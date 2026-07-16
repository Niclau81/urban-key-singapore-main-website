import type { Express, Request } from "express";

import { getMapsCredentialOrigins } from "./mapsProjectMetadata";

const MAPS_SCRIPT_PATH = "/v1/maps/proxy/maps/api/js";
const MAPS_LIBRARIES = "marker,places,geocoding,geometry";
const CACHE_TTL_MS = 15 * 60 * 1000;

type CachedScript = {
  body: string;
  contentType: string;
  expiresAt: number;
};

let cachedScript: CachedScript | null = null;
let pendingScript: Promise<CachedScript> | null = null;

function requestOrigin(req: Request) {
  const forwardedProto = req.header("x-forwarded-proto")?.split(",")[0]?.trim();
  const forwardedHost = req.header("x-forwarded-host")?.split(",")[0]?.trim();
  const protocol = forwardedProto || req.protocol;
  const host = forwardedHost || req.header("host");
  return host ? `${protocol}://${host}` : null;
}

function upstreamUrl() {
  const baseUrl = process.env.VITE_FRONTEND_FORGE_API_URL;
  const apiKey = process.env.VITE_FRONTEND_FORGE_API_KEY;
  if (!baseUrl || !apiKey) {
    throw new Error("Google Maps proxy configuration is unavailable");
  }

  const url = new URL(`${baseUrl.replace(/\/+$/, "")}${MAPS_SCRIPT_PATH}`);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("v", "weekly");
  url.searchParams.set("libraries", MAPS_LIBRARIES);
  return url;
}

export async function fetchMapsScript(
  origin: string | null,
  fetchImpl: typeof fetch = fetch,
  credentialOrigins = getMapsCredentialOrigins(),
): Promise<CachedScript> {
  const origins = Array.from(
    new Set([origin, ...credentialOrigins].filter(Boolean)),
  ) as string[];

  for (const candidateOrigin of origins) {
    const response = await fetchImpl(upstreamUrl(), {
      headers: { Origin: candidateOrigin },
      signal: AbortSignal.timeout(20_000),
    });

    if (response.ok) {
      const contentType = response.headers.get("content-type") || "";
      const body = await response.text();
      if (!contentType.includes("javascript") || !body.includes("google.maps")) {
        throw new Error("Google Maps proxy returned an invalid script response");
      }
      return {
        body,
        contentType: "text/javascript; charset=utf-8",
        expiresAt: Date.now() + CACHE_TTL_MS,
      };
    }

    if (response.status !== 401 && response.status !== 403) {
      throw new Error(`Google Maps proxy returned HTTP ${response.status}`);
    }
  }

  throw new Error("Google Maps proxy rejected the available project origins");
}

async function getMapsScript(origin: string | null) {
  if (cachedScript && cachedScript.expiresAt > Date.now()) return cachedScript;
  if (!pendingScript) {
    pendingScript = fetchMapsScript(origin).finally(() => {
      pendingScript = null;
    });
  }
  cachedScript = await pendingScript;
  return cachedScript;
}

export function registerMapsScriptProxy(app: Express) {
  app.get("/api/maps/script", async (req, res) => {
    try {
      const script = await getMapsScript(requestOrigin(req));
      res.setHeader("Content-Type", script.contentType);
      res.setHeader("Cache-Control", "public, max-age=900, stale-while-revalidate=3600");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.send(script.body);
    } catch (error) {
      console.error("[Maps] Unable to load managed Google Maps script", error);
      res.status(502).type("text/plain").send("Google Maps is temporarily unavailable");
    }
  });
}
