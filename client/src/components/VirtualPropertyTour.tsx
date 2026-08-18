import { Button } from "@/components/ui/button";
import { EquirectangularPanorama } from "@/components/EquirectangularPanorama";
import { getTimingPhotos } from "@/components/VirtualTour";
import type { VirtualPropertyTour as VirtualPropertyTourConfig } from "@shared/virtualTour";
import { ChevronLeft, ChevronRight, CircleDotDashed, Eye, Footprints, Layers3, Maximize2, Minimize2, ShieldCheck, Sparkles, Volume2, VolumeX, X, ZoomIn, ZoomOut } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  title: string;
  gallery: string[];
  tour: VirtualPropertyTourConfig;
  onAppointmentIntent: () => void;
};

type TourEvent = "tour_opened" | "room_visited" | "appointment_intent";

function recordLocalTourEvent(propertyTitle: string, event: TourEvent, roomId?: string) {
  if (typeof window === "undefined") return;
  const key = "urbankey.virtual-tour.events";
  const current = JSON.parse(window.sessionStorage.getItem(key) ?? "[]") as Array<{ title: string; event: TourEvent; roomId?: string }>;
  window.sessionStorage.setItem(key, JSON.stringify([...current.slice(-19), { title: propertyTitle, event, roomId }]));
  window.dispatchEvent(new CustomEvent("urbankey:virtual-tour", { detail: { event, roomId } }));
}

export function VirtualPropertyTour({ title, gallery, tour, onAppointmentIntent }: Props) {
  const tourRef = useRef<HTMLElement>(null);
  const [activeFloorId, setActiveFloorId] = useState(tour.floors[0]?.id ?? "");
  const [activeRoomId, setActiveRoomId] = useState(tour.floors[0]?.roomIds[0] ?? tour.rooms[0]?.id ?? "");
  const [timingByRoom, setTimingByRoom] = useState<Record<string, string>>({});
  const [zoom, setZoom] = useState(1);
  const [guidedPhotoRoomIds, setGuidedPhotoRoomIds] = useState<Set<string>>(() => new Set());
  const [guideOpen, setGuideOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const activeFloor = tour.floors.find(floor => floor.id === activeFloorId) ?? tour.floors[0];
  const activeRoom = tour.rooms.find(room => room.id === activeRoomId) ?? tour.rooms[0];
  const activeFloorRooms = useMemo(() => tour.rooms.filter(room => activeFloor?.roomIds.includes(room.id)), [activeFloor, tour.rooms]);
  const timingPhotos = useMemo(() => activeRoom?.timedPhotos?.map(photo => ({ ...photo, kind: "example-simulation" as const })) ?? getTimingPhotos(gallery[activeRoom?.imageIndex ?? 0]), [activeRoom, gallery]);
  const timingId = timingByRoom[activeRoom?.id ?? ""] ?? "noon";
  const activeTiming = timingPhotos.find(photo => photo.id === timingId) ?? timingPhotos[0];
  const verifiedPanoramaUrl = tour.panoramaUrls?.[activeRoom?.id ?? ""] ?? tour.panoramaUrl;
  const isVerified360 = tour.captureMode === "verified-360" && Boolean(verifiedPanoramaUrl);
  const panoramaPreviewUrl = tour.panoramaPreviewUrls?.[activeRoom?.id ?? ""];
  const isGuidedPhotoSelected = Boolean(activeRoom && guidedPhotoRoomIds.has(activeRoom.id));
  const isIllustrativePanoramaPreview = tour.captureMode === "illustrative-panorama" && Boolean(panoramaPreviewUrl) && !isGuidedPhotoSelected;
  const interactivePanoramaUrl = isVerified360 ? verifiedPanoramaUrl : isIllustrativePanoramaPreview ? panoramaPreviewUrl : undefined;
  const visibleImageSource = isIllustrativePanoramaPreview ? panoramaPreviewUrl! : activeTiming.src;

  useEffect(() => {
    recordLocalTourEvent(title, "tour_opened");
    const changeHandler = () => setIsFullscreen(document.fullscreenElement === tourRef.current);
    document.addEventListener("fullscreenchange", changeHandler);
    return () => {
      document.removeEventListener("fullscreenchange", changeHandler);
      window.speechSynthesis?.cancel();
    };
  }, [title]);

  useEffect(() => {
    setZoom(1);
  }, [activeRoomId]);

  const selectTiming = (nextTimingId: string) => {
    if (!activeRoom) return;
    setGuidedPhotoRoomIds(current => new Set(current).add(activeRoom.id));
    setTimingByRoom(current => ({ ...current, [activeRoom.id]: nextTimingId }));
  };

  const showGuidedPhoto = () => {
    if (!activeRoom) return;
    setGuidedPhotoRoomIds(current => new Set(current).add(activeRoom.id));
  };

  const showPanoramaPreview = () => {
    if (!activeRoom) return;
    setGuidedPhotoRoomIds(current => {
      const next = new Set(current);
      next.delete(activeRoom.id);
      return next;
    });
  };

  const selectRoom = (roomId: string) => {
    const room = tour.rooms.find(candidate => candidate.id === roomId);
    if (!room) return;
    const owningFloor = tour.floors.find(floor => floor.roomIds.includes(room.id));
    if (owningFloor) setActiveFloorId(owningFloor.id);
    setActiveRoomId(room.id);
    recordLocalTourEvent(title, "room_visited", room.id);
  };

  const selectFloor = (floorId: string) => {
    const floor = tour.floors.find(candidate => candidate.id === floorId);
    if (!floor) return;
    setActiveFloorId(floor.id);
    selectRoom(floor.roomIds[0] ?? activeRoomId);
  };

  const cycleRoom = (step: number) => {
    const currentIndex = activeFloorRooms.findIndex(room => room.id === activeRoomId);
    const next = activeFloorRooms[(currentIndex + step + activeFloorRooms.length) % activeFloorRooms.length];
    if (next) selectRoom(next.id);
  };

  const toggleFullscreen = async () => {
    if (!tourRef.current) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await tourRef.current.requestFullscreen?.();
  };

  const toggleGuideNarration = () => {
    if (!window.speechSynthesis || !activeRoom) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const narration = new SpeechSynthesisUtterance(`${tour.aiGuide.intro} You are viewing ${activeRoom.label}. ${activeRoom.note}. Approved highlights: ${activeRoom.approvedHighlights.join(", ")}.`);
    narration.lang = "en-SG";
    narration.rate = 0.94;
    narration.onend = () => setIsSpeaking(false);
    narration.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(narration);
  };

  const onViewerKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.defaultPrevented) return;
    if (event.key === "ArrowLeft") { event.preventDefault(); cycleRoom(-1); }
    if (event.key === "ArrowRight") { event.preventDefault(); cycleRoom(1); }
    if (event.key === "Escape" && isFullscreen) void document.exitFullscreen();
  };

  const requestViewing = () => {
    if (!activeRoom) return;
    recordLocalTourEvent(title, "appointment_intent", activeRoom.id);
    onAppointmentIntent();
  };

  if (!activeRoom || !activeFloor || !activeTiming) return null;

  return <section ref={tourRef} tabIndex={0} onKeyDown={onViewerKeyDown} aria-label={`${title} immersive virtual property tour`} className={`relative overflow-hidden bg-[#17171e] text-white outline-none focus-visible:ring-4 focus-visible:ring-[#5aa8ff] ${isFullscreen ? "h-full w-full" : "rounded-[28px] border border-[#17382f]/10 shadow-[0_24px_90px_rgba(12,22,20,.2)]"}`} data-virtual-property-tour="immersive-viewer" data-tour-capture-mode={isVerified360 ? "verified-360" : "guided-photo-fallback"}>
    <div className="flex min-h-[clamp(480px,72dvh,680px)] flex-col xl:flex-row">
      <div className="relative min-h-[430px] flex-1 overflow-hidden xl:h-[clamp(480px,72dvh,680px)] xl:min-h-0">
        {interactivePanoramaUrl ? <div className="absolute inset-0"><EquirectangularPanorama src={interactivePanoramaUrl} alt={`${title} ${activeRoom.label}, ${isVerified360 ? "verified equirectangular panorama" : "illustrative generated panorama preview"}`} hotspots={activeFloorRooms.filter(room => room.id !== activeRoom.id).map(room => ({ id: room.id, label: room.label, x: room.viewerPosition.x, y: room.viewerPosition.y }))} onSelectHotspot={selectRoom} /></div> : <img key={visibleImageSource} src={visibleImageSource} alt={`${title} ${activeRoom.label}, ${activeTiming.label.toLowerCase()} guided photo view`} className="absolute inset-0 h-full w-full object-cover motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300" style={{ transform: `scale(${zoom})` }} data-tour-layer="timed-photograph" data-tour-photo-source={visibleImageSource} data-tour-zoom={zoom.toFixed(1)} />}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/35" />
        <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-4 sm:p-6">
          <div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-white/70">{isVerified360 ? "Verified 360° panorama" : isIllustrativePanoramaPreview ? "Illustrative generated panorama preview" : "Guided photo view"}</p><h3 className="mt-1 font-display text-2xl text-white sm:text-3xl">{activeRoom.label}</h3></div>
          <div className="flex items-center gap-2"><div className="rounded-full border border-white/15 bg-[#17171e]/85 px-3 py-2 text-[10px] font-semibold text-white shadow-lg backdrop-blur"><CircleDotDashed className="mr-1.5 inline size-3.5 text-[#5aa8ff]" />{isVerified360 ? "Interactive 360°" : isIllustrativePanoramaPreview ? "Illustrative 360° preview" : "Photos, not panorama"}</div>{!interactivePanoramaUrl && <div className="flex overflow-hidden rounded-full border border-white/15 bg-[#17171e]/85 shadow-lg"><Button aria-label="Zoom out guided photo" onClick={() => setZoom(current => Math.max(1, Number((current - 0.2).toFixed(1))))} size="icon" variant="ghost" disabled={zoom <= 1} className="size-10 rounded-none text-white hover:bg-white/15 disabled:text-white/35"><ZoomOut className="size-4" /></Button><Button aria-label="Zoom in guided photo" onClick={() => setZoom(current => Math.min(1.8, Number((current + 0.2).toFixed(1))))} size="icon" variant="ghost" disabled={zoom >= 1.8} className="size-10 rounded-none border-l border-white/15 text-white hover:bg-white/15 disabled:text-white/35"><ZoomIn className="size-4" /></Button></div>}<Button aria-label={isFullscreen ? "Exit full screen tour" : "Open full screen tour"} onClick={() => void toggleFullscreen()} size="icon" variant="ghost" className="size-10 rounded-full border border-white/15 bg-[#17171e]/85 text-white hover:bg-white/15">{isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}</Button></div>
        </div>
        {!interactivePanoramaUrl && activeFloorRooms.filter(room => room.id !== activeRoom.id).map(room => <button key={room.id} type="button" onClick={() => selectRoom(room.id)} style={{ left: `${room.viewerPosition.x}%`, top: `${room.viewerPosition.y}%` }} aria-label={`Jump to ${room.label}`} className="absolute z-20 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full border border-white/80 bg-[#087ff5] px-2 py-1.5 text-[10px] font-bold text-white shadow-[0_6px_20px_rgba(0,0,0,.45)] transition hover:scale-105 focus-visible:ring-4 focus-visible:ring-white/60 motion-reduce:transform-none motion-reduce:transition-none"><Footprints className="size-3" />{room.label}</button>)}
        <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col gap-3 p-4 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl"><p className="font-display text-xl text-white">{activeRoom.note}</p><p className="mt-1 text-xs text-white/75">{isVerified360 ? "Drag, swipe, or use arrow keys to look around this interactive panoramic room capture." : isIllustrativePanoramaPreview ? "Interactive illustrative panorama preview · not captured from a real property." : `${activeTiming.label} · ${activeTiming.timeRange} · ${activeTiming.description}`}</p></div>
          <div className="flex flex-wrap items-center gap-2"><Button aria-label="Previous room" onClick={() => cycleRoom(-1)} size="icon" variant="ghost" className="size-10 rounded-full border border-white/20 bg-[#17171e]/80 text-white hover:bg-white/15"><ChevronLeft className="size-4" /></Button>{!isVerified360 && isIllustrativePanoramaPreview && <Button onClick={showGuidedPhoto} variant="outline" className="h-10 rounded-full border-white/20 bg-[#17171e]/85 px-4 text-xs text-white hover:bg-white/15">View photo timings</Button>}{!isVerified360 && !isIllustrativePanoramaPreview && tour.captureMode === "illustrative-panorama" && panoramaPreviewUrl && <Button onClick={showPanoramaPreview} variant="outline" className="h-10 rounded-full border-white/20 bg-[#17171e]/85 px-4 text-xs text-white hover:bg-white/15">View panorama preview</Button>}{!isVerified360 && !isIllustrativePanoramaPreview && timingPhotos.length > 1 && <label className="flex h-10 items-center rounded-full border border-white/20 bg-[#17171e]/85 px-3 text-xs font-semibold text-white shadow-lg"><Eye className="mr-2 size-3.5 text-[#d5ae72]" /><span className="sr-only">Select photo timing</span><select value={activeTiming.id} onChange={event => selectTiming(event.target.value)} data-tour-control="photo-timing-select" aria-label="Select an available photo timing" className="min-w-[116px] appearance-none bg-transparent pr-1 text-xs outline-none">{timingPhotos.map(photo => <option className="text-[#17382f]" key={photo.id} value={photo.id}>{photo.label}</option>)}</select></label>}<Button aria-label="Next room" onClick={() => cycleRoom(1)} size="icon" variant="ghost" className="size-10 rounded-full border border-white/20 bg-[#17171e]/80 text-white hover:bg-white/15"><ChevronRight className="size-4" /></Button></div>
        </div>
      </div>

      <aside className="flex w-full shrink-0 flex-col border-t border-white/10 bg-[#24242c] xl:w-[340px] xl:border-l xl:border-t-0" aria-label="Tour floor and panorama navigator">
        <div className="border-b border-white/10 px-5 py-5"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-white/55">Jump to a room</p><p className="mt-1 text-sm text-white/85">Choose a blue dot on the floor view or an on-canvas marker.</p></div>
        <div className="max-h-[400px] space-y-4 overflow-y-auto p-4 xl:max-h-[calc(72dvh-250px)]">{tour.floors.map(floor => {
          const floorRooms = tour.rooms.filter(room => floor.roomIds.includes(room.id));
          const floorActive = floor.id === activeFloor.id;
          return <section key={floor.id} className={`rounded-2xl border p-3 transition motion-reduce:transition-none ${floorActive ? "border-[#5aa8ff]/60 bg-white/5" : "border-white/10 bg-black/10"}`}><div className="flex items-center justify-between"><button type="button" onClick={() => selectFloor(floor.id)} className="text-sm font-semibold text-white hover:text-[#84c2ff]">{floor.label}</button><Layers3 className="size-4 text-white/45" /></div><div className="relative mt-3 aspect-[1.62] overflow-hidden rounded-xl border border-white/10 bg-[#f6f7f4]" aria-label={`${floor.label} floor view`}><div className="absolute inset-[10%] rounded-md border-2 border-[#233f37] bg-[#fffef9]" /><div className="absolute left-[14%] top-[18%] h-[33%] w-[42%] rounded-sm border border-[#6d8880] bg-[#e5eee7]" /><div className="absolute right-[14%] top-[18%] h-[33%] w-[25%] rounded-sm border border-[#a88a5c] bg-[#f7ebd7]" /><div className="absolute bottom-[17%] left-[14%] h-[20%] w-[72%] rounded-sm border border-[#6d8880] bg-[#edf1ed]" />{floorRooms.map(room => <button key={room.id} type="button" onClick={() => selectRoom(room.id)} style={{ left: `${room.floorPlanPosition.x}%`, top: `${room.floorPlanPosition.y}%` }} aria-label={`Jump to ${room.label}`} aria-pressed={room.id === activeRoom.id} className={`absolute z-10 flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 text-[10px] font-bold shadow-md transition motion-reduce:transition-none ${room.id === activeRoom.id ? "border-white bg-[#d5ae72] text-[#172b25]" : "border-white bg-[#087ff5] text-white hover:scale-110 motion-reduce:transform-none"}`}>{floorRooms.indexOf(room) + 1}</button>)}</div><div className="mt-3 grid gap-1">{floorRooms.map(room => <button key={room.id} type="button" onClick={() => selectRoom(room.id)} aria-pressed={room.id === activeRoom.id} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition motion-reduce:transition-none ${room.id === activeRoom.id ? "bg-[#087ff5]/20 text-white" : "text-white/65 hover:bg-white/8 hover:text-white"}`}><span className="size-2 rounded-full bg-[#087ff5]" />{room.label}</button>)}</div></section>;
        })}</div>
        <div className="border-t border-white/10 p-4"><Button onClick={requestViewing} className="min-h-11 w-full rounded-full bg-[#d5ae72] text-[#16241f] hover:bg-[#ebc98d]">Request a viewing</Button>{tour.aiGuide.enabled && <div data-tour-guide-scope="approved-metadata" className="mt-3 rounded-xl border border-[#d5ae72]/25 bg-[#302d26] p-3"><Button variant="ghost" onClick={() => setGuideOpen(open => !open)} className="h-auto w-full justify-start p-0 text-left text-xs font-semibold text-[#f5d9a6] hover:bg-transparent hover:text-[#fff4de]"><Sparkles className="mr-1.5 size-3.5" />Optional AI Tour Guide</Button>{guideOpen && <div className="mt-3 border-t border-white/10 pt-3"><p className="text-[11px] leading-5 text-white/75">{tour.aiGuide.intro}</p><Button type="button" variant="outline" size="sm" onClick={toggleGuideNarration} className="mt-3 min-h-9 rounded-full border-white/20 bg-white/5 text-[11px] text-white hover:bg-white/10">{isSpeaking ? <><VolumeX className="mr-1.5 size-3.5" />Stop guide</> : <><Volume2 className="mr-1.5 size-3.5" />Listen to guide</>}</Button></div>}</div>}<div className="mt-3 flex gap-2 text-[10px] leading-4 text-white/55"><ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-[#d5ae72]" /><p>{tour.captureMode === "guided-photo" ? "Guided photo fallback. It is not presented as a 360° panorama." : tour.captureMode === "illustrative-panorama" ? "Illustrative generated panorama preview. It is not a captured 360° property tour." : "Verified 360° media is subject to publication review."} Privacy review and manual approval are required before real publication.</p></div></div>
      </aside>
    </div>
    <div className="sr-only" aria-live="polite">Now viewing {activeRoom.label} on {activeFloor.label}.</div>
    {isFullscreen && <Button onClick={() => void toggleFullscreen()} aria-label="Exit full screen tour" size="icon" className="absolute right-4 top-4 z-40 size-10 rounded-full bg-[#17171e]/85 text-white hover:bg-white/15"><X className="size-4" /></Button>}
  </section>;
}
