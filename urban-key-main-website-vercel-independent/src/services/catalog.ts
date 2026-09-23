import { commercialPropertyTypes, properties, type ListingMode, type Property } from "../data";
import type { LiveListing } from "./supabase";

export type CatalogFilters = {
  marketId?: Property["marketId"];
  mode?: ListingMode;
  search?: string;
  district?: string;
  propertyType?: string;
  tenure?: string;
  maxPrice?: number;
  minSize?: number;
  maxMrtMinutes?: number;
  commercialUsage?: string;
  minFloorLoading?: number;
  minCeilingHeight?: number;
};

const fallbackImage = "/assets/office-interior_791afa97.jpg";

export function liveListingToProperty(listing: LiveListing): Property {
  const category = listing.category === "Commercial" ? "Commercial" : "Residential";
  const mode = listing.mode ?? (listing.category === "Commercial" ? "Rent" : listing.category ?? "Buy");
  const image = listing.image_url ?? fallbackImage;
  const price = listing.price ?? parsePrice(listing.price_label) ?? 0;
  const size = listing.size ?? parseSize(listing.size_label) ?? 0;
  return {
    id: listing.id,
    marketId: listing.market_id ?? "singapore",
    title: listing.title,
    district: listing.district,
    address: listing.address,
    category,
    type: listing.property_type,
    mode: normaliseMode(mode),
    price,
    monthlyRent: listing.monthly_rent ?? undefined,
    beds: listing.bedrooms ?? 0,
    baths: listing.bathrooms ?? 0,
    size,
    tenure: listing.tenure ?? "Verification required",
    mrt: listing.mrt_name ?? "Transit details pending",
    minutes: listing.mrt_minutes ?? 0,
    latitude: listing.latitude ?? 1.334,
    longitude: listing.longitude ?? 103.817,
    tags: listing.tags ?? [],
    tone: listing.image_tone || "city",
    detail: listing.description,
    image,
    gallery: listing.gallery_urls?.length ? listing.gallery_urls : [image],
    planningDemo: listing.is_planning_demo ?? false,
    virtualTourAvailable: listing.virtual_tour_available ?? false,
    commercialUsage: listing.commercial_usage ?? undefined,
    floorLoading: listing.floor_loading ?? undefined,
    ceilingHeight: listing.ceiling_height ?? undefined,
    loadingAccess: listing.loading_access ?? undefined,
    parkingLots: listing.parking_lots ?? undefined,
    availableFrom: listing.available_from ?? undefined,
    transactions: [],
  };
}

function normaliseMode(mode: string): ListingMode {
  return mode === "Buy" || mode === "Sell" || mode === "Rent" || mode === "Rent-Out" ? mode : "Buy";
}

function parsePrice(value?: string | null) {
  if (!value) return undefined;
  const compact = value.toLowerCase().replace(/,/g, "");
  const match = compact.match(/([\d.]+)\s*m/);
  if (match) return Math.round(Number(match[1]) * 1_000_000);
  const number = compact.match(/[\d.]+/);
  return number ? Number(number[0]) : undefined;
}

function parseSize(value?: string | null) {
  if (!value) return undefined;
  const number = value.replace(/,/g, "").match(/[\d.]+/);
  return number ? Number(number[0]) : undefined;
}

export function mergeCatalog(liveListings: LiveListing[]) {
  const live = liveListings.map(liveListingToProperty);
  const overrides = new Map(live.map(item => [item.id, item]));
  return [...properties.map(item => overrides.get(item.id) ?? item), ...live.filter(item => !properties.some(seed => seed.id === item.id))];
}

export function filterCatalog(catalog: Property[], filters: CatalogFilters) {
  const query = filters.search?.trim().toLowerCase();
  const allDistricts = !filters.district || filters.district === "All districts";
  const allTypes = !filters.propertyType || filters.propertyType === "All types";
  const allTenures = !filters.tenure || filters.tenure === "Any ownership";
  const allUsage = !filters.commercialUsage || filters.commercialUsage === "Any usage";
  return catalog.filter(property => {
    if (filters.marketId && property.marketId !== filters.marketId) return false;
    if (filters.mode && property.mode !== filters.mode) return false;
    if (!allDistricts && property.district !== filters.district) return false;
    if (!allTypes && property.type !== filters.propertyType) return false;
    if (!allTenures && property.tenure !== filters.tenure) return false;
    if (filters.maxPrice) {
      const comparablePrice = property.mode === "Rent" || property.mode === "Rent-Out" ? (property.monthlyRent ?? property.price) : property.price;
      if (comparablePrice > filters.maxPrice) return false;
    }
    if (filters.minSize && property.size < filters.minSize) return false;
    if (filters.maxMrtMinutes && property.minutes > filters.maxMrtMinutes) return false;
    if (!allUsage && !property.commercialUsage?.toLowerCase().includes(filters.commercialUsage!.toLowerCase())) return false;
    if (filters.minFloorLoading && (property.floorLoading ?? 0) < filters.minFloorLoading) return false;
    if (filters.minCeilingHeight && (property.ceilingHeight ?? 0) < filters.minCeilingHeight) return false;
    if (!query) return true;
    return [property.title, property.district, property.address, property.type, property.mrt, ...property.tags]
      .join(" ").toLowerCase().includes(query);
  });
}

export function hasCommercialFocus(propertyType?: string) {
  return !propertyType || propertyType === "All types" || commercialPropertyTypes.includes(propertyType as (typeof commercialPropertyTypes)[number]);
}

export function filtersToSearch(filters: CatalogFilters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== "All districts" && value !== "All types" && value !== "Any ownership") params.set(key, String(value));
  });
  return params.toString();
}
