import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { startLogin } from "@/const";
import { Building2, ChevronDown, Menu, Search, Sparkles, UserRound } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

const navItems = [
  { label: "Buy", href: "/explore?mode=Buy" },
  { label: "Rent", href: "/explore?mode=Rent" },
  { label: "Sell", href: "/explore?mode=Sell" },
  { label: "Rent out", href: "/explore?mode=Rent-Out" },
  { label: "Map intelligence", href: "/map" },
];

export function BrandHeader({ tone = "light" }: { tone?: "light" | "dark" }) {
  const [open, setOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const dark = tone === "dark";
  return (
    <header className={`relative z-50 border-b ${dark ? "border-white/12 bg-[#10211d]/88 text-white" : "border-[#18342c]/10 bg-[#faf9f5]/92 text-[#18342c]"} backdrop-blur-xl`}>
      <div className="container flex h-[76px] items-center justify-between gap-6">
        <Link href="/" className="group flex items-center gap-3">
          <span className={`grid size-10 place-items-center rounded-full ${dark ? "bg-[#d5ae72] text-[#10211d]" : "bg-[#143a31] text-[#f8e4bd]"} transition-transform group-hover:rotate-6`}><Building2 className="size-5" /></span>
          <span className="leading-none"><span className="font-display text-[22px] tracking-tight">UrbanKey</span><span className={`mt-1 block text-[9px] font-bold uppercase tracking-[0.28em] ${dark ? "text-white/75" : "text-[#526861]"}`}>Singapore</span></span>
        </Link>
        <nav className="hidden items-center gap-7 lg:flex" aria-label="Main navigation">
          {navItems.map(item => <Link key={item.label} href={item.href} className={`text-[13px] font-semibold transition-colors ${location.startsWith(item.href.split("?")[0]) ? "text-[#b68a4c]" : dark ? "text-white/72 hover:text-white" : "text-[#18342c]/72 hover:text-[#18342c]"}`}>{item.label}</Link>)}
          <Link href="/assistants" className={`flex items-center gap-1.5 text-[13px] font-semibold ${dark ? "text-white/72 hover:text-white" : "text-[#18342c]/72 hover:text-[#18342c]"}`}><Sparkles className="size-3.5 text-[#b68a4c]" /> AI concierge</Link>
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          <Link href="/explore"><Button aria-label="Search properties" variant="ghost" size="icon" className={dark ? "text-white hover:bg-white/10" : ""}><Search className="size-4" /></Button></Link>
          <Link href={isAuthenticated ? "/agent/portal" : "/agent"}><Button variant="ghost" className={`rounded-full px-4 ${dark ? "text-white hover:bg-white/10" : "text-[#18342c] hover:bg-[#18342c]/6"}`}>Agent portal</Button></Link><Link href="/agent/subscribe"><Button variant="ghost" className={`rounded-full px-3 ${dark ? "text-[#d7ad6d] hover:bg-white/10" : "text-[#a77c43] hover:bg-[#18342c]/6"}`}>Plans</Button></Link>
          {isAuthenticated ? <Link href="/dashboard"><Button variant="outline" className={`rounded-full ${dark ? "border-white/25 bg-white/5 text-white hover:bg-white/12" : "border-[#18342c]/20"}`}><UserRound className="mr-2 size-4" />{user?.name?.split(" ")[0] || "Account"}<ChevronDown className="ml-2 size-3.5 opacity-60" /></Button></Link> : <Button onClick={startLogin} className={`rounded-full px-5 ${dark ? "bg-[#d7ad6d] text-[#10211d] hover:bg-[#e1bd84]" : "bg-[#143a31] text-white hover:bg-[#1c4b40]"}`}>Sign in</Button>}
        </div>
        <button className="lg:hidden" onClick={() => setOpen(value => !value)} aria-label="Toggle menu"><Menu /></button>
      </div>
      {open && <div className={`container border-t py-5 lg:hidden ${dark ? "border-white/10" : "border-[#18342c]/10"}`}><div className="grid gap-3">{navItems.map(item => <Link key={item.label} href={item.href} onClick={() => setOpen(false)} className="py-2 text-sm font-semibold">{item.label}</Link>)}<Link href="/assistants" className="py-2 text-sm font-semibold">AI concierge</Link><Link href={isAuthenticated ? "/agent/portal" : "/agent"} onClick={() => setOpen(false)} className="py-2 text-sm font-semibold text-[#b68a4c]">Agent & co-broker portal</Link><Link href="/agent/subscribe" onClick={() => setOpen(false)} className="py-2 text-sm font-semibold">Professional plans</Link>{isAuthenticated && <Link href="/agent/payments" onClick={() => setOpen(false)} className="py-2 text-sm font-semibold">Payment history</Link>}<Link href="/dashboard" className="py-2 text-sm font-semibold">My workspace</Link></div></div>}
    </header>
  );
}
