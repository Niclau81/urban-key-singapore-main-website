export type ImmersiveModelView = "tower" | "floor";

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

export function getModelInteractionAfterKey(active: boolean, key: string) {
  if (key === "Enter" || key === " ") return true;
  if (key === "Escape") return false;
  return active;
}

export function getModelInteractionAfterBlur(active: boolean, focusStayedWithin: boolean) {
  return focusStayedWithin ? active : false;
}
