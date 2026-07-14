import { describe, expect, it } from "vitest";
import { getTourExteriorMask } from "../client/src/lib/tourSceneMasks";

describe("virtual tour exterior masks", () => {
  it("never places an exterior overlay over known interior-only scenes", () => {
    expect(getTourExteriorMask("/manus-storage/factory-interior_71f18145.jpg")).toBeNull();
    expect(getTourExteriorMask("/manus-storage/shophouse-office_0083057a.jpg")).toBeNull();
  });

  it("limits the office interior effect to its diagonal right-side sky opening", () => {
    const mask = getTourExteriorMask("/manus-storage/office-interior_791afa97.jpg");
    expect(mask).toMatchObject({
      clipPath: "polygon(78.1% 44.2%, 93.8% 38.2%, 93.8% 56.8%, 78.1% 55.4%)",
      maskImage:
        "linear-gradient(135deg, transparent 0%, #000 10%, #000 89%, transparent 100%)",
      opacity: 1,
      label: "diagonal-office-window-sky",
      composition: "photographic-aperture",
    });
    expect(mask?.apertureMaskImage).toContain("data:image/svg+xml");
    expect(decodeURIComponent(mask?.apertureMaskImage ?? "")).toContain("fill='transparent'");
    expect(mask?.foregroundMaskImage).toContain("data:image/svg+xml");
    const foregroundMask = decodeURIComponent(mask?.foregroundMaskImage ?? "");
    expect(foregroundMask).toContain("<rect width='1000' height='1000' fill='black'/>");
    expect(foregroundMask).toContain("fill='transparent'");
  });

  it("bounds the residential exterior treatment to the central open view", () => {
    const mask = getTourExteriorMask("/manus-storage/office-building_b7b74f98.jpg");
    expect(mask).toMatchObject({
      clipPath: "polygon(34.8% 59.8%, 65.8% 59.8%, 65.8% 71.2%, 34.8% 71.2%)",
      maskImage: "linear-gradient(to bottom, transparent 58.8%, #000 61%, #000 69.8%, transparent 72.2%)",
      opacity: 1,
      label: "central-bay-view-opening",
      composition: "photographic-aperture",
    });
    expect(mask?.apertureMaskImage).toContain("data:image/svg+xml");
    expect(decodeURIComponent(mask?.apertureMaskImage ?? "")).toContain("fill='transparent'");
    expect(mask?.foregroundMaskImage).toContain("data:image/svg+xml");
    expect(decodeURIComponent(mask?.foregroundMaskImage ?? "")).toContain("fill='transparent'");
  });

  it("allows a full-frame treatment only for an explicitly exterior scene", () => {
    expect(getTourExteriorMask("/manus-storage/warehouse-exterior_25db9dac.jpg")).toMatchObject({
      clipPath: "inset(0)",
      maskImage: "linear-gradient(#000, #000)",
      foregroundMaskImage: "linear-gradient(#000, #000)",
      opacity: 1,
      label: "exterior-scene",
      composition: "full-scene",
    });
  });
});
