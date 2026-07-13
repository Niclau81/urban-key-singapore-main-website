import { Button } from "@/components/ui/button";
import { TOUR_PERIODS, getTourPeriod, type TourPeriodId } from "@/lib/tourPeriods";
import { getTourExteriorMask } from "@/lib/tourSceneMasks";
import { ChevronLeft, ChevronRight, CloudSun, Moon, MoonStar, Move3D, Sun, Sunrise, Sunset } from "lucide-react";
import { useState } from "react";

const periodIcons = {
  morning: Sunrise,
  noon: Sun,
  afternoon: CloudSun,
  evening: Sunset,
  night: Moon,
  midnight: MoonStar,
} satisfies Record<TourPeriodId, typeof Sun>;

export function VirtualTour({ title, gallery, tourUrl }: { title: string; gallery: string[]; tourUrl?: string }) {
  const [periodId, setPeriodId] = useState<TourPeriodId>("noon");
  const [index, setIndex] = useState(0);
  const period = getTourPeriod(periodId);
  const exteriorMask = tourUrl ? null : getTourExteriorMask(gallery[index]);
  const next = (step: number) => setIndex(current => (current + step + gallery.length) % gallery.length);

  return <div
    className="relative h-[560px] overflow-hidden rounded-[28px] border border-[#17382f]/10 bg-[#10231e] sm:h-[520px]"
    data-tour-fallback={tourUrl ? "panoramic-iframe" : "image-carousel"}
    data-tour-period={period.id}
  >
    {tourUrl ? <iframe
      src={tourUrl}
      title={`${title} panoramic virtual tour`}
      allowFullScreen
      className="h-full w-full transition-[filter] duration-500"
      style={{ filter: period.sceneFilter }}
    /> : <img
      src={gallery[index]}
      alt={`${title} virtual view ${index + 1}`}
      className="h-full w-full object-cover transition-[filter] duration-500"
      style={{ filter: period.sceneFilter }}
    />}
    {exteriorMask && <div
      aria-hidden="true"
      data-tour-layer="exterior-window"
      data-tour-exterior-region={exteriorMask.label}
      className="pointer-events-none absolute inset-0 transition-[background] duration-500"
      style={{
        background: period.exteriorView,
        clipPath: exteriorMask.clipPath,
        mixBlendMode: period.exteriorBlendMode,
      }}
    />}
    <div
      aria-hidden="true"
      data-tour-layer="interior-light"
      className="pointer-events-none absolute inset-0 transition-[background] duration-500"
      style={{ background: period.interiorLight, mixBlendMode: "screen" }}
    />
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#071a17]/72 via-[#071a17]/18 to-transparent" />

    <div className="absolute left-3 right-3 top-3 flex flex-col gap-2 sm:left-4 sm:right-4 sm:top-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex w-fit items-center gap-2 rounded-full bg-[#10231e]/78 px-3 py-2 text-[10px] font-bold uppercase tracking-[.14em] text-white backdrop-blur">
        <Move3D className="size-4 text-[#d5ae72]" />{tourUrl ? "Interactive 360° tour" : "360° tour-ready fallback"}
      </div>
      <div className="max-w-full overflow-x-auto rounded-2xl border border-white/20 bg-[#10231e]/78 p-1.5 text-white shadow-lg backdrop-blur" role="toolbar" aria-label="Virtual tour time of day">
        <div className="flex min-w-max gap-1">
          {TOUR_PERIODS.map(option => {
            const Icon = periodIcons[option.id];
            const active = option.id === period.id;
            return <button
              key={option.id}
              type="button"
              onClick={() => setPeriodId(option.id)}
              aria-label={`${option.label} view, ${option.timeRange}`}
              aria-pressed={active}
              className={`flex min-h-11 items-center gap-1.5 rounded-xl px-2.5 text-[10px] font-bold uppercase tracking-[.08em] transition duration-200 active:scale-[.97] ${active ? "bg-white text-[#17382f] shadow-sm" : "text-white/72 hover:bg-white/10 hover:text-white"}`}
            >
              <Icon className="size-3.5" style={{ color: active ? period.accent : undefined }} />
              <span>{option.label}</span>
            </button>;
          })}
        </div>
      </div>
    </div>

    {!tourUrl && <>
      <Button aria-label="Previous virtual tour view" onClick={() => next(-1)} size="icon" className="absolute left-3 top-[58%] -translate-y-1/2 rounded-full bg-white/88 text-[#17382f] hover:bg-white sm:left-4 sm:top-1/2"><ChevronLeft className="size-4" /></Button>
      <Button aria-label="Next virtual tour view" onClick={() => next(1)} size="icon" className="absolute right-3 top-[58%] -translate-y-1/2 rounded-full bg-white/88 text-[#17382f] hover:bg-white sm:right-4 sm:top-1/2"><ChevronRight className="size-4" /></Button>
    </>}

    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-4 text-white sm:p-5">
      <div aria-live="polite">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ backgroundColor: period.accent }} />
          <p className="font-display text-2xl">{period.label} perspective</p>
        </div>
        <p className="mt-1 text-xs text-white/75">{period.timeRange} · {period.description} · Exterior view and interior lighting preview</p>
      </div>
      {!tourUrl && <div className="hidden gap-1.5 sm:flex">{gallery.map((_, itemIndex) => <button key={itemIndex} onClick={() => setIndex(itemIndex)} className={`h-1.5 rounded-full transition-all ${itemIndex === index ? "w-7 bg-[#d5ae72]" : "w-1.5 bg-white/45"}`} aria-label={`View image ${itemIndex + 1}`} />)}</div>}
    </div>
  </div>;
}
