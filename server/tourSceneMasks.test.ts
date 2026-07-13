import { describe, expect, it } from "vitest";
import { getTourExteriorMask } from "../client/src/lib/tourSceneMasks";

describe("virtual tour exterior masks", () => {
  it("never places an exterior overlay over known interior-only scenes", () => {
    expect(getTourExteriorMask("/manus-storage/office-interior_791afa97.jpg")).toBeNull();
    expect(getTourExteriorMask("/manus-storage/factory-interior_71f18145.jpg")).toBeNull();
    expect(getTourExteriorMask("/manus-storage/shophouse-office_0083057a.jpg")).toBeNull();
  });

  it("bounds the residential exterior treatment to the central open view", () => {
    expect(getTourExteriorMask("/manus-storage/office-building_b7b74f98.jpg")).toEqual({
      clipPath: "polygon(34% 58%, 69% 58%, 69% 80%, 34% 80%)",
      label: "window-opening",
    });
  });

  it("allows a full-frame treatment only for an explicitly exterior scene", () => {
    expect(getTourExteriorMask("/manus-storage/warehouse-exterior_25db9dac.jpg")).toEqual({
      clipPath: "inset(0)",
      label: "exterior-scene",
    });
  });
});
