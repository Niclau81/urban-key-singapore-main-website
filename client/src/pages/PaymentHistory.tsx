import { useAuth } from "@/_core/hooks/useAuth";
import { BrandHeader } from "@/components/BrandHeader";
import { Button } from "@/components/ui/button";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { calculateSubscriptionPrice, formatSgd, getSubscriptionPlan } from "@shared/subscriptionPlans";
import { ArrowLeft, CalendarDays, CreditCard, ReceiptText } from "lucide-react";
import { Link } from "wouter";

const statusStyles = {
  active: "bg-[#dfece4] text-[#276148]",
  pending: "bg-[#fff0ce] text-[#8a6536]",
  failed: "bg-[#f8dddd] text-[#963f3f]",
  cancelled: "bg-[#ebedef] text-[#667078]",
  expired: "bg-[#ebedef] text-[#667078]",
} as const;

export default function PaymentHistory() {
  const { loading, user } = useAuth();
  const { data: orders = [], isLoading, error } = trpc.subscription.listOrders.useQuery(undefined, { enabled: Boolean(user) });
  if (loading) return <div className="grid min-h-screen place-items-center bg-[#f4f4ef]"><span className="size-8 animate-spin rounded-full border-2 border-[#17382f]/20 border-t-[#17382f]" /></div>;
  if (!user) return <div className="min-h-screen bg-[#f4f4ef] text-[#17382f]"><BrandHeader /><main className="container grid min-h-[calc(100vh-76px)] place-items-center py-10"><section className="max-w-lg rounded-[2rem] bg-white p-9 text-center"><ReceiptText className="mx-auto size-12 text-[#b68a4c]" /><h1 className="mt-5 font-display text-4xl">Payment history</h1><p className="mt-3 text-sm text-[#647b74]">Sign in to view subscriptions associated with your professional account.</p><Button onClick={startLogin} className="mt-6 w-full rounded-full bg-[#17382f]">Sign in securely</Button></section></main></div>;

  return <div className="min-h-screen bg-[#f4f4ef] text-[#17382f]"><BrandHeader /><main className="container py-8 sm:py-12"><Link href="/agent/portal" className="inline-flex items-center gap-2 text-sm font-semibold text-[#526b64]"><ArrowLeft className="size-4" />Back to portal</Link><div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="eyebrow">UrbanKey Pro</p><h1 className="mt-3 font-display text-4xl sm:text-5xl">Payment history</h1><p className="mt-3 text-sm text-[#647b74]">Subscription terms, activation status, and receipt email destinations for this account.</p></div><Link href="/agent/subscribe"><Button className="rounded-full bg-[#17382f]">View plans</Button></Link></div>
    <section className="mt-8 overflow-hidden rounded-[2rem] bg-white shadow-[0_18px_65px_rgba(23,56,47,.06)]">{isLoading ? <div className="grid gap-3 p-6">{[0, 1, 2].map(item => <div key={item} className="h-28 animate-pulse rounded-2xl bg-[#edf1ed]" />)}</div> : error ? <div className="p-10 text-center"><h2 className="font-display text-3xl">Could not load payment history</h2><p className="mt-2 text-sm text-[#647b74]">{error.message}</p></div> : !orders.length ? <div className="p-10 text-center sm:p-16"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#edf1ed] text-[#526b64]"><CreditCard className="size-6" /></span><h2 className="mt-5 font-display text-3xl">No subscription payments yet</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#647b74]">Choose a term when you are ready to activate UrbanKey Pro for this account.</p><Link href="/agent/subscribe"><Button className="mt-6 rounded-full bg-[#17382f]">Compare plans</Button></Link></div> : <div className="divide-y divide-[#17382f]/8">{orders.map(order => {
      const plan = getSubscriptionPlan(order.planId);
      const price = plan ? calculateSubscriptionPrice(plan) : undefined;
      const canRetry = order.status === "failed" || order.status === "cancelled";
      return <article key={order.id} className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center"><div className="flex min-w-0 items-start gap-4"><span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#e9eee9] text-[#275649]"><ReceiptText className="size-5" /></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">UrbanKey Pro · {plan?.label ?? `${order.termMonths} months`}</h2><span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${statusStyles[order.status]}`}>{order.status}</span></div><p className="mt-2 flex items-center gap-1.5 text-xs text-[#52665f]"><CalendarDays className="size-3.5" />Created {new Date(order.createdAt).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })}{order.expiresAt ? ` · Access until ${new Date(order.expiresAt).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })}` : ""}</p><p className="mt-1 truncate text-xs text-[#52665f]">Receipt email: {order.receiptEmail}</p></div></div><div className="text-left lg:text-right"><strong className="font-display text-2xl">{price ? formatSgd(price.payableCents) : "—"}</strong>{price && price.savingsCents > 0 && <p className="mt-1 text-xs font-semibold text-[#6f4d22]">Saved {formatSgd(price.savingsCents)}</p>}<p className="mt-1 text-[10px] uppercase tracking-wider text-[#667972]">Checkout …{order.stripeCheckoutSessionId.slice(-8)}</p>{canRetry && <Link href={`/agent/checkout?plan=${encodeURIComponent(order.planId)}`}><Button size="sm" className="mt-3 rounded-full bg-[#17382f] text-white">Retry this plan</Button></Link>}</div></article>;
    })}</div>}</section><p className="mt-5 text-xs leading-5 text-[#52665f]">Payment credentials are managed by Stripe and are not stored in UrbanKey. For the itemized receipt or invoice, use the message sent by Stripe to the receipt email shown above.</p></main></div>;
}
