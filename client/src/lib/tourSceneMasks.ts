export type TourExteriorMask = {
  clipPath: string;
  maskImage: string;
  apertureMaskImage: string;
  foregroundMaskImage: string;
  opacity: number;
  label: string;
  composition: "photographic-aperture" | "full-scene";
};

const SOLID_MASK = "linear-gradient(#000, #000)";

function svgMask(polygons: string[], inverse = false) {
  const polygonFill = inverse ? "transparent" : "black";
  const shapes = polygons.map(points => `<polygon points='${points}' fill='${polygonFill}'/>`).join("");
  const rectFill = inverse ? "black" : "transparent";
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 1000' preserveAspectRatio='none'><rect width='1000' height='1000' fill='${rectFill}'/>${shapes}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

const EXTERIOR_SCENE_MASK: TourExteriorMask = {
  clipPath: "inset(0)",
  maskImage: SOLID_MASK,
  apertureMaskImage: SOLID_MASK,
  foregroundMaskImage: SOLID_MASK,
  opacity: 1,
  label: "exterior-scene",
  composition: "full-scene",
};

const CENTRAL_BAY_POLYGONS = ["348,598 658,598 658,712 348,712"];
const CENTRAL_WINDOW_MASK: TourExteriorMask = {
  clipPath: "polygon(34.8% 59.8%, 65.8% 59.8%, 65.8% 71.2%, 34.8% 71.2%)",
  maskImage: "linear-gradient(to bottom, transparent 58.8%, #000 61%, #000 69.8%, transparent 72.2%)",
  apertureMaskImage: svgMask(CENTRAL_BAY_POLYGONS),
  foregroundMaskImage: svgMask(CENTRAL_BAY_POLYGONS, true),
  opacity: 1,
  label: "central-bay-view-opening",
  composition: "photographic-aperture",
};

const OFFICE_SKY_PANES = [
  "784,438 806,431 806,537 784,543",
  "812,428 838,420 838,528 812,535",
  "844,418 873,408 873,520 844,526",
  "880,406 929,390 929,510 880,518",
];
const DIAGONAL_OFFICE_WINDOW_MASK: TourExteriorMask = {
  clipPath: "polygon(78.1% 44.2%, 93.8% 38.2%, 93.8% 56.8%, 78.1% 55.4%)",
  maskImage: "linear-gradient(135deg, transparent 0%, #000 10%, #000 89%, transparent 100%)",
  apertureMaskImage: svgMask(OFFICE_SKY_PANES),
  foregroundMaskImage: svgMask(OFFICE_SKY_PANES, true),
  opacity: 1,
  label: "diagonal-office-window-sky",
  composition: "photographic-aperture",
};

export function getTourExteriorMask(imageUrl: string): TourExteriorMask | null {
  const image = imageUrl.toLowerCase();
  if (image.includes("office-building")) return CENTRAL_WINDOW_MASK;
  if (image.includes("office-interior")) return DIAGONAL_OFFICE_WINDOW_MASK;
  if (image.includes("warehouse-exterior")) return EXTERIOR_SCENE_MASK;
  return null;
}
