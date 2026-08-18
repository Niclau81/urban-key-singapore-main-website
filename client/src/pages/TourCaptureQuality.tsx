import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { startLogin } from "@/const";
import { useMarket } from "@/contexts/MarketContext";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, ArrowLeft, BadgeCheck, Camera, CheckCircle2, ClipboardCheck, Eye, FileWarning, ImagePlus, LockKeyhole, ShieldCheck, UploadCloud } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

const fieldClass = "h-11 rounded-xl border border-[#17382f]/12 bg-white px-3 text-sm text-[#17382f] outline-none transition focus:border-[#b68a4c] focus:ring-2 focus:ring-[#b68a4c]/10";

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

function readImageDimensions(file: File) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => { URL.revokeObjectURL(objectUrl); resolve({ width: image.naturalWidth, height: image.naturalHeight }); };
    image.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Could not inspect this capture")); };
    image.src = objectUrl;
  });
}

function captureTone(status: string) {
  if (status === "approval_required") return "bg-[#fff2d8] text-[#95661e]";
  if (status === "approved" || status === "published") return "bg-[#dff1e7] text-[#246245]";
  if (status === "rejected") return "bg-[#f5e4e2] text-[#99534c]";
  return "bg-[#e7eef6] text-[#385b77]";
}

export default function TourCaptureQuality() {
  const { loading, user } = useAuth();
  const { market } = useMarket();
  const utils = trpc.useUtils();
  const { data: listings = [], isLoading: listingsLoading } = trpc.listing.listMine.useQuery({ marketId: market.id }, { enabled: Boolean(user) });
  const [listingId, setListingId] = useState<number | null>(null);
  const { data: captures = [], isLoading: capturesLoading } = trpc.listing.listTourCaptures.useQuery(listingId ? { id: listingId } : undefined, { enabled: Boolean(user) && listingId !== null });
  const [file, setFile] = useState<File | null>(null);
  const [floorLabel, setFloorLabel] = useState("Main floor");
  const [roomLabel, setRoomLabel] = useState("Living space");
  const [horizontalCoverage, setHorizontalCoverage] = useState("360");
  const [verticalCoverage, setVerticalCoverage] = useState("180");
  const [listingAuthorised, setListingAuthorised] = useState(false);
  const [captureConsent, setCaptureConsent] = useState(false);
  const [reviewCaptureId, setReviewCaptureId] = useState<number | null>(null);
  const [privacyStatus, setPrivacyStatus] = useState<"review_required" | "cleared" | "blocked">("review_required");
  const [manualPrivacyReviewed, setManualPrivacyReviewed] = useState(false);
  const [qualityNotes, setQualityNotes] = useState("");

  useEffect(() => { if (listingId === null && listings[0]) setListingId(listings[0].id); }, [listingId, listings]);
  const selectedListing = listings.find(listing => listing.id === listingId);
  const upload = trpc.listing.uploadTourCapture.useMutation();
  const review = trpc.listing.reviewTourCapture.useMutation();

  const selectedPreview = useMemo(() => file ? URL.createObjectURL(file) : null, [file]);
  useEffect(() => () => { if (selectedPreview) URL.revokeObjectURL(selectedPreview); }, [selectedPreview]);

  if (loading) return <div className="grid min-h-screen place-items-center bg-[#f4f4ef]"><span className="size-8 animate-spin rounded-full border-2 border-[#17382f]/20 border-t-[#17382f]" /></div>;
  if (!user) return <main className="grid min-h-screen place-items-center bg-[#f4f4ef] p-5 text-[#17382f]"><section className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-[0_24px_80px_rgba(23,56,47,.12)]"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#e7eef6] text-[#385b77]"><Camera className="size-6" /></span><h1 className="mt-6 font-display text-4xl">360° capture review</h1><p className="mt-3 text-sm leading-6 text-[#647b74]">Sign in to upload captures privately and complete required technical, privacy, and listing-authorisation checks.</p><Button onClick={startLogin} className="mt-7 h-11 w-full rounded-full bg-[#17382f]">Sign in securely</Button><Link href="/agent/portal"><Button variant="ghost" className="mt-2 w-full"><ArrowLeft className="mr-2 size-4" />Back to portal</Button></Link></section></main>;

  const submitCapture = async () => {
    if (!listingId || !file) return toast.error("Choose a listing and 360° capture first");
    if (!listingAuthorised || !captureConsent) return toast.error("Confirm listing authority and capture consent before storing media");
    if (!["image/jpeg", "image/webp"].includes(file.type)) return toast.error("Use a JPG or WebP equirectangular capture");
    if (file.size > 20 * 1024 * 1024) return toast.error("The capture must be smaller than 20 MB");
    try {
      const dimensions = await readImageDimensions(file);
      const result = await upload.mutateAsync({
        id: listingId, fileName: file.name, mimeType: file.type as "image/jpeg" | "image/webp", base64: await fileToBase64(file), width: dimensions.width, height: dimensions.height,
        horizontalCoverage: Number(horizontalCoverage), verticalCoverage: Number(verticalCoverage), floorLabel: floorLabel.trim(), roomLabel: roomLabel.trim(), listingAuthorizationConfirmed: true, captureConsentConfirmed: true,
      });
      await utils.listing.listTourCaptures.invalidate({ id: listingId });
      setFile(null); setListingAuthorised(false); setCaptureConsent(false);
      toast.success(result.technicalReviewPassed ? "Private capture stored for privacy review" : "Capture stored, but it does not meet the 360° technical baseline");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not store this capture"); }
  };

  const submitReview = async () => {
    if (!reviewCaptureId) return;
    try {
      await review.mutateAsync({ captureId: reviewCaptureId, privacyReviewStatus: privacyStatus, manualPrivacyReviewed, listingAuthorizationConfirmed: listingAuthorised, captureConsentConfirmed: captureConsent, qualityNotes: qualityNotes.trim() || undefined });
      if (listingId) await utils.listing.listTourCaptures.invalidate({ id: listingId });
      setReviewCaptureId(null); setQualityNotes("");
      toast.success("Quality review saved. Independent approval is still required before publication.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not save review"); }
  };

  return <main className="min-h-screen bg-[#f4f4ef] pb-16 text-[#17382f]">
    <header className="border-b border-[#17382f]/8 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8"><Link href="/agent/portal" className="inline-flex items-center text-sm font-semibold text-[#49635d]"><ArrowLeft className="mr-2 size-4" />Agent portal</Link><span className="rounded-full bg-[#e7eef6] px-3 py-1 text-[10px] font-bold uppercase tracking-[.16em] text-[#385b77]">Private review workspace</span></div></header>
    <div className="mx-auto max-w-7xl px-5 pt-10 sm:px-8"><div className="max-w-3xl"><p className="eyebrow">Real media · publication controlled</p><h1 className="mt-3 font-display text-4xl sm:text-5xl">360° capture quality check</h1><p className="mt-4 text-sm leading-6 text-[#647b74]">Store equirectangular room captures privately, validate coverage and resolution, review personal-information risks, and prepare—not publish—an approved tour asset. Publishing remains blocked until a separate independent approval action.</p></div>
      <section className="mt-8 grid gap-6 lg:grid-cols-[.9fr_1.1fr]"><div className="rounded-3xl bg-white p-5 shadow-[0_16px_60px_rgba(23,56,47,.06)] sm:p-7"><div className="flex items-start gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-[#e7eef6] text-[#385b77]"><ImagePlus className="size-5" /></span><div><h2 className="font-display text-2xl">Private capture intake</h2><p className="mt-1 text-xs leading-5 text-[#71857f]">Accepted format: equirectangular JPG or WebP, at least 3000 × 1500 pixels, 360° × 180° coverage, under 20 MB.</p></div></div>
        <div className="mt-6 grid gap-4"><label className="grid gap-2 text-xs font-semibold text-[#49635d]">Listing<select value={listingId ?? ""} onChange={event => setListingId(Number(event.target.value))} className={fieldClass} disabled={listingsLoading || listings.length === 0}>{listings.length ? listings.map(listing => <option key={listing.id} value={listing.id}>{listing.title}</option>) : <option value="">Create a listing first</option>}</select></label><div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-xs font-semibold text-[#49635d]">Floor label<input value={floorLabel} onChange={event => setFloorLabel(event.target.value)} className={fieldClass} /></label><label className="grid gap-2 text-xs font-semibold text-[#49635d]">Room label<input value={roomLabel} onChange={event => setRoomLabel(event.target.value)} className={fieldClass} /></label><label className="grid gap-2 text-xs font-semibold text-[#49635d]">Horizontal coverage<input type="number" min="0" max="360" value={horizontalCoverage} onChange={event => setHorizontalCoverage(event.target.value)} className={fieldClass} /></label><label className="grid gap-2 text-xs font-semibold text-[#49635d]">Vertical coverage<input type="number" min="0" max="180" value={verticalCoverage} onChange={event => setVerticalCoverage(event.target.value)} className={fieldClass} /></label></div><label className="grid cursor-pointer place-items-center rounded-2xl border border-dashed border-[#17382f]/20 bg-[#faf9f5] px-5 py-7 text-center transition hover:border-[#b68a4c]"><input type="file" accept="image/jpeg,image/webp" className="sr-only" onChange={event => setFile(event.target.files?.[0] ?? null)} /><UploadCloud className="size-6 text-[#a77c43]" /><span className="mt-2 text-xs font-semibold">Choose 360° capture</span><span className="mt-1 text-[10px] text-[#81918c]">{file ? `${file.name} · ${(file.size / 1024 / 1024).toFixed(1)} MB` : "JPG or WebP · private until approved"}</span></label>{selectedPreview && <img src={selectedPreview} alt="Local 360 capture preview" className="aspect-[2/1] w-full rounded-2xl object-cover" />}
          <label className="flex gap-3 rounded-2xl bg-[#fff8eb] p-4 text-xs leading-5 text-[#705321]"><input type="checkbox" checked={listingAuthorised} onChange={event => setListingAuthorised(event.target.checked)} className="mt-0.5 size-4 accent-[#b68a4c]" />I am authorised by the listing owner or authorised representative to capture and submit this media for this listing.</label><label className="flex gap-3 rounded-2xl bg-[#fff8eb] p-4 text-xs leading-5 text-[#705321]"><input type="checkbox" checked={captureConsent} onChange={event => setCaptureConsent(event.target.checked)} className="mt-0.5 size-4 accent-[#b68a4c]" />I have obtained required consent and removed or protected people, documents, cards, screens, access codes, and other personal information.</label><Button onClick={() => void submitCapture()} disabled={!selectedListing || upload.isPending} className="h-11 rounded-full bg-[#17382f]">{upload.isPending ? "Storing private capture…" : "Store for quality review"}<LockKeyhole className="ml-2 size-4" /></Button></div></div>
        <aside className="rounded-3xl bg-[#17382f] p-5 text-white shadow-[0_16px_60px_rgba(23,56,47,.14)] sm:p-7"><div className="flex items-start gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-white/10 text-[#d5ae72]"><ClipboardCheck className="size-5" /></span><div><h2 className="font-display text-2xl">Quality gate</h2><p className="mt-1 text-xs leading-5 text-white/60">Every capture starts private. A real 360° tour cannot be published from this screen.</p></div></div><div className="mt-6 grid gap-3">{[["1", "Technical baseline", "At least 3000 × 1500, near 2:1 equirectangular, full 360° × 180° coverage."], ["2", "Privacy review", "AI-assisted candidate detection is required in production; a human must confirm face, document, card, name, code, and screen protection."], ["3", "Independent approval", "Completed checks move to approval-required; a separate administrator must approve before any publishing workflow." ]].map(([number, title, detail]) => <div key={number} className="rounded-2xl border border-white/10 bg-white/[.055] p-4"><span className="text-xs font-bold text-[#d5ae72]">{number}</span><h3 className="mt-1 text-sm font-semibold">{title}</h3><p className="mt-1 text-[11px] leading-5 text-white/60">{detail}</p></div>)}</div></aside></section>
      <section className="mt-8 overflow-hidden rounded-3xl bg-white shadow-[0_16px_60px_rgba(23,56,47,.06)]"><div className="flex items-center justify-between border-b border-[#17382f]/8 p-5 sm:p-7"><div><h2 className="font-display text-2xl">Capture queue {selectedListing ? `· ${selectedListing.title}` : ""}</h2><p className="mt-1 text-xs text-[#71857f]">Technical and privacy status are stored with every private capture.</p></div><span className="text-xs font-semibold text-[#71857f]">{captures.length} record{captures.length === 1 ? "" : "s"}</span></div>{capturesLoading ? <div className="p-8"><div className="h-24 animate-pulse rounded-2xl bg-[#edf1ed]" /></div> : captures.length ? <div className="divide-y divide-[#17382f]/8">{captures.map(capture => <article key={capture.id} className="grid gap-4 p-5 lg:grid-cols-[150px_1fr_auto] lg:items-center sm:p-7"><img src={capture.url} alt={`${capture.roomLabel} capture`} className="aspect-[2/1] w-full rounded-2xl object-cover" /><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{capture.floorLabel} · {capture.roomLabel}</h3><span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${captureTone(capture.qualityStatus)}`}>{capture.qualityStatus.replaceAll("_", " ")}</span></div><p className="mt-2 text-xs text-[#71857f]">{capture.width} × {capture.height} · {capture.aspectRatio} · {capture.horizontalCoverage}° × {capture.verticalCoverage}° · {Math.max(1, Math.round(capture.fileSize / 1024 / 1024))} MB</p><div className="mt-3 flex flex-wrap gap-2">{capture.technicalReviewPassed ? <Pill icon={CheckCircle2} text="Technical baseline passed" tone="green" /> : <Pill icon={AlertTriangle} text="Technical baseline not met" tone="amber" />}{capture.manualPrivacyReviewed ? <Pill icon={ShieldCheck} text="Manual privacy review logged" tone="green" /> : <Pill icon={FileWarning} text="Privacy review required" tone="amber" />}{capture.listingAuthorizationConfirmed && capture.captureConsentConfirmed ? <Pill icon={BadgeCheck} text="Authority and consent logged" tone="green" /> : <Pill icon={AlertTriangle} text="Authority / consent incomplete" tone="amber" />}</div>{capture.qualityNotes && <p className="mt-3 rounded-xl bg-[#faf9f5] p-3 text-[11px] leading-5 text-[#647b74]">{capture.qualityNotes}</p>}</div><div className="flex flex-wrap gap-2 lg:justify-end"><Button size="sm" variant="outline" onClick={() => { setReviewCaptureId(capture.id); setPrivacyStatus(capture.privacyReviewStatus === "not_run" ? "review_required" : capture.privacyReviewStatus === "blocked" ? "blocked" : "cleared"); setManualPrivacyReviewed(capture.manualPrivacyReviewed); setListingAuthorised(capture.listingAuthorizationConfirmed); setCaptureConsent(capture.captureConsentConfirmed); setQualityNotes(capture.qualityNotes ?? ""); }} className="rounded-full bg-white"><Eye className="mr-1.5 size-3.5" />Review</Button></div></article>)}</div> : <div className="p-12 text-center text-sm text-[#71857f]">No private 360° captures for this listing yet.</div>}</section>
    </div>
    {reviewCaptureId && <div className="fixed inset-0 z-50 grid place-items-center bg-[#0d1e1a]/60 p-4 backdrop-blur-sm"><section className="w-full max-w-xl rounded-3xl bg-[#f7f7f1] p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="eyebrow">Manual review</p><h2 className="mt-1 font-display text-3xl">Privacy & quality gate</h2></div><Button variant="ghost" onClick={() => setReviewCaptureId(null)}>Close</Button></div><p className="mt-4 text-sm leading-6 text-[#647b74]">This review cannot publish media. Marking a capture cleared only moves it to independent approval when all technical, privacy, authority, and consent gates pass.</p><div className="mt-5 grid gap-4"><label className="grid gap-2 text-xs font-semibold text-[#49635d]">Privacy review outcome<select value={privacyStatus} onChange={event => setPrivacyStatus(event.target.value as typeof privacyStatus)} className={fieldClass}><option value="review_required">Further review required</option><option value="cleared">Cleared after redaction review</option><option value="blocked">Block capture</option></select></label><label className="flex gap-3 rounded-2xl bg-white p-4 text-xs leading-5 text-[#49635d]"><input type="checkbox" checked={manualPrivacyReviewed} onChange={event => setManualPrivacyReviewed(event.target.checked)} className="mt-0.5 size-4 accent-[#17382f]" />I manually checked for faces, family photos, documents, letters, cards, name cards, screens, access codes, and other personal information.</label><label className="flex gap-3 rounded-2xl bg-white p-4 text-xs leading-5 text-[#49635d]"><input type="checkbox" checked={listingAuthorised} onChange={event => setListingAuthorised(event.target.checked)} className="mt-0.5 size-4 accent-[#17382f]" />Listing authority remains confirmed for this capture.</label><label className="flex gap-3 rounded-2xl bg-white p-4 text-xs leading-5 text-[#49635d]"><input type="checkbox" checked={captureConsent} onChange={event => setCaptureConsent(event.target.checked)} className="mt-0.5 size-4 accent-[#17382f]" />Capture consent remains confirmed for this media.</label><label className="grid gap-2 text-xs font-semibold text-[#49635d]">Reviewer notes<textarea value={qualityNotes} onChange={event => setQualityNotes(event.target.value)} rows={4} maxLength={2000} className="rounded-xl border border-[#17382f]/12 bg-white p-3 text-sm outline-none focus:border-[#b68a4c]" placeholder="Describe redaction work, stitching issues, mapping gaps, or conditions for follow-up…" /></label><Button onClick={() => void submitReview()} disabled={review.isPending} className="h-11 rounded-full bg-[#17382f]">{review.isPending ? "Saving review…" : "Save quality review"}</Button></div></section></div>}
  </main>;
}

function Pill({ icon: Icon, text, tone }: { icon: typeof CheckCircle2; text: string; tone: "green" | "amber" }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold ${tone === "green" ? "bg-[#dff1e7] text-[#246245]" : "bg-[#fff2d8] text-[#95661e]"}`}><Icon className="mr-1 size-3" />{text}</span>;
}
