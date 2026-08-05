import { BrandHeader } from "@/components/BrandHeader";
import { Button } from "@/components/ui/button";
import { useMarket } from "@/contexts/MarketContext";
import { trpc } from "@/lib/trpc";
import { ArrowUp, Bot, BriefcaseBusiness, Building2, CheckCircle2, RotateCcw, Sparkles, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Streamdown } from "streamdown";
import { toast } from "sonner";

type Mode = "buyer" | "agent";
type ChatMessage = { role: "user" | "assistant"; content: string };

function getStarterPrompts(countryName: string, currency: string, transit: string): Record<Mode, string[]> {
  return {
  buyer: [`Find a quiet 3-bedroom home under 4.5M ${currency} near ${transit}.`, "Compare warehouses for rent by floor loading and ceiling height.", "Which office or shophouse best balances access, ownership, and price?"],
  agent: ["How should I position an office building for sale to investors?", "Compare warehouse and factory leasing signals in the catalog.", "Suggest a principled rent-out negotiation plan for a commercial landlord."],
  };
}

function initialMessages(countryName: string): Record<Mode, ChatMessage[]> {
  return {
    buyer: [{ role: "assistant", content: `Welcome to **UrbanKey Concierge** for **${countryName}**. Tell me what you need—home, office, shophouse, warehouse, office building, or factory—plus your budget, location, ownership, space, access, and operating requirements. I’ll reason through the available demonstration listings with you.` }],
    agent: [{ role: "assistant", content: `Welcome to **UrbanKey Pro** for **${countryName}**. I can help position residential, commercial, and industrial assets, interpret the available demonstration catalog, identify co-broking angles, and structure a principled negotiation approach.` }],
  };
}

export default function Assistants() {
  const { market } = useMarket();
  const [mode, setMode] = useState<Mode>("buyer");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Record<Mode, ChatMessage[]>>(() => initialMessages(market.countryName));
  useEffect(() => {
    setMessages(initialMessages(market.countryName));
    setInput("");
  }, [market.id, market.countryName]);
  const activeMessages = messages[mode];
  const mutation = trpc.ai.chat.useMutation({ onSuccess: result => setMessages(current => ({ ...current, [mode]: [...current[mode], { role: "assistant", content: result.content }] })), onError: error => toast.error(error.message) });
  const send = (prompt?: string) => {
    const content = (prompt ?? input).trim(); if (!content || mutation.isPending) return;
    const nextMessages: ChatMessage[] = [...activeMessages, { role: "user", content }];
    setMessages(current => ({ ...current, [mode]: nextMessages })); setInput("");
    mutation.mutate({ mode, marketId: market.id, messages: nextMessages.map(message => ({ role: message.role, content: message.content })) });
  };
  const contextLabel = useMemo(() => mode === "buyer" ? `${market.countryName} homes + commercial and industrial assets · Buy and Rent matching` : `${market.countryName} residential + commercial and industrial catalog · Sell and Rent-Out strategy`, [market.countryName, mode]);
  const starterPrompts = useMemo(() => getStarterPrompts(market.countryName, market.currency, market.terminology.transit), [market.countryName, market.currency, market.terminology.transit]);
  return <div className="min-h-screen bg-[#10231e] text-white"><BrandHeader tone="dark" /><main className="container grid min-h-[calc(100vh-76px)] gap-8 py-8 lg:grid-cols-[340px_1fr]">
    <aside className="flex flex-col rounded-[28px] border border-white/10 bg-white/[.055] p-6 backdrop-blur"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#efd09e]">AI workspaces</p><h1 className="mt-3 font-display text-3xl">Intelligence for every side of the move.</h1><p className="mt-4 text-sm leading-6 text-white/75">Two purpose-built assistants, each grounded in the available property catalog and configured not to infer private identity.</p></div><div className="mt-7 grid gap-2">{([{ id: "buyer", label: "Buyer & tenant", note: "Discovery and matching", icon: UserRound }, { id: "agent", label: "Agent & co-broker", note: "Market and deal support", icon: BriefcaseBusiness }] as const).map(item => <button key={item.id} onClick={() => setMode(item.id)} className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${mode === item.id ? "border-[#d5ae72]/35 bg-[#d5ae72]/12" : "border-white/8 bg-white/[.035] hover:bg-white/[.07]"}`}><span className={`grid size-10 place-items-center rounded-full ${mode === item.id ? "bg-[#d5ae72] text-[#17382f]" : "bg-white/8 text-white/75"}`}><item.icon className="size-4" /></span><span className="flex-1"><span className="block text-sm font-semibold">{item.label}</span><span className="mt-1 block text-[10px] text-white/70">{item.note}</span></span>{mode === item.id && <CheckCircle2 className="size-4 text-[#d5ae72]" />}</button>)}</div><div className="mt-auto pt-8"><div className="rounded-2xl border border-white/8 bg-black/10 p-4"><div className="flex items-center gap-2 text-xs font-semibold"><Building2 className="size-4 text-[#d5ae72]" />Catalog context active</div><p className="mt-2 text-[10px] leading-5 text-white/70">{contextLabel}. Responses are AI-generated and should be independently verified.</p></div></div></aside>
    <section className="flex min-h-[720px] flex-col overflow-hidden rounded-[30px] bg-[#f7f6f1] text-[#17382f] shadow-2xl"><header className="flex flex-col justify-between gap-4 border-b border-[#17382f]/10 px-5 py-5 sm:flex-row sm:items-center sm:px-7"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-full bg-[#17382f] text-[#d5ae72]"><Sparkles className="size-5" /></span><div><h2 className="font-display text-2xl">{mode === "buyer" ? "UrbanKey Concierge" : "UrbanKey Pro"}</h2><p className="mt-1 text-[10px] font-semibold uppercase tracking-[.13em] text-[#82938e]">Live LLM completion · Catalog grounded</p></div></div><Button variant="ghost" size="sm" onClick={() => setMessages(current => ({ ...current, [mode]: [current[mode][0]] }))} className="self-start rounded-full text-[#647b74] sm:self-auto"><RotateCcw className="mr-2 size-3.5" />New conversation</Button></header>
      <div className="flex-1 overflow-y-auto px-5 py-7 sm:px-8"><div className="mx-auto grid max-w-3xl gap-5">{activeMessages.map((message, index) => <div key={`${message.role}-${index}`} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>{message.role === "assistant" && <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-full bg-[#e1e9e3] text-[#275649]"><Bot className="size-4" /></span>}<div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-7 ${message.role === "user" ? "rounded-br-sm bg-[#17382f] text-white" : "rounded-bl-sm border border-[#17382f]/8 bg-white shadow-sm"}`}>{message.role === "assistant" ? <Streamdown>{message.content}</Streamdown> : message.content}</div></div>)}{mutation.isPending && <div className="flex gap-3"><span className="grid size-8 place-items-center rounded-full bg-[#e1e9e3] text-[#275649]"><Bot className="size-4" /></span><div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-white px-4 py-4 shadow-sm"><span className="size-1.5 animate-pulse rounded-full bg-[#a77c43]" /><span className="size-1.5 animate-pulse rounded-full bg-[#a77c43] [animation-delay:120ms]" /><span className="size-1.5 animate-pulse rounded-full bg-[#a77c43] [animation-delay:240ms]" /></div></div>}</div></div>
      <div className="border-t border-[#17382f]/8 bg-white/70 px-5 py-5 sm:px-8"><div className="mx-auto max-w-3xl"><div className="mb-3 flex gap-2 overflow-x-auto pb-1">{starterPrompts[mode].map(prompt => <button key={prompt} onClick={() => send(prompt)} className="shrink-0 rounded-full border border-[#17382f]/10 bg-white px-3 py-2 text-[10px] font-semibold text-[#4e665f] transition hover:border-[#a77c43]/40 hover:text-[#17382f]">{prompt}</button>)}</div><form onSubmit={event => { event.preventDefault(); send(); }} className="flex items-end gap-3 rounded-2xl border border-[#17382f]/12 bg-white p-2 shadow-[0_12px_35px_rgba(23,56,47,.07)]"><textarea aria-label="Message your AI property assistant" value={input} onChange={event => setInput(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); send(); } }} rows={2} placeholder={mode === "buyer" ? `Describe your ideal ${market.countryName} property…` : "Ask about positioning, matching, or negotiation…"} className="max-h-32 min-h-12 flex-1 resize-none bg-transparent px-3 py-2 text-sm leading-6 outline-none" /><Button aria-label="Send message" type="submit" disabled={!input.trim() || mutation.isPending} size="icon" className="mb-0.5 shrink-0 rounded-full bg-[#17382f]"><ArrowUp className="size-4" /></Button></form><p className="mt-2 text-center text-[9px] leading-4 text-[#657a74]">AI output may be incomplete or inaccurate. Verify financial, legal, transaction, and property information independently.</p></div></div>
    </section>
  </main></div>;
}
