import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { startLogin } from "@/const";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { formatMarketCurrency, getMarketConfig } from "@shared/marketConfig";
import type { Property } from "@shared/propertyData";
import { Bath, BedDouble, Bookmark, Building2, CarFront, MapPin, MoveUpRight, Ruler, ScanLine, TrainFront, Warehouse } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

export function PropertyCard({ property, featured = false }: { property: Property; featured?: boolean }) {
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [saved, setSaved] = useState(false);
  const toggleSaved = trpc.saved.toggle.useMutation({
    onSuccess: result => { setSaved(result.saved); toast.success(result.saved ? t("card.saved") : t("card.removed")); },
    onError: error => toast.error(error.message),
  });
  const save = () => isAuthenticated ? toggleSaved.mutate({ propertyId: property.id }) : startLogin();
  const isRental = property.mode === "Rent" || property.mode === "Rent-Out";
  const market = getMarketConfig(property.marketId);
  const price = isRental && property.monthlyRent ? `${formatMarketCurrency(property.monthlyRent, market)} ${t("card.perMonth")}` : formatMarketCurrency(property.price, market);
  const modeLabel = { Buy: t("card.forSale"), Sell: t("card.ownerSale"), Rent: t("card.forRent"), "Rent-Out": t("card.ownerLease") }[property.mode];
  return (
    <article className={`group overflow-hidden rounded-[24px] border border-[#17382f]/10 bg-white shadow-[0_18px_60px_rgba(21,50,42,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_70px_rgba(21,50,42,0.14)] ${featured ? "lg:grid lg:grid-cols-[1.18fr_.82fr]" : ""}`}>
      <div className={`relative overflow-hidden ${featured ? "min-h-[350px]" : "aspect-[1.38/1]"}`}>
        <img src={property.image} alt={property.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.035]" />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
          <div className="flex max-w-[calc(100%-3rem)] flex-wrap gap-2"><span className="rounded-full bg-[#fbfaf7]/92 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-[#17382f] backdrop-blur">{modeLabel}</span>{property.virtualTour && <span data-virtual-tour-badge className="inline-flex items-center gap-1.5 rounded-full bg-[#17382f] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-white shadow-sm"><ScanLine className="size-3.5 text-[#d5ae72]" />{property.virtualTour.badgeLabel}</span>}{property.isPlanningDemo && <span className="rounded-full bg-[#c99d60] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#10231e] shadow-sm">{t("demo.planningLabel")}</span>}</div>
          <Button onClick={save} size="icon" variant="secondary" className="rounded-full bg-[#fbfaf7]/92 text-[#17382f] shadow-sm backdrop-blur hover:bg-white" aria-label={t("card.save")}><Bookmark className={`size-4 ${saved ? "fill-current" : ""}`} /></Button>
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 pt-14 text-white"><div className="flex items-center gap-2 text-xs"><MapPin className="size-3.5" />{property.district}</div></div>
      </div>
      <div className={`flex flex-col p-5 ${featured ? "justify-center lg:p-8" : ""}`}>
        <div className="mb-4"><p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#76552f]">{property.type} · {property.tenure}</p><h3 className={`${featured ? "font-display text-3xl" : "text-[20px] font-semibold"} leading-tight text-[#16362e]`}>{property.title}</h3><p className="mt-2 text-sm text-[#49635d]">{property.address}</p></div>
        <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#49635d]">{property.isCommercial ? <><span className="flex items-center gap-1.5"><Warehouse className="size-4" />{property.commercialUsage?.split(" · ")[0]}</span><span className="flex items-center gap-1.5"><Ruler className="size-4" />{property.size.toLocaleString(market.locale)} {market.terminology.areaUnit}</span><span className="flex items-center gap-1.5"><CarFront className="size-4" />{property.parkingLots ?? 0} {t("card.lots")}</span></> : <><span className="flex items-center gap-1.5"><BedDouble className="size-4" />{property.beds}</span><span className="flex items-center gap-1.5"><Bath className="size-4" />{property.baths}</span><span className="flex items-center gap-1.5"><Building2 className="size-4" />{property.size.toLocaleString(market.locale)} {market.terminology.areaUnit}</span></>}<span className="flex items-center gap-1.5"><TrainFront className="size-4 text-[#b68a4c]" />{property.mrtMinutes} {t("card.minute")} {market.terminology.transit}</span></div>
        <div className="mt-auto flex items-end justify-between border-t border-[#17382f]/10 pt-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#566c65]">{isRental ? t("card.guideRent") : t("card.guidePrice")}</p><p className="mt-1 text-xl font-semibold text-[#17382f]">{price}</p></div><Link href={`/property/${property.id}`}><Button size="icon" className="rounded-full bg-[#17382f] text-white hover:bg-[#225245]" aria-label={t("card.view", { title: property.title })}><MoveUpRight className="size-4" /></Button></Link></div>
      </div>
    </article>
  );
}
