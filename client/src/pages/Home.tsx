import { BrandHeader } from "@/components/BrandHeader";
import { PropertyCard } from "@/components/PropertyCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { ArrowRight, BadgeCheck, Box, Building, ChartNoAxesCombined, Map, Search, ShieldCheck, Sparkles, TrainFront } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

const modes = ["Buy", "Rent", "Sell", "Rent-Out"] as const;

export default function Home() {
  const [mode, setMode] = useState<(typeof modes)[number]>("Buy");
  const [query, setQuery] = useState("");
  const [district, setDistrict] = useState("All districts");
  const [, navigate] = useLocation();
  const { data: properties = [] } = trpc.property.list.useQuery();
  const submit = () => navigate(`/explore?mode=${mode}&district=${encodeURIComponent(district)}&search=${encodeURIComponent(query)}`);
  return (
    <div className="min-h-screen bg-[#f8f6f0] text-[#16362e]">
      <main>
      <section className="relative min-h-[760px] overflow-hidden bg-[#10231e] text-white">
        <BrandHeader tone="dark" />
        <div className="absolute inset-y-0 right-0 hidden w-[52%] lg:block"><img src="/manus-storage/marina-skyline_8ccbeb9b.jpg" className="h-full w-full object-cover" alt="Singapore Marina Bay skyline" /><div className="absolute inset-0 bg-gradient-to-r from-[#10231e] via-[#10231e]/30 to-transparent" /><div className="absolute inset-0 bg-gradient-to-t from-[#10231e]/70 via-transparent to-[#10231e]/25" /></div>
        <div className="container relative z-10 grid min-h-[684px] items-center py-16 lg:grid-cols-[1.05fr_.95fr]">
          <div className="max-w-[720px] pb-10 lg:pb-16">
            <div className="mb-7 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[#d5ae72]"><span className="h-px w-10 bg-current" />Singapore property, understood</div>
            <h1 className="font-display text-[52px] leading-[1.02] tracking-[-0.035em] sm:text-[68px] lg:text-[78px]">Find the address<br />that <em className="font-normal text-[#d9bc8e]">fits your life.</em></h1>
            <p className="mt-7 max-w-[580px] text-base leading-7 text-white/67 sm:text-lg">Explore homes through immersive maps, verified-context tools, transaction intelligence, and a concierge that understands what matters to you.</p>
            <div className="mt-10 max-w-[760px] rounded-[22px] bg-[#faf9f5] p-2.5 text-[#16362e] shadow-[0_30px_90px_rgba(0,0,0,0.26)]">
              <div className="flex flex-wrap gap-1 border-b border-[#17382f]/10 px-2 pb-2">{modes.map(item => <button key={item} onClick={() => setMode(item)} className={`rounded-full px-4 py-2 text-xs font-bold transition ${mode === item ? "bg-[#17382f] text-white" : "text-[#49635d] hover:bg-[#e8ede9]"}`}>{item}</button>)}</div>
              <div className="grid gap-2 pt-2 sm:grid-cols-[1.5fr_1fr_auto]">
                <div className="flex items-center gap-2 rounded-xl px-3"><Search className="size-4 text-[#9b7440]" /><Input value={query} onChange={event => setQuery(event.target.value)} className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0" placeholder="Condo, district, MRT or street" onKeyDown={event => event.key === "Enter" && submit()} /></div>
                <Select value={district} onValueChange={setDistrict}><SelectTrigger aria-label="District" className="h-11 border-0 bg-[#edf1ed] shadow-none"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="All districts">All districts</SelectItem><SelectItem value="D01 · Marina Bay">D01 · Marina Bay</SelectItem><SelectItem value="D04 · Harbourfront">D04 · Harbourfront</SelectItem><SelectItem value="D10 · Tanglin">D10 · Tanglin</SelectItem></SelectContent></Select>
                <Button onClick={submit} className="h-11 rounded-xl bg-[#c99d60] px-6 text-[#10231e] hover:bg-[#d8af76]">Explore <ArrowRight className="ml-2 size-4" /></Button>
              </div>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-8 gap-y-3 text-xs text-white/60"><span className="flex items-center gap-2"><BadgeCheck className="size-4 text-[#d5ae72]" />Privacy-first insights</span><span className="flex items-center gap-2"><TrainFront className="size-4 text-[#d5ae72]" />MRT-aware discovery</span><span className="flex items-center gap-2"><ShieldCheck className="size-4 text-[#d5ae72]" />Context with disclaimers</span></div>
          </div>
        </div>
        <div className="absolute bottom-8 right-8 z-20 hidden rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-xl lg:block"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">Live market signal</p><p className="mt-2 text-sm"><span className="text-[#d5ae72]">D01</span> · 18 new matches this week</p></div>
      </section>

      <section className="border-b border-[#17382f]/10 bg-[#f8f6f0] py-8"><div className="container grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[
        ["3D district map", "Explore context, not just pins", Map], ["Immersive viewing", "Tour day and night", Box], ["Transaction lens", "Read the price journey", ChartNoAxesCombined], ["AI matching", "Explain what fits and why", Sparkles],
      ].map(([title, text, Icon]) => <div key={title as string} className="flex items-center gap-4 px-2 py-3"><span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#e6ece7] text-[#275649]"><Icon className="size-5" /></span><div><p className="text-sm font-semibold">{title as string}</p><p className="mt-0.5 text-xs text-[#506760]">{text as string}</p></div></div>)}</div></section>

      <section className="container py-24">
        <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="eyebrow">Curated residences</p><h2 className="section-title mt-3">Homes with a clearer story.</h2><p className="mt-4 max-w-xl text-[#4e665f]">Move beyond surface details with immersive views, ownership context, and a transparent record of curated highlights and reported concerns.</p></div><Link href="/explore"><Button variant="outline" className="rounded-full border-[#17382f]/20 bg-transparent px-5">View all properties <ArrowRight className="ml-2 size-4" /></Button></Link></div>
        <div className="grid gap-6 lg:grid-cols-3">{properties.map(property => <PropertyCard key={property.id} property={property} />)}</div>
      </section>

      <section className="overflow-hidden bg-[#e9eee9] py-24"><div className="container grid items-center gap-12 lg:grid-cols-[.92fr_1.08fr]"><div className="relative"><div className="overflow-hidden rounded-[32px]"><img src="/manus-storage/interlace-aerial_74c51dd9.jpg" alt="Architectural condominium in Singapore" className="aspect-[1.1/1] w-full object-cover" /></div><div className="absolute -bottom-6 -right-4 max-w-[230px] rounded-2xl bg-[#17382f] p-5 text-white shadow-2xl sm:right-8"><Building className="size-5 text-[#d5ae72]" /><p className="mt-3 font-display text-xl">See the whole address.</p><p className="mt-2 text-xs leading-5 text-white/75">Building form, district context, MRT radius, and neighborhood boundaries in one view.</p></div></div><div className="lg:pl-10"><p className="eyebrow">Spatial intelligence</p><h2 className="section-title mt-3">Singapore, layered<br />around your priorities.</h2><p className="mt-6 max-w-xl text-base leading-7 text-[#49615a]">Tilt into a 3D perspective, reveal nearby transport, compare district boundaries, and move from neighborhood scale to unit-level detail without losing context.</p><div className="mt-8 grid gap-4 sm:grid-cols-2">{["3D building footprints", "MRT walk-time radii", "District boundary overlays", "Clustered property signals"].map(item => <div key={item} className="flex items-center gap-3 rounded-xl border border-[#17382f]/10 bg-white/50 px-4 py-3 text-sm font-semibold"><BadgeCheck className="size-4 text-[#76552f]" />{item}</div>)}</div><Link href="/map"><Button className="mt-9 rounded-full bg-[#17382f] px-6 text-white">Open map intelligence <ArrowRight className="ml-2 size-4" /></Button></Link></div></div></section>

      <section className="container py-24"><div className="rounded-[34px] bg-[#17382f] p-8 text-white sm:p-12 lg:flex lg:items-center lg:justify-between lg:p-16"><div className="max-w-2xl"><p className="eyebrow !text-[#f0cf9b]">UrbanKey Intelligence</p><h2 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">Tell us how you want to live.<br />We’ll translate it into places.</h2><p className="mt-5 max-w-xl text-white/75">Our buyer and tenant concierge reasons across commute, budget, tenure, space, and lifestyle. A separate professional mode supports agents and co-brokers.</p></div><Link href="/assistants"><Button className="mt-8 h-13 rounded-full bg-[#d5ae72] px-7 text-[#17382f] hover:bg-[#e2c08b] lg:mt-0">Meet your AI concierge <Sparkles className="ml-2 size-4" /></Button></Link></div></section>
      </main>
      <footer className="border-t border-[#17382f]/10 py-10"><div className="container flex flex-col gap-5 text-sm text-[#4e665f] sm:flex-row sm:items-center sm:justify-between"><p>© 2026 UrbanKey Singapore. Demonstration property intelligence platform.</p><div className="flex flex-wrap gap-5" aria-label="Platform principles"><span>Privacy by design</span><span>Curated demo data</span><span>Independent verification required</span></div></div></footer>
    </div>
  );
}
