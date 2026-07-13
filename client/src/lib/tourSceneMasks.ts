export type TourExteriorMask = {
  clipPath: string;
  label: "exterior-scene" | "window-opening";
};

const EXTERIOR_SCENE_MASK: TourExteriorMask = {
  clipPath: "inset(0)",
  label: "exterior-scene",
};

const CENTRAL_WINDOW_MASK: TourExteriorMask = {
  clipPath: "polygon(34% 58%, 69% 58%, 69% 80%, 34% 80%)",
  label: "window-opening",
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
