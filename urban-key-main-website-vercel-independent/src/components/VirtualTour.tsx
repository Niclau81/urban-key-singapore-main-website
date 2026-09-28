import { ChevronLeft, ChevronRight, CircleDotDashed, Maximize2, Minimize2, ShieldCheck } from "lucide-react";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import type { Property } from "../data";
import { getPortableTour, type TourTime } from "../tours";

type Props = { property: Property; onRequestViewing: () => void };

const timings: Array<{ id: TourTime; label: string; caption: string }> = [
  { id: "morning", label: "Morning", caption: "7:30 AM" },
  { id: "noon", label: "Noon", caption: "12:30 PM" },
  { id: "night", label: "Night", caption: "8:30 PM" },
];

const EquirectangularPanorama = lazy(async () => ({ default: (await import("./EquirectangularPanorama")).EquirectangularPanorama }));

const panoramaNodePosition = (direction: "left" | "right" | "up" | "down") => {
  if (direction === "left") return { x: 42, y: 60 };
  if (direction === "right") return { x: 58, y: 60 };
  if (direction === "up") return { x: 50, y: 37 };
  return { x: 50, y: 65 };
};

export function VirtualTour({ property, onRequestViewing }: Props) {
  const tour = getPortableTour(property);
  const viewerRef = useRef<HTMLElement>(null);
  const [roomId, setRoomId] = useState(tour?.rooms[0]?.id ?? "");
  const [time, setTime] = useState<TourTime>("noon");
  const [fullscreen, setFullscreen] = useState(false);

  const room = tour?.rooms.find(item => item.id === roomId) ?? tour?.rooms[0];
  const availableTimings = timings.filter(item => Boolean(room?.media[item.id]));
  const showTimingChooser = availableTimings.length > 1;
  const image = room?.media[time] ?? room?.media.noon ?? room?.media.morning ?? room?.media.night;

  useEffect(() => {
    if (!room || room.media[time]) return;
    setTime(room.media.noon ? "noon" : room.media.morning ? "morning" : "night");
  }, [room?.id, room?.media, time]);
  useEffect(() => {
    const update = () => setFullscreen(document.fullscreenElement === viewerRef.current);
    document.addEventListener("fullscreenchange", update);
    return () => document.removeEventListener("fullscreenchange", update);
  }, []);

  if (!tour || !room || !image) return null;

  const selectRoom = (next: string) => { if (tour.rooms.some(item => item.id === next)) setRoomId(next); };
  const stepRoom = (delta: number) => {
    const current = tour.rooms.findIndex(item => item.id === room.id);
    selectRoom(tour.rooms[(current + delta + tour.rooms.length) % tour.rooms.length].id);
  };
  const toggleFullscreen = async () => {
    if (!viewerRef.current) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await viewerRef.current.requestFullscreen?.();
  };

  return <section id="tour-viewer" ref={viewerRef} className={`virtual-tour ${fullscreen ? "tour-fullscreen" : ""}`} aria-label={`${property.title} immersive virtual property tour`} data-tour-renderer="equirectangular-panorama">
    <header className="tour-timing-bar"><div><p className="eyebrow">Virtual Property Tour</p><b>{room.label} · {showTimingChooser ? "photo timing" : "guided view"}</b><small>{showTimingChooser ? "Matched morning, noon, and night panorama media with room-to-room navigation." : "One matched illustrative panorama view is available for this position."}</small></div>{showTimingChooser ? <div className="tour-time-buttons" role="group" aria-label="Choose photo timing">{availableTimings.map(item => <button key={item.id} type="button" aria-pressed={time === item.id} className={time === item.id ? "selected" : ""} onClick={() => setTime(item.id)}><b>{item.label}</b><span>{item.caption}</span></button>)}</div> : <span className="tour-as-photographed">As photographed</span>}</header>
    <div className="tour-stage">
      <div className="tour-image-area">
        <Suspense fallback={<div className="tour-panorama-loading">Loading interactive panorama…</div>}><EquirectangularPanorama src={image} alt={`${property.title} illustrative ${room.label} ${time} panorama view`} timeOfDay={time} hotspots={room.connections.map(connection => { const destination = tour.rooms.find(item => item.id === connection.roomId); const position = panoramaNodePosition(connection.direction); return destination ? { id: destination.id, label: destination.label, ...position, direction: connection.direction } : null; }).filter((destination): destination is NonNullable<typeof destination> => Boolean(destination))} onSelectHotspot={selectRoom} /></Suspense>
        <div className="tour-shade" />
        <div className="tour-title"><span><CircleDotDashed size={15} />Illustrative panorama preview</span><h3>{room.label}</h3></div>
        <div className="tour-controls"><button type="button" aria-label="Previous room" onClick={() => stepRoom(-1)}><ChevronLeft size={20} /></button><button type="button" aria-label={fullscreen ? "Exit full screen virtual tour" : "Open full screen virtual tour"} onClick={() => void toggleFullscreen()}>{fullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}</button><button type="button" aria-label="Next room" onClick={() => stepRoom(1)}><ChevronRight size={20} /></button></div>
        <div className="tour-caption"><b>{room.note}</b><span>{showTimingChooser ? (time === "night" ? "Matched bright interior with a night exterior outlook." : `Matched ${time} panorama composition for viewing context.`) : "Matched illustrative panorama media; no alternate timing has been published for this room."}</span></div>
      </div>
      <aside className="tour-navigator" aria-label="Tour room navigator"><div><p className="eyebrow">Room navigator</p><h3>{tour.floorLabel}</h3><p>Choose a room below, select a blue arrow, or drag across the panorama.</p></div><div className="tour-floor-plan">{tour.rooms.map(item => <button key={item.id} type="button" aria-pressed={item.id === room.id} aria-label={`View ${item.label}`} className={item.id === room.id ? "active" : ""} onClick={() => selectRoom(item.id)} style={{ left: `${item.floorBounds.x}%`, top: `${item.floorBounds.y}%`, width: `${item.floorBounds.width}%`, height: `${item.floorBounds.height}%` }}><span>{item.label}</span><i /></button>)}</div><div className="tour-room-list">{tour.rooms.map(item => <button key={item.id} type="button" className={item.id === room.id ? "active" : ""} onClick={() => selectRoom(item.id)}><i />{item.label}</button>)}</div><button type="button" className="gold-button tour-request" onClick={onRequestViewing}>Request a viewing <ChevronRight size={16} /></button><p className="tour-disclosure"><ShieldCheck size={14} />{tour.disclosure}</p></aside>
    </div>
  </section>;
}
