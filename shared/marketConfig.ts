export const marketIds = ["singapore", "australia", "united-kingdom", "united-states", "united-arab-emirates", "global"] as const;
export type MarketId = (typeof marketIds)[number];

export type MapPoint = { lat: number; lng: number };

export type MarketConfig = {
  id: MarketId;
  countryName: string;
  countryCode: string;
  locale: string;
  currency: string;
  map: {
    center: MapPoint;
    zoom: number;
    regionPolygons?: MapPoint[][];
  };
  geography: {
    regionLabel: string;
    regions: string[];
  };
  terminology: {
    propertyPlural: string;
    transit: string;
    areaUnit: string;
    pricePerArea: string;
  };
};

const singaporeRegions = [
  "D01 · Marina Bay", "D02 · Tanjong Pagar", "D03 · Queenstown", "D04 · Harbourfront", "D05 · Buona Vista", "D06 · City Hall", "D07 · Bugis", "D08 · Little India", "D09 · Orchard", "D10 · Tanglin", "D11 · Newton", "D12 · Toa Payoh", "D13 · Macpherson", "D14 · Geylang", "D15 · East Coast", "D16 · Bedok", "D17 · Changi", "D18 · Tampines", "D19 · Sengkang", "D20 · Bishan", "D21 · Upper Bukit Timah", "D22 · Jurong", "D23 · Choa Chu Kang", "D24 · Lim Chu Kang", "D25 · Woodlands", "D26 · Upper Thomson", "D27 · Yishun", "D28 · Seletar",
];

export const marketConfigs: Record<MarketId, MarketConfig> = {
  singapore: {
    id: "singapore", countryName: "Singapore", countryCode: "SG", locale: "en-SG", currency: "SGD",
    map: {
      center: { lat: 1.334, lng: 103.817 }, zoom: 11,
      regionPolygons: [
        [{ lat: 1.266, lng: 103.842 }, { lat: 1.266, lng: 103.87 }, { lat: 1.292, lng: 103.87 }, { lat: 1.292, lng: 103.842 }],
        [{ lat: 1.272, lng: 103.786 }, { lat: 1.272, lng: 103.821 }, { lat: 1.297, lng: 103.821 }, { lat: 1.297, lng: 103.786 }],
        [{ lat: 1.292, lng: 103.808 }, { lat: 1.292, lng: 103.84 }, { lat: 1.316, lng: 103.84 }, { lat: 1.316, lng: 103.808 }],
      ],
    },
    geography: { regionLabel: "District", regions: singaporeRegions },
    terminology: { propertyPlural: "properties", transit: "MRT", areaUnit: "sq ft", pricePerArea: "PSF" },
  },
  australia: {
    id: "australia", countryName: "Australia", countryCode: "AU", locale: "en-AU", currency: "AUD",
    map: { center: { lat: -25.2744, lng: 133.7751 }, zoom: 4 },
    geography: { regionLabel: "Market", regions: ["Sydney", "Melbourne", "Brisbane", "Perth"] },
    terminology: { propertyPlural: "properties", transit: "public transport", areaUnit: "m²", pricePerArea: "price per m²" },
  },
  "united-kingdom": {
    id: "united-kingdom", countryName: "United Kingdom", countryCode: "GB", locale: "en-GB", currency: "GBP",
    map: { center: { lat: 54.5, lng: -3.4 }, zoom: 5 },
    geography: { regionLabel: "Area", regions: ["London", "Manchester", "Birmingham", "Edinburgh"] },
    terminology: { propertyPlural: "properties", transit: "public transport", areaUnit: "sq ft", pricePerArea: "price per sq ft" },
  },
  "united-states": {
    id: "united-states", countryName: "United States", countryCode: "US", locale: "en-US", currency: "USD",
    map: { center: { lat: 39.8283, lng: -98.5795 }, zoom: 4 },
    geography: { regionLabel: "Metro", regions: ["New York", "Los Angeles", "Austin", "Miami"] },
    terminology: { propertyPlural: "properties", transit: "public transit", areaUnit: "sq ft", pricePerArea: "price per sq ft" },
  },
  "united-arab-emirates": {
    id: "united-arab-emirates", countryName: "United Arab Emirates", countryCode: "AE", locale: "en-AE", currency: "AED",
    map: { center: { lat: 24.4539, lng: 54.3773 }, zoom: 7 },
    geography: { regionLabel: "Emirate", regions: ["Dubai", "Abu Dhabi", "Sharjah", "Ras Al Khaimah"] },
    terminology: { propertyPlural: "properties", transit: "public transport", areaUnit: "sq ft", pricePerArea: "price per sq ft" },
  },
  global: {
    id: "global", countryName: "Custom market", countryCode: "GLOBAL", locale: "en", currency: "USD",
    map: { center: { lat: 20, lng: 0 }, zoom: 2 },
    geography: { regionLabel: "Region", regions: [] },
    terminology: { propertyPlural: "properties", transit: "transit", areaUnit: "m²", pricePerArea: "price per m²" },
  },
};

export const marketOptions = Object.values(marketConfigs);
export const defaultMarketId: MarketId = "singapore";

export function getMarketConfig(id?: string): MarketConfig {
  return marketConfigs[id as MarketId] ?? marketConfigs[defaultMarketId];
}

export function getAllRegionsLabel(market: MarketConfig) {
  return `All ${market.geography.regionLabel.toLowerCase()}s`;
}

export function formatMarketCurrency(value: number, market: MarketConfig, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(market.locale, {
    style: "currency",
    currency: market.currency,
    maximumFractionDigits: 0,
    ...options,
  }).format(value);
}
