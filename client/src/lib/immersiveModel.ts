export type ImmersiveModelView = "tower" | "floor";

export const IMMERSIVE_MODEL_VIEW_CONFIG = {
  tower: {
    scaleY: 1,
    cameraDirection: [0.9, 0.68, 1] as const,
    framingPadding: 1.28,
  },
  floor: {
    scaleY: 0.23,
    cameraDirection: [0.82, 1.28, 1] as const,
    framingPadding: 1.38,
  },
} satisfies Record<ImmersiveModelView, {
  scaleY: number;
  cameraDirection: readonly [number, number, number];
  framingPadding: number;
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

export function getModelInteractionAfterKey(active: boolean, key: string) {
  if (key === "Enter" || key === " ") return true;
  if (key === "Escape") return false;
  return active;
}

export function getModelInteractionAfterBlur(active: boolean, focusStayedWithin: boolean) {
  return focusStayedWithin ? active : false;
}
