import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import type { Property } from "@shared/propertyData";
import { Bath, BedDouble, Bookmark, Building2, CarFront, MapPin, MoveUpRight, Ruler, TrainFront, Warehouse } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

const money = (value: number) => new Intl.NumberFormat("en-SG", { style: "currency", currency: "SGD", maximumFractionDigits: 0 }).format(value);

export function PropertyCard({ property, featured = false }: { property: Property; featured?: boolean }) {
  const { isAuthenticated } = useAuth();
  const [saved, setSaved] = useState(false);
  const toggleSaved = trpc.saved.toggle.useMutation({
    onSuccess: result => { setSaved(result.saved); toast.success(result.saved ? "Saved to your collection" : "Removed from saved properties"); },
    onError: error => toast.error(error.message),
  });
  const save = () => isAuthenticated ? toggleSaved.mutate({ propertyId: property.id }) : startLogin();
  const isRental = property.mode === "Rent" || property.mode === "Rent-Out";
  const price = isRental && property.monthlyRent ? `${money(property.monthlyRent)} / mo` : money(property.price);
  const modeLabel = { Buy: "For sale", Sell: "Owner sale", Rent: "For rent", "Rent-Out": "Owner lease" }[property.mode];
  return (
    <article className={`group overflow-hidden rounded-[24px] border border-[#17382f]/10 bg-white shadow-[0_18px_60px_rgba(21,50,42,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_70px_rgba(21,50,42,0.14)] ${featured ? "lg:grid lg:grid-cols-[1.18fr_.82fr]" : ""}`}>
      <div className={`relative overflow-hidden ${featured ? "min-h-[350px]" : "aspect-[1.38/1]"}`}>
        <img src={property.image} alt={property.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.035]" />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
          <span className="rounded-full bg-[#fbfaf7]/92 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-[#17382f] backdrop-blur">{modeLabel}</span>
          <Button onClick={save} size="icon" variant="secondary" className="rounded-full bg-[#fbfaf7]/92 text-[#17382f] shadow-sm backdrop-blur hover:bg-white" aria-label="Save property"><Bookmark className={`size-4 ${saved ? "fill-current" : ""}`} /></Button>
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 pt-14 text-white"><div className="flex items-center gap-2 text-xs"><MapPin className="size-3.5" />{property.district}</div></div>
      </div>
      <div className={`flex flex-col p-5 ${featured ? "justify-center lg:p-8" : ""}`}>
        <div className="mb-4"><p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#76552f]">{property.type} · {property.tenure}</p><h3 className={`${featured ? "font-display text-3xl" : "text-[20px] font-semibold"} leading-tight text-[#16362e]`}>{property.title}</h3><p className="mt-2 text-sm text-[#49635d]">{property.address}</p></div>
        <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#49635d]">{property.isCommercial ? <><span className="flex items-center gap-1.5"><Warehouse className="size-4" />{property.commercialUsage?.split(" · ")[0]}</span><span className="flex items-center gap-1.5"><Ruler className="size-4" />{property.size.toLocaleString()} sq ft</span><span className="flex items-center gap-1.5"><CarFront className="size-4" />{property.parkingLots ?? 0} lots</span></> : <><span className="flex items-center gap-1.5"><BedDouble className="size-4" />{property.beds}</span><span className="flex items-center gap-1.5"><Bath className="size-4" />{property.baths}</span><span className="flex items-center gap-1.5"><Building2 className="size-4" />{property.size.toLocaleString()} sq ft</span></>}<span className="flex items-center gap-1.5"><TrainFront className="size-4 text-[#b68a4c]" />{property.mrtMinutes} min</span></div>
        <div className="mt-auto flex items-end justify-between border-t border-[#17382f]/10 pt-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#566c65]">{isRental ? "Guide rent" : "Guide price"}</p><p className="mt-1 text-xl font-semibold text-[#17382f]">{price}</p></div><Link href={`/property/${property.id}`}><Button size="icon" className="rounded-full bg-[#17382f] text-white hover:bg-[#225245]" aria-label={`View ${property.title}`}><MoveUpRight className="size-4" /></Button></Link></div>
      </div>
    </article>
  );
}
