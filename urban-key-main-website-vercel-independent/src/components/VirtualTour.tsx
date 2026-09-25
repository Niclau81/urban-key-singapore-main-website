import { ChevronLeft, ChevronRight, CircleDotDashed, Footprints, Maximize2, Minimize2, Move, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { Property } from "../data";
import { getPortableTour, type TourTime } from "../tours";

type Props = { property: Property; onRequestViewing: () => void };

const timings: Array<{ id: TourTime; label: string; caption: string }> = [
  { id: "morning", label: "Morning", caption: "7:30 AM" },
  { id: "noon", label: "Noon", caption: "12:30 PM" },
  { id: "night", label: "Night", caption: "8:30 PM" },
];

export function VirtualTour({ property, onRequestViewing }: Props) {
  const tour = getPortableTour(property);
  const viewerRef = useRef<HTMLElement>(null);
  const dragging = useRef<{ x: number; y: number } | null>(null);
  const [roomId, setRoomId] = useState(tour?.rooms[0]?.id ?? "");
  const [time, setTime] = useState<TourTime>("noon");
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [fullscreen, setFullscreen] = useState(false);

  const room = tour?.rooms.find(item => item.id === roomId) ?? tour?.rooms[0];
  const image = room?.media[time] ?? room?.media.noon ?? room?.media.morning ?? room?.media.night;

  useEffect(() => { setPan({ x: 0, y: 0 }); }, [room?.id, time]);
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
  const beginPan = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragging.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const movePan = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const dx = event.clientX - dragging.current.x;
    const dy = event.clientY - dragging.current.y;
    dragging.current = { x: event.clientX, y: event.clientY };
    setPan(current => ({ x: Math.max(-140, Math.min(140, current.x + dx)), y: Math.max(-75, Math.min(75, current.y + dy)) }));
  };
  const endPan = () => { dragging.current = null; };

  return <section id="tour-viewer" ref={viewerRef} className={`virtual-tour ${fullscreen ? "tour-fullscreen" : ""}`} aria-label={`${property.title} virtual property tour`}>
    <header className="tour-timing-bar"><div><p className="eyebrow">Virtual Property Tour</p><b>{room.label} · photo timing</b><small>Illustrative panorama-style preview with room-to-room navigation.</small></div><div className="tour-time-buttons" role="group" aria-label="Choose photo timing">{timings.map(item => <button key={item.id} type="button" aria-pressed={time === item.id} className={time === item.id ? "selected" : ""} onClick={() => setTime(item.id)}><b>{item.label}</b><span>{item.caption}</span></button>)}</div></header>
    <div className="tour-stage">
      <div className="tour-image-area" onPointerDown={beginPan} onPointerMove={movePan} onPointerUp={endPan} onPointerCancel={endPan} onPointerLeave={endPan}>
        <img draggable={false} src={image} alt={`${property.title} illustrative ${room.label} ${time} panorama-style view`} style={{ transform: `scale(1.14) translate(${pan.x / 1.14}px, ${pan.y / 1.14}px)` }} />
        <div className="tour-shade" />
        <div className="tour-title"><span><CircleDotDashed size={15} />Illustrative panorama preview</span><h3>{room.label}</h3></div>
        <p className="tour-drag-hint"><Move size={14} />Drag to look around</p>
        <div className="tour-hotspots">{room.connections.map(connection => { const destination = tour.rooms.find(item => item.id === connection.roomId); return destination ? <button key={connection.roomId} type="button" style={{ left: `${destination.viewerPosition.x}%`, top: `${destination.viewerPosition.y}%` }} onClick={() => selectRoom(destination.id)} aria-label={`Move ${connection.direction} to ${destination.label}`}><Footprints size={14} />{connection.direction === "left" ? "←" : connection.direction === "right" ? "→" : connection.direction === "up" ? "↑" : "↓"} {destination.label}</button> : null; })}</div>
        <div className="tour-controls"><button type="button" aria-label="Previous room" onClick={() => stepRoom(-1)}><ChevronLeft size={20} /></button><button type="button" aria-label={fullscreen ? "Exit full screen virtual tour" : "Open full screen virtual tour"} onClick={() => void toggleFullscreen()}>{fullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}</button><button type="button" aria-label="Next room" onClick={() => stepRoom(1)}><ChevronRight size={20} /></button></div>
        <div className="tour-caption"><b>{room.note}</b><span>{time === "night" ? "Night treatment preserves a bright interior with a darker exterior outlook." : `Illustrative ${time} treatment for viewing context.`}</span></div>
      </div>
      <aside className="tour-navigator" aria-label="Tour room navigator"><div><p className="eyebrow">Room navigator</p><h3>{tour.floorLabel}</h3><p>Choose a room below or use the blue arrows in the preview.</p></div><div className="tour-floor-plan">{tour.rooms.map(item => <button key={item.id} type="button" aria-pressed={item.id === room.id} aria-label={`View ${item.label}`} className={item.id === room.id ? "active" : ""} onClick={() => selectRoom(item.id)} style={{ left: `${item.floorBounds.x}%`, top: `${item.floorBounds.y}%`, width: `${item.floorBounds.width}%`, height: `${item.floorBounds.height}%` }}><span>{item.label}</span><i /></button>)}</div><div className="tour-room-list">{tour.rooms.map(item => <button key={item.id} type="button" className={item.id === room.id ? "active" : ""} onClick={() => selectRoom(item.id)}><i />{item.label}</button>)}</div><button type="button" className="gold-button tour-request" onClick={onRequestViewing}>Request a viewing <ChevronRight size={16} /></button><p className="tour-disclosure"><ShieldCheck size={14} />{tour.disclosure}</p></aside>
    </div>
  </section>;
}
