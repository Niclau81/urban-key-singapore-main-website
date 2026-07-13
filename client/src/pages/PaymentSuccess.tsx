import { useAuth } from "@/_core/hooks/useAuth";
import { BrandHeader } from "@/components/BrandHeader";
import { Button } from "@/components/ui/button";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { Check, Clock3, MailCheck, ReceiptText, ShieldCheck, X } from "lucide-react";
import { Link } from "wouter";

export default function PaymentSuccess() {
  const { loading, user } = useAuth();
  const sessionId = new URLSearchParams(window.location.search).get("session_id");
  const { data: orders = [], isLoading } = trpc.subscription.listOrders.useQuery(undefined, { enabled: Boolean(user), refetchInterval: 2500 });
  const order = orders.find(item => item.stripeCheckoutSessionId === sessionId);
  const active = order?.status === "active";
  const failed = order?.status === "failed";
  const retryHref = order ? `/agent/checkout?plan=${encodeURIComponent(order.planId)}` : "/agent/subscribe";

  if (loading) return <div className="grid min-h-screen place-items-center bg-[#f4f4ef]"><span className="size-8 animate-spin rounded-full border-2 border-[#17382f]/20 border-t-[#17382f]" /></div>;
  if (!user) return <div className="min-h-screen bg-[#f4f4ef] text-[#17382f]"><BrandHeader /><main className="container grid min-h-[calc(100vh-76px)] place-items-center py-10"><section className="max-w-lg rounded-[2rem] bg-white p-9 text-center"><ShieldCheck className="mx-auto size-12 text-[#b68a4c]" /><h1 className="mt-5 font-display text-4xl">Sign in to confirm payment</h1><p className="mt-3 text-sm leading-6 text-[#647b74]">Use the same account that opened checkout to view activation and receipt details.</p><Button onClick={startLogin} className="mt-6 w-full rounded-full bg-[#17382f]">Sign in securely</Button></section></main></div>;

  return <div className="min-h-screen bg-[#f4f4ef] text-[#17382f]"><BrandHeader /><main className="container grid min-h-[calc(100vh-76px)] place-items-center py-10"><section className="w-full max-w-2xl overflow-hidden rounded-[2rem] bg-white text-center shadow-[0_28px_90px_rgba(23,56,47,.10)]"><div className={`p-8 sm:p-11 ${active ? "bg-[#17382f] text-white" : failed ? "bg-[#f8dddd] text-[#702f2f]" : "bg-[#fff8eb]"}`}><span className={`mx-auto grid size-16 place-items-center rounded-full ${active ? "bg-[#d5ae72] text-[#17382f]" : failed ? "bg-[#efc7c7] text-[#8f3737]" : "bg-[#f0ddbc] text-[#8a6536]"}`}>{active ? <Check className="size-8" /> : failed ? <X className="size-7" /> : <Clock3 className="size-7" />}</span><p className={`mt-5 text-[10px] font-bold uppercase tracking-[.18em] ${active ? "text-[#d5ae72]" : failed ? "text-[#8f3737]" : "text-[#9a7440]"}`}>{active ? "Payment confirmed" : failed ? "Payment not completed" : "Confirming payment"}</p><h1 className="mt-3 font-display text-4xl sm:text-5xl">{active ? "Your Pro access is active." : failed ? "Your payment could not be confirmed." : "Your payment is being verified."}</h1><p className={`mx-auto mt-4 max-w-lg text-sm leading-6 ${active ? "text-white/58" : failed ? "text-[#702f2f]" : "text-[#7a5a31]"}`}>{active ? "UrbanKey has received Stripe's confirmation and activated your selected term." : failed ? "No Pro access was activated. Retry the same plan securely or choose another subscription term." : isLoading || order ? "Stripe confirmation can take a few moments, especially for PayNow. This page updates automatically." : "We are matching this checkout to your UrbanKey account. Keep this page open for a moment."}</p></div><div className="p-7 sm:p-9"><div className="grid gap-3 sm:grid-cols-2"><InfoCard icon={MailCheck} title={active ? "Receipt emailed" : "Receipt after payment"} body={active && order?.receiptEmail ? `Stripe sends the receipt to ${order.receiptEmail}.` : "Stripe sends a receipt only after payment is confirmed."} /><InfoCard icon={ReceiptText} title="Payment history" body="Your subscription status and term remain available in your professional account." /></div><div className="mt-7 grid gap-3 sm:grid-cols-2">{failed ? <Link href={retryHref}><Button className="h-11 w-full rounded-full bg-[#17382f]">Retry secure payment</Button></Link> : <Link href="/agent/portal"><Button className="h-11 w-full rounded-full bg-[#17382f]">Open agent portal</Button></Link>}<Link href="/agent/payments"><Button variant="outline" className="h-11 w-full rounded-full border-[#17382f]/18 bg-white">View payment history</Button></Link></div>{sessionId && <p className="mt-6 break-all text-[10px] text-[#667972]">Checkout reference: {sessionId}</p>}</div></section></main></div>;
}

function InfoCard({ icon: Icon, title, body }: { icon: typeof MailCheck; title: string; body: string }) {
  return <div className="rounded-2xl bg-[#f5f6f1] p-5 text-left"><Icon className="size-5 text-[#76542c]" /><strong className="mt-3 block text-sm">{title}</strong><p className="mt-1 text-xs leading-5 text-[#52665f]">{body}</p></div>;
}
