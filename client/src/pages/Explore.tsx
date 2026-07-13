import { BrandHeader } from "@/components/BrandHeader";
import { PropertyCard } from "@/components/PropertyCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Filter, ListFilter, Map, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

const readQuery = () => new URLSearchParams(window.location.search);

export default function Explore() {
  const params = useMemo(readQuery, []);
  const [mode, setMode] = useState(params.get("mode") || "Buy");
  const [search, setSearch] = useState(params.get("search") || "");
  const [district, setDistrict] = useState(params.get("district") || "All districts");
  const [propertyType, setPropertyType] = useState("All types");
  const [tenure, setTenure] = useState("Any tenure");
  const [maxPrice, setMaxPrice] = useState("Any price");
  const [minSize, setMinSize] = useState("Any size");
  const [mrtWalk, setMrtWalk] = useState("Any distance");
  const queryInput = useMemo(() => ({ mode: mode as "Buy" | "Sell" | "Rent" | "Rent-Out", search: search || undefined, district, propertyType, tenure, maxPrice: maxPrice === "Any price" ? undefined : Number(maxPrice), minSize: minSize === "Any size" ? undefined : Number(minSize), maxMrtMinutes: mrtWalk === "Any distance" ? undefined : Number(mrtWalk) }), [mode, search, district, propertyType, tenure, maxPrice, minSize, mrtWalk]);
  const { data: properties = [], isLoading } = trpc.property.list.useQuery(queryInput);
  return <div className="min-h-screen bg-[#f5f4ef] text-[#17382f]"><BrandHeader />
    <main>
      <section className="border-b border-[#17382f]/10 bg-[#faf9f5] py-10"><div className="container"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="eyebrow">Discover Singapore</p><h1 className="mt-3 font-display text-4xl sm:text-5xl">Properties, seen in context.</h1></div><Link href="/map"><Button className="rounded-full bg-[#17382f]"><Map className="mr-2 size-4" />Explore on 3D map</Button></Link></div>
        <div className="mt-8 grid gap-3 rounded-2xl border border-[#17382f]/10 bg-white p-3 shadow-sm md:grid-cols-2 xl:grid-cols-[1.4fr_repeat(6,1fr)]"><div className="flex items-center gap-2 rounded-xl bg-[#f0f2ee] px-3"><Search className="size-4 text-[#9b7440]" /><Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search address, MRT or district" className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0" /></div>
          <Select value={mode} onValueChange={setMode}><SelectTrigger aria-label="Listing mode" className="border-0 bg-[#f0f2ee] shadow-none"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Buy">Buy</SelectItem><SelectItem value="Rent">Rent</SelectItem><SelectItem value="Sell">Sell</SelectItem><SelectItem value="Rent-Out">Rent-Out</SelectItem></SelectContent></Select>
          <Select value={district} onValueChange={setDistrict}><SelectTrigger aria-label="District" className="border-0 bg-[#f0f2ee] shadow-none"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="All districts">All districts</SelectItem><SelectItem value="D01 · Marina Bay">D01 · Marina Bay</SelectItem><SelectItem value="D04 · Harbourfront">D04 · Harbourfront</SelectItem><SelectItem value="D10 · Tanglin">D10 · Tanglin</SelectItem></SelectContent></Select>
          <Select value={propertyType} onValueChange={setPropertyType}><SelectTrigger aria-label="Property type" className="border-0 bg-[#f0f2ee] shadow-none"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="All types">All types</SelectItem><SelectItem value="Condominium">Condominium</SelectItem><SelectItem value="Apartment">Apartment</SelectItem></SelectContent></Select>
          <Select value={tenure} onValueChange={setTenure}><SelectTrigger aria-label="Tenure" className="border-0 bg-[#f0f2ee] shadow-none"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Any tenure">Any tenure</SelectItem><SelectItem value="Freehold">Freehold</SelectItem><SelectItem value="99-year">99-year</SelectItem></SelectContent></Select>
          <Select value={minSize} onValueChange={setMinSize}><SelectTrigger aria-label="Minimum floor area" className="border-0 bg-[#f0f2ee] shadow-none"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Any size">Any size</SelectItem><SelectItem value="1000">1,000+ sq ft</SelectItem><SelectItem value="1500">1,500+ sq ft</SelectItem><SelectItem value="2000">2,000+ sq ft</SelectItem></SelectContent></Select>
          <Select value={mrtWalk} onValueChange={setMrtWalk}><SelectTrigger aria-label="Maximum MRT walk time" className="border-0 bg-[#f0f2ee] shadow-none"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Any distance">Any MRT walk</SelectItem><SelectItem value="5">Within 5 min</SelectItem><SelectItem value="10">Within 10 min</SelectItem><SelectItem value="15">Within 15 min</SelectItem></SelectContent></Select>
        </div></div></section>
      <section className="container py-10"><h2 className="sr-only">Matched properties</h2><div className="mb-7 flex items-center justify-between"><p className="text-sm text-[#4e665f]"><strong className="text-[#17382f]">{properties.length}</strong> thoughtfully matched properties</p><div className="flex gap-2"><Select value={maxPrice} onValueChange={setMaxPrice}><SelectTrigger aria-label="Maximum price" className="w-[150px] rounded-full bg-transparent"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Any price">Any price</SelectItem><SelectItem value="3000000">Up to S$3M</SelectItem><SelectItem value="5000000">Up to S$5M</SelectItem><SelectItem value="7000000">Up to S$7M</SelectItem></SelectContent></Select><Button onClick={() => toast.info("Results are currently ordered by contextual match.")} aria-label="Result sorting information" variant="outline" size="icon" className="rounded-full"><ListFilter className="size-4" /></Button></div></div>
        {isLoading ? <div className="grid gap-6 lg:grid-cols-3">{[1,2,3].map(item => <div key={item} className="h-[500px] animate-pulse rounded-[24px] bg-[#e4e8e4]" />)}</div> : properties.length ? <div className="grid gap-6 lg:grid-cols-3">{properties.map(property => <PropertyCard key={property.id} property={property} />)}</div> : <div className="rounded-3xl border border-dashed border-[#17382f]/20 py-24 text-center"><Filter className="mx-auto size-8 text-[#a77c43]" /><h2 className="mt-4 font-display text-2xl">No exact match yet</h2><p className="mt-2 text-sm text-[#647b74]">Try widening a filter or ask the AI concierge to reason across your priorities.</p><Link href="/assistants"><Button className="mt-6 rounded-full bg-[#17382f]">Ask AI concierge</Button></Link></div>}
      </section>
    </main></div>;
}
