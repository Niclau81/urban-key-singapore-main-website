import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Clock3, Image as ImageIcon } from "lucide-react";
import { useMemo, useState } from "react";

type TimingPhoto = {
  id: string;
  label: string;
  timeRange: string;
  description: string;
  src: string;
  kind: "source" | "example-simulation";
};

const OFFICE_INTERIOR_TIMING_PHOTOS: TimingPhoto[] = [
  {
    id: "morning",
    label: "Morning",
    timeRange: "7:30 AM",
    description: "Warm early daylight through the glazing",
    src: "/manus-storage/office-interior-morning_19c37691.png",
    kind: "example-simulation",
  },
  {
    id: "noon",
    label: "Noon",
    timeRange: "12:30 PM",
    description: "Original bright daytime presentation",
    src: "/manus-storage/office-interior-noon_a72da44f.jpg",
    kind: "source",
  },
  {
    id: "midnight",
    label: "Midnight",
    timeRange: "12:00 AM",
    description: "Warm interior lighting against a night view",
    src: "/manus-storage/office-interior-midnight_8e9070ce.png",
    kind: "example-simulation",
  },
];

function getTimingPhotos(imageUrl: string): TimingPhoto[] {
  if (imageUrl.toLowerCase().includes("office-interior_791afa97")) {
    return OFFICE_INTERIOR_TIMING_PHOTOS;
  }

  return [{
    id: "as-photographed",
    label: "As photographed",
    timeRange: "Original capture",
    description: "No alternate timing photos are available for this view",
    src: imageUrl,
    kind: "source",
  }];
}

export function VirtualTour({ title, gallery, tourUrl }: { title: string; gallery: string[]; tourUrl?: string }) {
  const [timingId, setTimingId] = useState("noon");
  const [index, setIndex] = useState(() => {
    const photoBackedExample = gallery.findIndex(image => getTimingPhotos(image).length > 1);
    return photoBackedExample >= 0 ? photoBackedExample : 0;
  });
  const timingPhotos = useMemo(() => getTimingPhotos(gallery[index]), [gallery, index]);
  const activeTiming = timingPhotos.find(photo => photo.id === timingId) ?? timingPhotos[0];

  const showImage = (nextIndex: number) => {
    setIndex(nextIndex);
    setTimingId("noon");
  };

  const move = (step: number) => showImage((index + step + gallery.length) % gallery.length);

  return <div
    className="relative h-[clamp(260px,54svh,360px)] overflow-hidden rounded-[28px] border border-[#17382f]/10 bg-[#10231e] sm:h-[520px]"
    data-tour-fallback={tourUrl ? "panoramic-iframe" : "image-carousel"}
    data-tour-photo-timing={tourUrl ? "provider-controlled" : activeTiming.id}
  >
    {tourUrl ? <iframe
      title={`${title} panoramic virtual tour`}
      src={tourUrl}
      className="h-full w-full border-0"
      allow="fullscreen; gyroscope; accelerometer"
      allowFullScreen
    /> : <img
      key={activeTiming.src}
      src={activeTiming.src}
      alt={`${title} ${activeTiming.label.toLowerCase()} virtual view ${index + 1}`}
      data-tour-layer="timed-photograph"
      data-tour-photo-source={activeTiming.src}
      className="absolute inset-0 h-full w-full object-cover motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300"
    />}

    <div className="absolute left-4 right-4 top-4 z-30 flex items-start justify-between gap-3 sm:left-6 sm:right-6 sm:top-6">
      <div className="flex items-center gap-2 rounded-full bg-[#10231e]/88 px-3 py-2 text-[10px] font-bold uppercase tracking-[.14em] text-white shadow-lg">
        <ImageIcon className="size-3.5 text-[#d5ae72]" />
        Photo timing
      </div>

      {!tourUrl && timingPhotos.length > 1 ? <Select value={activeTiming.id} onValueChange={setTimingId}>
        <SelectTrigger
          aria-label="Select an available photo timing"
          data-tour-control="photo-timing-select"
          className="h-11 w-[158px] rounded-full border-white/15 bg-[#10231e]/92 px-4 text-xs font-semibold text-white shadow-lg focus:ring-[#d5ae72] sm:w-[184px]"
        >
          <Clock3 className="mr-2 size-3.5 text-[#d5ae72]" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end" className="border-[#17382f]/10 bg-[#f8f7f2] text-[#17382f]">
          {timingPhotos.map(photo => <SelectItem key={photo.id} value={photo.id}>
            <span className="flex items-center gap-2">
              <span className="font-semibold">{photo.label}</span>
              <span className="text-[10px] text-[#6a7d77]">{photo.timeRange}</span>
            </span>
          </SelectItem>)}
        </SelectContent>
      </Select> : <div className="rounded-full bg-[#10231e]/88 px-3 py-2 text-[10px] font-semibold text-white shadow-lg">
        {tourUrl ? "Live panorama" : "As photographed"}
      </div>}
    </div>

    {!tourUrl && gallery.length > 1 && <>
      <Button aria-label="Previous gallery image" onClick={() => move(-1)} size="icon" className="absolute left-3 top-1/2 z-20 size-11 -translate-y-1/2 rounded-full bg-white/90 text-[#17382f] shadow-lg hover:bg-white sm:left-4"><ChevronLeft className="size-4" /></Button>
      <Button aria-label="Next gallery image" onClick={() => move(1)} size="icon" className="absolute right-3 top-1/2 z-20 size-11 -translate-y-1/2 rounded-full bg-white/90 text-[#17382f] shadow-lg hover:bg-white sm:right-4"><ChevronRight className="size-4" /></Button>
    </>}

    <div data-tour-layer="caption-content" className="absolute bottom-5 left-5 z-20 max-w-[calc(100%-2.5rem)] text-white sm:bottom-7 sm:left-7">
      <p className="font-display text-2xl" style={{ textShadow: "0 2px 7px rgb(3 16 13 / 88%)" }}>{tourUrl ? "Interactive panorama" : `${activeTiming.label} perspective`}</p>
      <p className="mt-1 text-xs text-white/80" style={{ textShadow: "0 2px 6px rgb(3 16 13 / 92%)" }}>
        {tourUrl ? "Explore the provider-hosted panoramic view" : `${activeTiming.timeRange} · ${activeTiming.description} · ${activeTiming.kind === "example-simulation" ? "Example time-specific photo" : "Source photo"}`}
      </p>
    </div>

    {!tourUrl && <div className="absolute bottom-5 right-5 z-20 hidden gap-1.5 sm:flex">
      {gallery.map((_, itemIndex) => <button
        key={itemIndex}
        onClick={() => showImage(itemIndex)}
        className={`h-1.5 rounded-full transition-all ${itemIndex === index ? "w-7 bg-[#d5ae72]" : "w-1.5 bg-white/55"}`}
        aria-label={`View image ${itemIndex + 1}`}
      />)}
    </div>}
  </div>;
}
