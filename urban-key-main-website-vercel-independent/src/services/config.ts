const readValue = (value: string | undefined) => value?.trim() || undefined;

export const externalConfig = {
  appTitle: readValue(import.meta.env.VITE_APP_TITLE) ?? "UrbanKey Singapore",
  supabaseUrl: readValue(import.meta.env.VITE_SUPABASE_URL),
  supabasePublishableKey: readValue(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY),
  googleMapsApiKey: readValue(import.meta.env.VITE_GOOGLE_MAPS_API_KEY),
};

export const hasSupabaseConfig = Boolean(externalConfig.supabaseUrl && externalConfig.supabasePublishableKey);
export const hasGoogleMapsConfig = Boolean(externalConfig.googleMapsApiKey);

export const integrationStatus = {
  auth: hasSupabaseConfig ? "ready" : "configuration required",
  database: hasSupabaseConfig ? "ready" : "configuration required",
  storage: hasSupabaseConfig ? "ready" : "configuration required",
  maps: hasGoogleMapsConfig ? "ready" : "configuration required",
};
