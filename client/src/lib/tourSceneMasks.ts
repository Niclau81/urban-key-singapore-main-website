export type TourExteriorMask = {
  clipPath: string;
  maskImage: string;
  opacity: number;
  label: string;
};

const SOLID_MASK = "linear-gradient(#000, #000)";

const EXTERIOR_SCENE_MASK: TourExteriorMask = {
  clipPath: "inset(0)",
  maskImage: SOLID_MASK,
  opacity: 1,
  label: "exterior-scene",
};

const CENTRAL_WINDOW_MASK: TourExteriorMask = {
  // Source image is 1500×783. The exterior bay view occupies the central opening,
  // while the cabinetry, ceiling and balcony furniture remain outside this mask.
  clipPath: "polygon(34.8% 59.8%, 65.8% 59.8%, 65.8% 71.2%, 34.8% 71.2%)",
  maskImage: "linear-gradient(to bottom, transparent 58.8%, #000 61%, #000 69.8%, transparent 72.2%)",
  opacity: 0.94,
  label: "central-bay-view-opening",
};

const DIAGONAL_OFFICE_WINDOW_MASK: TourExteriorMask = {
  // Source image is 1499×1064. The visible exterior is a narrow diagonal band
  // behind the right-side window wall; stop above the balcony rail and stair void.
  clipPath: "polygon(78.1% 44.2%, 93.8% 38.2%, 93.8% 56.8%, 78.1% 55.4%)",
  maskImage:
    "linear-gradient(135deg, transparent 0%, #000 10%, #000 89%, transparent 100%)",
  opacity: 0.96,
  label: "diagonal-office-window-sky",
};

/**
 * Returns a deliberately conservative exterior region for a known tour image.
 * Interior-only scenes return null so sky effects can never cover room surfaces.
 */
export function getTourExteriorMask(imageUrl: string): TourExteriorMask | null {
  const image = imageUrl.toLowerCase();

  if (image.includes("office-building")) return CENTRAL_WINDOW_MASK;
  if (image.includes("office-interior")) return DIAGONAL_OFFICE_WINDOW_MASK;
  if (image.includes("warehouse-exterior")) return EXTERIOR_SCENE_MASK;

  return null;
}
