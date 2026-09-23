import { createClient, type Session, type User } from "@supabase/supabase-js";
import { hasSupabaseConfig, externalConfig } from "./config";
import { properties, type ListingMode, type Property } from "../data";

export type LiveListing = {
  id: string;
  title: string;
  district: string;
  address: string;
  category: "Buy" | "Rent" | "Commercial" | "Residential";
  property_type: string;
  price_label: string;
  bedrooms: number | null;
  bathrooms: number | null;
  size_label: string;
  mrt_name: string | null;
  mrt_minutes: number | null;
  tags: string[] | null;
  image_tone: string | null;
  image_url: string | null;
  description: string;
  is_published: boolean;
  listing_status?: "draft" | "active" | "paused";
  mode?: ListingMode;
  market_id?: "singapore" | "indonesia" | "malaysia" | "thailand" | "vietnam" | "philippines";
  price?: number | null;
  monthly_rent?: number | null;
  size?: number | null;
  tenure?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  gallery_urls?: string[] | null;
  is_planning_demo?: boolean | null;
  virtual_tour_available?: boolean | null;
  commercial_usage?: string | null;
  floor_loading?: number | null;
  ceiling_height?: number | null;
  loading_access?: string | null;
  parking_lots?: number | null;
  available_from?: string | null;
};

export type AgentTask = { id: string; title: string; status: "open" | "in_review" | "complete" | "blocked"; due_at: string | null; created_at: string; requires_authorization?: boolean; category?: string };
export type EnquiryInput = { listingId?: string; enquiryType: "viewing" | "property_agent" | "general"; message: string; contactName: string; contactEmail: string };
export type Profile = { id: string; display_name: string | null; persona: "buyer_tenant" | "seller_landlord" | "agent_cobroker" | null; role: "customer" | "agent" | "admin"; district: string | null; budget: string | null };
export type AgentProfile = { user_id: string; professional_type: "agent" | "cobroker"; company_name: string; licence_number: string; phone: string; postal_code: string; terms_accepted_at: string; verification_status: "pending" | "verified" | "rejected" };
export type ManagedListingInput = {
  title: string; district: string; address: string; propertyType: string; mode: ListingMode; price: number; monthlyRent?: number; size: number; tenure: string; bedrooms?: number; bathrooms?: number; mrtName?: string; mrtMinutes?: number; description: string; commercialUsage?: string; floorLoading?: number; ceilingHeight?: number; loadingAccess?: string; parkingLots?: number;
};
export type PropertyAgentCase = { id: string; journey: "buy" | "sell" | "rent" | "rent_out"; status: string; requirements: string; consent_recorded_at: string | null; created_at: string };
export type DashboardData = { profile: Profile | null; saved: LiveListing[]; enquiries: { id: string; enquiry_type: string; status: string; created_at: string; listing_id: string | null; catalog_listing_id?: string | null }[]; listings: LiveListing[]; cases: PropertyAgentCase[] };

const client = hasSupabaseConfig
  ? createClient(externalConfig.supabaseUrl!, externalConfig.supabasePublishableKey!, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
  : null;

function propertyToLiveListing(property: Property): LiveListing {
  return {
    id: property.id,
    title: property.title,
    district: property.district,
    address: property.address,
    category: property.category,
    property_type: property.type,
    price_label: property.mode === "Rent" || property.mode === "Rent-Out" ? `S$${(property.monthlyRent ?? property.price).toLocaleString("en-SG")} / mo` : `S$${(property.price / 1_000_000).toFixed(2)}m`,
    bedrooms: property.beds,
    bathrooms: property.baths,
    size_label: `${property.size.toLocaleString("en-SG")} sq ft`,
    mrt_name: property.mrt,
    mrt_minutes: property.minutes,
    tags: property.tags,
    image_tone: property.tone,
    image_url: property.image,
    description: property.detail,
    is_published: true,
    mode: property.mode,
    market_id: property.marketId,
    price: property.price,
    monthly_rent: property.monthlyRent,
    size: property.size,
    tenure: property.tenure,
    latitude: property.latitude,
    longitude: property.longitude,
    gallery_urls: property.gallery,
    is_planning_demo: property.planningDemo,
    virtual_tour_available: property.virtualTourAvailable,
    commercial_usage: property.commercialUsage,
    floor_loading: property.floorLoading,
    ceiling_height: property.ceilingHeight,
    loading_access: property.loadingAccess,
    parking_lots: property.parkingLots,
    available_from: property.availableFrom,
  };
}

function configured() {
  if (!client) throw new Error("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.");
  return client;
}

async function signedInUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Sign in before using this protected workflow.");
  return user;
}

export const isSupabaseReady = () => client !== null;
export const getSession = async (): Promise<Session | null> => (await client?.auth.getSession())?.data.session ?? null;
export const getCurrentUser = async (): Promise<User | null> => (await client?.auth.getUser())?.data.user ?? null;

export async function requestMagicLink(email: string) {
  const supabase = configured();
  const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
  if (error) throw error;
}

export async function signOut() {
  if (!client) return;
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

export async function fetchListings(): Promise<LiveListing[]> {
  if (!client) return [];
  const { data, error } = await client.from("listings").select("*").eq("is_published", true).order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as LiveListing[];
}

export async function fetchManagedListings(): Promise<LiveListing[]> {
  const supabase = configured();
  await signedInUser();
  const { data, error } = await supabase.from("listings").select("*").order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as LiveListing[];
}

export async function createManagedListing(input: ManagedListingInput) {
  const supabase = configured();
  const user = await signedInUser();
  const payload = {
    title: input.title, district: input.district, address: input.address, category: ["Office", "Shophouse", "Warehouse", "Office Building", "Factory Building"].includes(input.propertyType) ? "Commercial" : "Residential", property_type: input.propertyType, mode: input.mode, price: input.price, monthly_rent: input.monthlyRent ?? null, price_label: input.monthlyRent ? `S$${input.monthlyRent.toLocaleString("en-SG")} / mo` : `S$${(input.price / 1_000_000).toFixed(2)}m`, bedrooms: input.bedrooms ?? null, bathrooms: input.bathrooms ?? null, size: input.size, size_label: `${input.size.toLocaleString("en-SG")} sq ft`, tenure: input.tenure, mrt_name: input.mrtName ?? null, mrt_minutes: input.mrtMinutes ?? null, description: input.description, commercial_usage: input.commercialUsage ?? null, floor_loading: input.floorLoading ?? null, ceiling_height: input.ceilingHeight ?? null, loading_access: input.loadingAccess ?? null, parking_lots: input.parkingLots ?? null, created_by: user.id, is_published: false,
  };
  const { data, error } = await supabase.from("listings").insert(payload).select("*").single();
  if (error) throw error;
  return data as LiveListing;
}

export async function updateManagedListingStatus(id: string, status: "draft" | "active" | "paused") {
  const supabase = configured();
  await signedInUser();
  const { error } = await supabase.from("listings").update({ listing_status: status, is_published: status === "active" }).eq("id", id);
  if (error) throw error;
}

export async function toggleFavourite(listingId: string) {
  const supabase = configured();
  const user = await signedInUser();
  if (properties.some(property => property.id === listingId)) {
    const { data, error } = await supabase.from("catalog_favourites").select("property_id").eq("user_id", user.id).eq("property_id", listingId).maybeSingle();
    if (error) throw error;
    if (data) {
      const { error: removeError } = await supabase.from("catalog_favourites").delete().eq("user_id", user.id).eq("property_id", listingId);
      if (removeError) throw removeError;
      return false;
    }
    const { error: addError } = await supabase.from("catalog_favourites").insert({ user_id: user.id, property_id: listingId });
    if (addError) throw addError;
    return true;
  }
  const { data, error } = await supabase.from("favourites").select("listing_id").eq("user_id", user.id).eq("listing_id", listingId).maybeSingle();
  if (error) throw error;
  if (data) {
    const { error: removeError } = await supabase.from("favourites").delete().eq("user_id", user.id).eq("listing_id", listingId);
    if (removeError) throw removeError;
    return false;
  }
  const { error: addError } = await supabase.from("favourites").insert({ user_id: user.id, listing_id: listingId });
  if (addError) throw addError;
  return true;
}

/** Backwards-compatible alias for prior card implementation. */
export const saveFavourite = toggleFavourite;

export async function fetchFavouriteListings(): Promise<LiveListing[]> {
  const supabase = configured();
  const user = await signedInUser();
  const [{ data: listingData, error: listingError }, { data: catalogData, error: catalogError }] = await Promise.all([
    supabase.from("favourites").select("listing_id, listings(*)").eq("user_id", user.id),
    supabase.from("catalog_favourites").select("property_id").eq("user_id", user.id),
  ]);
  if (listingError) throw listingError;
  if (catalogError) throw catalogError;
  const published = (listingData ?? [])
    .map(row => (row as unknown as { listings: LiveListing | LiveListing[] | null }).listings)
    .flatMap(listing => Array.isArray(listing) ? listing : listing ? [listing] : []);
  const savedCatalog = (catalogData ?? [])
    .map(row => properties.find(property => property.id === row.property_id))
    .filter((property): property is Property => Boolean(property))
    .map(propertyToLiveListing);
  return [...published, ...savedCatalog];
}

export async function submitEnquiry(input: EnquiryInput) {
  const supabase = configured();
  const user = await signedInUser();
  if (input.message.trim().length < 10) throw new Error("Please provide at least 10 characters so the authorised reviewer has enough context.");
  const catalogListingId = input.listingId && properties.some(property => property.id === input.listingId) ? input.listingId : null;
  const { error } = await supabase.from("enquiries").insert({ listing_id: catalogListingId ? null : input.listingId ?? null, catalog_listing_id: catalogListingId, user_id: user.id, enquiry_type: input.enquiryType, message: input.message.trim(), contact_name: input.contactName.trim(), contact_email: input.contactEmail.trim() });
  if (error) throw error;
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = configured();
  const user = await signedInUser();
  const { data, error } = await supabase.from("profiles").select("id,display_name,persona,role,district,budget").eq("id", user.id).maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function saveProfile(input: Pick<Profile, "display_name" | "persona" | "district" | "budget">) {
  const supabase = configured();
  const user = await signedInUser();
  const { error } = await supabase.from("profiles").upsert({ id: user.id, ...input }, { onConflict: "id" });
  if (error) throw error;
}

export async function registerAgentProfile(input: Omit<AgentProfile, "user_id" | "terms_accepted_at" | "verification_status">) {
  const supabase = configured();
  const user = await signedInUser();
  const { error } = await supabase.from("agent_profiles").upsert({ user_id: user.id, ...input, terms_accepted_at: new Date().toISOString(), verification_status: "pending" }, { onConflict: "user_id" });
  if (error) throw error;
}

export async function getAgentProfile(): Promise<AgentProfile | null> {
  const supabase = configured();
  const user = await signedInUser();
  const { data, error } = await supabase.from("agent_profiles").select("*").eq("user_id", user.id).maybeSingle();
  if (error) throw error;
  return data as AgentProfile | null;
}

export async function fetchAgentTasks(): Promise<AgentTask[]> {
  const supabase = configured();
  await signedInUser();
  const { data, error } = await supabase.from("agent_tasks").select("id,title,status,due_at,created_at,requires_authorization,category").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as AgentTask[];
}

export async function updateAgentTaskStatus(id: string, status: AgentTask["status"]) {
  const supabase = configured();
  await signedInUser();
  const { error } = await supabase.from("agent_tasks").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function createPropertyAgentCase(input: { journey: PropertyAgentCase["journey"]; requirements: string; consent: boolean }) {
  if (!input.consent) throw new Error("Recorded processing consent is required before a Property Agent case can be created.");
  const supabase = configured();
  await signedInUser();
  const { data, error } = await supabase.rpc("create_property_agent_case", { p_journey: input.journey, p_requirements: input.requirements.trim() });
  if (error) throw error;
  return data as string;
}

export async function fetchPropertyAgentCases(): Promise<PropertyAgentCase[]> {
  const supabase = configured();
  await signedInUser();
  const { data, error } = await supabase.from("property_agent_cases").select("id,journey,status,requirements,consent_recorded_at,created_at").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PropertyAgentCase[];
}

export async function getDashboardData(): Promise<DashboardData> {
  const [profile, saved, enquiries, listings, cases] = await Promise.all([
    getProfile(), fetchFavouriteListings(), (async () => {
      const supabase = configured(); const user = await signedInUser(); const { data, error } = await supabase.from("enquiries").select("id,enquiry_type,status,created_at,listing_id,catalog_listing_id").eq("user_id", user.id).order("created_at", { ascending: false }); if (error) throw error; return data ?? [];
    })(), fetchManagedListings(), fetchPropertyAgentCases(),
  ]);
  return { profile, saved, enquiries, listings, cases };
}

export async function uploadTourMedia(file: File, listingId: string, metadata: { roomLabel: string; hasAuthority: boolean; hasConsent: boolean }) {
  if (!metadata.hasAuthority || !metadata.hasConsent) throw new Error("Owner authority and capture consent must be recorded before a tour capture can be stored.");
  if (!(file.type === "image/jpeg" || file.type === "image/webp")) throw new Error("Only JPEG or WebP tour captures are accepted for quality review.");
  if (file.size > 20 * 1024 * 1024) throw new Error("Tour captures must be 20 MB or smaller.");
  const supabase = configured();
  const user = await signedInUser();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const path = `${user.id}/${listingId}/${crypto.randomUUID()}-${safeName}`;
  const { error: uploadError } = await supabase.storage.from("tour-media").upload(path, file, { upsert: false, contentType: file.type });
  if (uploadError) throw uploadError;
  const { error: recordError } = await supabase.from("tour_captures").insert({ listing_id: listingId, owner_id: user.id, storage_path: path, filename: safeName, mime_type: file.type, byte_size: file.size, room_label: metadata.roomLabel.trim(), authority_confirmed: true, consent_confirmed: true, review_status: "submitted" });
  if (recordError) throw recordError;
  return path;
}
