import type { Property } from "./data";

export type TourTime = "morning" | "noon" | "night";
export type TourRoom = {
  id: string;
  label: string;
  note: string;
  floorBounds: { x: number; y: number; width: number; height: number };
  viewerPosition: { x: number; y: number };
  connections: Array<{ roomId: string; direction: "left" | "right" | "up" | "down" }>;
  media: Partial<Record<TourTime, string>>;
};

export type PortableTour = {
  disclosure: string;
  floorLabel: string;
  rooms: TourRoom[];
};

const asset = (name: string) => `/assets/tours/${name}`;
const disclosure = "Illustrative generated viewing media, not a captured 360° survey, official plan, or representation of an actual unit. Request an in-person viewing to verify the property.";
const matched = (room: "living" | "kitchen" | "utility" | "primary" | "room2" | "room3"): Partial<Record<TourTime, string>> => ({
  morning: asset(`marina-${room}-morning.webp`),
  noon: asset(`marina-${room}-noon.webp`),
  night: asset(`marina-${room}-night.webp`),
});

const marinaRooms: TourRoom[] = [
  { id: "living", label: "Living / dining", note: "Matched-composition illustrative living panorama with bay-facing light treatment.", floorBounds: { x: 5, y: 5, width: 42, height: 40 }, viewerPosition: { x: 50, y: 66 }, connections: [{ roomId: "kitchen", direction: "right" }, { roomId: "primary", direction: "down" }], media: matched("living") },
  { id: "kitchen", label: "Kitchen", note: "Matched-composition illustrative kitchen panorama linked from the living room and utility area.", floorBounds: { x: 51, y: 5, width: 44, height: 23 }, viewerPosition: { x: 68, y: 61 }, connections: [{ roomId: "living", direction: "left" }, { roomId: "utility", direction: "down" }], media: matched("kitchen") },
  { id: "utility", label: "Utility / bath", note: "Matched-composition privacy-safe utility and bath panorama.", floorBounds: { x: 51, y: 32, width: 44, height: 15 }, viewerPosition: { x: 36, y: 56 }, connections: [{ roomId: "kitchen", direction: "up" }, { roomId: "room2", direction: "down" }], media: matched("utility") },
  { id: "primary", label: "Primary room", note: "Matched-composition illustrative primary-room panorama; verify dimensions and outlook in person.", floorBounds: { x: 5, y: 52, width: 29, height: 39 }, viewerPosition: { x: 34, y: 72 }, connections: [{ roomId: "living", direction: "up" }, { roomId: "room2", direction: "right" }], media: matched("primary") },
  { id: "room2", label: "Room 2", note: "Matched-composition illustrative secondary-room panorama with linked room navigation.", floorBounds: { x: 36, y: 52, width: 28, height: 39 }, viewerPosition: { x: 58, y: 69 }, connections: [{ roomId: "primary", direction: "left" }, { roomId: "room3", direction: "right" }, { roomId: "utility", direction: "up" }], media: matched("room2") },
  { id: "room3", label: "Room 3", note: "Matched-composition illustrative secondary-room panorama; request a real viewing for verification.", floorBounds: { x: 66, y: 52, width: 29, height: 39 }, viewerPosition: { x: 74, y: 72 }, connections: [{ roomId: "room2", direction: "left" }], media: matched("room3") },
];

function cloneRooms(rooms: TourRoom[]) {
  return rooms.map(room => ({ ...room, floorBounds: { ...room.floorBounds }, viewerPosition: { ...room.viewerPosition }, connections: room.connections.map(connection => ({ ...connection })), media: { ...room.media } }));
}

function lockedTour(floorLabel: string, rooms: Array<{ id: string; label: string; source: "living" | "kitchen" | "primary" | "room2"; note: string }>): PortableTour {
  return {
    disclosure,
    floorLabel,
    rooms: rooms.map((room, index) => ({
      id: room.id,
      label: room.label,
      note: room.note,
      floorBounds: { x: 5 + index * (90 / rooms.length), y: 24, width: 90 / rooms.length - 3, height: 52 },
      viewerPosition: { x: 32 + index * (36 / Math.max(1, rooms.length - 1)), y: 66 },
      connections: [...(index ? [{ roomId: rooms[index - 1].id, direction: "left" as const }] : []), ...(index < rooms.length - 1 ? [{ roomId: rooms[index + 1].id, direction: "right" as const }] : [])],
      media: matched(room.source),
    })),
  };
}

const tours: Record<string, PortableTour> = {
  "marina-cove-28-08": { disclosure, floorLabel: "Illustrative main floor", rooms: cloneRooms(marinaRooms) },
  "interlace-garden-06-12": {
    disclosure,
    floorLabel: "Illustrative garden home",
    rooms: [
      { id: "entry", label: "Entry", note: "Illustrative arrival preview for the garden-home demonstration.", floorBounds: { x: 5, y: 20, width: 25, height: 55 }, viewerPosition: { x: 32, y: 60 }, connections: [{ roomId: "gather", direction: "right" }], media: { noon: asset("interlace-entry.webp") } },
      { id: "gather", label: "Gathering area", note: "Illustrative shared living panorama for the garden-home demonstration.", floorBounds: { x: 34, y: 14, width: 42, height: 62 }, viewerPosition: { x: 55, y: 56 }, connections: [{ roomId: "entry", direction: "left" }, { roomId: "outlook", direction: "right" }], media: { noon: asset("interlace-gather.webp") } },
      { id: "outlook", label: "Outlook", note: "Illustrative garden outlook preview. Verify actual outlook and condition in person.", floorBounds: { x: 80, y: 20, width: 15, height: 55 }, viewerPosition: { x: 69, y: 56 }, connections: [{ roomId: "gather", direction: "left" }], media: { noon: asset("interlace-outlook.webp") } },
    ],
  },
  "queenstown-skyline-demo": {
    disclosure,
    floorLabel: "Illustrative HDB layout",
    rooms: [
      { id: "living", label: "Living / dining", note: "Illustrative living and dining panorama from the current product-demo media set.", floorBounds: { x: 5, y: 5, width: 42, height: 41 }, viewerPosition: { x: 50, y: 64 }, connections: [{ roomId: "kitchen", direction: "right" }, { roomId: "primary", direction: "down" }], media: { noon: asset("queenstown-living.webp") } },
      { id: "kitchen", label: "Kitchen", note: "Illustrative kitchen panorama from the current product-demo media set.", floorBounds: { x: 51, y: 5, width: 44, height: 23 }, viewerPosition: { x: 68, y: 58 }, connections: [{ roomId: "living", direction: "left" }, { roomId: "utility", direction: "down" }], media: { noon: asset("queenstown-kitchen.webp") } },
      { id: "utility", label: "Utility / bath", note: "Illustrative utility and bath preview; no personal information is represented.", floorBounds: { x: 51, y: 32, width: 44, height: 15 }, viewerPosition: { x: 55, y: 68 }, connections: [{ roomId: "kitchen", direction: "up" }, { roomId: "room2", direction: "down" }], media: { noon: asset("queenstown-utility.webp") } },
      { id: "primary", label: "Primary room", note: "Illustrative primary room preview; verify condition and size in person.", floorBounds: { x: 5, y: 52, width: 29, height: 39 }, viewerPosition: { x: 34, y: 72 }, connections: [{ roomId: "living", direction: "up" }, { roomId: "room2", direction: "right" }], media: { noon: asset("queenstown-primary.webp") } },
      { id: "room2", label: "Room 2", note: "Illustrative secondary room preview.", floorBounds: { x: 36, y: 52, width: 28, height: 39 }, viewerPosition: { x: 58, y: 69 }, connections: [{ roomId: "primary", direction: "left" }, { roomId: "room3", direction: "right" }, { roomId: "utility", direction: "up" }], media: { noon: asset("queenstown-room2.webp") } },
      { id: "room3", label: "Room 3", note: "Illustrative secondary room preview with adjoining-room navigation.", floorBounds: { x: 66, y: 52, width: 29, height: 39 }, viewerPosition: { x: 74, y: 72 }, connections: [{ roomId: "room2", direction: "left" }], media: { noon: asset("queenstown-room3.webp") } },
    ],
  },
  "bishan-grove-demo": lockedTour("Illustrative HDB layout", [
    { id: "living", label: "Living / dining", source: "living", note: "Illustrative locked-composition HDB living sequence." },
    { id: "kitchen", label: "Kitchen", source: "kitchen", note: "Illustrative locked-composition kitchen sequence." },
    { id: "primary", label: "Primary room", source: "primary", note: "Illustrative locked-composition primary-room sequence." },
  ]),
  "tampines-verge-demo": lockedTour("Illustrative HDB layout", [
    { id: "living", label: "Living / dining", source: "living", note: "Illustrative locked-composition HDB living sequence." },
    { id: "kitchen", label: "Kitchen", source: "kitchen", note: "Illustrative locked-composition kitchen sequence." },
    { id: "bedroom", label: "Bedroom", source: "room2", note: "Illustrative locked-composition bedroom sequence." },
  ]),
  "tanjong-pagar-office-18": lockedTour("Illustrative office suite", [
    { id: "reception", label: "Reception", source: "living", note: "Illustrative locked-composition reception context." },
    { id: "workspace", label: "Open workspace", source: "kitchen", note: "Illustrative locked-composition workplace circulation." },
    { id: "meeting", label: "Meeting suite", source: "primary", note: "Illustrative locked-composition meeting-suite context." },
  ]),
};

export function getPortableTour(property: Property): PortableTour | null {
  if (tours[property.id]) return tours[property.id];
  if (!property.virtualTourAvailable) return null;
  const fallback = property.gallery[0] ?? property.image;
  return {
    disclosure: "Illustrative guided viewing media, not a captured 360° survey or official plan. Request an in-person viewing to verify the property.",
    floorLabel: "Illustrative room sequence",
    rooms: [{ id: "main", label: "Main viewing", note: "Illustrative listing media for this demonstration property.", floorBounds: { x: 12, y: 18, width: 76, height: 64 }, viewerPosition: { x: 50, y: 60 }, connections: [], media: { noon: fallback } }],
  };
}
