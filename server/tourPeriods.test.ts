import { describe, expect, it } from "vitest";
import { TOUR_PERIOD_IDS, TOUR_PERIODS, getTourPeriod } from "../client/src/lib/tourPeriods";

describe("virtual tour time periods", () => {
  it("provides the six requested periods in chronological order", () => {
    expect(TOUR_PERIOD_IDS).toEqual([
      "morning",
      "noon",
      "afternoon",
      "evening",
      "night",
      "midnight",
    ]);
    expect(TOUR_PERIODS.map(period => period.id)).toEqual(TOUR_PERIOD_IDS);
  });

  it("provides distinct exterior and interior treatments for every period", () => {
    expect(new Set(TOUR_PERIODS.map(period => period.sceneFilter)).size).toBe(6);
    expect(new Set(TOUR_PERIODS.map(period => period.exteriorView)).size).toBe(6);
    expect(new Set(TOUR_PERIODS.map(period => period.interiorLight)).size).toBe(6);

    for (const period of TOUR_PERIODS) {
      expect(period.label.length).toBeGreaterThan(0);
      expect(period.timeRange.length).toBeGreaterThan(0);
      expect(period.description.length).toBeGreaterThan(0);
      expect(period.accent).toMatch(/^#[0-9a-f]{6}$/i);
      expect(period.exteriorView).toContain("linear-gradient");
      expect(["color", "normal"]).toContain(period.exteriorBlendMode);
      expect(period.interiorLight).toContain("radial-gradient");
    }
  });

  it("replaces bright window luminance after sunset without darkening the complete room", () => {
    for (const id of ["evening", "night", "midnight"] as const) {
      expect(getTourPeriod(id).exteriorBlendMode).toBe("normal");
    }

    for (const id of ["morning", "noon", "afternoon"] as const) {
      expect(getTourPeriod(id).exteriorBlendMode).toBe("color");
    }
  });

  it("keeps interiors readable during evening, night, and midnight", () => {
    for (const id of ["evening", "night", "midnight"] as const) {
      const period = getTourPeriod(id);
      const brightness = Number(period.sceneFilter.match(/brightness\(([^)]+)\)/)?.[1]);
      expect(brightness).toBeGreaterThanOrEqual(0.95);
    }
  });

  it("resolves each selectable period deterministically", () => {
    for (const id of TOUR_PERIOD_IDS) {
      expect(getTourPeriod(id).id).toBe(id);
    }
  });
});
