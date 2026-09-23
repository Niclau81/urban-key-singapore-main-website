export type ListingMode = "Buy" | "Sell" | "Rent" | "Rent-Out";
export type PropertyCategory = "Residential" | "Commercial";

export type PropertyTransaction = {
  date: string;
  type: "Sale" | "Rent";
  price: number;
  psf: number;
  unit: string;
};

export type Property = {
  id: string;
  marketId: "singapore" | "indonesia" | "malaysia" | "thailand" | "vietnam" | "philippines";
  title: string;
  district: string;
  address: string;
  category: PropertyCategory;
  type: string;
  mode: ListingMode;
  price: number;
  monthlyRent?: number;
  beds: number;
  baths: number;
  size: number;
  tenure: string;
  mrt: string;
  minutes: number;
  latitude: number;
  longitude: number;
  tags: string[];
  tone: string;
  detail: string;
  image: string;
  gallery: string[];
  planningDemo?: boolean;
  virtualTourAvailable?: boolean;
  commercialUsage?: string;
  floorLoading?: number;
  ceilingHeight?: number;
  loadingAccess?: string;
  parkingLots?: number;
  availableFrom?: string;
  transactions: PropertyTransaction[];
};

const assets = {
  marina: "/assets/office-interior_791afa97.jpg",
  skyline: "/assets/marina-skyline_8ccbeb9b.jpg",
  interlace: "/assets/interlace-aerial_74c51dd9.jpg",
  office: "/assets/office-building_b7b74f98.jpg",
  shophouse: "/assets/shophouse-office_0083057a.jpg",
  warehouse: "/assets/warehouse-exterior_25db9dac.jpg",
  factory: "/assets/factory-interior_71f18145.jpg",
};

const galleries = {
  residence: [assets.marina, assets.skyline, assets.interlace],
  home: [assets.interlace, assets.marina, assets.skyline],
  office: [assets.office, assets.marina, assets.skyline],
  shophouse: [assets.shophouse, assets.office, assets.warehouse],
  logistics: [assets.warehouse, assets.office, assets.factory],
  factory: [assets.factory, assets.warehouse, assets.office],
};

const sale = (price: number, size: number, unit = "Representative unit"): PropertyTransaction => ({ date: "2025-08-18", type: "Sale", price: Math.round(price * 0.95), psf: Math.round((price * 0.95) / size), unit });
const rent = (price: number, size: number, unit = "Representative unit"): PropertyTransaction => ({ date: "2025-08-18", type: "Rent", price: Math.round(price * 0.94), psf: Number(((price * 0.94) / size).toFixed(2)), unit });

const singaporeResidential: Property[] = [
  {
    id: "marina-cove-28-08", marketId: "singapore", title: "Marina Cove Residence", district: "D01 · Marina Bay", address: "18 Marina Boulevard", category: "Residential", type: "Condominium", mode: "Buy", price: 4280000, monthlyRent: 14500, beds: 3, baths: 3, size: 1658, tenure: "99-year", mrt: "Downtown MRT", minutes: 4, latitude: 1.2797, longitude: 103.8547, tags: ["Bay view", "Private lift", "High floor"], tone: "marina", image: assets.marina, gallery: galleries.residence, virtualTourAvailable: true,
    detail: "Illustrative product-demo residence with a high-floor waterfront setting, gallery-style living room, and private lift lobby. Availability and all particulars require independent verification.", transactions: [sale(4280000, 1658, "#28-08"), rent(14500, 1658, "#31-06")],
  },
  {
    id: "interlace-garden-06-12", marketId: "singapore", title: "The Interlace Garden Home", district: "D04 · Harbourfront", address: "180 Depot Road", category: "Residential", type: "Condominium", mode: "Rent", price: 2480000, monthlyRent: 7800, beds: 3, baths: 2, size: 1593, tenure: "99-year", mrt: "Labrador Park MRT", minutes: 9, latitude: 1.2822, longitude: 103.8035, tags: ["Garden view", "Architectural icon", "Family home"], tone: "garden", image: assets.interlace, gallery: galleries.home, virtualTourAvailable: true,
    detail: "Illustrative product-demo home set in an architectural garden estate, with generous living zones and a green outlook. Availability and all particulars require independent verification.", transactions: [rent(7800, 1593, "#06-12"), sale(2480000, 1593, "#09-03")],
  },
  {
    id: "orchard-boulevard-19-02", marketId: "singapore", title: "Orchard Boulevard Atelier", district: "D10 · Tanglin", address: "9 Orchard Boulevard", category: "Residential", type: "Apartment", mode: "Buy", price: 6150000, monthlyRent: 17800, beds: 4, baths: 4, size: 2142, tenure: "Freehold", mrt: "Orchard Boulevard MRT", minutes: 2, latitude: 1.3023, longitude: 103.8238, tags: ["Freehold", "Concierge", "Prime district"], tone: "city", image: assets.skyline, gallery: galleries.residence,
    detail: "A composed illustrative freehold residence near Orchard Boulevard, with expansive entertaining spaces and hotel-style services. Availability and all particulars require independent verification.", transactions: [sale(6150000, 2142, "#19-02"), rent(17800, 2142, "#16-01")],
  },
];

const hdbRows = [
  ["queenstown-skyline-demo", "Queenstown Skyline Flat · Demo", "D03 · Queenstown", "Alexandra Road · illustrative address", "Buy", 928000, 0, 3, 2, 969, "Queenstown MRT", 6, 1.2941, 103.8062, "Established resale", assets.interlace],
  ["bishan-grove-demo", "Bishan Grove Flat · Demo", "D20 · Bishan", "Bishan Street 24 · illustrative address", "Buy", 870000, 0, 3, 2, 904, "Bishan MRT", 8, 1.3507, 103.8482, "Established resale", assets.marina],
  ["sengkang-canopy-demo", "Sengkang Canopy Flat · Demo", "D19 · Sengkang", "Sengkang West Way · illustrative address", "Buy", 748000, 0, 3, 2, 1001, "Cheng Lim LRT", 5, 1.3852, 103.8891, "Recent flat", assets.skyline],
  ["woodlands-horizon-demo", "Woodlands Horizon Flat · Demo", "D25 · Woodlands", "Woodlands Drive 50 · illustrative address", "Rent", 0, 3850, 3, 2, 1087, "Woodlands North MRT", 9, 1.4451, 103.7856, "Established resale", assets.interlace],
  ["yishun-greenway-demo", "Yishun Greenway Flat · Demo", "D27 · Yishun", "Yishun Avenue 6 · illustrative address", "Buy", 608000, 0, 3, 2, 861, "Khatib MRT", 10, 1.4182, 103.8333, "Established resale", assets.skyline],
  ["tampines-verge-demo", "Tampines Verge Flat · Demo", "D18 · Tampines", "Tampines Avenue 9 · illustrative address", "Buy", 786000, 0, 4, 2, 1184, "Tampines West MRT", 7, 1.3535, 103.9401, "Recent flat", assets.marina],
  ["bedok-reservoir-demo", "Bedok Reservoir Flat · Demo", "D16 · Bedok", "Bedok Reservoir Road · illustrative address", "Rent", 0, 3420, 3, 2, 926, "Bedok Reservoir MRT", 6, 1.3339, 103.9188, "Established resale", assets.interlace],
  ["jurong-lake-demo", "Jurong Lake Gardens Flat · Demo", "D22 · Jurong", "Yuan Ching Road · illustrative address", "Buy", 698000, 0, 3, 2, 990, "Lakeside MRT", 8, 1.3447, 103.7204, "Recent flat", assets.skyline],
  ["choa-chu-kang-demo", "Choa Chu Kang Park Flat · Demo", "D23 · Choa Chu Kang", "Choa Chu Kang Avenue 4 · illustrative address", "Buy", 628000, 0, 3, 2, 1033, "Yew Tee MRT", 9, 1.3975, 103.7472, "Established resale", assets.marina],
  ["clementi-crest-demo", "Clementi Crest Flat · Demo", "D05 · Buona Vista", "Clementi Avenue 4 · illustrative address", "Buy", 838000, 0, 4, 2, 1119, "Clementi MRT", 6, 1.3164, 103.7653, "Recent flat", assets.interlace],
] as const;

const singaporeHdb: Property[] = hdbRows.map(([id, title, district, address, mode, price, monthlyRent, beds, baths, size, mrt, minutes, latitude, longitude, era, image], index) => {
  const guidePrice = price || Math.round(monthlyRent * 220);
  return {
    id, marketId: "singapore", title, district, address, category: "Residential", type: "HDB Flat", mode, price: guidePrice, monthlyRent: monthlyRent || undefined, beds, baths, size, tenure: "99-year", mrt, minutes, latitude, longitude, tags: ["HDB demo", era, `${beds}-room layout`], tone: index % 2 ? "terracotta" : "city", image, gallery: [image, assets.marina, assets.skyline], virtualTourAvailable: ["queenstown-skyline-demo", "bishan-grove-demo", "tampines-verge-demo"].includes(id),
    detail: `An ${era.toLowerCase()} HDB flat included as an illustrative UrbanKey demonstration listing. Layout, availability, price, and all property particulars require independent verification before any decision.`, transactions: [mode === "Rent" ? rent(monthlyRent, size) : sale(guidePrice, size)],
  };
});

const commercialRows = [
  ["tanjong-pagar-office-18", "Anson Exchange Office Suite", "D02 · Tanjong Pagar", "10 Anson Road", "Office", "Rent", 4680000, 23800, 3680, "99-year", "Tanjong Pagar MRT", 3, 1.2758, 103.8464, assets.office, "Office · Professional services", 3, 2.8, "Shared service bay", 3, "2026-09-01"],
  ["robinson-office-09", "Robinson Green Workplace", "D01 · Marina Bay", "88 Robinson Road", "Office", "Buy", 5980000, 29200, 4210, "Freehold", "Shenton Way MRT", 4, 1.2793, 103.8489, assets.office, "Office · Corporate headquarters", 3.5, 3, "Basement service bay", 4, "2026-10-15"],
  ["keong-saik-shophouse", "Keong Saik Conservation House", "D02 · Tanjong Pagar", "41 Keong Saik Road", "Shophouse", "Sell", 12800000, 42000, 4860, "Freehold", "Outram Park MRT", 6, 1.2805, 103.8414, assets.shophouse, "F&B · Retail · Office", 4, 3.6, "Rear service lane", 0, "2026-12-01"],
  ["joo-chiat-shophouse", "Joo Chiat Creative Shophouse", "D15 · East Coast", "112 Joo Chiat Road", "Shophouse", "Rent-Out", 6200000, 21800, 3280, "Freehold", "Marine Parade MRT", 9, 1.3087, 103.9039, assets.shophouse, "Retail · Studio · Office", 3.5, 3.3, "Sheltered rear access", 1, "2026-08-15"],
  ["tuas-logistics-park", "Tuas Logistics Hub", "D22 · Jurong", "31 Tuas South Avenue 8", "Warehouse", "Rent", 9800000, 68000, 28400, "30-year", "Tuas Link MRT", 12, 1.3108, 103.6318, assets.warehouse, "Warehouse · Logistics", 15, 12, "4 dock levellers · 2 drive-in bays", 18, "2026-11-01"],
  ["changi-airfreight-warehouse", "Changi Airfreight Warehouse", "D17 · Changi", "7 Changi North Street 1", "Warehouse", "Rent-Out", 12800000, 74500, 31600, "30-year", "Tampines East MRT", 15, 1.3658, 103.9715, assets.warehouse, "Warehouse · Airfreight", 20, 10.5, "6 loading bays · secure yard", 22, "2027-01-01"],
  ["paya-lebar-office-building", "Paya Lebar Enterprise House", "D14 · Geylang", "62 Paya Lebar Road", "Office Building", "Sell", 48800000, 198000, 42800, "Freehold", "Paya Lebar MRT", 3, 1.3182, 103.8928, assets.office, "Office building · Retail podium", 4, 3.2, "Dedicated service lane", 36, "2027-03-01"],
  ["one-north-office-building", "One-North Innovation Building", "D05 · Buona Vista", "23 Fusionopolis Way", "Office Building", "Buy", 63800000, 242000, 58600, "60-year", "one-north MRT", 2, 1.2997, 103.7875, assets.office, "Office building · R&D support", 5, 3.4, "Dedicated basement loading bay", 52, "2027-06-01"],
  ["woodlands-factory-building", "Woodlands Advanced Manufacturing Centre", "D25 · Woodlands", "18 Woodlands Sector 1", "Factory Building", "Sell", 23800000, 126000, 67200, "30-year", "Woodlands North MRT", 13, 1.4582, 103.7862, assets.factory, "B2 Factory · Advanced manufacturing", 25, 6.5, "3 goods lifts · 4 loading bays", 48, "2027-02-01"],
  ["jurong-factory-building", "Jurong Precision Factory", "D22 · Jurong", "5 Pioneer Sector Walk", "Factory Building", "Rent-Out", 17800000, 98500, 51400, "30-year", "Pioneer MRT", 14, 1.3136, 103.6814, assets.factory, "B2 Factory · Precision engineering", 30, 8, "Drive-in production bays · 2 loading docks", 34, "2026-10-01"],
] as const;

const singaporeCommercial: Property[] = commercialRows.map(([id, title, district, address, type, mode, price, monthlyRent, size, tenure, mrt, minutes, latitude, longitude, image, commercialUsage, floorLoading, ceilingHeight, loadingAccess, parkingLots, availableFrom]) => ({
  id, marketId: "singapore", title, district, address, category: "Commercial", type, mode, price, monthlyRent, beds: 0, baths: type === "Office" ? 2 : type === "Shophouse" ? 4 : 8, size, tenure, mrt, minutes, latitude, longitude, image, gallery: type === "Shophouse" ? galleries.shophouse : type.includes("Office") ? galleries.office : type === "Warehouse" ? galleries.logistics : galleries.factory, tags: [type, commercialUsage.split(" · ")[0], `${parkingLots} parking lots`], tone: type === "Shophouse" ? "ochre" : type.includes("Office") ? "slate" : "terracotta", virtualTourAvailable: id === "tanjong-pagar-office-18",
  commercialUsage, floorLoading, ceilingHeight, loadingAccess, parkingLots, availableFrom,
  detail: type === "Office" ? "A professionally configured workplace with efficient floor plates, flexible meeting areas, and strong transport connectivity." : type === "Shophouse" ? "A character-rich conservation property with prominent frontage, adaptable upper floors, and practical service access." : type === "Warehouse" ? "A logistics-ready facility with high-clearance storage, robust floor loading, secure yard circulation, and ancillary office space." : type === "Office Building" ? "A whole-building commercial opportunity with adaptable office floors, dedicated service access, and business-district connectivity." : "A production-ready industrial facility with reinforced floors, high-capacity loading infrastructure, and self-contained administration space.",
  transactions: [mode === "Rent" || mode === "Rent-Out" ? rent(monthlyRent, size, type.includes("Building") || type === "Shophouse" ? "Whole" : "Representative unit") : sale(price, size, type.includes("Building") || type === "Shophouse" ? "Whole" : "Representative unit")],
}));

const planningRows = [
  ["jakarta-garden-planning-demo", "indonesia", "Jakarta Garden Residence · Planning Demo", "Jakarta", "Condominium", "Buy", 2650000000, 0, 2, 2, 92, "Illustrative Jakarta transit node", 8, -6.2297, 106.8269, assets.marina],
  ["tangerang-office-planning-demo", "indonesia", "Tangerang Flexible Office · Planning Demo", "Tangerang", "Office", "Rent", 7800000000, 65000000, 0, 2, 380, "Illustrative Tangerang transit node", 11, -6.1783, 106.6319, assets.office],
  ["kl-sky-planning-demo", "malaysia", "Kuala Lumpur Sky Home · Planning Demo", "Kuala Lumpur", "Condominium", "Buy", 1250000, 0, 2, 2, 88, "Illustrative Kuala Lumpur transit node", 7, 3.1517, 101.6942, assets.marina],
  ["johor-office-planning-demo", "malaysia", "Johor Creative Office · Planning Demo", "Johor Bahru", "Office", "Rent", 1850000, 11500, 0, 2, 310, "Illustrative Johor transit node", 9, 1.4927, 103.7414, assets.office],
  ["bangkok-riverside-planning-demo", "thailand", "Bangkok Riverside Apartment · Planning Demo", "Bangkok", "Apartment", "Buy", 8900000, 0, 2, 2, 76, "Illustrative Bangkok transit node", 6, 13.7246, 100.5331, assets.interlace],
  ["chonburi-office-planning-demo", "thailand", "Chonburi Business Hub · Planning Demo", "Chonburi", "Office", "Rent", 22000000, 160000, 0, 3, 540, "Illustrative Chonburi transit node", 14, 13.3611, 100.9847, assets.office],
  ["hcm-garden-planning-demo", "vietnam", "Ho Chi Minh Garden Apartment · Planning Demo", "Ho Chi Minh City", "Apartment", "Buy", 6800000000, 0, 2, 2, 82, "Illustrative Ho Chi Minh City transit node", 10, 10.7769, 106.7009, assets.marina],
  ["hanoi-workspace-planning-demo", "vietnam", "Hanoi Flexible Workspace · Planning Demo", "Hanoi", "Office", "Rent", 18000000000, 120000000, 0, 3, 470, "Illustrative Hanoi transit node", 12, 21.0285, 105.8542, assets.office],
  ["makati-residence-planning-demo", "philippines", "Makati Residence · Planning Demo", "Makati", "Condominium", "Buy", 13500000, 0, 2, 2, 86, "Illustrative Makati transit node", 9, 14.5547, 121.0244, assets.skyline],
  ["taguig-office-planning-demo", "philippines", "Taguig Harbour Office · Planning Demo", "Taguig", "Office", "Rent", 92000000, 540000, 0, 3, 520, "Illustrative Taguig transit node", 8, 14.5176, 121.0509, assets.office],
] as const;

const planningProperties: Property[] = planningRows.map(([id, marketId, title, district, type, mode, price, monthlyRent, beds, baths, size, mrt, minutes, latitude, longitude, image]) => ({
  id, marketId, title, district, address: "Illustrative location only — not a real listing address", category: type === "Office" ? "Commercial" : "Residential", type, mode, price, monthlyRent: monthlyRent || undefined, beds, baths, size, tenure: "Illustrative tenure", mrt, minutes, latitude, longitude, image, gallery: [image, assets.marina, assets.office], planningDemo: true, tags: ["Illustrative planning demo", "Future market", "Not live inventory"], tone: type === "Office" ? "slate" : "city", detail: `Illustrative future-market planning inventory for ${marketId}. This record is not a live, available, or verified property listing and must not be used to assess pricing, availability, ownership, or local market conditions.`, commercialUsage: type === "Office" ? "Illustrative office use" : undefined, floorLoading: type === "Office" ? 2.5 : undefined, ceilingHeight: type === "Office" ? 3 : undefined, parkingLots: type === "Office" ? 4 : undefined, transactions: [],
}));

export const properties: Property[] = [...singaporeResidential, ...singaporeHdb, ...singaporeCommercial, ...planningProperties];

export const singaporeDistricts = [
  "D01 · Marina Bay", "D02 · Tanjong Pagar", "D03 · Queenstown", "D04 · Harbourfront", "D05 · Buona Vista", "D10 · Tanglin", "D14 · Geylang", "D15 · East Coast", "D16 · Bedok", "D17 · Changi", "D18 · Tampines", "D19 · Sengkang", "D20 · Bishan", "D22 · Jurong", "D23 · Choa Chu Kang", "D25 · Woodlands", "D27 · Yishun",
];

export const propertyTypes = ["Condominium", "Apartment", "HDB Flat", "Office", "Shophouse", "Warehouse", "Office Building", "Factory Building"] as const;
export const commercialPropertyTypes = ["Office", "Shophouse", "Warehouse", "Office Building", "Factory Building"] as const;
export const agentSteps = [
  ["1", "Clarify", "Capture needs, target areas, budget, timeline, and consent preferences."],
  ["2", "Source", "Compare candidate listings and prepare viewing shortlists for approval."],
  ["3", "Coordinate", "Draft appointment, paperwork, professional hand-off, and follow-up tasks."],
  ["4", "Confirm", "Keep approvals visible before any external communication or commitment."],
] as const;

export const propertyAgentSafeguardNotice = "UrbanKey prepares and tracks workflow material only. It does not provide legal, tax, financial, eligibility, licensing, or regulatory advice; make binding offers; accept terms; send external communications; transfer funds; or submit documents to a government agency, lawyer, bank, owner, or other party without the customer’s explicit authorisation and the appropriate professional review.";

export function isRental(property: Property) {
  return property.mode === "Rent" || property.mode === "Rent-Out";
}

export function displayPrice(property: Property) {
  if (isRental(property) && property.monthlyRent) return `S$${property.monthlyRent.toLocaleString("en-SG")} / mo`;
  return `S$${(property.price / 1_000_000).toFixed(property.price >= 10_000_000 ? 1 : 2).replace(/\.00$/, "")}m`;
}

export function displayPricePerArea(property: Property) {
  const amount = isRental(property) && property.monthlyRent ? property.monthlyRent : property.price;
  return `S$${Math.round(amount / property.size).toLocaleString("en-SG")} / sq ft${isRental(property) ? " / mo" : ""}`;
}
