import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { commercialPropertyTypes, districts, propertyTypes } from "@shared/propertyData";
import { ArrowLeft, Building2, Camera, Check, ChevronRight, CirclePlus, FileImage, Home, ImagePlus, LayoutDashboard, LogOut, Map, Menu, Pencil, Search, Sparkles, Trash2, UploadCloud, Warehouse, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

type ListingDraft = {
  title: string;
  description: string;
  address: string;
  mrtName: string;
  mode: "Sell" | "Rent-Out";
  district: string;
  propertyType: string;
  price: string;
  size: string;
  mrtMinutes: string;
  tenure: string;
  commercialUsage: string;
  floorLoading: string;
  ceilingHeight: string;
  loadingAccess: string;
  parkingLots: string;
  availableFrom: string;
};

const emptyDraft: ListingDraft = {
  title: "", description: "", address: "", mrtName: "", mode: "Sell", district: "D01 · Marina Bay", propertyType: "Condominium", price: "", size: "", mrtMinutes: "5", tenure: "99-year", commercialUsage: "", floorLoading: "", ceilingHeight: "", loadingAccess: "", parkingLots: "", availableFrom: "",
};

const fieldClass = "h-11 rounded-xl border border-[#17382f]/12 bg-white px-3 text-sm text-[#17382f] outline-none transition focus:border-[#b68a4c] focus:ring-2 focus:ring-[#b68a4c]/10";
const labelClass = "grid gap-2 text-xs font-semibold text-[#49635d]";

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

export default function AgentPortal() {
  const { loading, user, logout } = useAuth();
  const utils = trpc.useUtils();
  const { data: listings = [], isLoading, error } = trpc.listing.listMine.useQuery(undefined, { enabled: Boolean(user) });
  const [mobileNav, setMobileNav] = useState(false);
  const [search, setSearch] = useState("");
  const [showEditor, setShowEditor] = useState(() => new URLSearchParams(window.location.search).get("new") === "1");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<ListingDraft>(emptyDraft);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const createListing = trpc.listing.create.useMutation();
  const updateListing = trpc.listing.update.useMutation();
  const uploadImage = trpc.listing.uploadImage.useMutation();
  const removeImage = trpc.listing.removeImage.useMutation();
  const updateStatus = trpc.listing.updateStatus.useMutation({
    onSuccess: async () => { await utils.listing.listMine.invalidate(); toast.success("Listing status updated"); },
    onError: error => toast.error(error.message),
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return listings;
    return listings.filter(listing => `${listing.title} ${listing.address ?? ""} ${listing.district} ${listing.propertyType}`.toLowerCase().includes(term));
  }, [listings, search]);
  const activeCount = listings.filter(item => item.status === "active").length;
  const draftCount = listings.filter(item => item.status === "draft").length;
  const imageCount = listings.reduce((total, item) => total + item.images.length, 0);
  const selectedListing = editingId ? listings.find(item => item.id === editingId) : undefined;
  const commercialDraft = commercialPropertyTypes.includes(draft.propertyType as (typeof commercialPropertyTypes)[number]);
  const saving = createListing.isPending || updateListing.isPending || uploadImage.isPending;

  const openNew = () => {
    setEditingId(null);
    setDraft(emptyDraft);
    setPendingFiles([]);
    setShowEditor(true);
  };

  const openEdit = (listing: (typeof listings)[number]) => {
    setEditingId(listing.id);
    setDraft({
      title: listing.title,
      description: listing.description ?? "",
      address: listing.address ?? "",
      mrtName: listing.mrtName ?? "",
      mode: listing.mode,
      district: listing.district,
      propertyType: listing.propertyType,
      price: String(listing.price),
      size: String(listing.size),
      mrtMinutes: String(listing.mrtMinutes),
      tenure: listing.tenure,
      commercialUsage: listing.commercialUsage ?? "",
      floorLoading: listing.floorLoading ? String(listing.floorLoading) : "",
      ceilingHeight: listing.ceilingHeight ? String(listing.ceilingHeight) : "",
      loadingAccess: listing.loadingAccess ?? "",
      parkingLots: listing.parkingLots === null ? "" : String(listing.parkingLots),
      availableFrom: listing.availableFrom ?? "",
    });
    setPendingFiles([]);
    setShowEditor(true);
  };

  const chooseFiles = (files: FileList | null) => {
    if (!files) return;
    const next = Array.from(files);
    const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
    const invalid = next.find(file => !allowed.has(file.type) || file.size > 6 * 1024 * 1024);
    if (invalid) return toast.error("Use JPG, PNG, or WebP images smaller than 6 MB each");
    const existingCount = selectedListing?.images.length ?? 0;
    if (existingCount + pendingFiles.length + next.length > 6) return toast.error("Each listing supports up to 6 images");
    setPendingFiles(current => [...current, ...next]);
  };

  const listingInput = () => ({
    title: draft.title.trim(),
    description: draft.description.trim() || undefined,
    address: draft.address.trim() || undefined,
    mrtName: draft.mrtName.trim() || undefined,
    mode: draft.mode,
    district: draft.district,
    propertyType: draft.propertyType,
    price: Number(draft.price),
    size: Number(draft.size),
    mrtMinutes: Number(draft.mrtMinutes),
    tenure: draft.tenure,
    ...(commercialDraft ? {
      commercialUsage: draft.commercialUsage.trim() || undefined,
      floorLoading: draft.floorLoading ? Number(draft.floorLoading) : undefined,
      ceilingHeight: draft.ceilingHeight ? Number(draft.ceilingHeight) : undefined,
      loadingAccess: draft.loadingAccess.trim() || undefined,
      parkingLots: draft.parkingLots ? Number(draft.parkingLots) : undefined,
      availableFrom: draft.availableFrom || undefined,
    } : {}),
  });

  const saveListing = async () => {
    try {
      const input = listingInput();
      if (!input.title || !Number.isFinite(input.price) || input.price <= 0 || !Number.isFinite(input.size) || input.size <= 0) return toast.error("Complete the title, price, and property size");
      const saved = editingId ? await updateListing.mutateAsync({ id: editingId, ...input }) : await createListing.mutateAsync(input);
      for (const file of pendingFiles) {
        await uploadImage.mutateAsync({ id: saved.id, fileName: file.name, mimeType: file.type as "image/jpeg" | "image/png" | "image/webp", base64: await fileToBase64(file) });
      }
      await utils.listing.listMine.invalidate();
      setShowEditor(false);
      setPendingFiles([]);
      toast.success(editingId ? "Listing updated" : "Draft listing created");
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : "Could not save this listing");
    }
  };

  const deleteImage = async (listingId: number, imageId: number) => {
    try {
      await removeImage.mutateAsync({ id: listingId, imageId });
      await utils.listing.listMine.invalidate();
      toast.success("Image removed");
    } catch (removeError) {
      toast.error(removeError instanceof Error ? removeError.message : "Could not remove image");
    }
  };

  if (loading) return <div className="grid min-h-screen place-items-center bg-[#f4f4ef]"><span className="size-8 animate-spin rounded-full border-2 border-[#17382f]/20 border-t-[#17382f]" /></div>;

  if (!user) return <div className="grid min-h-screen place-items-center bg-[#f4f4ef] p-5 text-[#17382f]"><div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-[0_24px_80px_rgba(23,56,47,.12)]"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#e7ede8] text-[#275649]"><LayoutDashboard className="size-6" /></span><h1 className="mt-6 font-display text-4xl">Agent portal</h1><p className="mt-3 text-sm leading-6 text-[#647b74]">Sign in to create, upload, and update the property listings assigned to your account.</p><Button onClick={startLogin} className="mt-7 h-11 w-full rounded-full bg-[#17382f]">Sign in securely</Button><Link href="/"><Button variant="ghost" className="mt-2 w-full"><ArrowLeft className="mr-2 size-4" />Back to UrbanKey</Button></Link></div></div>;

  return <div className="min-h-screen bg-[#f4f4ef] text-[#17382f]">
    <header className="sticky top-0 z-40 border-b border-[#17382f]/8 bg-[#f4f4ef]/95 backdrop-blur lg:hidden"><div className="flex h-16 items-center justify-between px-4"><button onClick={() => setMobileNav(true)} aria-label="Open portal navigation" className="grid size-10 place-items-center rounded-full bg-white"><Menu className="size-5" /></button><Link href="/" className="font-display text-xl">UrbanKey <span className="text-[#a77c43]">Pro</span></Link><button onClick={openNew} aria-label="Create listing" className="grid size-10 place-items-center rounded-full bg-[#17382f] text-white"><PlusIcon /></button></div></header>
    <div className="mx-auto flex min-h-screen max-w-[1600px]">
      <aside className={`fixed inset-y-0 left-0 z-50 w-[286px] border-r border-white/8 bg-[#17382f] p-5 text-white transition-transform lg:sticky lg:top-0 lg:z-0 lg:h-screen lg:translate-x-0 ${mobileNav ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between"><Link href="/" className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#d5ae72] font-display text-xl text-[#17382f]">U</span><span><strong className="block font-display text-xl leading-none">UrbanKey</strong><span className="mt-1 block text-[9px] font-bold uppercase tracking-[.2em] text-[#d5ae72]">Professional portal</span></span></Link><button onClick={() => setMobileNav(false)} aria-label="Close portal navigation" className="grid size-9 place-items-center rounded-full bg-white/8 lg:hidden"><X className="size-4" /></button></div>
        <nav className="mt-10 grid gap-2"><button onClick={() => setMobileNav(false)} className="flex h-11 items-center gap-3 rounded-xl bg-white/10 px-4 text-left text-sm font-semibold"><LayoutDashboard className="size-4 text-[#d5ae72]" />Listings</button><button onClick={() => { openNew(); setMobileNav(false); }} className="flex h-11 items-center gap-3 rounded-xl px-4 text-left text-sm text-white/60 transition hover:bg-white/7 hover:text-white"><CirclePlus className="size-4" />Create property</button><Link href="/map" className="flex h-11 items-center gap-3 rounded-xl px-4 text-sm text-white/60 transition hover:bg-white/7 hover:text-white"><Map className="size-4" />Market map</Link><Link href="/assistants" className="flex h-11 items-center gap-3 rounded-xl px-4 text-sm text-white/60 transition hover:bg-white/7 hover:text-white"><Sparkles className="size-4" />UrbanKey AI</Link></nav>
        <div className="absolute inset-x-5 bottom-5 rounded-2xl border border-white/10 bg-white/[.055] p-4"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-[#d5ae72]/20 text-sm font-bold text-[#d5ae72]">{user.name?.charAt(0).toUpperCase() || "A"}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{user.name || "UrbanKey professional"}</p><p className="truncate text-[10px] text-white/45">Agent / Co-broker</p></div><button onClick={logout} aria-label="Sign out" className="grid size-9 place-items-center rounded-full text-white/50 transition hover:bg-white/8 hover:text-white"><LogOut className="size-4" /></button></div></div>
      </aside>
      {mobileNav && <button aria-label="Close navigation overlay" onClick={() => setMobileNav(false)} className="fixed inset-0 z-40 bg-[#0d1e1a]/55 lg:hidden" />}
      <main className="min-w-0 flex-1 px-4 py-7 sm:px-7 lg:px-10 lg:py-10 xl:px-14">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="eyebrow">Agent & co-broker workspace</p><h1 className="mt-3 font-display text-4xl sm:text-5xl">Property portfolio</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#647b74]">Create complete records, upload listing media, maintain property details, and control what is ready for market.</p></div><Button onClick={openNew} className="h-11 rounded-full bg-[#17382f] px-5"><CirclePlus className="mr-2 size-4" />New property</Button></div>
        <section className="mt-8 grid gap-4 sm:grid-cols-3"><Metric label="Total listings" value={listings.length} icon={Building2} /><Metric label="Active" value={activeCount} icon={Check} accent /><Metric label="Uploaded images" value={imageCount} icon={Camera} detail={`${draftCount} draft${draftCount === 1 ? "" : "s"}`} /></section>
        <section className="mt-8 overflow-hidden rounded-3xl bg-white shadow-[0_16px_60px_rgba(23,56,47,.06)]">
          <div className="flex flex-col gap-4 border-b border-[#17382f]/8 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"><div><h2 className="font-display text-2xl">Your listings</h2><p className="mt-1 text-xs text-[#71857f]">Only properties owned by this account are shown.</p></div><label className="flex h-11 w-full items-center gap-2 rounded-full border border-[#17382f]/12 bg-[#f8f8f3] px-4 sm:w-72"><Search className="size-4 text-[#7c8e88]" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search title, address, type…" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#9aa8a4]" /></label></div>
          {isLoading ? <div className="grid gap-3 p-5 sm:p-6">{[0, 1, 2].map(item => <div key={item} className="h-28 animate-pulse rounded-2xl bg-[#edf1ed]" />)}</div> : error ? <div className="p-10 text-center"><p className="font-semibold">Could not load your listings</p><p className="mt-2 text-sm text-[#71857f]">{error.message}</p></div> : filtered.length ? <div className="divide-y divide-[#17382f]/8">{filtered.map(listing => <article key={listing.id} className="grid gap-4 p-5 transition hover:bg-[#fbfaf6] sm:grid-cols-[110px_1fr] sm:p-6 lg:grid-cols-[130px_1fr_auto] lg:items-center">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#e7ede8]">{listing.images[0] ? <img src={listing.images[0].url} alt={`${listing.title} cover`} className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center text-[#7f948d]">{commercialPropertyTypes.includes(listing.propertyType as (typeof commercialPropertyTypes)[number]) ? <Warehouse className="size-7" /> : <Home className="size-7" />}</span>}<span className="absolute left-2 top-2 rounded-full bg-[#17382f]/85 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-white">{listing.mode}</span></div>
            <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate font-semibold">{listing.title}</h3><StatusPill status={listing.status} /></div><p className="mt-2 text-xs text-[#71857f]">{listing.propertyType} · {listing.district} · {listing.size.toLocaleString()} sq ft</p><p className="mt-1 text-xs text-[#71857f]">{listing.address || "Address not added"}{listing.mrtName ? ` · ${listing.mrtName} MRT` : ""}</p><div className="mt-3 flex flex-wrap gap-2"><span className="rounded-full bg-[#edf1ed] px-2.5 py-1 text-[10px] font-semibold text-[#49635d]">{listing.mode === "Rent-Out" ? `$${listing.price.toLocaleString()}/mo` : `$${listing.price.toLocaleString()}`}</span><span className="rounded-full bg-[#f3ede2] px-2.5 py-1 text-[10px] font-semibold text-[#805d2f]">{listing.images.length}/6 images</span>{listing.commercialUsage && <span className="rounded-full bg-[#f3ede2] px-2.5 py-1 text-[10px] font-semibold text-[#805d2f]">{listing.commercialUsage}</span>}</div></div>
            <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-1 lg:justify-end"><Button size="sm" variant="outline" onClick={() => openEdit(listing)} className="rounded-full bg-white"><Pencil className="mr-1.5 size-3.5" />Edit & upload</Button><Button size="sm" onClick={() => updateStatus.mutate({ id: listing.id, status: listing.status === "active" ? "paused" : "active" })} disabled={updateStatus.isPending} className={`rounded-full ${listing.status === "active" ? "bg-[#e9eee9] text-[#275649] hover:bg-[#dce5de]" : "bg-[#17382f]"}`}>{listing.status === "active" ? "Pause" : "Activate"}</Button></div>
          </article>)}</div> : <div className="px-5 py-16 text-center"><span className="mx-auto grid size-16 place-items-center rounded-2xl bg-[#e7ede8] text-[#275649]"><Building2 className="size-7" /></span><h3 className="mt-5 font-display text-2xl">{search ? "No matching properties" : "Create your first property"}</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#71857f]">{search ? "Try another title, address, district, or property type." : "Start with the essentials, save a private draft, then upload media and activate it when the record is ready."}</p>{!search && <Button onClick={openNew} className="mt-6 rounded-full bg-[#17382f]"><CirclePlus className="mr-2 size-4" />Create draft listing</Button>}</div>}
        </section>
      </main>
    </div>
    {showEditor && <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#0d1e1a]/70 p-3 backdrop-blur-sm sm:p-6"><div className="mx-auto my-3 w-full max-w-5xl overflow-hidden rounded-[1.75rem] bg-[#f7f7f1] shadow-2xl"><div className="sticky top-0 z-10 flex items-start justify-between border-b border-[#17382f]/8 bg-[#f7f7f1]/95 px-5 py-5 backdrop-blur sm:px-8"><div><p className="eyebrow">{editingId ? "Update property" : "New listing"}</p><h2 className="mt-1 font-display text-3xl">{editingId ? "Keep the listing current." : "Capture the property clearly."}</h2></div><button onClick={() => setShowEditor(false)} aria-label="Close listing editor" className="grid size-10 place-items-center rounded-full bg-white shadow-sm"><X className="size-4" /></button></div>
      <form onSubmit={event => { event.preventDefault(); void saveListing(); }} className="grid gap-6 p-5 sm:p-8 lg:grid-cols-[1fr_300px]">
        <div className="grid gap-6"><FormSection title="Property identity" description="The core information agents and co-brokers need to recognize the asset."><div className="grid gap-4 sm:grid-cols-2"><label className={`${labelClass} sm:col-span-2`}>Property title<input required value={draft.title} onChange={event => setDraft(current => ({ ...current, title: event.target.value }))} className={fieldClass} placeholder="e.g. Tuas logistics facility with yard" /></label><label className={`${labelClass} sm:col-span-2`}>Description<textarea value={draft.description} onChange={event => setDraft(current => ({ ...current, description: event.target.value }))} maxLength={4000} rows={5} className="rounded-xl border border-[#17382f]/12 bg-white p-3 text-sm outline-none focus:border-[#b68a4c]" placeholder="Positioning, condition, access, permitted use, and notable features…" /></label><label className={`${labelClass} sm:col-span-2`}>Property address<input value={draft.address} onChange={event => setDraft(current => ({ ...current, address: event.target.value }))} className={fieldClass} placeholder="Street and building address" /></label><label className={labelClass}>District<select value={draft.district} onChange={event => setDraft(current => ({ ...current, district: event.target.value }))} className={fieldClass}>{districts.filter(item => item !== "All districts").map(item => <option key={item}>{item}</option>)}</select></label><label className={labelClass}>Property type<select value={draft.propertyType} onChange={event => setDraft(current => ({ ...current, propertyType: event.target.value }))} className={fieldClass}>{propertyTypes.map(item => <option key={item}>{item}</option>)}</select></label></div></FormSection>
          <FormSection title="Commercial terms" description="Set the listing intent, guide value, tenure, size, and transport context."><div className="grid gap-4 sm:grid-cols-2"><label className={labelClass}>Listing mode<select value={draft.mode} onChange={event => setDraft(current => ({ ...current, mode: event.target.value as ListingDraft["mode"] }))} className={fieldClass}><option value="Sell">Sell</option><option value="Rent-Out">Rent-Out</option></select></label><label className={labelClass}>{draft.mode === "Rent-Out" ? "Guide monthly rent (SGD)" : "Guide price (SGD)"}<input required min="1" type="number" value={draft.price} onChange={event => setDraft(current => ({ ...current, price: event.target.value }))} className={fieldClass} /></label><label className={labelClass}>Size (sq ft)<input required min="1" type="number" value={draft.size} onChange={event => setDraft(current => ({ ...current, size: event.target.value }))} className={fieldClass} /></label><label className={labelClass}>Tenure<select value={draft.tenure} onChange={event => setDraft(current => ({ ...current, tenure: event.target.value }))} className={fieldClass}><option>Freehold</option><option>999-year</option><option>99-year</option><option>60-year</option><option>30-year</option></select></label><label className={labelClass}>Nearest MRT<input value={draft.mrtName} onChange={event => setDraft(current => ({ ...current, mrtName: event.target.value }))} className={fieldClass} placeholder="e.g. Tanjong Pagar" /></label><label className={labelClass}>MRT walk / travel (minutes)<input required min="0" max="60" type="number" value={draft.mrtMinutes} onChange={event => setDraft(current => ({ ...current, mrtMinutes: event.target.value }))} className={fieldClass} /></label></div></FormSection>
          {commercialDraft && <FormSection title="Operational specifications" description="Help commercial prospects screen practical suitability before formal due diligence."><div className="grid gap-4 sm:grid-cols-2"><label className={`${labelClass} sm:col-span-2`}>Approved / intended usage<input required value={draft.commercialUsage} onChange={event => setDraft(current => ({ ...current, commercialUsage: event.target.value }))} className={fieldClass} placeholder="Office, retail, warehouse, food factory…" /></label><label className={labelClass}>Floor loading (kN/m²)<input min="0.1" step="0.1" type="number" value={draft.floorLoading} onChange={event => setDraft(current => ({ ...current, floorLoading: event.target.value }))} className={fieldClass} /></label><label className={labelClass}>Ceiling height (m)<input min="0.1" step="0.1" type="number" value={draft.ceilingHeight} onChange={event => setDraft(current => ({ ...current, ceilingHeight: event.target.value }))} className={fieldClass} /></label><label className={labelClass}>Loading access<input value={draft.loadingAccess} onChange={event => setDraft(current => ({ ...current, loadingAccess: event.target.value }))} className={fieldClass} placeholder="40-ft container, dock leveller…" /></label><label className={labelClass}>Parking lots<input min="0" type="number" value={draft.parkingLots} onChange={event => setDraft(current => ({ ...current, parkingLots: event.target.value }))} className={fieldClass} /></label><label className={labelClass}>Available from<input type="date" value={draft.availableFrom} onChange={event => setDraft(current => ({ ...current, availableFrom: event.target.value }))} className={fieldClass} /></label></div></FormSection>}
        </div>
        <aside><div className="sticky top-28 rounded-2xl border border-[#17382f]/10 bg-white p-5"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#e7ede8] text-[#275649]"><ImagePlus className="size-5" /></span><div><h3 className="text-sm font-semibold">Property media</h3><p className="text-[10px] text-[#71857f]">JPG, PNG or WebP · 6 MB each</p></div></div><label className="mt-5 grid cursor-pointer place-items-center rounded-2xl border border-dashed border-[#17382f]/22 bg-[#faf9f5] px-4 py-8 text-center transition hover:border-[#b68a4c]"><input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={event => { chooseFiles(event.target.files); event.currentTarget.value = ""; }} /><UploadCloud className="size-6 text-[#a77c43]" /><span className="mt-2 text-xs font-semibold">Choose property images</span><span className="mt-1 text-[10px] text-[#81918c]">Up to 6 images per listing</span></label>
          <div className="mt-4 grid gap-2">{selectedListing?.images.map(image => <div key={image.id} className="group flex items-center gap-3 rounded-xl bg-[#f4f4ef] p-2"><img src={image.url} alt="Property upload" className="size-12 rounded-lg object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-[11px] font-semibold">{image.fileName}</p><p className="mt-0.5 text-[9px] text-[#81918c]">{Math.max(1, Math.round(image.fileSize / 1024))} KB</p></div><button type="button" aria-label={`Remove ${image.fileName}`} onClick={() => void deleteImage(selectedListing.id, image.id)} className="grid size-8 place-items-center rounded-full text-[#9c5651] transition hover:bg-[#f5e4e2]"><Trash2 className="size-3.5" /></button></div>)}{pendingFiles.map((file, index) => <div key={`${file.name}-${file.lastModified}`} className="flex items-center gap-3 rounded-xl border border-[#b68a4c]/20 bg-[#fff8eb] p-2"><span className="grid size-12 place-items-center rounded-lg bg-[#f3e8d5] text-[#a77c43]"><FileImage className="size-5" /></span><div className="min-w-0 flex-1"><p className="truncate text-[11px] font-semibold">{file.name}</p><p className="mt-0.5 text-[9px] text-[#81918c]">Ready to upload</p></div><button type="button" aria-label={`Remove pending ${file.name}`} onClick={() => setPendingFiles(current => current.filter((_, fileIndex) => fileIndex !== index))} className="grid size-8 place-items-center rounded-full text-[#9c5651]"><X className="size-3.5" /></button></div>)}</div>
          {!editingId && pendingFiles.length === 0 && <p className="mt-4 rounded-xl bg-[#edf1ed] p-3 text-[10px] leading-4 text-[#647b74]">You can save the listing first and return later to add images. New records remain private drafts until activated.</p>}
        </div></aside>
        <div className="flex flex-col-reverse gap-3 border-t border-[#17382f]/8 pt-5 sm:flex-row sm:justify-end lg:col-span-2"><Button type="button" variant="ghost" onClick={() => setShowEditor(false)}>Cancel</Button><Button disabled={saving} className="h-11 rounded-full bg-[#17382f] px-7">{saving ? "Saving property…" : editingId ? "Save updates" : "Create draft"}<ChevronRight className="ml-2 size-4" /></Button></div>
      </form></div></div>}
  </div>;
}

function PlusIcon() { return <CirclePlus className="size-5" />; }

function Metric({ label, value, icon: Icon, detail, accent = false }: { label: string; value: number; icon: typeof Building2; detail?: string; accent?: boolean }) {
  return <div className={`rounded-2xl p-5 ${accent ? "bg-[#17382f] text-white" : "bg-white shadow-[0_12px_40px_rgba(23,56,47,.045)]"}`}><div className="flex items-center justify-between"><span className={`grid size-10 place-items-center rounded-xl ${accent ? "bg-white/10 text-[#d5ae72]" : "bg-[#e7ede8] text-[#275649]"}`}><Icon className="size-4.5" /></span>{detail && <span className={`text-[10px] font-semibold ${accent ? "text-white/50" : "text-[#81918c]"}`}>{detail}</span>}</div><p className="mt-5 text-3xl font-semibold">{value}</p><p className={`mt-1 text-xs ${accent ? "text-white/55" : "text-[#71857f]"}`}>{label}</p></div>;
}

function StatusPill({ status }: { status: "draft" | "active" | "paused" }) {
  const style = status === "active" ? "bg-[#dff1e7] text-[#246245]" : status === "paused" ? "bg-[#f4e5dd] text-[#8b5948]" : "bg-[#eee9dc] text-[#806b4e]";
  return <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${style}`}>{status}</span>;
}

function FormSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-[#17382f]/9 bg-white p-5 sm:p-6"><h3 className="font-display text-2xl">{title}</h3><p className="mt-1 text-xs leading-5 text-[#71857f]">{description}</p><div className="mt-5">{children}</div></section>;
}
