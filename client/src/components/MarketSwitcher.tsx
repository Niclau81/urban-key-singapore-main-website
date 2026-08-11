import { useMarket } from "@/contexts/MarketContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Globe2 } from "lucide-react";
import { useId } from "react";
import type { MarketId } from "@shared/marketConfig";

export function MarketSwitcher({ tone = "light", className = "" }: { tone?: "light" | "dark"; className?: string }) {
  const { market, markets, setMarketId } = useMarket();
  const { t } = useLanguage();
  const id = useId();
  const dark = tone === "dark";
  return <div className={`relative flex items-center ${className}`}>
    <label htmlFor={id} className="sr-only">{t("nav.chooseMarket")}</label>
    <Globe2 aria-hidden="true" className={`pointer-events-none absolute left-3 size-3.5 ${dark ? "text-[#d7ad6d]" : "text-[#8a6736]"}`} />
    <select id={id} value={market.id} onChange={event => setMarketId(event.target.value as MarketId)} className={`h-9 max-w-[150px] appearance-none rounded-full border py-1 pl-8 pr-7 text-[11px] font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-[#d5ae72] ${dark ? "border-white/20 bg-white/8 text-white hover:bg-white/12" : "border-[#18342c]/15 bg-white/80 text-[#18342c] hover:bg-white"}`}>
      {markets.map(option => <option key={option.id} value={option.id} className="bg-white text-[#18342c]">{option.countryName}</option>)}
    </select>
  </div>;
}
