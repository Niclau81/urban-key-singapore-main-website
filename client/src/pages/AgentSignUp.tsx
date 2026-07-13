import { useAuth } from "@/_core/hooks/useAuth";
import { BrandHeader } from "@/components/BrandHeader";
import { Button } from "@/components/ui/button";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, ArrowRight, BadgeCheck, Building2, Check, ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";

type RegistrationForm = {
  accountType: "agent" | "co_broker";
  firstName: string;
  middleName: string;
  lastName: string;
  contactNumber: string;
  email: string;
  companyName: string;
  companyAddress: string;
  postalCode: string;
  agentLicenseNumber: string;
  jobTitle: string;
  businessRegistrationNumber: string;
  website: string;
  termsAccepted: boolean;
};

const initialForm: RegistrationForm = {
  accountType: "agent", firstName: "", middleName: "", lastName: "", contactNumber: "", email: "", companyName: "", companyAddress: "", postalCode: "", agentLicenseNumber: "", jobTitle: "", businessRegistrationNumber: "", website: "", termsAccepted: false,
};

const steps = [
  { title: "Personal", icon: UserRound },
  { title: "Professional", icon: Building2 },
  { title: "Review", icon: ShieldCheck },
];

const fieldClass = "h-12 w-full rounded-xl border border-[#17382f]/14 bg-white px-3.5 text-sm text-[#17382f] outline-none transition placeholder:text-[#9aa8a4] focus:border-[#b68a4c] focus:ring-2 focus:ring-[#b68a4c]/15";
const labelClass = "grid gap-2 text-xs font-semibold text-[#49635d]";

export default function AgentSignUp() {
  const { loading, user } = useAuth();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [hydrated, setHydrated] = useState(false);
  const { data: profile, isLoading: profileLoading } = trpc.agent.getProfile.useQuery(undefined, { enabled: Boolean(user) });
  const register = trpc.agent.register.useMutation();

  useEffect(() => {
    if (hydrated || !user || profileLoading) return;
    const nameParts = (user.name ?? "").trim().split(/\s+/).filter(Boolean);
    setForm(current => profile ? {
      accountType: profile.accountType,
      firstName: profile.firstName,
      middleName: profile.middleName ?? "",
      lastName: profile.lastName,
      contactNumber: profile.contactNumber,
      email: profile.email,
      companyName: profile.companyName,
      companyAddress: profile.companyAddress,
      postalCode: profile.postalCode ?? "",
      agentLicenseNumber: profile.agentLicenseNumber,
      jobTitle: profile.jobTitle ?? "",
      businessRegistrationNumber: profile.businessRegistrationNumber ?? "",
      website: profile.website ?? "",
      termsAccepted: true,
    } : {
      ...current,
      firstName: nameParts[0] ?? "",
      lastName: nameParts.slice(1).join(" "),
      email: user.email ?? "",
    });
    setHydrated(true);
  }, [hydrated, profile, profileLoading, user]);

  const update = <K extends keyof RegistrationForm>(key: K, value: RegistrationForm[K]) => setForm(current => ({ ...current, [key]: value }));

  const validate = () => {
    if (step === 0 && (!form.firstName.trim() || !form.lastName.trim() || form.contactNumber.trim().length < 8 || !/^\S+@\S+\.\S+$/.test(form.email))) return "Complete your name, contact number, and valid email address.";
    if (step === 1 && (!form.companyName.trim() || !form.companyAddress.trim() || !/^\d{6}$/.test(form.postalCode) || !form.agentLicenseNumber.trim())) return "Complete your company address, 6-digit postal code, and licence number.";
    if (step === 2 && !form.termsAccepted) return "Accept the professional account terms to continue.";
    return "";
  };

  const next = () => {
    const issue = validate();
    if (issue) return toast.error(issue);
    setStep(current => Math.min(2, current + 1));
  };

  const submit = async () => {
    const issue = validate();
    if (issue) return toast.error(issue);
    try {
      await register.mutateAsync({
        accountType: form.accountType,
        firstName: form.firstName.trim(),
        middleName: form.middleName.trim() || undefined,
        lastName: form.lastName.trim(),
        contactNumber: form.contactNumber.trim(),
        email: form.email.trim(),
        companyName: form.companyName.trim(),
        companyAddress: form.companyAddress.trim(),
        postalCode: form.postalCode.trim(),
        agentLicenseNumber: form.agentLicenseNumber.trim(),
        jobTitle: form.jobTitle.trim() || undefined,
        businessRegistrationNumber: form.businessRegistrationNumber.trim() || undefined,
        website: form.website.trim(),
        termsAccepted: true,
      });
      toast.success(profile ? "Professional profile updated" : "Professional profile created");
      setLocation("/agent/subscribe");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save your professional profile");
    }
  };

  if (loading || (user && profileLoading)) return <div className="grid min-h-screen place-items-center bg-[#f4f4ef]"><span className="size-8 animate-spin rounded-full border-2 border-[#17382f]/20 border-t-[#17382f]" /></div>;
  if (!user) return <div className="min-h-screen bg-[#f4f4ef] text-[#17382f]"><BrandHeader /><main className="container grid min-h-[calc(100vh-76px)] place-items-center py-10"><section className="w-full max-w-lg rounded-[2rem] bg-white p-8 text-center shadow-[0_24px_80px_rgba(23,56,47,.10)] sm:p-10"><BadgeCheck className="mx-auto size-12 text-[#b68a4c]" /><h1 className="mt-5 font-display text-4xl">Create a professional profile</h1><p className="mt-3 text-sm leading-6 text-[#647b74]">Sign in first so your verified UrbanKey account can own this agent or co-broker profile.</p><Button onClick={startLogin} className="mt-7 h-12 w-full rounded-full bg-[#17382f] text-white">Sign in securely <ArrowRight className="ml-2 size-4" /></Button><Link href="/agent"><Button variant="ghost" className="mt-2 w-full"><ArrowLeft className="mr-2 size-4" />Back to agent access</Button></Link></section></main></div>;

  return <div className="min-h-screen bg-[#f4f4ef] text-[#17382f]"><BrandHeader /><main className="container py-8 sm:py-12"><div className="mx-auto max-w-5xl"><div className="grid gap-8 lg:grid-cols-[.72fr_1.28fr] lg:gap-12">
    <aside><p className="eyebrow">Professional onboarding</p><h1 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">Set up your UrbanKey Pro identity.</h1><p className="mt-4 text-sm leading-6 text-[#647b74]">Tell clients and co-brokers who they are working with. Payment details are never collected on this form.</p><ol className="mt-8 grid gap-3" aria-label="Registration progress">{steps.map((item, index) => <li key={item.title} className={`flex items-center gap-3 rounded-2xl p-4 transition ${index === step ? "bg-[#17382f] text-white shadow-lg shadow-[#17382f]/12" : index < step ? "bg-[#e4ece7] text-[#275649]" : "bg-white text-[#7c8e88]"}`}><span className={`grid size-10 place-items-center rounded-xl ${index === step ? "bg-[#d5ae72] text-[#17382f]" : "bg-[#edf1ed]"}`}>{index < step ? <Check className="size-4" /> : <item.icon className="size-4" />}</span><span><strong className="block text-sm">{item.title}</strong><span className={`text-[11px] ${index === step ? "text-white/55" : "text-[#879891]"}`}>Step {index + 1} of 3</span></span></li>)}</ol></aside>
    <section className="rounded-[2rem] bg-white p-6 shadow-[0_24px_90px_rgba(23,56,47,.08)] sm:p-9"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#a77c43]">Step {step + 1}</p><h2 className="mt-2 font-display text-3xl">{step === 0 ? "Your details" : step === 1 ? "Company & credentials" : "Review & consent"}</h2></div><span className="rounded-full bg-[#eef2ee] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#5d756e]">{form.accountType === "agent" ? "Agent" : "Co-broker"}</span></div>
      {step === 0 && <div className="mt-7 grid gap-5"><fieldset><legend className="mb-2 text-xs font-semibold text-[#49635d]">Account type</legend><div className="grid grid-cols-2 gap-3">{(["agent", "co_broker"] as const).map(value => <button key={value} type="button" onClick={() => update("accountType", value)} className={`h-12 rounded-xl border text-sm font-semibold transition ${form.accountType === value ? "border-[#17382f] bg-[#17382f] text-white" : "border-[#17382f]/14 bg-[#f8f8f4] text-[#49635d] hover:border-[#b68a4c]"}`}>{value === "agent" ? "Agent" : "Co-broker"}</button>)}</div></fieldset><div className="grid gap-5 sm:grid-cols-2"><label className={labelClass}>First name *<input className={fieldClass} value={form.firstName} onChange={event => update("firstName", event.target.value)} autoComplete="given-name" /></label><label className={labelClass}>Middle name<input className={fieldClass} value={form.middleName} onChange={event => update("middleName", event.target.value)} autoComplete="additional-name" /></label></div><label className={labelClass}>Last name *<input className={fieldClass} value={form.lastName} onChange={event => update("lastName", event.target.value)} autoComplete="family-name" /></label><div className="grid gap-5 sm:grid-cols-2"><label className={labelClass}>Contact number *<input className={fieldClass} value={form.contactNumber} onChange={event => update("contactNumber", event.target.value)} inputMode="tel" autoComplete="tel" placeholder="+65 9123 4567" /></label><label className={labelClass}>Email *<input className={fieldClass} value={form.email} onChange={event => update("email", event.target.value)} inputMode="email" type="email" autoComplete="email" /></label></div></div>}
      {step === 1 && <div className="mt-7 grid gap-5"><label className={labelClass}>Company name *<input className={fieldClass} value={form.companyName} onChange={event => update("companyName", event.target.value)} autoComplete="organization" /></label><label className={labelClass}>Company address *<input className={fieldClass} value={form.companyAddress} onChange={event => update("companyAddress", event.target.value)} autoComplete="street-address" /></label><div className="grid gap-5 sm:grid-cols-2"><label className={labelClass}>Postal code *<input className={fieldClass} value={form.postalCode} onChange={event => update("postalCode", event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="postal-code" placeholder="018956" /></label><label className={labelClass}>Agent licence number *<input className={fieldClass} value={form.agentLicenseNumber} onChange={event => update("agentLicenseNumber", event.target.value)} autoCapitalize="characters" /></label></div><div className="grid gap-5 sm:grid-cols-2"><label className={labelClass}>Job title<input className={fieldClass} value={form.jobTitle} onChange={event => update("jobTitle", event.target.value)} autoComplete="organization-title" /></label><label className={labelClass}>Business registration no.<input className={fieldClass} value={form.businessRegistrationNumber} onChange={event => update("businessRegistrationNumber", event.target.value)} /></label></div><label className={labelClass}>Company website<input className={fieldClass} value={form.website} onChange={event => update("website", event.target.value)} inputMode="url" type="url" autoComplete="url" placeholder="https://example.sg" /></label></div>}
      {step === 2 && <div className="mt-7"><div className="grid gap-3 rounded-2xl bg-[#f5f6f1] p-5 text-sm"><ReviewRow label="Professional" value={`${form.firstName} ${form.lastName} · ${form.accountType === "agent" ? "Agent" : "Co-broker"}`} /><ReviewRow label="Contact" value={`${form.email} · ${form.contactNumber}`} /><ReviewRow label="Company" value={`${form.companyName}, ${form.companyAddress}, Singapore ${form.postalCode}`} /><ReviewRow label="Licence" value={form.agentLicenseNumber} /></div><label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl border border-[#17382f]/12 p-4 text-sm leading-6 text-[#49635d]"><input type="checkbox" checked={form.termsAccepted} onChange={event => update("termsAccepted", event.target.checked)} className="mt-1 size-4 accent-[#17382f]" /><span>I confirm these professional details are accurate and agree to the UrbanKey Pro account terms and acceptable-use requirements.</span></label><div className="mt-4 flex items-start gap-3 rounded-2xl bg-[#fff8eb] p-4 text-xs leading-5 text-[#7a5a31]"><ShieldCheck className="mt-0.5 size-4 shrink-0" />Card and PayNow information is entered only on Stripe's secure checkout. UrbanKey does not store card numbers, CVVs, bank credentials, or PayNow QR details.</div></div>}
      <div className="mt-8 flex items-center justify-between gap-3"><Button type="button" variant="ghost" onClick={() => step ? setStep(current => current - 1) : setLocation("/agent")} className="rounded-full"><ArrowLeft className="mr-2 size-4" />{step ? "Back" : "Cancel"}</Button>{step < 2 ? <Button onClick={next} className="rounded-full bg-[#17382f] px-6 text-white">Continue <ArrowRight className="ml-2 size-4" /></Button> : <Button onClick={submit} disabled={register.isPending} className="rounded-full bg-[#17382f] px-6 text-white">{register.isPending ? "Saving…" : profile ? "Save & view plans" : "Create profile & view plans"}<ArrowRight className="ml-2 size-4" /></Button>}</div>
    </section>
  </div></div></main></div>;
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return <div className="grid gap-1 border-b border-[#17382f]/8 pb-3 last:border-0 last:pb-0 sm:grid-cols-[110px_1fr]"><span className="text-xs font-bold uppercase tracking-wider text-[#8a9994]">{label}</span><span className="font-medium text-[#17382f]">{value}</span></div>;
}
