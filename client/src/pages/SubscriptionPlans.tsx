import { useAuth } from "@/_core/hooks/useAuth";
import { BrandHeader } from "@/components/BrandHeader";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { formatSgd } from "@shared/subscriptionPlans";
import { ArrowRight, BadgeCheck, Check, CreditCard, Landmark, ShieldCheck, Sparkles } from "lucide-react";
import { useLocation } from "wouter";

export default function SubscriptionPlans() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data, isLoading, error } = trpc.subscription.getPlans.useQuery();
  const choose = (planId: string) => setLocation(user ? `/agent/checkout?plan=${encodeURIComponent(planId)}` : "/agent/signup");

  return <div className="min-h-screen bg-[#f4f4ef] text-[#17382f]"><BrandHeader /><main><section className="relative overflow-hidden bg-[#17382f] py-14 text-white sm:py-20"><div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_20%_15%,#d5ae72_0,transparent_25%),linear-gradient(rgba(255,255,255,.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.07)_1px,transparent_1px)] [background-size:auto,48px_48px,48px_48px]" /><div className="container relative text-center"><span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[.06] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.18em] text-[#d5ae72]"><Sparkles className="size-3.5" /> UrbanKey Pro access</span><h1 className="mx-auto mt-6 max-w-4xl font-display text-5xl leading-[.95] sm:text-6xl lg:text-7xl">Commit longer.<br /><span className="text-[#d5ae72]">Save more.</span></h1><p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-white/62 sm:text-base">Every plan includes the same professional workspace. Select the term that matches your business horizon, from one month to ten years.</p></div></section>
    <section className="container py-10 sm:py-14"><div className="mb-8 grid gap-3 sm:grid-cols-3"><TrustCard icon={CreditCard} title="Cards accepted" text="Visa, Mastercard, and other supported cards" /><TrustCard icon={Landmark} title="PayNow" text="Scan and approve in a participating Singapore bank app" /><TrustCard icon={ShieldCheck} title="Stripe secured" text="UrbanKey never stores sensitive payment credentials" /></div>
      {isLoading ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 9 }, (_, index) => <div key={index} className="h-72 animate-pulse rounded-3xl bg-white" />)}</div> : error ? <div className="rounded-3xl bg-white p-10 text-center"><h2 className="font-display text-3xl">Plans are temporarily unavailable</h2><p className="mt-2 text-sm text-[#647b74]">{error.message}</p></div> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{data?.plans.map(plan => {
        const featured = plan.id === "1-year";
        return <article key={plan.id} className={`relative flex min-h-[330px] flex-col overflow-hidden rounded-3xl p-6 transition hover:-translate-y-1 ${featured ? "bg-[#17382f] text-white shadow-[0_24px_70px_rgba(23,56,47,.20)]" : "bg-white shadow-[0_15px_50px_rgba(23,56,47,.055)]"}`}>
          {featured && <span className="absolute right-5 top-5 rounded-full bg-[#d5ae72] px-3 py-1 text-[9px] font-black uppercase tracking-[.16em] text-[#17382f]">Popular</span>}<p className={`text-[10px] font-bold uppercase tracking-[.18em] ${featured ? "text-[#d5ae72]" : "text-[#76542c]"}`}>{plan.group.replace("_", " ")}</p><h2 className="mt-3 font-display text-4xl">{plan.label}</h2><div className="mt-6"><span className="font-display text-4xl">{formatSgd(plan.effectiveMonthlyCents)}</span><span className={featured ? "text-white/45" : "text-[#52665f]"}> / month</span></div><p className={`mt-2 text-xs ${featured ? "text-white/45" : "text-[#52665f]"}`}>{formatSgd(plan.payableCents)} payable once for the full term</p>
          <div className={`my-5 h-px ${featured ? "bg-white/10" : "bg-[#17382f]/8"}`} />
          <div className="space-y-2 text-sm"><p className="flex items-center gap-2"><Check className={`size-4 ${featured ? "text-[#d5ae72]" : "text-[#4d806d]"}`} />Full UrbanKey Pro workspace</p><p className="flex items-center gap-2"><Check className={`size-4 ${featured ? "text-[#d5ae72]" : "text-[#4d806d]"}`} />Email receipt after payment</p>{plan.discountPercent > 0 ? <p className={`flex items-center gap-2 font-semibold ${featured ? "text-[#d5ae72]" : "text-[#6f4d22]"}`}><BadgeCheck className="size-4" />Save {formatSgd(plan.savingsCents)} ({plan.discountPercent}%)</p> : <p className={`flex items-center gap-2 ${featured ? "text-white/55" : "text-[#52665f]"}`}><Check className="size-4" />Flexible one-month access</p>}</div>
          <Button onClick={() => choose(plan.id)} className={`mt-auto h-11 rounded-full ${featured ? "bg-[#d5ae72] text-[#17382f] hover:bg-[#e2bd83]" : "bg-[#17382f] text-white hover:bg-[#224a40]"}`}>Choose {plan.label}<ArrowRight className="ml-2 size-4" /></Button>
        </article>;
      })}</div>}
      <p className="mt-8 text-center text-xs leading-5 text-[#52665f]">Prices are in Singapore dollars. Longer-term discounts are applied at checkout. PayNow is presented as a QR payment in supported Singapore bank apps; generic bank-login credentials are never requested by UrbanKey.</p>
    </section></main></div>;
}

function TrustCard({ icon: Icon, title, text }: { icon: typeof CreditCard; title: string; text: string }) {
  return <div className="flex items-center gap-3 rounded-2xl bg-white p-4"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e9eee9] text-[#275649]"><Icon className="size-4" /></span><span><strong className="block text-sm">{title}</strong><span className="mt-0.5 block text-[11px] leading-4 text-[#52665f]">{text}</span></span></div>;
}
