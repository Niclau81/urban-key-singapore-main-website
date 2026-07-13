export type TourExteriorMask = {
  clipPath: string;
  label: "exterior-scene" | "window-opening";
  opacity: number;
  maskImage?: string;
};

const EXTERIOR_SCENE_MASK: TourExteriorMask = {
  clipPath: "inset(0)",
  label: "exterior-scene",
  opacity: 1,
};

const CENTRAL_WINDOW_MASK: TourExteriorMask = {
  clipPath: "polygon(35.5% 60.5%, 68.5% 60.5%, 68.5% 75.5%, 35.5% 75.5%)",
  label: "window-opening",
  opacity: 0.72,
  maskImage: "linear-gradient(to bottom, transparent 57.5%, #000 62%, #000 72%, transparent 77%)",
};

/**
 * Returns a deliberately conservative exterior region for a known tour image.
 * Interior-only scenes return null so sky effects can never cover room surfaces.
 */
export function getTourExteriorMask(imageUrl: string): TourExteriorMask | null {
  const image = imageUrl.toLowerCase();

  if (image.includes("office-building")) return CENTRAL_WINDOW_MASK;
  if (image.includes("warehouse-exterior")) return EXTERIOR_SCENE_MASK;

  return null;
}
