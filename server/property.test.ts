import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getAllRegionsLabel, marketConfigs, marketIds } from "@shared/marketConfig";
import { planningDemoDisclosure, properties } from "@shared/propertyData";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";

function publicContext(): TrpcContext {
  return { user: null, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("property intelligence procedures", () => {
  it("defines an explicit country, region, locale, currency, and map viewport for every selectable market", () => {
    expect(marketIds).toEqual(["singapore", "indonesia", "malaysia", "thailand", "vietnam", "philippines", "australia", "united-kingdom", "united-states", "united-arab-emirates", "global"]);
    for (const marketId of marketIds) {
      const market = marketConfigs[marketId];
      expect(market).toMatchObject({ id: marketId, countryName: expect.any(String), countryCode: expect.any(String), locale: expect.any(String), currency: expect.any(String) });
      expect(market.map.center.lat).toBeGreaterThanOrEqual(-90);
      expect(market.map.center.lat).toBeLessThanOrEqual(90);
      expect(market.map.center.lng).toBeGreaterThanOrEqual(-180);
      expect(market.map.center.lng).toBeLessThanOrEqual(180);
      expect(market.map.zoom).toBeGreaterThan(0);
      expect(getAllRegionsLabel(market)).toMatch(/^All /);
    }
  });

  it("scopes public discovery results to the requested country market", async () => {
    const caller = appRouter.createCaller(publicContext());
    const singapore = await caller.property.list({ marketId: "singapore" });
    const australia = await caller.property.list({ marketId: "australia" });

    expect(singapore.length).toBeGreaterThan(0);
    expect(singapore.every(property => property.marketId === "singapore")).toBe(true);
    expect(australia.every(property => property.marketId === "australia")).toBe(true);
  });

  it("provides selected South-East Asian markets with explicitly illustrative planning inventory", async () => {
    const caller = appRouter.createCaller(publicContext());
    const southeastAsiaMarkets = ["indonesia", "malaysia", "thailand", "vietnam", "philippines"] as const;

    for (const marketId of southeastAsiaMarkets) {
      const result = await caller.property.list({ marketId });
      expect(result).toHaveLength(2);
      expect(result.every(property => property.marketId === marketId && property.isPlanningDemo)).toBe(true);
      expect(result.every(property => property.tags.includes("Not live inventory"))).toBe(true);
    }

    const demos = properties.filter(property => property.isPlanningDemo);
    expect(demos).toHaveLength(10);
    expect(planningDemoDisclosure).toContain("not live");
  });

  it("returns filtered Singapore listings", async () => {
    const caller = appRouter.createCaller(publicContext());
    const result = await caller.property.list({ district: "D01 · Marina Bay", propertyType: "Condominium", maxMrtMinutes: 5 });
    expect(result).toHaveLength(1);
    expect(result[0]?.title).toBe("Marina Cove Residence");
  });

  it("applies size, tenure, and MRT walk-time filters together", async () => {
    const caller = appRouter.createCaller(publicContext());
    const result = await caller.property.list({ propertyType: "Apartment", minSize: 2000, maxMrtMinutes: 3, tenure: "Freehold" });
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: "orchard-boulevard-19-02", tenure: "Freehold" });
  });

  it("never exposes a full owner identity", async () => {
    const caller = appRouter.createCaller(publicContext());
    const result = await caller.property.detail({ id: "marina-cove-28-08" });
    expect(Object.keys(result.property.owner).sort()).toEqual(["initials", "ownershipYears", "propertyCount"].sort());
    expect(result.disclaimer).toContain("independently verify");
  });

  it("keeps owner contact and identity fields out of serialized responses", async () => {
    const caller = appRouter.createCaller(publicContext());
    const result = await caller.property.detail({ id: "interlace-garden-06-12" });
    const serialized = JSON.stringify(result.property.owner).toLowerCase();
    expect(serialized).not.toContain("email");
    expect(serialized).not.toContain("phone");
    expect(serialized).not.toContain("name");
    expect(result.property.owner.initials).toMatch(/^[A-Z]\.[A-Z]\.$/);
  });

  it("protects user-managed property listing procedures", async () => {
    const caller = appRouter.createCaller(publicContext());
    await expect(caller.listing.listMine()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("includes every requested commercial and industrial property category", async () => {
    const caller = appRouter.createCaller(publicContext());
    const result = await caller.property.list();
    const commercialTypes = new Set(result.filter(property => property.isCommercial).map(property => property.type));
    expect(commercialTypes).toEqual(new Set(["Office", "Shophouse", "Warehouse", "Office Building", "Factory Building"]));
  });

  it.each(["Buy", "Sell", "Rent", "Rent-Out"] as const)("filters %s listings as an exact transaction mode", async mode => {
    const caller = appRouter.createCaller(publicContext());
    const result = await caller.property.list({ mode });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every(property => property.mode === mode)).toBe(true);
    expect(result.some(property => property.isCommercial)).toBe(true);
  });

  it("filters industrial assets by category and operational capability", async () => {
    const caller = appRouter.createCaller(publicContext());
    const result = await caller.property.list({ propertyType: "Warehouse", minFloorLoading: 20, minCeilingHeight: 10 });
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: "changi-airfreight-warehouse", floorLoading: 20, ceilingHeight: 10.5 });
  });

  it("includes illustrative new and established HDB demonstrations across Singapore regions with floor-plan references", async () => {
    const caller = appRouter.createCaller(publicContext());
    const hdbListings = await caller.property.list({ propertyType: "HDB Flat" });
    const districts = new Set(hdbListings.map(property => property.district));
    const detail = await caller.property.detail({ id: "queenstown-skyline-demo" });

    expect(hdbListings).toHaveLength(10);
    expect([...districts]).toEqual(expect.arrayContaining(["D03 · Queenstown", "D18 · Tampines", "D22 · Jurong", "D25 · Woodlands"]));
    expect(hdbListings.some(property => property.tags.includes("Recent flat"))).toBe(true);
    expect(hdbListings.some(property => property.tags.includes("Established resale"))).toBe(true);
    expect(detail.property.floorPlan).toMatchObject({ label: expect.stringContaining("illustrative HDB layout") });
    expect(detail.property).toMatchObject({ listingFloor: 12, listingUnit: "#12-128" });
    expect(detail.property.transactions[0]).toMatchObject({ property: detail.property.title, unit: "#12-128" });
    expect(hdbListings.every(property => Number.isInteger(property.listingFloor) && (property.listingFloor ?? 0) > 0 && /^#\d{2}-\d{3,4}$/.test(property.listingUnit ?? ""))).toBe(true);
  });

  it("makes guided Virtual Property Tours optional, explicitly privacy-reviewed, and available on selected Singapore listings", () => {
    const tourListings = properties.filter(property => property.marketId === "singapore" && property.virtualTour);
    expect(tourListings.map(property => property.id)).toEqual(expect.arrayContaining(["marina-cove-28-08", "interlace-garden-06-12", "queenstown-skyline-demo"]));
    expect(tourListings).toHaveLength(3);

    for (const property of tourListings) {
      const tour = property.virtualTour!;
      expect(tour.rooms.length).toBeGreaterThanOrEqual(3);
      expect(tour.rooms.every(room => room.imageIndex >= 0 && room.imageIndex < property.gallery.length)).toBe(true);
      expect(tour.aiGuide).toMatchObject({ enabled: true, intro: expect.any(String) });
      expect(tour.aiGuide.intro.length).toBeGreaterThan(80);
      expect(tour.privacyReview).toMatchObject({ automatedRedactionRequired: true, manualReviewRequired: true, status: "demo-review-required" });
      expect(tour.privacyReview.protectedTargets).toEqual(expect.arrayContaining(["Faces", "Family photos", "Letters and cards", "Name cards", "Access codes"]));
      expect(tour.analytics).toEqual({ scope: "on-device", events: ["tour_opened", "room_visited", "appointment_intent"] });
    }
    expect(properties.filter(property => property.marketId === "singapore" && !property.virtualTour).length).toBeGreaterThan(0);
  });

  it("keeps the tour badge, guided room navigation, privacy review, and photo-timing controls connected in the user interface", () => {
    const cardSource = readFileSync(resolve(process.cwd(), "client/src/components/PropertyCard.tsx"), "utf8");
    const detailSource = readFileSync(resolve(process.cwd(), "client/src/pages/PropertyDetail.tsx"), "utf8");
    const guidedSource = readFileSync(resolve(process.cwd(), "client/src/components/VirtualPropertyTour.tsx"), "utf8");
    const timedSource = readFileSync(resolve(process.cwd(), "client/src/components/VirtualTour.tsx"), "utf8");

    expect(cardSource).toContain("data-virtual-tour-badge");
    expect(detailSource).toContain("<VirtualPropertyTour");
    expect(detailSource).toContain("#virtual-property-tour");
    expect(guidedSource).toContain("recordLocalTourEvent");
    expect(guidedSource).toContain("Privacy review required.");
    expect(guidedSource).toContain("privacyReview.protectedTargets");
    expect(guidedSource).toContain("onImageIndexChange");
    expect(guidedSource).toContain("speechSynthesis.speak");
    expect(guidedSource).toContain('data-tour-guide-scope="approved-metadata"');
    expect(timedSource).toContain("data-tour-photo-timing");
    expect(timedSource).toContain("photo-timing-select");
  });

  it("matches commercial usage text without including residential listings", async () => {
    const caller = appRouter.createCaller(publicContext());
    const result = await caller.property.list({ commercialUsage: "Factory" });
    expect(result).toHaveLength(2);
    expect(result.every(property => property.type === "Factory Building")).toBe(true);
  });
});
