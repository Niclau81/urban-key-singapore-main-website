import { createClient, type Session, type User } from "@supabase/supabase-js";
import { hasSupabaseConfig, externalConfig } from "./config";

export type LiveListing = {
  id: string;
  title: string;
  district: string;
  address: string;
  category: "Buy" | "Rent" | "Commercial";
  property_type: string;
  price_label: string;
  bedrooms: number | null;
  bathrooms: number | null;
  size_label: string;
  mrt_name: string | null;
  mrt_minutes: number | null;
  tags: string[];
  image_tone: string;
  description: string;
  is_published: boolean;
};

export type AgentTask = { id: string; title: string; status: "open" | "in_review" | "complete"; due_at: string | null; created_at: string };
export type EnquiryInput = { listingId?: string; enquiryType: "viewing" | "property_agent" | "general"; message: string; contactName: string; contactEmail: string };

const client = hasSupabaseConfig
  ? createClient(externalConfig.supabaseUrl!, externalConfig.supabasePublishableKey!, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
  : null;

export const isSupabaseReady = () => client !== null;
export const getSession = async (): Promise<Session | null> => (await client?.auth.getSession())?.data.session ?? null;
export const getCurrentUser = async (): Promise<User | null> => (await client?.auth.getUser())?.data.user ?? null;

export async function requestMagicLink(email: string) {
  if (!client) throw new Error("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.");
  const { error } = await client.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
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

export async function saveFavourite(listingId: string) {
  if (!client) throw new Error("Sign in and configure Supabase before saving properties.");
  const user = await getCurrentUser();
  if (!user) throw new Error("Sign in before saving a property.");
  const { error } = await client.from("favourites").upsert({ user_id: user.id, listing_id: listingId }, { onConflict: "user_id,listing_id" });
  if (error) throw error;
}

export async function submitEnquiry(input: EnquiryInput) {
  if (!client) throw new Error("Supabase is not configured. Add the public Supabase values first.");
  const user = await getCurrentUser();
  const { error } = await client.from("enquiries").insert({ listing_id: input.listingId ?? null, user_id: user?.id ?? null, enquiry_type: input.enquiryType, message: input.message, contact_name: input.contactName, contact_email: input.contactEmail });
  if (error) throw error;
}

export async function fetchAgentTasks(): Promise<AgentTask[]> {
  if (!client) return [];
  const { data, error } = await client.from("agent_tasks").select("id,title,status,due_at,created_at").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as AgentTask[];
}

export async function updateAgentTaskStatus(id: string, status: AgentTask["status"]) {
  if (!client) throw new Error("Sign in and configure Supabase before updating agent tasks.");
  const { error } = await client.from("agent_tasks").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function uploadTourMedia(file: File) {
  if (!client) throw new Error("Sign in and configure Supabase before uploading media.");
  const user = await getCurrentUser();
  if (!user) throw new Error("Sign in before uploading media.");
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const path = `${user.id}/${crypto.randomUUID()}-${safeName}`;
  const { error } = await client.storage.from("tour-media").upload(path, file, { upsert: false, contentType: file.type || "application/octet-stream" });
  if (error) throw error;
  return path;
}
