import { describe, expect, it } from "vitest";
import {
  getBoundedModelPanOffset,
  getListingFloorIdentity,
  getModelInteractionAfterBlur,
  getModelInteractionAfterKey,
  getModelOrbitDelta,
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
    expect(getNextModelZoomDistance({ active: false, currentDistance: 12, deltaY: -200, minDistance: 6, maxDistance: 20 })).toBe(12);
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
    expect(getNextModelZoomDistance({ active: true, currentDistance: 12, deltaY: -200, minDistance: 6, maxDistance: 20 })).toBeCloseTo(9.6);
    expect(getNextModelZoomDistance({ active: true, currentDistance: 7, deltaY: -1000, minDistance: 6, maxDistance: 20 })).toBe(6);
  });

  it("does not pan before explicit model activation", () => {
    expect(getModelPanDelta({ active: false, deltaX: 80, deltaY: -50, viewportHeight: 460, cameraDistance: 12, verticalFovDegrees: 38 })).toEqual({ x: 0, y: 0 });
  });

  it("orbits around both horizontal and vertical axes only after activation", () => {
    expect(getModelOrbitDelta({ active: false, deltaX: 80, deltaY: -50, viewportWidth: 900, viewportHeight: 460 })).toEqual({ azimuth: 0, polar: 0 });

    const horizontal = getModelOrbitDelta({ active: true, deltaX: 80, deltaY: 0, viewportWidth: 900, viewportHeight: 460 });
    expect(horizontal.azimuth).toBeLessThan(0);
    expect(horizontal.polar).toBe(0);

    const diagonal = getModelOrbitDelta({ active: true, deltaX: -80, deltaY: 50, viewportWidth: 900, viewportHeight: 460 });
    expect(diagonal.azimuth).toBeGreaterThan(0);
    expect(diagonal.polar).toBeLessThan(0);
  });

  it("derives listed-unit floors while excluding sole landed and whole-property listings", () => {
    expect(getListingFloorIdentity({ propertyId: "interlace-garden-06-12", propertyType: "Condominium", transactionUnit: "#06-12" })).toEqual({ floor: 6, unitLabel: "#06-12" });
    expect(getListingFloorIdentity({ propertyId: "orchard-boulevard-19-02", propertyType: "Apartment" })).toEqual({ floor: 19, unitLabel: "#19-02" });
    expect(getListingFloorIdentity({ propertyId: "tanjong-katong-shophouse", propertyType: "Conservation Shophouse", transactionUnit: "#02-01" })).toBeNull();
    expect(getListingFloorIdentity({ propertyId: "sentosa-bungalow", propertyType: "Detached Landed", transactionUnit: "#01-01" })).toBeNull();
  });

  it("prioritizes an advertised listing floor over comparable transaction metadata", () => {
    expect(getListingFloorIdentity({
      propertyId: "queenstown-skyline-demo",
      propertyType: "HDB Flat",
      transactionUnit: "Illustrative unit",
      listingFloor: 12,
      listingUnit: "#12-128",
    })).toEqual({ floor: 12, unitLabel: "#12-128" });

    expect(getListingFloorIdentity({
      propertyId: "new-listing-without-floor-in-id",
      propertyType: "Condominium",
      transactionUnit: "#06-02",
      listingFloor: 18,
      listingUnit: "#17-08",
    })).toEqual({ floor: 18, unitLabel: "Level 18" });
  });

  it("handles incomplete listing metadata without throwing during BuildingViewer render", () => {
    expect(getListingFloorIdentity({ propertyId: "interlace-garden-06-12", propertyType: undefined })).toEqual({ floor: 6, unitLabel: "#06-12" });
    expect(getListingFloorIdentity({ propertyId: "orchard-boulevard-19-02", propertyType: null, transactionUnit: undefined })).toEqual({ floor: 19, unitLabel: "#19-02" });
    expect(getListingFloorIdentity({ propertyId: undefined, propertyType: undefined, transactionUnit: undefined })).toBeNull();
    expect(getListingFloorIdentity({ propertyId: null, propertyType: null, transactionUnit: null })).toBeNull();
    expect(getListingFloorIdentity({ propertyId: "interlace-garden-home", propertyType: "Condominium", transactionUnit: "garden-facing" })).toBeNull();
  });

  it("returns horizontal, vertical, and diagonal screen-space pan deltas", () => {
    const horizontal = getModelPanDelta({ active: true, deltaX: 40, deltaY: 0, viewportHeight: 460, cameraDistance: 12, verticalFovDegrees: 38 });
    expect(horizontal.x).toBeLessThan(0);
    expect(horizontal.y).toBe(0);

    const vertical = getModelPanDelta({ active: true, deltaX: 0, deltaY: -30, viewportHeight: 460, cameraDistance: 12, verticalFovDegrees: 38 });
    expect(vertical.x).toBe(0);
    expect(vertical.y).toBeLessThan(0);

    const diagonal = getModelPanDelta({ active: true, deltaX: -35, deltaY: 25, viewportHeight: 460, cameraDistance: 12, verticalFovDegrees: 38 });
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
