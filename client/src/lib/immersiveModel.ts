export type ImmersiveModelView = "tower" | "floor";

export type ListingFloorIdentity = {
  floor: number;
  unitLabel: string;
};

const WHOLE_PROPERTY_TYPES = [
  "shophouse",
  "warehouse",
  "office building",
  "factory building",
  "landed",
  "bungalow",
  "detached",
  "semi-detached",
  "terrace house",
];

export const IMMERSIVE_MODEL_VIEW_CONFIG = {
  tower: {
    scaleY: 1,
    cameraDirection: [0.9, 0.68, 1] as const,
    framingPadding: 1.28,
    panLimitRatio: 0.48,
  },
  floor: {
    scaleY: 0.23,
    cameraDirection: [0.82, 1.28, 1] as const,
    framingPadding: 1.38,
    panLimitRatio: 0.42,
  },
} satisfies Record<ImmersiveModelView, {
  scaleY: number;
  cameraDirection: readonly [number, number, number];
  framingPadding: number;
  panLimitRatio: number;
}>;

export function getNextModelZoomDistance({
  active,
  currentDistance,
  deltaY,
  minDistance,
  maxDistance,
}: {
  active: boolean;
  currentDistance: number;
  deltaY: number;
  minDistance: number;
  maxDistance: number;
}) {
  if (!active) return currentDistance;
  return Math.min(maxDistance, Math.max(minDistance, currentDistance + deltaY * 0.012));
}

export function getModelPanDelta({
  active,
  deltaX,
  deltaY,
  viewportHeight,
  cameraDistance,
  verticalFovDegrees,
}: {
  active: boolean;
  deltaX: number;
  deltaY: number;
  viewportHeight: number;
  cameraDistance: number;
  verticalFovDegrees: number;
}) {
  if (!active) return { x: 0, y: 0 };

  const safeViewportHeight = Math.max(viewportHeight, 1);
  const verticalFovRadians = verticalFovDegrees * Math.PI / 180;
  const visibleWorldHeight = 2 * cameraDistance * Math.tan(verticalFovRadians / 2);
  const worldUnitsPerPixel = visibleWorldHeight / safeViewportHeight;

  return {
    x: deltaX === 0 ? 0 : -deltaX * worldUnitsPerPixel,
    y: deltaY === 0 ? 0 : deltaY * worldUnitsPerPixel,
  };
}

export function getBoundedModelPanOffset({
  x,
  y,
  z,
  maxDistance,
}: {
  x: number;
  y: number;
  z: number;
  maxDistance: number;
}) {
  const safeMaxDistance = Math.max(maxDistance, 0);
  const distance = Math.hypot(x, y, z);
  if (distance === 0 || distance <= safeMaxDistance) return { x, y, z };
  const scale = safeMaxDistance / distance;
  return { x: x * scale, y: y * scale, z: z * scale };
}

export function getModelOrbitDelta({
  active,
  deltaX,
  deltaY,
  viewportWidth,
  viewportHeight,
}: {
  active: boolean;
  deltaX: number;
  deltaY: number;
  viewportWidth: number;
  viewportHeight: number;
}) {
  if (!active) return { azimuth: 0, polar: 0 };
  return {
    azimuth: deltaX === 0 ? 0 : -(deltaX / Math.max(viewportWidth, 1)) * Math.PI * 1.7,
    polar: deltaY === 0 ? 0 : -(deltaY / Math.max(viewportHeight, 1)) * Math.PI * 1.2,
  };
}

export function getListingFloorIdentity({
  propertyId,
  propertyType,
  transactionUnit,
  listingFloor,
  listingUnit,
}: {
  propertyId?: string | null;
  propertyType?: string | null;
  transactionUnit?: string | null;
  listingFloor?: number | null;
  listingUnit?: string | null;
}): ListingFloorIdentity | null {
  const normalizedType = typeof propertyType === "string" ? propertyType.trim().toLowerCase() : "";
  if (WHOLE_PROPERTY_TYPES.some(type => normalizedType.includes(type))) return null;

  const parseUnit = (unit: string | null | undefined) => typeof unit === "string" ? unit.match(/#\s*(\d{1,3})\s*-\s*(\d{1,4})/) : null;
  const explicitFloor = typeof listingFloor === "number" && Number.isInteger(listingFloor) && listingFloor > 0 ? listingFloor : null;
  const explicitUnitMatch = parseUnit(listingUnit);
  if (explicitFloor) {
    const unitLabel = explicitUnitMatch && Number(explicitUnitMatch[1]) === explicitFloor
      ? `#${explicitUnitMatch[1]}-${explicitUnitMatch[2]}`
      : `Level ${explicitFloor}`;
    return { floor: explicitFloor, unitLabel };
  }

  const unitMatch = explicitUnitMatch ?? parseUnit(transactionUnit);
  if (unitMatch) {
    const floor = Number(unitMatch[1]);
    return floor > 0 ? { floor, unitLabel: `#${unitMatch[1]}-${unitMatch[2]}` } : null;
  }

  const normalizedPropertyId = typeof propertyId === "string" ? propertyId.trim() : "";
  if (!normalizedPropertyId) return null;
  const idMatch = normalizedPropertyId.match(/-(\d{1,3})(?:-(\d{1,4}))?$/);
  if (!idMatch) return null;
  const floor = Number(idMatch[1]);
  if (floor <= 0) return null;
  return { floor, unitLabel: idMatch[2] ? `#${idMatch[1]}-${idMatch[2]}` : `Level ${floor}` };
}

export function getModelInteractionAfterKey(active: boolean, key: string) {
  if (key === "Enter" || key === " ") return true;
  if (key === "Escape") return false;
  return active;
}

export function getModelInteractionAfterBlur(active: boolean, focusStayedWithin: boolean) {
  return focusStayedWithin ? active : false;
}
