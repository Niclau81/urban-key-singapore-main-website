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
    const heroStyles = readFileSync(new URL("./portable-assets.css", import.meta.url), "utf8");
    expect(appSource).toContain('className="hero-skyline"');
    expect(appSource).toContain('Find the address<br /><em>fits your life.</em>');
    expect(appSource).toContain('className="hero-listings-map"');
    expect(appSource).toContain('presentation="hero" compact');
    expect(appSource).toContain("SG islands · live");
    expect(appSource).toContain("onListingSelect={listingId => navigate(`/map?marketId=${marketId}&property=${listingId}`)}");
    expect(heroStyles).toContain("Native map-boundary mode");
    expect(heroStyles).toContain(".hero-map-live .google-map");
    expect(heroStyles).toContain("coordinates stay attached to live imagery");
    expect(appSource).not.toContain("hero-singapore-island-shape");
    expect(appSource).not.toContain("singapore-island-outline.svg");
    expect(appSource).not.toContain('className="hero-market-label"');
    expect(heroStyles).not.toContain(".hero-market-label");
    expect(appSource).not.toContain('className="hero-media city-photo"');
    expect(appSource).not.toContain('className="city-orb city-photo"');
  });

  it("removes the redundant spatial-context panel and spaces desktop navigation after the brand", () => {
    const appSource = readFileSync(new URL("./main.tsx", import.meta.url), "utf8");
    const baseStyles = readFileSync(new URL("./styles.css", import.meta.url), "utf8");
    expect(appSource).not.toContain('className="map-banner"');
    expect(appSource).not.toContain("See where an address sits in the city.");
    expect(baseStyles).toContain("Desktop header rhythm");
    expect(baseStyles).toContain(".header .brand{margin-right:clamp(38px,4vw,68px)}");
    expect(baseStyles).toContain(".header nav{gap:clamp(18px,2vw,28px)}");
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

  it("requires a dimensioned 3D map element, direct failure fallback, and selectable native listing markers", () => {
    const mapSource = readFileSync(new URL("./services/maps.ts", import.meta.url), "utf8");
    const workflowSource = readFileSync(new URL("./components/ExternalWorkflows.tsx", import.meta.url), "utf8");
    const appSource = readFileSync(new URL("./main.tsx", import.meta.url), "utf8");
    const parityCss = readFileSync(new URL("./parity.css", import.meta.url), "utf8");
    const portableAssetsCss = readFileSync(new URL("./portable-assets.css", import.meta.url), "utf8");
    expect(mapSource).toContain('version: "beta"');
    expect(mapSource).toContain("export type MapPresentation = \"hero\" | \"listings\" | \"regions\"");
    expect(mapSource).toContain("function mapCamera(focus: MapFocus | undefined, marketId: MarketId, presentation: MapPresentation)");
    expect(mapSource).toContain("const SINGAPORE_OVERVIEW = { lat: 1.3521, lng: 103.8198 }");
    expect(mapSource).toContain("const SINGAPORE_OVERVIEW_RANGE = 36_000");
    expect(mapSource).toContain("const SINGAPORE_OUTER_ISLANDS_OVERVIEW");
    expect(mapSource).toContain("const SINGAPORE_HERO_RANGE = 58_000");
    expect(mapSource).toContain("const SINGAPORE_LISTINGS_RANGE = 32_000");
    expect(mapSource).toContain('mode: presentation === "listings" ? "HYBRID" : "SATELLITE"');
    expect(mapSource).toContain("threeDimensionalMap.center = next.center");
    expect(mapSource).toContain("threeDimensionalMap.range = next.range");
    expect(mapSource).toContain('return listing.commercial ? "C" : "H"');
    expect(mapSource).toContain('threeDimensionalMap.classList.add("live-map-canvas")');
    expect(mapSource).toContain('threeDimensionalMap.style.width = "100%"');
    expect(mapSource).toContain('map.addEventListener("gmp-steadychange", onSteadyChange)');
    expect(mapSource).toContain("Marker3DInteractiveElement");
    expect(mapSource).toContain('marker.addEventListener("gmp-click"');
    expect(mapSource).toContain("createListingMarkers(threeDimensionalMap");
    expect(mapSource).toContain("Polygon3DElement");
    expect(mapSource).toContain("createGeographicIslandOverlays(threeDimensionalMap");
    expect(mapSource).toContain("polygon.path = path");
    expect(mapSource).toContain('polygon.dataset.urbankeyMapLayer = "singapore-island-boundary"');
    expect(mapSource).toContain("const SINGAPORE_BOUNDS");
    expect(mapSource).toContain("threeDimensionalMap.bounds = SINGAPORE_BOUNDS");
    expect(mapSource).toContain("threeDimensionalMap.maxAltitude = 52_000");
    expect(mapSource).toContain("restriction: marketId === \"singapore\"");
    expect(appSource).toContain("future-map-page");
    expect(appSource).toContain('presentation="hero" compact');
    expect(portableAssetsCss).toContain("Native map-boundary mode");
    expect(portableAssetsCss).toContain("coordinates stay attached to live imagery");
    expect(portableAssetsCss).not.toContain("clip-path:url");
    expect(appSource).toContain("future-map-corner");
    expect(appSource).toContain("future-panel-signal");
    expect(appSource).toContain("Singapore regions");
    expect(appSource).toContain("Live listings");
    expect(appSource).toContain("Island regions");
    expect(appSource).toContain("South Singapore");
    expect(appSource).toContain("future-map-regions");
    expect(appSource).toContain("future-listing-detail");
    expect(parityCss).toContain("Futuristic Singapore 3D map cockpit");
    expect(parityCss).toContain("future-map-scan");
    expect(parityCss).toContain("Full-island Singapore mode");
    expect(mapSource).not.toContain("setTimeout");
    expect(mapSource).toContain('"gmp-map-id-error"');
    expect(mapSource).toContain('dispose: () => { removeMapListeners(); element.replaceChildren(); }');
    expect(mapSource).toContain('marketId === "singapore" && externalConfig.googleMapsMapId');
    expect(workflowSource).toContain("Live 3D Singapore listings loaded with");
    expect(workflowSource).toContain("must never keep the map behind a blocking loading overlay");
    expect(workflowSource).toContain("cameraUpdateRef.current?.(focus)");
    expect(workflowSource).toContain("onListingSelectRef.current?.(listingId)");
    expect(appSource).toContain("listings={listingPoints}");
    expect(appSource).toContain("onListingSelect={selectListingId}");
    expect(appSource).toContain("hero-listings-map");
    expect(appSource).not.toContain("hero-market-label");
  });
});
