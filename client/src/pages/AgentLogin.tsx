import { useAuth } from "@/_core/hooks/useAuth";
import { BrandHeader } from "@/components/BrandHeader";
import { Button } from "@/components/ui/button";
import { startLogin } from "@/const";
import { ArrowRight, BadgeCheck, Building2, Images, LockKeyhole, RefreshCw } from "lucide-react";
import { useEffect } from "react";
import { Link, useLocation } from "wouter";

const benefits = [
  { icon: Building2, title: "One property workspace", body: "Create and maintain residential, commercial, and industrial listings from one focused portal." },
  { icon: Images, title: "Deployment-safe media", body: "Upload up to six property images per listing to secure managed storage." },
  { icon: RefreshCw, title: "Live listing control", body: "Edit details, refresh operational specifications, and move listings between draft, active, and paused." },
];

export default function AgentLogin() {
  const { loading, user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user) setLocation("/agent/portal");
  }, [setLocation, user]);

  if (loading || user) {
    return <div className="grid min-h-screen place-items-center bg-[#f4f4ef] text-[#17382f]"><div className="text-center"><span className="mx-auto block size-8 animate-spin rounded-full border-2 border-[#17382f]/20 border-t-[#17382f]" /><p className="mt-4 text-sm text-[#647b74]">Preparing your professional workspace…</p></div></div>;
  }

  return <div className="min-h-screen bg-[#f4f4ef] text-[#17382f]">
    <BrandHeader />
    <main className="container py-8 sm:py-12 lg:py-16">
      <section className="grid overflow-hidden rounded-[2rem] bg-white shadow-[0_30px_100px_rgba(23,56,47,0.12)] lg:grid-cols-[1.02fr_.98fr]">
        <div className="relative px-6 py-10 sm:px-10 sm:py-14 lg:px-14 lg:py-20">
          <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(23,56,47,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(23,56,47,.045)_1px,transparent_1px)] [background-size:38px_38px]" />
          <div className="relative max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#b68a4c]/25 bg-[#fff8eb] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.16em] text-[#805d2f]"><BadgeCheck className="size-3.5" /> Agent & co-broker access</div>
            <h1 className="mt-7 font-display text-5xl leading-[.96] sm:text-6xl">Your listings,<br /><span className="text-[#a77c43]">kept current.</span></h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-[#647b74]">Sign in to publish stronger property records, upload media, maintain commercial specifications, and control listing availability from one secure workspace.</p>
            <Button onClick={startLogin} size="lg" className="mt-8 h-12 rounded-full bg-[#17382f] px-7 text-white shadow-lg shadow-[#17382f]/15 hover:bg-[#224a40]">Sign in to agent portal <ArrowRight className="ml-2 size-4" /></Button>
            <div className="mt-5 flex items-center gap-2 text-xs text-[#71857f]"><LockKeyhole className="size-3.5" /> Protected with your UrbanKey account</div>
            <p className="mt-10 text-xs text-[#71857f]">Looking for properties instead? <Link href="/explore" className="font-semibold text-[#275649] underline decoration-[#b68a4c]/60 underline-offset-4">Return to discovery</Link></p>
          </div>
        </div>
        <div className="relative overflow-hidden bg-[#17382f] p-7 text-white sm:p-10 lg:p-14">
          <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_20%_20%,#d5ae72_0,transparent_30%),linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:auto,46px_46px,46px_46px]" />
          <div className="relative flex h-full flex-col justify-between gap-12">
            <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#d5ae72]">UrbanKey Pro</p><h2 className="mt-4 max-w-md font-display text-3xl leading-tight sm:text-4xl">Built for the detail work behind every listing.</h2></div>
            <div className="grid gap-4">{benefits.map(item => <div key={item.title} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[.055] p-5 backdrop-blur"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#d5ae72]/15 text-[#d5ae72]"><item.icon className="size-5" /></span><div><h3 className="text-sm font-semibold">{item.title}</h3><p className="mt-1 text-xs leading-5 text-white/55">{item.body}</p></div></div>)}</div>
          </div>
        </div>
      </section>
    </main>
  </div>;
}
