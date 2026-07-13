import { describe, expect, it } from "vitest";
import { TOUR_PERIOD_IDS, TOUR_PERIODS, getTourPeriod } from "./tourPeriods";

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

  it("provides a complete and distinct visual treatment for every period", () => {
    expect(new Set(TOUR_PERIODS.map(period => period.filter)).size).toBe(6);
    expect(new Set(TOUR_PERIODS.map(period => period.overlay)).size).toBe(6);
    for (const period of TOUR_PERIODS) {
      expect(period.label.length).toBeGreaterThan(0);
      expect(period.timeRange.length).toBeGreaterThan(0);
      expect(period.description.length).toBeGreaterThan(0);
      expect(period.accent).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("resolves each selectable period deterministically", () => {
    for (const id of TOUR_PERIOD_IDS) {
      expect(getTourPeriod(id).id).toBe(id);
    }
  });
});
