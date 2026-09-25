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

const tourAsset = (name: string) => `/assets/tours/${name}`;
const illustrativeDisclosure = "Illustrative generated viewing media, not a captured 360° survey, official plan, or representation of an actual unit. Request an in-person viewing to verify the property.";

const tours: Record<string, PortableTour> = {
  "marina-cove-28-08": {
    disclosure: illustrativeDisclosure,
    floorLabel: "Illustrative main floor",
    rooms: [
      { id: "living", label: "Living / dining", note: "A wide illustrative living panorama with bay-facing light treatment.", floorBounds: { x: 5, y: 5, width: 42, height: 40 }, viewerPosition: { x: 50, y: 66 }, connections: [{ roomId: "kitchen", direction: "right" }, { roomId: "primary", direction: "down" }], media: { morning: tourAsset("marina-living-morning.webp"), noon: tourAsset("marina-living-noon.webp"), night: tourAsset("marina-living-night.webp") } },
      { id: "kitchen", label: "Kitchen", note: "Illustrative kitchen view linked from the living room and utility area.", floorBounds: { x: 51, y: 5, width: 44, height: 23 }, viewerPosition: { x: 68, y: 61 }, connections: [{ roomId: "living", direction: "left" }, { roomId: "utility", direction: "down" }], media: { morning: tourAsset("marina-kitchen-day.webp"), noon: tourAsset("marina-kitchen-day.webp"), night: tourAsset("marina-kitchen-night.webp") } },
      { id: "utility", label: "Utility / bath", note: "Illustrative privacy-safe utility and bath view.", floorBounds: { x: 51, y: 32, width: 44, height: 15 }, viewerPosition: { x: 36, y: 56 }, connections: [{ roomId: "kitchen", direction: "up" }, { roomId: "room2", direction: "down" }], media: { morning: tourAsset("marina-utility-morning.webp"), noon: tourAsset("marina-utility-noon.webp"), night: tourAsset("marina-utility-night.webp") } },
      { id: "primary", label: "Primary room", note: "Illustrative primary room preview; verify dimensions and outlook in person.", floorBounds: { x: 5, y: 52, width: 29, height: 39 }, viewerPosition: { x: 34, y: 72 }, connections: [{ roomId: "living", direction: "up" }, { roomId: "room2", direction: "right" }], media: { morning: tourAsset("marina-primary-day.webp"), noon: tourAsset("marina-primary-day.webp"), night: tourAsset("marina-primary-night.webp") } },
      { id: "room2", label: "Room 2", note: "Illustrative secondary room preview with linked room navigation.", floorBounds: { x: 36, y: 52, width: 28, height: 39 }, viewerPosition: { x: 58, y: 69 }, connections: [{ roomId: "primary", direction: "left" }, { roomId: "room3", direction: "right" }, { roomId: "utility", direction: "up" }], media: { morning: tourAsset("marina-room2-day.webp"), noon: tourAsset("marina-room2-day.webp"), night: tourAsset("marina-room2-night.webp") } },
      { id: "room3", label: "Room 3", note: "Illustrative secondary room preview; request a real viewing for verification.", floorBounds: { x: 66, y: 52, width: 29, height: 39 }, viewerPosition: { x: 74, y: 72 }, connections: [{ roomId: "room2", direction: "left" }], media: { morning: tourAsset("marina-room3-day.webp"), noon: tourAsset("marina-room3-day.webp"), night: tourAsset("marina-room3-night.webp") } },
    ],
  },
  "interlace-garden-06-12": {
    disclosure: illustrativeDisclosure,
    floorLabel: "Illustrative garden home",
    rooms: [
      { id: "entry", label: "Entry", note: "Illustrative arrival view for the garden-home demonstration.", floorBounds: { x: 5, y: 20, width: 25, height: 55 }, viewerPosition: { x: 32, y: 60 }, connections: [{ roomId: "gather", direction: "right" }], media: { morning: tourAsset("interlace-living.webp"), noon: tourAsset("interlace-living.webp"), night: tourAsset("interlace-living.webp") } },
      { id: "gather", label: "Gathering area", note: "Illustrative shared living area; the treatment changes only for viewing context.", floorBounds: { x: 34, y: 14, width: 42, height: 62 }, viewerPosition: { x: 55, y: 56 }, connections: [{ roomId: "entry", direction: "left" }, { roomId: "outlook", direction: "right" }], media: { morning: tourAsset("interlace-living.webp"), noon: tourAsset("interlace-living.webp"), night: tourAsset("interlace-living.webp") } },
      { id: "outlook", label: "Garden outlook", note: "Illustrative outlook position. Verify actual outlook and condition in person.", floorBounds: { x: 80, y: 20, width: 15, height: 55 }, viewerPosition: { x: 69, y: 56 }, connections: [{ roomId: "gather", direction: "left" }], media: { morning: tourAsset("interlace-living.webp"), noon: tourAsset("interlace-living.webp"), night: tourAsset("interlace-living.webp") } },
    ],
  },
  "queenstown-skyline-demo": {
    disclosure: illustrativeDisclosure,
    floorLabel: "Illustrative HDB layout",
    rooms: [
      { id: "living", label: "Living / dining", note: "Illustrative living and dining panorama; not a surveyed unit.", floorBounds: { x: 5, y: 5, width: 42, height: 41 }, viewerPosition: { x: 50, y: 64 }, connections: [{ roomId: "kitchen", direction: "right" }, { roomId: "primary", direction: "down" }], media: { morning: tourAsset("queenstown-living.webp"), noon: tourAsset("queenstown-living.webp"), night: tourAsset("queenstown-living.webp") } },
      { id: "kitchen", label: "Kitchen", note: "Illustrative kitchen panorama with the same room sequence as the managed demo.", floorBounds: { x: 51, y: 5, width: 44, height: 23 }, viewerPosition: { x: 68, y: 58 }, connections: [{ roomId: "living", direction: "left" }, { roomId: "utility", direction: "down" }], media: { morning: tourAsset("queenstown-kitchen.webp"), noon: tourAsset("queenstown-kitchen.webp"), night: tourAsset("queenstown-kitchen.webp") } },
      { id: "utility", label: "Utility / bath", note: "Illustrative utility and bath preview; no personal information is represented.", floorBounds: { x: 51, y: 32, width: 44, height: 15 }, viewerPosition: { x: 55, y: 68 }, connections: [{ roomId: "kitchen", direction: "up" }, { roomId: "room2", direction: "down" }], media: { morning: tourAsset("queenstown-utility.webp"), noon: tourAsset("queenstown-utility.webp"), night: tourAsset("queenstown-utility.webp") } },
      { id: "primary", label: "Primary room", note: "Illustrative primary room preview; verify condition and size in person.", floorBounds: { x: 5, y: 52, width: 29, height: 39 }, viewerPosition: { x: 34, y: 72 }, connections: [{ roomId: "living", direction: "up" }, { roomId: "room2", direction: "right" }], media: { morning: tourAsset("queenstown-primary.webp"), noon: tourAsset("queenstown-primary.webp"), night: tourAsset("queenstown-primary.webp") } },
      { id: "room2", label: "Room 2", note: "Illustrative secondary room preview.", floorBounds: { x: 36, y: 52, width: 28, height: 39 }, viewerPosition: { x: 58, y: 69 }, connections: [{ roomId: "primary", direction: "left" }, { roomId: "room3", direction: "right" }, { roomId: "utility", direction: "up" }], media: { morning: tourAsset("queenstown-bedroom.webp"), noon: tourAsset("queenstown-bedroom.webp"), night: tourAsset("queenstown-bedroom.webp") } },
      { id: "room3", label: "Room 3", note: "Illustrative secondary room preview with adjoining-room navigation.", floorBounds: { x: 66, y: 52, width: 29, height: 39 }, viewerPosition: { x: 74, y: 72 }, connections: [{ roomId: "room2", direction: "left" }], media: { morning: tourAsset("queenstown-bedroom.webp"), noon: tourAsset("queenstown-bedroom.webp"), night: tourAsset("queenstown-bedroom.webp") } },
    ],
  },
};

export function getPortableTour(property: Property): PortableTour | null {
  if (tours[property.id]) return tours[property.id];
  if (!property.virtualTourAvailable) return null;
  const fallback = property.gallery[0] ?? property.image;
  return {
    disclosure: "Illustrative guided viewing media, not a captured 360° survey or official plan. Request an in-person viewing to verify the property.",
    floorLabel: "Illustrative room sequence",
    rooms: [
      { id: "main", label: "Main viewing", note: "Illustrative listing media for this demonstration property.", floorBounds: { x: 12, y: 18, width: 76, height: 64 }, viewerPosition: { x: 50, y: 60 }, connections: [], media: { morning: fallback, noon: fallback, night: fallback } },
    ],
  };
}
