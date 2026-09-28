import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "fs";
import { commercialPropertyTypes, properties } from "./data";
import { filterCatalog, mergeCatalog } from "./services/catalog";
import { externalConfig, hasGoogleMaps3DConfig } from "./services/config";
import { locales, marketConfigs, translate } from "./services/market";
import { getPortableTour } from "./tours";
import { getListingFloorIdentity } from "./components/BuildingViewer";

describe("independent public-site parity contracts", () => {
  it("ships the complete labelled Singapore catalog with deployable local media", () => {
    expect(properties.filter(property => property.marketId === "singapore")).toHaveLength(23);
    expect(properties.some(property => property.marketId !== "singapore" && property.planningDemo)).toBe(true);
    expect(properties.some(property => property.category === "Commercial")).toBe(true);
    expect(properties.some(property => property.virtualTourAvailable)).toBe(true);
    for (const property of properties) {
      expect(property.image).toMatch(/^\/assets\/.+\.(jpg|jpeg|png|webp)$/i);
      expect(existsSync(new URL(`../public${property.image}`, import.meta.url))).toBe(true);
      expect(property.gallery.length).toBeGreaterThan(0);
      expect(property.latitude).toBeGreaterThanOrEqual(-90);
      expect(property.longitude).toBeLessThanOrEqual(180);
    }
  });

  it("keeps route-backed filters for mode, district, type, tenure, size, MRT, and commercial controls", () => {
    expect(filterCatalog(properties, { marketId: "singapore", mode: "Rent" }).every(property => property.mode === "Rent")).toBe(true);
    expect(filterCatalog(properties, { marketId: "singapore", district: "D18 · Tampines" }).map(property => property.id)).toContain("tampines-verge-demo");
    expect(filterCatalog(properties, { marketId: "singapore", propertyType: "Warehouse", minFloorLoading: 10, minCeilingHeight: 10 }).every(property => property.type === "Warehouse" && (property.floorLoading ?? 0) >= 10 && (property.ceilingHeight ?? 0) >= 10)).toBe(true);
    expect(filterCatalog(properties, { marketId: "singapore", search: "Marina", maxMrtMinutes: 5 }).map(property => property.id)).toContain("marina-cove-28-08");
    expect(commercialPropertyTypes).toContain("Office");
  });

  it("merges independently published rows onto—not instead of—the full portable catalog", () => {
    const first = properties[0];
    const merged = mergeCatalog([{ id: first.id, title: "Verified replacement", district: first.district, address: first.address, category: "Residential", property_type: first.type, price_label: "S$4.28m", bedrooms: first.beds, bathrooms: first.baths, size_label: `${first.size} sq ft`, mrt_name: first.mrt, mrt_minutes: first.minutes, tags: [], image_tone: "city", image_url: first.image, description: "Verified override", is_published: true, price: first.price, size: first.size }]);
    expect(merged).toHaveLength(properties.length);
    expect(merged.find(property => property.id === first.id)?.title).toBe("Verified replacement");
  });

  it("uses the Manus-aligned full-height skyline hero rather than an isolated image card or legacy circular orb", () => {
    const appSource = readFileSync(new URL("./main.tsx", import.meta.url), "utf8");
    expect(appSource).toContain('className="hero-skyline"');
    expect(appSource).toContain('Find the address<br /><em>fits your life.</em>');
    expect(appSource).toContain('className="hero-market-label"');
    expect(appSource).not.toContain('className="hero-media city-photo"');
    expect(appSource).not.toContain('className="city-orb city-photo"');
  });

  it("handles invalid direct detail routes with a not-found state rather than a substituted listing", () => {
    const appSource = readFileSync(new URL("./main.tsx", import.meta.url), "utf8");
    expect(appSource).toContain("Property not found.");
    expect(appSource).not.toContain("?? properties[0]");
  });

  it("registers independent public and protected routes without payment, coworking, or 3D floor-plan routes", () => {
    const appSource = readFileSync(new URL("./main.tsx", import.meta.url), "utf8");
    for (const route of ["/explore", "/property/", "/map", "/assistants", "/property-agent", "/agent/signup", "/agent/portal", "/agent/tours", "/dashboard"]) expect(appSource).toContain(route);
    expect(appSource).not.toContain('path === "/checkout"');
    expect(appSource).not.toContain('path === "/payment-history"');
    expect(appSource).not.toContain('path === "/coworking"');
    expect(appSource).not.toContain('path === "/floor-plan"');
  });

  it("keeps packaged catalog saves and enquiries independent from UUID-backed published records", () => {
    const schema = readFileSync(new URL("../supabase/schema.sql", import.meta.url), "utf8");
    const workflowSource = readFileSync(new URL("./services/supabase.ts", import.meta.url), "utf8");
    expect(schema).toContain("create table if not exists public.catalog_favourites");
    expect(schema).toContain("catalog_listing_id text");
    expect(schema).toContain('create policy "catalog favourite owner access"');
    expect(workflowSource).toContain('from("catalog_favourites")');
    expect(workflowSource).toContain("catalog_listing_id: catalogListingId");
  });

  it("keeps selectable South-East Asian market and language configuration in the portable build", () => {
    expect(Object.keys(marketConfigs)).toEqual(expect.arrayContaining(["singapore", "indonesia", "malaysia", "thailand", "vietnam", "philippines"]));
    expect(locales.map(locale => locale.id)).toEqual(expect.arrayContaining(["en", "id", "ms", "th", "vi", "zh-Hans"]));
    expect(translate("th", "market")).toBe("ตลาด");
    const appSource = readFileSync(new URL("./main.tsx", import.meta.url), "utf8");
    expect(appSource).toContain("Choose active property market");
    expect(appSource).toContain("Choose display language");
  });

  it("packages the reusable virtual-tour viewer and its illustrative media without managed-runtime URLs", () => {
    const marina = properties.find(property => property.id === "marina-cove-28-08");
    const queenstown = properties.find(property => property.id === "queenstown-skyline-demo");
    expect(marina).toBeDefined();
    expect(queenstown).toBeDefined();
    const marinaTour = getPortableTour(marina!);
    expect(marinaTour?.rooms).toHaveLength(6);
    expect(marinaTour?.rooms[0].media.night).toMatch(/^\/assets\/tours\/.+\.webp$/);
    expect(queenstown && getPortableTour(queenstown)?.rooms).toHaveLength(6);
    for (const room of marinaTour?.rooms ?? []) {
      for (const source of Object.values(room.media)) expect(existsSync(new URL(`../public${source}`, import.meta.url))).toBe(true);
    }
    const component = readFileSync(new URL("./components/VirtualTour.tsx", import.meta.url), "utf8");
    const panorama = readFileSync(new URL("./components/EquirectangularPanorama.tsx", import.meta.url), "utf8");
    expect(component).toContain("photo timing");
    expect(component).toContain("EquirectangularPanorama");
    expect(component).toContain('data-tour-renderer="equirectangular-panorama"');
    expect(component).toContain("panoramaNodePosition");
    expect(component).toContain("Request a viewing");
    expect(component).not.toContain("manus-storage");
    expect(panorama).toContain('import * as THREE from "three"');
    expect(panorama).toContain("new THREE.WebGLRenderer");
    expect(panorama).toContain("data-equirectangular-panorama");
    expect(panorama).toContain("Drag, swipe, or use arrow keys to look around");
    expect(panorama).toContain("Panorama rendering is unavailable in this browser");
  });

  it("keeps each Marina Cove timing on the matching room composition and only shows controls for published timings", () => {
    const marina = properties.find(property => property.id === "marina-cove-28-08");
    const interlace = properties.find(property => property.id === "interlace-garden-06-12");
    const marinaTour = getPortableTour(marina!);
    const interlaceTour = getPortableTour(interlace!);
    expect(marinaTour?.rooms).toHaveLength(6);
    for (const room of marinaTour?.rooms ?? []) {
      expect(room.media.morning).toMatch(new RegExp(`/marina-${room.id}-morning\\.webp$`));
      expect(room.media.noon).toMatch(new RegExp(`/marina-${room.id}-noon\\.webp$`));
      expect(room.media.night).toMatch(new RegExp(`/marina-${room.id}-night\\.webp$`));
      expect(new Set(Object.values(room.media)).size).toBe(3);
    }
    expect(interlaceTour?.rooms.every(room => Object.keys(room.media).length === 1)).toBe(true);
    const component = readFileSync(new URL("./components/VirtualTour.tsx", import.meta.url), "utf8");
    expect(component).toContain("const showTimingChooser = availableTimings.length > 1");
    expect(component).toContain("As photographed");
  });

  it("restores the independent 3D building and floor-plate viewer with listing-level highlighting", () => {
    const marina = properties.find(property => property.id === "marina-cove-28-08");
    const queenstown = properties.find(property => property.id === "queenstown-skyline-demo");
    expect(getListingFloorIdentity(marina!)).toEqual({ floor: 28, unitLabel: "#28-08" });
    expect(getListingFloorIdentity(queenstown!)).toEqual({ floor: 12, unitLabel: "#12-128" });
    const viewer = readFileSync(new URL("./components/BuildingViewer.tsx", import.meta.url), "utf8");
    const app = readFileSync(new URL("./main.tsx", import.meta.url), "utf8");
    expect(viewer).toContain('import * as THREE from "three"');
    expect(viewer).toContain("Floor plate");
    expect(viewer).toContain("Gold level highlighted");
    expect(app).toContain("<BuildingViewer propertyId={property.id}");
  });
});

describe("portable visual and map contracts", () => {
  it("keeps the Google Map ID as a separately configurable 3D-mode dependency", () => {
    expect(Object.keys(externalConfig)).toContain("googleMapsMapId");
    expect(typeof hasGoogleMaps3DConfig).toBe("boolean");
  });

  it("requires a dimensioned 3D map element, visible preparation state, direct failure fallback, and listing focus", () => {
    const mapSource = readFileSync(new URL("./services/maps.ts", import.meta.url), "utf8");
    const workflowSource = readFileSync(new URL("./components/ExternalWorkflows.tsx", import.meta.url), "utf8");
    expect(mapSource).toContain('version: "beta"');
    expect(mapSource).toContain("focus ? { lat: focus.latitude, lng: focus.longitude }");
    expect(mapSource).toContain("range: focus ? 1800 : 2500");
    expect(mapSource).toContain('threeDimensionalMap.classList.add("live-map-canvas")');
    expect(mapSource).toContain('threeDimensionalMap.style.width = "100%"');
    expect(mapSource).toContain('map.addEventListener("gmp-steadychange", onSteadyChange)');
    expect(mapSource).not.toContain("setTimeout");
    expect(mapSource).toContain('"gmp-map-id-error"');
    expect(mapSource).toContain('dispose: () => { removeMapListeners(); element.replaceChildren(); }');
    expect(mapSource).toContain('marketId === "singapore" && externalConfig.googleMapsMapId');
    expect(workflowSource).toContain("Preparing photorealistic 3D Singapore map");
    expect(workflowSource).toContain("Live photorealistic 3D Singapore map is ready.");
  });
});
