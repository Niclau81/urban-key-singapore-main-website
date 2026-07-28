export type ListingMode = "Buy" | "Sell" | "Rent" | "Rent-Out";

export const residentialPropertyTypes = ["Condominium", "Apartment", "HDB Flat"] as const;
export const commercialPropertyTypes = ["Office", "Shophouse", "Warehouse", "Office Building", "Factory Building"] as const;
export const propertyTypes = [...residentialPropertyTypes, ...commercialPropertyTypes] as const;

export function isCommercialPropertyType(type: string) {
  return commercialPropertyTypes.includes(type as (typeof commercialPropertyTypes)[number]);
}

export type PropertyTransaction = {
  date: string;
  type: "Sale" | "Rent";
  property: string;
  unit: string;
  price: number;
  psf: number;
};

export type PropertyIncident = {
  year: string;
  category: "positive" | "neutral" | "negative";
  title: string;
  detail: string;
  source: string;
};

export type Property = {
  id: string;
  title: string;
  district: string;
  address: string;
  type: string;
  mode: ListingMode;
  price: number;
  monthlyRent?: number;
  beds: number;
  baths: number;
  size: number;
  tenure: string;
  mrt: string;
  mrtMinutes: number;
  latitude: number;
  longitude: number;
  image: string;
  gallery: string[];
  description: string;
  tags: string[];
  owner: {
    initials: string;
    ownershipYears: number;
    propertyCount: number;
  };
  incidents: PropertyIncident[];
  transactions: PropertyTransaction[];
  isCommercial?: boolean;
  commercialUsage?: string;
  floorLoading?: number;
  ceilingHeight?: number;
  loadingAccess?: string;
  parkingLots?: number;
  availableFrom?: string;
  grossFloorArea?: number;
  floorPlan?: {
    label: string;
    bedrooms: number;
    note: string;
    imageUrl?: string;
  };
  /**
   * The advertised unit identity for a multi-unit listing. These optional
   * fields deliberately remain separate from comparable transaction history,
   * which may describe a different unit in the same development.
   */
  listingFloor?: number;
  listingUnit?: string;
};

const images = {
  marinaInterior: "/manus-storage/office-interior_791afa97.jpg",
  marinaSkyline: "/manus-storage/office-building_b7b74f98.jpg",
  interlace: "/manus-storage/shophouse-office_0083057a.jpg",
  tower: "/manus-storage/office-building_b7b74f98.jpg",
  luxuryInterior: "/manus-storage/office-interior_791afa97.jpg",
  office: "/manus-storage/office-interior_791afa97.jpg",
  shophouse: "/manus-storage/shophouse-office_0083057a.jpg",
  warehouse: "/manus-storage/warehouse-exterior_25db9dac.jpg",
  factoryBuilding: "/manus-storage/factory-interior_71f18145.jpg",
  officeBuilding: "/manus-storage/office-building_b7b74f98.jpg",
};

const residentialProperties: Property[] = [
  {
    id: "marina-cove-28-08",
    title: "Marina Cove Residence",
    district: "D01 · Marina Bay",
    address: "18 Marina Boulevard",
    type: "Condominium",
    mode: "Buy",
    price: 4280000,
    monthlyRent: 14500,
    beds: 3,
    baths: 3,
    size: 1658,
    tenure: "99-year",
    mrt: "Downtown MRT",
    mrtMinutes: 4,
    latitude: 1.2797,
    longitude: 103.8547,
    image: images.marinaInterior,
    gallery: [images.marinaInterior, images.marinaSkyline, images.luxuryInterior],
    description: "A high-floor waterfront residence with uninterrupted bay views, a private lift lobby, and a calm, gallery-like interior designed for effortless city living.",
    tags: ["Bay view", "Private lift", "High floor"],
    owner: { initials: "J.L.", ownershipYears: 7, propertyCount: 2 },
    incidents: [
      { year: "2025", category: "positive", title: "Estate excellence recognition", detail: "The development received a landscape maintenance commendation in a curated demonstration record.", source: "Curated demo record" },
      { year: "2023", category: "neutral", title: "Façade maintenance completed", detail: "Scheduled external works were recorded as completed with no continuing access restriction.", source: "Curated demo record" },
      { year: "2021", category: "negative", title: "Noise dispute reported", detail: "One unverified resident report described intermittent renovation noise on the same floor. No active report is shown.", source: "Unverified demo report" },
    ],
    transactions: [
      { date: "2025-10-14", type: "Sale", property: "Marina Cove Residence", unit: "#28-08", price: 4150000, psf: 2503 },
      { date: "2024-06-02", type: "Rent", property: "Marina Cove Residence", unit: "#31-06", price: 14200, psf: 8.56 },
      { date: "2023-11-19", type: "Sale", property: "Bayfront Collection", unit: "#22-03", price: 3980000, psf: 2400 },
      { date: "2022-08-11", type: "Sale", property: "Marina Cove Residence", unit: "#17-08", price: 3740000, psf: 2256 },
      { date: "2021-03-24", type: "Rent", property: "Bayfront Collection", unit: "#19-11", price: 11800, psf: 7.12 },
    ],
  },
  {
    id: "interlace-garden-06-12",
    title: "The Interlace Garden Home",
    district: "D04 · Harbourfront",
    address: "180 Depot Road",
    type: "Condominium",
    mode: "Rent",
    price: 2480000,
    monthlyRent: 7800,
    beds: 3,
    baths: 2,
    size: 1593,
    tenure: "99-year",
    mrt: "Labrador Park MRT",
    mrtMinutes: 9,
    latitude: 1.2822,
    longitude: 103.8035,
    image: images.interlace,
    gallery: [images.interlace, images.luxuryInterior, images.marinaInterior],
    description: "A quiet garden-facing home in an architecturally distinctive estate, pairing generous living spaces with immediate access to greenery and community facilities.",
    tags: ["Garden view", "Architectural icon", "Family home"],
    owner: { initials: "A.T.", ownershipYears: 11, propertyCount: 1 },
    incidents: [
      { year: "2024", category: "positive", title: "Quiet-stack commendation", detail: "Resident-submitted demonstration feedback consistently described this stack as sheltered from road noise.", source: "Curated demo record" },
      { year: "2022", category: "positive", title: "Community garden renewed", detail: "Landscape and shared garden improvements were recorded for the surrounding cluster.", source: "Curated demo record" },
      { year: "2020", category: "negative", title: "Neighbor dispute report", detail: "An unverified historical report referenced a short-lived common-corridor disagreement. Resolution details are unavailable.", source: "Unverified demo report" },
    ],
    transactions: [
      { date: "2025-09-21", type: "Rent", property: "The Interlace", unit: "#06-12", price: 7500, psf: 4.71 },
      { date: "2024-12-08", type: "Sale", property: "The Interlace", unit: "#09-03", price: 2390000, psf: 1500 },
      { date: "2023-05-17", type: "Rent", property: "The Interlace", unit: "#04-09", price: 7200, psf: 4.52 },
      { date: "2022-02-12", type: "Sale", property: "The Interlace", unit: "#12-07", price: 2220000, psf: 1394 },
      { date: "2021-01-28", type: "Rent", property: "The Interlace", unit: "#03-14", price: 5900, psf: 3.70 },
    ],
  },
  {
    id: "orchard-boulevard-19-02",
    title: "Orchard Boulevard Atelier",
    district: "D10 · Tanglin",
    address: "9 Orchard Boulevard",
    type: "Apartment",
    mode: "Buy",
    price: 6150000,
    monthlyRent: 17800,
    beds: 4,
    baths: 4,
    size: 2142,
    tenure: "Freehold",
    mrt: "Orchard Boulevard MRT",
    mrtMinutes: 2,
    latitude: 1.3023,
    longitude: 103.8238,
    image: images.tower,
    gallery: [images.tower, images.luxuryInterior, images.marinaInterior],
    description: "A composed freehold residence near Orchard Boulevard, with sculptural architecture, expansive entertaining spaces, and discreet hotel-style services.",
    tags: ["Freehold", "Concierge", "Prime district"],
    owner: { initials: "M.K.", ownershipYears: 4, propertyCount: 3 },
    incidents: [
      { year: "2025", category: "positive", title: "Security upgrade completed", detail: "A demonstration estate record notes upgraded lift access controls and lobby monitoring.", source: "Curated demo record" },
      { year: "2023", category: "positive", title: "Low-noise environment", detail: "Curated environmental observations indicate limited late-night traffic at the inward-facing stack.", source: "Curated demo record" },
      { year: "2022", category: "negative", title: "Medical emergency reported", detail: "An anonymized, unverified demonstration report notes that emergency services attended another unit. No personal details are displayed.", source: "Unverified demo report" },
    ],
    transactions: [
      { date: "2025-11-06", type: "Sale", property: "Orchard Boulevard Atelier", unit: "#19-02", price: 5980000, psf: 2792 },
      { date: "2024-07-19", type: "Rent", property: "Orchard Boulevard Atelier", unit: "#16-01", price: 16900, psf: 7.89 },
      { date: "2023-09-03", type: "Sale", property: "Tanglin Edition", unit: "#12-05", price: 5600000, psf: 2614 },
      { date: "2022-04-26", type: "Sale", property: "Orchard Boulevard Atelier", unit: "#08-03", price: 5280000, psf: 2465 },
      { date: "2021-02-15", type: "Rent", property: "Tanglin Edition", unit: "#10-02", price: 14800, psf: 6.91 },
    ],
  },
];

const hdbSeed = [
  ["queenstown-skyline-demo", "Queenstown Skyline Flat · Demo", "D03 · Queenstown", "Alexandra Road · illustrative address", "Buy", 928000, 0, 3, 2, 969, "Queenstown MRT", 6, 1.2941, 103.8062, "Established resale", images.interlace],
  ["bishan-grove-demo", "Bishan Grove Flat · Demo", "D20 · Bishan", "Bishan Street 24 · illustrative address", "Buy", 870000, 0, 3, 2, 904, "Bishan MRT", 8, 1.3507, 103.8482, "Established resale", images.luxuryInterior],
  ["sengkang-canopy-demo", "Sengkang Canopy Flat · Demo", "D19 · Sengkang", "Sengkang West Way · illustrative address", "Buy", 748000, 0, 3, 2, 1001, "Cheng Lim LRT", 5, 1.3852, 103.8891, "Recent flat", images.marinaInterior],
  ["woodlands-horizon-demo", "Woodlands Horizon Flat · Demo", "D25 · Woodlands", "Woodlands Drive 50 · illustrative address", "Rent", 0, 3850, 3, 2, 1087, "Woodlands North MRT", 9, 1.4451, 103.7856, "Established resale", images.interlace],
  ["yishun-greenway-demo", "Yishun Greenway Flat · Demo", "D27 · Yishun", "Yishun Avenue 6 · illustrative address", "Buy", 608000, 0, 3, 2, 861, "Khatib MRT", 10, 1.4182, 103.8333, "Established resale", images.marinaSkyline],
  ["tampines-verge-demo", "Tampines Verge Flat · Demo", "D18 · Tampines", "Tampines Avenue 9 · illustrative address", "Buy", 786000, 0, 4, 2, 1184, "Tampines West MRT", 7, 1.3535, 103.9401, "Recent flat", images.luxuryInterior],
  ["bedok-reservoir-demo", "Bedok Reservoir Flat · Demo", "D16 · Bedok", "Bedok Reservoir Road · illustrative address", "Rent", 0, 3420, 3, 2, 926, "Bedok Reservoir MRT", 6, 1.3339, 103.9188, "Established resale", images.marinaInterior],
  ["jurong-lake-demo", "Jurong Lake Gardens Flat · Demo", "D22 · Jurong", "Yuan Ching Road · illustrative address", "Buy", 698000, 0, 3, 2, 990, "Lakeside MRT", 8, 1.3447, 103.7204, "Recent flat", images.interlace],
  ["choa-chu-kang-demo", "Choa Chu Kang Park Flat · Demo", "D23 · Choa Chu Kang", "Choa Chu Kang Avenue 4 · illustrative address", "Buy", 628000, 0, 3, 2, 1033, "Yew Tee MRT", 9, 1.3975, 103.7472, "Established resale", images.marinaSkyline],
  ["clementi-crest-demo", "Clementi Crest Flat · Demo", "D05 · Buona Vista", "Clementi Avenue 4 · illustrative address", "Buy", 838000, 0, 4, 2, 1119, "Clementi MRT", 6, 1.3164, 103.7653, "Recent flat", images.luxuryInterior],
] as const;

const hdbListingUnits = [
  { floor: 12, unit: "#12-128" },
  { floor: 9, unit: "#09-214" },
  { floor: 15, unit: "#15-306" },
  { floor: 11, unit: "#11-418" },
  { floor: 8, unit: "#08-522" },
  { floor: 14, unit: "#14-638" },
  { floor: 7, unit: "#07-744" },
  { floor: 16, unit: "#16-856" },
  { floor: 10, unit: "#10-962" },
  { floor: 18, unit: "#18-104" },
] as const;

const hdbProperties: Property[] = hdbSeed.map((item, index) => {
  const [id, title, district, address, mode, price, monthlyRent, beds, baths, size, mrt, mrtMinutes, latitude, longitude, era, image] = item;
  const salePrice = price || Math.round(monthlyRent * 220);
  const listingIdentity = hdbListingUnits[index];
  return {
    id,
    title,
    district,
    address,
    type: "HDB Flat",
    mode,
    price: salePrice,
    monthlyRent: monthlyRent || undefined,
    beds,
    baths,
    size,
    tenure: "99-year",
    mrt,
    mrtMinutes,
    latitude,
    longitude,
    image,
    gallery: [image, images.marinaInterior, images.luxuryInterior],
    description: `An ${era.toLowerCase()} HDB flat included as an illustrative UrbanKey demonstration listing. Layout, availability, price, and all property particulars require independent verification before any decision.`,
    tags: ["HDB demo", era, `${beds}-room layout`],
    floorPlan: {
      label: `${beds}-room illustrative HDB layout`,
      bedrooms: beds,
      note: "Illustrative product-demo floor plan only. It is not an official HDB plan, survey, or representation of an actual unit.",
    },
    listingFloor: listingIdentity.floor,
    listingUnit: listingIdentity.unit,
    owner: { initials: ["A.L.", "J.T.", "M.R.", "S.K.", "D.N.", "P.C.", "H.Y.", "R.W.", "C.G.", "E.F."][index], ownershipYears: 3 + (index % 12), propertyCount: 1 },
    incidents: [{ year: "Demo", category: "neutral", title: "Illustrative listing context", detail: "This HDB record is curated solely for product demonstration. Verify all material information through official sources and the appointed agent.", source: "Curated demo record" }],
    transactions: [{ date: "2025-05-18", type: mode === "Rent" ? "Rent" : "Sale", property: title, unit: listingIdentity.unit, price: mode === "Rent" ? Math.round((monthlyRent || 0) * 0.97) : Math.round(salePrice * 0.96), psf: mode === "Rent" ? Number((((monthlyRent || 0) * 0.97) / size).toFixed(2)) : Math.round((salePrice * 0.96) / size) }],
  };
});

const commercialSeed = [
  ["tanjong-pagar-office-18", "Anson Exchange Office Suite", "D02 · Tanjong Pagar", "10 Anson Road", "Office", "Rent", 4680000, 23800, 3680, "99-year", "Tanjong Pagar MRT", 3, 1.2758, 103.8464, images.office, "Office · Professional services", 3, 2.8, "Shared service bay", 3, "2026-09-01"],
  ["robinson-office-09", "Robinson Green Workplace", "D01 · Marina Bay", "88 Robinson Road", "Office", "Buy", 5980000, 29200, 4210, "Freehold", "Shenton Way MRT", 4, 1.2793, 103.8489, images.office, "Office · Corporate headquarters", 3.5, 3, "Basement service bay", 4, "2026-10-15"],
  ["keong-saik-shophouse", "Keong Saik Conservation House", "D02 · Tanjong Pagar", "41 Keong Saik Road", "Shophouse", "Sell", 12800000, 42000, 4860, "Freehold", "Outram Park MRT", 6, 1.2805, 103.8414, images.shophouse, "F&B · Retail · Office", 4, 3.6, "Rear service lane", 0, "2026-12-01"],
  ["joo-chiat-shophouse", "Joo Chiat Creative Shophouse", "D15 · East Coast", "112 Joo Chiat Road", "Shophouse", "Rent-Out", 6200000, 21800, 3280, "Freehold", "Marine Parade MRT", 9, 1.3087, 103.9039, images.shophouse, "Retail · Studio · Office", 3.5, 3.3, "Sheltered rear access", 1, "2026-08-15"],
  ["tuas-logistics-park", "Tuas Logistics Hub", "D22 · Jurong", "31 Tuas South Avenue 8", "Warehouse", "Rent", 9800000, 68000, 28400, "30-year", "Tuas Link MRT", 12, 1.3108, 103.6318, images.warehouse, "Warehouse · Logistics", 15, 12, "4 dock levellers · 2 drive-in bays", 18, "2026-11-01"],
  ["changi-airfreight-warehouse", "Changi Airfreight Warehouse", "D17 · Changi", "7 Changi North Street 1", "Warehouse", "Rent-Out", 12800000, 74500, 31600, "30-year", "Tampines East MRT", 15, 1.3658, 103.9715, images.warehouse, "Warehouse · Airfreight", 20, 10.5, "6 loading bays · secure yard", 22, "2027-01-01"],
  ["paya-lebar-office-building", "Paya Lebar Enterprise House", "D14 · Geylang", "62 Paya Lebar Road", "Office Building", "Sell", 48800000, 198000, 42800, "Freehold", "Paya Lebar MRT", 3, 1.3182, 103.8928, images.officeBuilding, "Office building · Retail podium", 4, 3.2, "Dedicated service lane", 36, "2027-03-01"],
  ["one-north-office-building", "One-North Innovation Building", "D05 · Buona Vista", "23 Fusionopolis Way", "Office Building", "Buy", 63800000, 242000, 58600, "60-year", "one-north MRT", 2, 1.2997, 103.7875, images.officeBuilding, "Office building · R&D support", 5, 3.4, "Dedicated basement loading bay", 52, "2027-06-01"],
  ["woodlands-factory-building", "Woodlands Advanced Manufacturing Centre", "D25 · Woodlands", "18 Woodlands Sector 1", "Factory Building", "Sell", 23800000, 126000, 67200, "30-year", "Woodlands North MRT", 13, 1.4582, 103.7862, images.factoryBuilding, "B2 Factory · Advanced manufacturing", 25, 6.5, "3 goods lifts · 4 loading bays", 48, "2027-02-01"],
  ["jurong-factory-building", "Jurong Precision Factory", "D22 · Jurong", "5 Pioneer Sector Walk", "Factory Building", "Rent-Out", 17800000, 98500, 51400, "30-year", "Pioneer MRT", 14, 1.3136, 103.6814, images.factoryBuilding, "B2 Factory · Precision engineering", 30, 8, "Drive-in production bays · 2 loading docks", 34, "2026-10-01"],
] as const;

const commercialProperties: Property[] = commercialSeed.map((item, index) => {
  const [id, title, district, address, type, mode, price, monthlyRent, size, tenure, mrt, mrtMinutes, latitude, longitude, image, commercialUsage, floorLoading, ceilingHeight, loadingAccess, parkingLots, availableFrom] = item;
  const gallery = type === "Shophouse"
    ? [images.shophouse, images.office, images.warehouse]
    : type === "Office" || type === "Office Building"
      ? [image, images.office, images.marinaSkyline]
      : [image, images.warehouse, images.factoryBuilding];
  return {
    id,
    title,
    district,
    address,
    type,
    mode,
    price,
    monthlyRent,
    beds: 0,
    baths: type === "Office" ? 2 : type === "Shophouse" ? 4 : 8,
    size,
    tenure,
    mrt,
    mrtMinutes,
    latitude,
    longitude,
    image,
    gallery,
    description: type === "Office"
      ? "A professionally configured workplace with efficient floor plates, flexible meeting areas, and strong transport connectivity for owner-occupiers or corporate tenants."
      : type === "Shophouse"
        ? "A character-rich conservation property with prominent frontage, adaptable upper floors, and practical service access for curated commercial uses."
        : type === "Warehouse"
          ? "A logistics-ready facility with high-clearance storage, robust floor loading, secure yard circulation, and practical ancillary office space."
          : type === "Office Building"
            ? "A whole-building commercial opportunity with adaptable office floors, dedicated service access, and established business-district connectivity."
            : "A production-ready industrial facility with reinforced floors, high-capacity loading infrastructure, and self-contained administrative accommodation.",
    tags: Array.from(new Set([type, commercialUsage.split(" · ")[0], `${parkingLots} parking lots`])),
    isCommercial: true,
    commercialUsage,
    floorLoading,
    ceilingHeight,
    loadingAccess,
    parkingLots,
    availableFrom,
    grossFloorArea: size,
    owner: { initials: ["C.W.", "R.H.", "L.S.", "P.N.", "T.K.", "E.G.", "B.Y.", "V.C.", "N.J.", "S.F."][index], ownershipYears: 5 + (index % 9), propertyCount: 2 + (index % 6) },
    incidents: [
      { year: "2025", category: "positive", title: "Planned asset works completed", detail: "A curated demonstration record notes completion of scheduled common-area or building-services maintenance.", source: "Curated demo record" },
      { year: "2022", category: index % 3 === 0 ? "negative" : "neutral", title: index % 3 === 0 ? "Short access disruption reported" : "Routine inspection recorded", detail: index % 3 === 0 ? "An unverified demonstration report references a temporary historical access disruption. No active restriction is shown." : "Illustrative inspection activity was recorded as completed; current conditions require independent verification.", source: index % 3 === 0 ? "Unverified demo report" : "Curated demo record" },
    ],
    transactions: [
      { date: "2025-08-18", type: mode === "Rent" || mode === "Rent-Out" ? "Rent" : "Sale", property: title, unit: type.includes("Building") || type === "Shophouse" ? "Whole" : "Representative unit", price: mode === "Rent" || mode === "Rent-Out" ? Math.round(monthlyRent * 0.94) : Math.round(price * 0.95), psf: mode === "Rent" || mode === "Rent-Out" ? Number(((monthlyRent * 0.94) / size).toFixed(2)) : Math.round((price * 0.95) / size) },
      { date: "2023-04-11", type: mode === "Rent" || mode === "Rent-Out" ? "Sale" : "Rent", property: title, unit: "Comparable", price: mode === "Rent" || mode === "Rent-Out" ? Math.round(price * 0.89) : Math.round(monthlyRent * 0.88), psf: mode === "Rent" || mode === "Rent-Out" ? Math.round((price * 0.89) / size) : Number(((monthlyRent * 0.88) / size).toFixed(2)) },
      { date: "2021-01-23", type: mode === "Rent" || mode === "Rent-Out" ? "Rent" : "Sale", property: title, unit: "Comparable", price: mode === "Rent" || mode === "Rent-Out" ? Math.round(monthlyRent * 0.78) : Math.round(price * 0.82), psf: mode === "Rent" || mode === "Rent-Out" ? Number(((monthlyRent * 0.78) / size).toFixed(2)) : Math.round((price * 0.82) / size) },
    ],
  };
});

const withIllustrativeFloorPlan = (property: Property): Property => ({
  ...property,
  floorPlan: property.floorPlan ?? {
    label: property.isCommercial ? "Illustrative floor-plate layout" : `${Math.max(1, property.beds)}-bedroom illustrative layout`,
    bedrooms: property.beds,
    note: "Illustrative product-demo floor plan only. It is not a survey, as-built drawing, or official plan.",
  },
});

export const properties: Property[] = [...residentialProperties, ...hdbProperties, ...commercialProperties].map(withIllustrativeFloorPlan);

export const districts = ["All districts", "D01 · Marina Bay", "D02 · Tanjong Pagar", "D03 · Queenstown", "D04 · Harbourfront", "D05 · Buona Vista", "D10 · Tanglin", "D14 · Geylang", "D15 · East Coast", "D16 · Bedok", "D18 · Tampines", "D19 · Sengkang", "D20 · Bishan", "D22 · Jurong", "D23 · Choa Chu Kang", "D25 · Woodlands", "D27 · Yishun"];

export const propertyHistoryDisclaimer =
  "Property and unit history shown here is curated demonstration data, may include unverified resident reports, and must not be treated as a factual allegation. Users should independently verify all material information through official records, the property owner, managing agent, and qualified advisers before making any decision.";
