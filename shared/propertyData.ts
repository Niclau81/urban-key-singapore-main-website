export type ListingMode = "Buy" | "Sell" | "Rent" | "Rent-Out";

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
};

const images = {
  marinaInterior: "/manus-storage/marina-interior_64621436.jpg",
  marinaSkyline: "/manus-storage/marina-skyline_8ccbeb9b.jpg",
  interlace: "/manus-storage/interlace-aerial_74c51dd9.jpg",
  tower: "/manus-storage/tower-concept_b7f9a5b6.jpg",
  luxuryInterior: "/manus-storage/luxury-interior_f4a25a40.jpg",
};

export const properties: Property[] = [
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

export const districts = ["All districts", "D01 · Marina Bay", "D04 · Harbourfront", "D10 · Tanglin"];

export const propertyHistoryDisclaimer =
  "Property and unit history shown here is curated demonstration data, may include unverified resident reports, and must not be treated as a factual allegation. Users should independently verify all material information through official records, the property owner, managing agent, and qualified advisers before making any decision.";

