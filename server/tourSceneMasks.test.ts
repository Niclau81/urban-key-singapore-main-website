import { describe, expect, it } from "vitest";
import { getTourExteriorMask } from "../client/src/lib/tourSceneMasks";

describe("virtual tour exterior masks", () => {
  it("never places an exterior overlay over known interior-only scenes", () => {
    expect(getTourExteriorMask("/manus-storage/factory-interior_71f18145.jpg")).toBeNull();
    expect(getTourExteriorMask("/manus-storage/shophouse-office_0083057a.jpg")).toBeNull();
  });

  it("limits the office interior effect to its diagonal right-side sky opening", () => {
    expect(getTourExteriorMask("/manus-storage/office-interior_791afa97.jpg")).toEqual({
      clipPath: "polygon(78.1% 44.2%, 93.8% 38.2%, 93.8% 56.8%, 78.1% 55.4%)",
      maskImage:
        "linear-gradient(135deg, transparent 0%, #000 10%, #000 89%, transparent 100%)",
      opacity: 0.96,
      label: "diagonal-office-window-sky",
    });
  });

  it("bounds the residential exterior treatment to the central open view", () => {
    expect(getTourExteriorMask("/manus-storage/office-building_b7b74f98.jpg")).toEqual({
      clipPath: "polygon(34.8% 59.8%, 65.8% 59.8%, 65.8% 71.2%, 34.8% 71.2%)",
      maskImage: "linear-gradient(to bottom, transparent 58.8%, #000 61%, #000 69.8%, transparent 72.2%)",
      opacity: 0.94,
      label: "central-bay-view-opening",
    });
  });

  it("allows a full-frame treatment only for an explicitly exterior scene", () => {
    expect(getTourExteriorMask("/manus-storage/warehouse-exterior_25db9dac.jpg")).toEqual({
      clipPath: "inset(0)",
      maskImage: "linear-gradient(#000, #000)",
      opacity: 1,
      label: "exterior-scene",
    });
  });
});
