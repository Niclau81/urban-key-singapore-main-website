import { Button } from "@/components/ui/button";
import { VirtualTour } from "@/components/VirtualTour";
import type { VirtualPropertyTour as VirtualPropertyTourConfig } from "@shared/virtualTour";
import { ChevronLeft, ChevronRight, Eye, MapPinned, ShieldCheck, Sparkles, Volume2, VolumeX } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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
  const [activeRoomIndex, setActiveRoomIndex] = useState(0);
  const [guideOpen, setGuideOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [visitedRoomIds, setVisitedRoomIds] = useState<string[]>([tour.rooms[0]?.id ?? ""]);
  const activeRoom = tour.rooms[activeRoomIndex] ?? tour.rooms[0];
  const activeRoomIds = useMemo(() => new Set(visitedRoomIds), [visitedRoomIds]);

  useEffect(() => { recordLocalTourEvent(title, "tour_opened"); }, [title]);
  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  const selectRoom = (index: number) => {
    const safeIndex = (index + tour.rooms.length) % tour.rooms.length;
    const nextRoom = tour.rooms[safeIndex];
    setActiveRoomIndex(safeIndex);
    setVisitedRoomIds(current => current.includes(nextRoom.id) ? current : [...current, nextRoom.id]);
    recordLocalTourEvent(title, "room_visited", nextRoom.id);
  };

  const requestViewing = () => {
    recordLocalTourEvent(title, "appointment_intent", activeRoom.id);
    onAppointmentIntent();
  };

  const toggleGuideNarration = () => {
    if (!window.speechSynthesis) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const message = new SpeechSynthesisUtterance(`${tour.aiGuide.intro} You are viewing ${activeRoom.label}. ${activeRoom.note}. Approved highlights: ${activeRoom.approvedHighlights.join(", ")}.`);
    message.lang = "en-SG";
    message.rate = 0.94;
    message.onend = () => setIsSpeaking(false);
    message.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(message);
  };

  return <section id="virtual-property-tour" className="overflow-hidden rounded-[30px] border border-[#17382f]/10 bg-white shadow-[0_20px_70px_rgba(23,56,47,.09)]" data-virtual-property-tour="guided-photo-floor-plan">
    <div className="flex flex-col gap-4 border-b border-[#17382f]/10 bg-[#edf2ed] px-5 py-5 sm:px-7 sm:py-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="max-w-2xl"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.15em] text-[#76552f]"><MapPinned className="size-4" />{tour.badgeLabel}</div><h2 className="mt-2 font-display text-3xl text-[#17382f]">Move room to room with context.</h2><p className="mt-2 text-sm leading-6 text-[#566f68]">Guided rooms and floor-plan hotspots work alongside the available photo-timing views.</p></div>
      <div className="flex items-center gap-3 rounded-2xl border border-[#17382f]/10 bg-white px-4 py-3 text-xs text-[#49635d]"><Eye className="size-4 text-[#a77c43]" /><span><strong className="text-[#17382f]">{activeRoomIds.size}</strong> of {tour.rooms.length} room zones explored</span></div>
    </div>
    <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 p-3 sm:p-5"><VirtualTour title={`${title} · ${activeRoom.label}`} gallery={gallery} activeImageIndex={activeRoom.imageIndex} onImageIndexChange={imageIndex => { const roomIndex = tour.rooms.findIndex(room => room.imageIndex === imageIndex); if (roomIndex >= 0) selectRoom(roomIndex); }} /></div>
      <aside className="border-t border-[#17382f]/10 bg-[#fbfaf6] p-5 lg:border-l lg:border-t-0 sm:p-6">
        <div className="flex items-center justify-between"><p className="eyebrow">Room navigator</p><span className="rounded-full bg-[#e8eee9] px-2.5 py-1 text-[10px] font-bold text-[#49635d]">{activeRoomIndex + 1} / {tour.rooms.length}</span></div>
        <div className="relative mt-5 aspect-[1.38] overflow-hidden rounded-2xl border border-[#17382f]/12 bg-[#f1f4f0]" aria-label="Interactive floor-plan room hotspots">
          <div className="absolute inset-4 rounded-xl border-2 border-[#55746b]/65 bg-[#fdfcf7]" />
          <div className="absolute left-[8%] top-[14%] h-[34%] w-[45%] rounded-md border border-[#55746b]/45 bg-[#e5eee7]" /><div className="absolute right-[8%] top-[14%] h-[34%] w-[28%] rounded-md border border-[#8f6b3c]/45 bg-[#f6eddd]" /><div className="absolute bottom-[13%] left-[8%] h-[23%] w-[80%] rounded-md border border-[#55746b]/35 bg-[#ecf0ed]" />
          {tour.rooms.map((room, index) => <button key={room.id} type="button" onClick={() => selectRoom(index)} aria-label={`Open ${room.label} tour view`} aria-pressed={index === activeRoomIndex} className={`absolute z-10 flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 text-xs font-bold shadow-lg transition focus:outline-none focus:ring-4 focus:ring-[#d5ae72]/30 ${index === activeRoomIndex ? "border-[#17382f] bg-[#d5ae72] text-[#17382f]" : "border-white bg-[#17382f] text-white hover:scale-110"}`} style={{ left: `${room.floorPlanPosition.x}%`, top: `${room.floorPlanPosition.y}%` }}>{index + 1}</button>)}
        </div>
        <div className="mt-5"><h3 className="font-display text-2xl text-[#17382f]">{activeRoom.label}</h3><p className="mt-2 text-sm leading-6 text-[#566f68]">{activeRoom.note}</p><div className="mt-3 flex flex-wrap gap-2">{activeRoom.approvedHighlights.map(highlight => <span key={highlight} className="rounded-full bg-[#e8eee9] px-2.5 py-1 text-[10px] font-semibold text-[#49635d]">{highlight}</span>)}</div></div>
        <div className="mt-5 flex gap-2"><Button size="sm" variant="outline" onClick={() => selectRoom(activeRoomIndex - 1)} className="min-h-11 flex-1 rounded-full"><ChevronLeft className="mr-1 size-4" />Previous</Button><Button size="sm" variant="outline" onClick={() => selectRoom(activeRoomIndex + 1)} className="min-h-11 flex-1 rounded-full">Next<ChevronRight className="ml-1 size-4" /></Button></div>
        {tour.aiGuide.enabled && <div data-tour-guide-scope="approved-metadata" className="mt-5 rounded-2xl border border-[#d5ae72]/35 bg-[#f8f1e4] p-4"><Button variant="ghost" onClick={() => setGuideOpen(open => !open)} className="h-auto w-full justify-start p-0 text-left text-sm font-semibold text-[#573b18]"><Sparkles className="mr-2 size-4 text-[#a77c43]" />Optional AI Tour Guide</Button>{guideOpen && <div className="mt-3 border-t border-[#a77c43]/20 pt-3"><p className="text-xs leading-5 text-[#76552f]">{tour.aiGuide.intro}</p><Button type="button" variant="outline" size="sm" onClick={toggleGuideNarration} className="mt-3 min-h-10 rounded-full border-[#a77c43]/35 bg-white/65 text-xs text-[#573b18]">{isSpeaking ? <><VolumeX className="mr-1.5 size-3.5" />Stop guide</> : <><Volume2 className="mr-1.5 size-3.5" />Listen to guide</>}</Button><p className="mt-2 text-[10px] font-semibold text-[#8d6b3c]">Uses approved tour metadata only. Your device reads the guide only after you choose Listen.</p></div>}</div>}
        <Button onClick={requestViewing} className="mt-5 min-h-11 w-full rounded-full bg-[#17382f]">Request a viewing</Button>
      </aside>
    </div>
    <div className="grid gap-4 border-t border-[#17382f]/10 bg-[#fcfbf8] px-5 py-5 text-xs leading-5 text-[#647b74] sm:grid-cols-2 sm:px-7"><div className="flex gap-2"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#a77c43]" /><p><strong className="text-[#17382f]">Privacy review required.</strong> <span className="font-semibold text-[#76552f]">{tour.privacyReview.status.replaceAll("-", " ")}.</span> AI-assisted redaction must flag {tour.privacyReview.protectedTargets.join(", ")}; a person must review before a real tour is published.</p></div><p><strong className="text-[#17382f]">Tour scope.</strong> {tour.disclosure} Engagement is session-only and records tour entry, room visits, and viewing intent—without cross-list profiling or automated lead scoring.</p></div>
  </section>;
}
