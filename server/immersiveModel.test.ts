import { describe, expect, it } from "vitest";
import {
  getModelInteractionAfterBlur,
  getModelInteractionAfterKey,
  getNextModelZoomDistance,
  IMMERSIVE_MODEL_VIEW_CONFIG,
} from "../client/src/lib/immersiveModel";

describe("immersive model interaction", () => {
  it("keeps both model modes centered through bounds-based framing configuration", () => {
    expect(IMMERSIVE_MODEL_VIEW_CONFIG.tower.scaleY).toBe(1);
    expect(IMMERSIVE_MODEL_VIEW_CONFIG.floor.scaleY).toBeLessThan(1);
    expect(IMMERSIVE_MODEL_VIEW_CONFIG.tower.framingPadding).toBeGreaterThan(1);
    expect(IMMERSIVE_MODEL_VIEW_CONFIG.floor.framingPadding).toBeGreaterThan(1);
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
});
