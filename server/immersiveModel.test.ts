import { describe, expect, it } from "vitest";
import {
  getBoundedModelPanOffset,
  getModelInteractionAfterBlur,
  getModelInteractionAfterKey,
  getModelPanDelta,
  getNextModelZoomDistance,
  IMMERSIVE_MODEL_VIEW_CONFIG,
} from "../client/src/lib/immersiveModel";

describe("immersive model interaction", () => {
  it("keeps both model modes centered through bounds-based framing configuration", () => {
    expect(IMMERSIVE_MODEL_VIEW_CONFIG.tower.scaleY).toBe(1);
    expect(IMMERSIVE_MODEL_VIEW_CONFIG.floor.scaleY).toBeLessThan(1);
    expect(IMMERSIVE_MODEL_VIEW_CONFIG.tower.framingPadding).toBeGreaterThan(1);
    expect(IMMERSIVE_MODEL_VIEW_CONFIG.floor.framingPadding).toBeGreaterThan(1);
    expect(IMMERSIVE_MODEL_VIEW_CONFIG.tower.panLimitRatio).toBeLessThan(0.5);
    expect(IMMERSIVE_MODEL_VIEW_CONFIG.floor.panLimitRatio).toBeLessThan(0.5);
  });

  it("does not consume wheel movement before explicit model activation", () => {
    expect(getNextModelZoomDistance({
      active: false,
      currentDistance: 12,
      deltaY: -200,
      minDistance: 6,
      maxDistance: 20,
    })).toBe(12);
  });

  it("activates from Enter or Space and releases controls with Escape", () => {
    expect(getModelInteractionAfterKey(false, "Enter")).toBe(true);
    expect(getModelInteractionAfterKey(false, " ")).toBe(true);
    expect(getModelInteractionAfterKey(true, "Escape")).toBe(false);
    expect(getModelInteractionAfterKey(true, "ArrowRight")).toBe(true);
  });

  it("releases wheel capture when focus leaves the model", () => {
    expect(getModelInteractionAfterBlur(true, false)).toBe(false);
    expect(getModelInteractionAfterBlur(true, true)).toBe(true);
  });

  it("zooms only while active and clamps the model within safe framing bounds", () => {
    expect(getNextModelZoomDistance({
      active: true,
      currentDistance: 12,
      deltaY: -200,
      minDistance: 6,
      maxDistance: 20,
    })).toBeCloseTo(9.6);

    expect(getNextModelZoomDistance({
      active: true,
      currentDistance: 7,
      deltaY: -1000,
      minDistance: 6,
      maxDistance: 20,
    })).toBe(6);
  });

  it("does not pan before explicit model activation", () => {
    expect(getModelPanDelta({
      active: false,
      deltaX: 80,
      deltaY: -50,
      viewportHeight: 460,
      cameraDistance: 12,
      verticalFovDegrees: 38,
    })).toEqual({ x: 0, y: 0 });
  });

  it("returns horizontal, vertical, and diagonal screen-space pan deltas", () => {
    const horizontal = getModelPanDelta({
      active: true,
      deltaX: 40,
      deltaY: 0,
      viewportHeight: 460,
      cameraDistance: 12,
      verticalFovDegrees: 38,
    });
    expect(horizontal.x).toBeLessThan(0);
    expect(horizontal.y).toBe(0);

    const vertical = getModelPanDelta({
      active: true,
      deltaX: 0,
      deltaY: -30,
      viewportHeight: 460,
      cameraDistance: 12,
      verticalFovDegrees: 38,
    });
    expect(vertical.x).toBe(0);
    expect(vertical.y).toBeLessThan(0);

    const diagonal = getModelPanDelta({
      active: true,
      deltaX: -35,
      deltaY: 25,
      viewportHeight: 460,
      cameraDistance: 12,
      verticalFovDegrees: 38,
    });
    expect(diagonal.x).toBeGreaterThan(0);
    expect(diagonal.y).toBeGreaterThan(0);
  });

  it("clamps accumulated diagonal panning to a safe radial bound", () => {
    expect(getBoundedModelPanOffset({ x: 2, y: -1, z: 1, maxDistance: 4 })).toEqual({ x: 2, y: -1, z: 1 });

    const bounded = getBoundedModelPanOffset({ x: 9, y: 12, z: 0, maxDistance: 5 });
    expect(Math.hypot(bounded.x, bounded.y, bounded.z)).toBeCloseTo(5);
    expect(bounded.x).toBeCloseTo(3);
    expect(bounded.y).toBeCloseTo(4);
  });
});
