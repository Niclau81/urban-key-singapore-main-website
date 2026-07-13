import { useAuth } from "@/_core/hooks/useAuth";
import { BrandHeader } from "@/components/BrandHeader";
import { Button } from "@/components/ui/button";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { formatSgd } from "@shared/subscriptionPlans";
import { ArrowLeft, ArrowRight, Check, CreditCard, Landmark, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function Checkout() {
  const { loading, user } = useAuth();
  const params = new URLSearchParams(window.location.search);
  const planId = params.get("plan") ?? "1-year";
  const cancelled = params.get("cancelled") === "1";
  const [paymentMethod, setPaymentMethod] = useState<"card" | "paynow">("card");
  const { data: catalogue, isLoading: plansLoading } = trpc.subscription.getPlans.useQuery();
  const { data: profile, isLoading: profileLoading } = trpc.agent.getProfile.useQuery(undefined, { enabled: Boolean(user) });
  const checkout = trpc.subscription.createCheckout.useMutation();
  const plan = catalogue?.plans.find(item => item.id === planId);

  const pay = async () => {
    if (!user) return startLogin();
    if (!profile) return toast.error("Complete your professional profile before checkout");
    if (!plan) return toast.error("Choose a valid subscription plan");
    try {
      const result = await checkout.mutateAsync({ planId: plan.id, paymentMethod, origin: window.location.origin });
      const opened = window.open(result.url, "_blank", "noopener,noreferrer");
      if (!opened) window.location.assign(result.url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not start secure checkout");
    }
  };

  if (loading || plansLoading || (user && profileLoading)) return <div className="grid min-h-screen place-items-center bg-[#f4f4ef]"><span className="size-8 animate-spin rounded-full border-2 border-[#17382f]/20 border-t-[#17382f]" /></div>;
  if (!plan) return <div className="min-h-screen bg-[#f4f4ef] text-[#17382f]"><BrandHeader /><main className="container py-16 text-center"><h1 className="font-display text-5xl">Plan not found</h1><Link href="/agent/subscribe"><Button className="mt-6 rounded-full bg-[#17382f]">View subscription plans</Button></Link></main></div>;

  return <div className="min-h-screen bg-[#f4f4ef] text-[#17382f]"><BrandHeader /><main className="container py-8 sm:py-12"><Link href="/agent/subscribe" className="inline-flex items-center gap-2 text-sm font-semibold text-[#526b64]"><ArrowLeft className="size-4" />Back to plans</Link>{cancelled && <div role="status" className="mt-5 rounded-2xl border border-[#b68a4c]/25 bg-[#fff8eb] p-4 text-sm text-[#7a5a31]">Checkout was cancelled. No payment was made, and you can resume whenever you are ready.</div>}
    <div className="mt-6 grid gap-7 lg:grid-cols-[1.08fr_.92fr] lg:gap-10"><section className="rounded-[2rem] bg-white p-6 shadow-[0_24px_80px_rgba(23,56,47,.07)] sm:p-9"><p className="eyebrow">Secure checkout</p><h1 className="mt-3 font-display text-4xl sm:text-5xl">Choose how to pay.</h1><p className="mt-3 text-sm leading-6 text-[#647b74]">You will complete payment on Stripe Checkout in a new tab. UrbanKey does not receive or store your sensitive payment credentials.</p>
      {!user ? <div className="mt-7 rounded-2xl bg-[#eef2ee] p-5"><h2 className="font-semibold">Sign in to continue</h2><p className="mt-1 text-sm text-[#647b74]">Your account links the subscription and receipt to the correct professional profile.</p><Button onClick={startLogin} className="mt-4 rounded-full bg-[#17382f]">Sign in securely</Button></div> : !profile ? <div className="mt-7 rounded-2xl bg-[#fff8eb] p-5"><h2 className="font-semibold">Professional profile required</h2><p className="mt-1 text-sm text-[#7a5a31]">Complete your name, company, contact, and licence details before paying.</p><Link href="/agent/signup"><Button className="mt-4 rounded-full bg-[#17382f]">Complete profile <ArrowRight className="ml-2 size-4" /></Button></Link></div> : <><fieldset className="mt-8"><legend className="text-xs font-bold uppercase tracking-[.16em] text-[#7a8b86]">Payment method</legend><div className="mt-3 grid gap-3 sm:grid-cols-2">{catalogue?.paymentMethods.map(method => {
        const Icon = method.id === "card" ? CreditCard : Landmark;
        const selected = paymentMethod === method.id;
        return <button key={method.id} type="button" onClick={() => setPaymentMethod(method.id)} className={`min-h-36 rounded-2xl border p-5 text-left transition ${selected ? "border-[#17382f] bg-[#17382f] text-white shadow-lg shadow-[#17382f]/10" : "border-[#17382f]/12 bg-[#f8f8f4] hover:border-[#b68a4c]"}`}><span className={`grid size-10 place-items-center rounded-xl ${selected ? "bg-[#d5ae72] text-[#17382f]" : "bg-[#e7ede8] text-[#275649]"}`}><Icon className="size-5" /></span><strong className="mt-4 block text-sm">{method.label}</strong><span className={`mt-1 block text-xs leading-5 ${selected ? "text-white/55" : "text-[#71857f]"}`}>{method.description}</span></button>;
      })}</div></fieldset><div className="mt-6 flex items-start gap-3 rounded-2xl border border-[#17382f]/10 p-4 text-xs leading-5 text-[#647b74]"><Mail className="mt-0.5 size-4 shrink-0 text-[#a77c43]" />Stripe sends the payment receipt to <strong className="text-[#17382f]">{profile.email}</strong>. Keep this address current in your professional profile.</div><Button onClick={pay} disabled={checkout.isPending} className="mt-6 h-12 w-full rounded-full bg-[#17382f] text-white shadow-lg shadow-[#17382f]/12">{checkout.isPending ? "Opening secure checkout…" : `Pay ${formatSgd(plan.payableCents)} with ${paymentMethod === "card" ? "card" : "PayNow"}`}<ArrowRight className="ml-2 size-4" /></Button></>}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] text-[#71857f]"><span className="flex items-center gap-1.5"><LockKeyhole className="size-3.5" />Encrypted Stripe Checkout</span><span className="flex items-center gap-1.5"><ShieldCheck className="size-3.5" />No payment credentials stored by UrbanKey</span></div>
    </section>
    <aside><div className="sticky top-6 overflow-hidden rounded-[2rem] bg-[#17382f] p-6 text-white shadow-[0_24px_80px_rgba(23,56,47,.18)] sm:p-8"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#d5ae72]">Order summary</p><h2 className="mt-3 font-display text-4xl">UrbanKey Pro</h2><p className="mt-1 text-sm text-white/55">{plan.label} professional access</p><div className="my-6 h-px bg-white/10" /><SummaryRow label={`Regular (${plan.months} × ${formatSgd(12000)})`} value={formatSgd(plan.regularCents)} /><SummaryRow label={`Term discount (${plan.discountPercent}%)`} value={plan.savingsCents ? `−${formatSgd(plan.savingsCents)}` : formatSgd(0)} accent={plan.savingsCents > 0} /><div className="my-5 h-px bg-white/10" /><div className="flex items-end justify-between gap-4"><span><span className="block text-xs text-white/45">Total payable now</span><span className="mt-1 block font-display text-4xl text-[#d5ae72]">{formatSgd(plan.payableCents)}</span></span><span className="text-right text-xs text-white/45">{formatSgd(plan.effectiveMonthlyCents)}<br />effective / month</span></div>{plan.savingsCents > 0 && <div className="mt-6 flex items-center gap-3 rounded-2xl bg-[#d5ae72]/12 p-4 text-sm text-[#f0cf9b]"><Check className="size-4 shrink-0" />You save <strong>{formatSgd(plan.savingsCents)}</strong> on this term.</div>}</div></aside>
    </div></main></div>;
}

function SummaryRow({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return <div className="mt-3 flex items-center justify-between gap-4 text-sm"><span className="text-white/55">{label}</span><strong className={accent ? "text-[#d5ae72]" : "text-white"}>{value}</strong></div>;
}
