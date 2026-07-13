import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Moon, Move3D, Sun } from "lucide-react";
import { useState } from "react";

export function VirtualTour({ title, gallery, tourUrl }: { title: string; gallery: string[]; tourUrl?: string }) {
  const [night, setNight] = useState(false);
  const [index, setIndex] = useState(0);
  if (tourUrl) return <div className="overflow-hidden rounded-[28px] border border-[#17382f]/10"><iframe src={tourUrl} title={`${title} panoramic virtual tour`} allowFullScreen className="h-[520px] w-full" /></div>;
  const next = (step: number) => setIndex(current => (current + step + gallery.length) % gallery.length);
  return <div className="relative h-[520px] overflow-hidden rounded-[28px] bg-[#10231e]" data-tour-fallback="image-carousel">
    <img src={gallery[index]} alt={`${title} virtual view ${index + 1}`} className={`h-full w-full object-cover transition duration-500 ${night ? "brightness-[.42] saturate-[.72] hue-rotate-[8deg]" : "brightness-100"}`} />
    <div className={`pointer-events-none absolute inset-0 transition ${night ? "bg-[radial-gradient(circle_at_72%_28%,rgba(228,188,118,.22),transparent_24%),linear-gradient(to_top,rgba(8,22,28,.6),transparent)]" : "bg-gradient-to-t from-black/45 via-transparent to-black/15"}`} />
    <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-[#10231e]/70 px-3 py-2 text-[10px] font-bold uppercase tracking-[.14em] text-white backdrop-blur"><Move3D className="size-4 text-[#d5ae72]" />360° tour-ready fallback</div>
    <div className="absolute right-4 top-4 flex rounded-full border border-white/20 bg-[#10231e]/65 p-1 text-white backdrop-blur"><button onClick={() => setNight(false)} className={`grid size-9 place-items-center rounded-full ${!night ? "bg-white text-[#17382f]" : "text-white/70"}`} aria-label="Day view"><Sun className="size-4" /></button><button onClick={() => setNight(true)} className={`grid size-9 place-items-center rounded-full ${night ? "bg-[#d5ae72] text-[#17382f]" : "text-white/70"}`} aria-label="Night view"><Moon className="size-4" /></button></div>
    <Button aria-label="Previous virtual tour view" onClick={() => next(-1)} size="icon" className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/88 text-[#17382f] hover:bg-white"><ChevronLeft className="size-4" /></Button><Button aria-label="Next virtual tour view" onClick={() => next(1)} size="icon" className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/88 text-[#17382f] hover:bg-white"><ChevronRight className="size-4" /></Button>
    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5 text-white"><div><p className="font-display text-2xl">{night ? "Evening ambience" : "Daylight perspective"}</p><p className="mt-1 text-xs text-white/65">View {index + 1} of {gallery.length} · Panoramic iframe supported when supplied</p></div><div className="flex gap-1.5">{gallery.map((_, itemIndex) => <button key={itemIndex} onClick={() => setIndex(itemIndex)} className={`h-1.5 rounded-full transition-all ${itemIndex === index ? "w-7 bg-[#d5ae72]" : "w-1.5 bg-white/45"}`} aria-label={`View image ${itemIndex + 1}`} />)}</div></div>
  </div>;
}
