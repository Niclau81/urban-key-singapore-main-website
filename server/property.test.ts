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
      expect(["guided-photo", "illustrative-panorama"]).toContain(tour.captureMode);
      expect(tour.panoramaUrl).toBeUndefined();
      expect(tour.floors.length).toBeGreaterThanOrEqual(1);
      expect(tour.rooms.every(room => room.imageIndex >= 0 && room.imageIndex < property.gallery.length && room.viewerPosition.x > 0 && room.viewerPosition.x < 100 && room.viewerPosition.y > 0 && room.viewerPosition.y < 100)).toBe(true);
      expect(tour.aiGuide).toMatchObject({ enabled: true, intro: expect.any(String) });
      expect(tour.aiGuide.intro.length).toBeGreaterThan(80);
      expect(tour.privacyReview).toMatchObject({ automatedRedactionRequired: true, manualReviewRequired: true, status: "demo-review-required" });
      expect(tour.privacyReview.protectedTargets).toEqual(expect.arrayContaining(["Faces", "Family photos", "Letters and cards", "Name cards", "Access codes"]));
      expect(tour.analytics).toEqual({ scope: "on-device", events: ["tour_opened", "room_visited", "appointment_intent"] });
    }
    const generatedDemo = tourListings.find(property => property.id === "queenstown-skyline-demo")!;
    expect(generatedDemo.gallery).toEqual([
      "/manus-storage/queenstown-demo-arrival_14745fbb.jpg",
      "/manus-storage/queenstown-demo-living_2085c0f5.jpg",
      "/manus-storage/queenstown-demo-window_ce0aa380.jpg",
    ]);
    expect(generatedDemo.virtualTour).toMatchObject({ captureMode: "illustrative-panorama" });
    expect(Object.values(generatedDemo.virtualTour!.panoramaPreviewUrls ?? {})).toHaveLength(6);
    expect(Object.values(generatedDemo.virtualTour!.panoramaPreviewUrls ?? {}).every(url => url.includes("/manus-storage/queenstown-") )).toBe(true);
    const timedRooms = generatedDemo.virtualTour!.rooms.filter(room => room.id === "living" || room.id === "kitchen");
    expect(timedRooms).toHaveLength(2);
    for (const room of timedRooms) {
      expect(room.timedPhotos?.map(photo => photo.id)).toEqual(["morning", "noon", "night"]);
      expect(room.timedPhotos?.every(photo => photo.src.includes("/manus-storage/queenstown-"))).toBe(true);
    }
    expect(generatedDemo.virtualTour!.floors[0]?.roomIds).toEqual(["living", "kitchen", "utility", "primary", "room2", "room3"]);
    expect(generatedDemo.virtualTour!.rooms.map(room => room.label)).toEqual(["Living / dining", "Kitchen", "Utility / bath", "Primary room", "Room 2", "Room 3"]);
    expect(generatedDemo.virtualTour!.rooms.every(room => room.floorPlanBounds && room.floorPlanBounds.width > 0 && room.floorPlanBounds.height > 0)).toBe(true);
    const marinaTour = tourListings.find(property => property.id === "marina-cove-28-08")!;
    expect(marinaTour.virtualTour).toMatchObject({ captureMode: "illustrative-panorama" });
    expect(marinaTour.gallery).toHaveLength(3);
    expect(marinaTour.gallery.every(url => url.includes("/manus-storage/marina-cove-demo-"))).toBe(true);
    expect(marinaTour.virtualTour!.floors[0]?.roomIds).toEqual(["living", "kitchen", "utility", "primary", "room2", "room3"]);
    expect(marinaTour.virtualTour!.rooms.map(room => room.label)).toEqual(["Living / dining", "Kitchen", "Utility / bath", "Primary room", "Room 2", "Room 3"]);
    expect(Object.values(marinaTour.virtualTour!.panoramaPreviewUrls ?? {})).toHaveLength(6);
    expect(marinaTour.virtualTour!.rooms.every(room => room.floorPlanBounds && room.floorPlanBounds.width > 0 && room.floorPlanBounds.height > 0)).toBe(true);
    const marinaLiving = marinaTour.virtualTour!.rooms.find(room => room.id === "living");
    expect(marinaTour.virtualTour!.rooms.every(room => room.timedPhotos?.map(photo => photo.id).join(",") === "morning,noon,night")).toBe(true);
    expect(marinaTour.virtualTour!.rooms.every(room => Object.keys(room.panoramaPreviewByTiming ?? {}).join(",") === "morning,noon,night")).toBe(true);
    expect(marinaTour.virtualTour!.rooms.filter(room => room.id !== "living").every(room => room.panoramaPreviewByTiming?.night.includes("-night-panorama_"))).toBe(true);
    const utility = marinaTour.virtualTour!.rooms.find(room => room.id === "utility");
    expect(new Set(Object.values(utility?.panoramaPreviewByTiming ?? {})).size).toBe(3);
    expect(marinaTour.virtualTour!.rooms.every(room => new Set(Object.values(room.panoramaPreviewByTiming ?? {})).size === 3)).toBe(true);
    expect(marinaLiving?.timedPhotos?.map(photo => photo.id)).toEqual(["morning", "noon", "night"]);
    expect(Object.keys(marinaLiving?.panoramaPreviewByTiming ?? {})).toEqual(["morning", "noon", "night"]);
    expect(marinaLiving?.connections).toEqual(expect.arrayContaining([{ roomId: "kitchen", direction: "right" }, { roomId: "primary", direction: "down" }]));
    expect(marinaTour.virtualTour!.rooms.find(room => room.id === "room2")?.connections).toEqual(expect.arrayContaining([{ roomId: "room3", direction: "right" }]));
    expect(marinaTour.virtualTour!.disclosure).toContain("not a real property tour");

    const interlaceTour = tourListings.find(property => property.id === "interlace-garden-06-12")!;
    expect(interlaceTour.virtualTour).toMatchObject({ captureMode: "illustrative-panorama" });
    expect(interlaceTour.gallery).toHaveLength(3);
    expect(interlaceTour.gallery.every(url => url.includes("/manus-storage/interlace-demo-"))).toBe(true);
    expect(Object.values(interlaceTour.virtualTour!.panoramaPreviewUrls ?? {})).toHaveLength(3);
    expect(Object.values(interlaceTour.virtualTour!.panoramaPreviewUrls ?? {}).every(url => url.includes("/manus-storage/interlace-demo-"))).toBe(true);
    expect(interlaceTour.virtualTour!.disclosure).toContain("not a real property tour");
    expect(properties.filter(property => property.marketId === "singapore" && !property.virtualTour).length).toBeGreaterThan(0);
  });

  it("keeps the tour badge, guided room navigation, privacy review, and photo-timing controls connected in the user interface", () => {
    const cardSource = readFileSync(resolve(process.cwd(), "client/src/components/PropertyCard.tsx"), "utf8");
    const detailSource = readFileSync(resolve(process.cwd(), "client/src/pages/PropertyDetail.tsx"), "utf8");
    const guidedSource = readFileSync(resolve(process.cwd(), "client/src/components/VirtualPropertyTour.tsx"), "utf8");
    const panoramaSource = readFileSync(resolve(process.cwd(), "client/src/components/EquirectangularPanorama.tsx"), "utf8");
    const timedSource = readFileSync(resolve(process.cwd(), "client/src/components/VirtualTour.tsx"), "utf8");

    expect(cardSource).toContain("data-virtual-tour-badge");
    expect(detailSource).toContain("<VirtualPropertyTour");
    expect(detailSource).toContain("#virtual-property-tour");
    expect(guidedSource).toContain("recordLocalTourEvent");
    expect(guidedSource).toContain('data-virtual-property-tour="immersive-viewer"');
    expect(guidedSource).toContain("guided-photo-fallback");
    expect(guidedSource).toContain("isIllustrativePanoramaPreview");
    expect(guidedSource).toContain("Illustrative 360° preview");
    expect(guidedSource).toContain("not a captured 360° property tour");
    expect(guidedSource).toContain("requestFullscreen");
    expect(guidedSource).toContain("data-tour-zoom");
    expect(guidedSource).toContain("Zoom in guided photo");
    expect(guidedSource).toContain("motion-reduce:transition-none");
    expect(guidedSource).toContain("ArrowLeft");
    expect(guidedSource).toContain("floorPlanPosition");
    expect(guidedSource).toContain("viewerPosition");
    expect(guidedSource).toContain("speechSynthesis.speak");
    expect(guidedSource).toContain('data-tour-guide-scope="approved-metadata"');
    expect(timedSource).toContain("data-tour-photo-timing");
    expect(guidedSource).toContain("activeRoom?.timedPhotos");
    expect(guidedSource).toContain("timingByRoom");
    expect(guidedSource).toContain("guidedPhotoRoomIds");
    expect(guidedSource).toContain("selectTiming");
    expect(guidedSource).toContain("panoramaPreviewByTiming");
    expect(guidedSource).toContain("connectedRooms");
    expect(guidedSource).toContain("Move ${room.direction}");
    expect(guidedSource).toContain("showPanoramaPreview");
    expect(guidedSource).toContain("top-photo-timing-choices");
    expect(guidedSource).toContain("Illustrative daylight and exterior outlook treatment.");
    expect(guidedSource).toContain("floorPlanBounds");
    expect(guidedSource).toContain("!isVerified360 && timingPhotos.length > 1");
    expect(guidedSource).toContain("<EquirectangularPanorama");
    expect(guidedSource).toContain("interactivePanoramaUrl");
    expect(guidedSource).toContain("Illustrative 360° preview");
    expect(panoramaSource).toContain("SphereGeometry");
    expect(panoramaSource).toContain("geometry.scale(-1, 1, 1)");
    expect(panoramaSource).toContain("TextureLoader");
    expect(panoramaSource).toContain("pointermove");
    expect(panoramaSource).toContain("data-panorama-room-arrow");
    expect(panoramaSource).toContain("onPointerDown={event => event.stopPropagation()}");
    expect(panoramaSource).toContain("event.preventDefault(); event.stopPropagation(); onSelectHotspot(hotspot.id);");
    expect(panoramaSource).toContain("ArrowLeft");
    expect(panoramaSource).toContain("vector.project(activeCamera)");
    expect(panoramaSource).toContain("Panorama rendering is unavailable");
    expect(panoramaSource).toContain("data-panorama-time={timeOfDay}");
  });

  it("matches commercial usage text without including residential listings", async () => {
    const caller = appRouter.createCaller(publicContext());
    const result = await caller.property.list({ commercialUsage: "Factory" });
    expect(result).toHaveLength(2);
    expect(result.every(property => property.type === "Factory Building")).toBe(true);
  });
});
