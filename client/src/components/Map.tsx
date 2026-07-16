/**
 * GOOGLE MAPS FRONTEND INTEGRATION - ESSENTIAL GUIDE
 *
 * USAGE FROM PARENT COMPONENT:
 * ======
 *
 * const mapRef = useRef<google.maps.Map | null>(null);
 *
 * <MapView
 *   initialCenter={{ lat: 40.7128, lng: -74.0060 }}
 *   initialZoom={15}
 *   onMapReady={(map) => {
 *     mapRef.current = map; // Store to control map from parent anytime, google map itself is in charge of the re-rendering, not react state.
 * </MapView>
 *
 * ======
 * Available Libraries and Core Features:
 * -------------------------------
 * 📍 MARKER (from `marker` library)
 * - Attaches to map using { map, position }
 * new google.maps.marker.AdvancedMarkerElement({
 *   map,
 *   position: { lat: 37.7749, lng: -122.4194 },
 *   title: "San Francisco",
 * });
 *
 * -------------------------------
 * 🏢 PLACES (from `places` library)
 * - Does not attach directly to map; use data with your map manually.
 * const place = new google.maps.places.Place({ id: PLACE_ID });
 * await place.fetchFields({ fields: ["displayName", "location"] });
 * map.setCenter(place.location);
 * new google.maps.marker.AdvancedMarkerElement({ map, position: place.location });
 *
 * -------------------------------
 * 🧭 GEOCODER (from `geocoding` library)
 * - Standalone service; manually apply results to map.
 * const geocoder = new google.maps.Geocoder();
 * geocoder.geocode({ address: "New York" }, (results, status) => {
 *   if (status === "OK" && results[0]) {
 *     map.setCenter(results[0].geometry.location);
 *     new google.maps.marker.AdvancedMarkerElement({
 *       map,
 *       position: results[0].geometry.location,
 *     });
 *   }
 * });
 *
 * -------------------------------
 * 📐 GEOMETRY (from `geometry` library)
 * - Pure utility functions; not attached to map.
 * const dist = google.maps.geometry.spherical.computeDistanceBetween(p1, p2);
 *
 * -------------------------------
 * 🛣️ ROUTES (from `routes` library)
 * - Combines DirectionsService (standalone) + DirectionsRenderer (map-attached)
 * const directionsService = new google.maps.DirectionsService();
 * const directionsRenderer = new google.maps.DirectionsRenderer({ map });
 * directionsService.route(
 *   { origin, destination, travelMode: "DRIVING" },
 *   (res, status) => status === "OK" && directionsRenderer.setDirections(res)
 * );
 *
 * -------------------------------
 * 🌦️ MAP LAYERS (attach directly to map)
 * - new google.maps.TrafficLayer().setMap(map);
 * - new google.maps.TransitLayer().setMap(map);
 * - new google.maps.BicyclingLayer().setMap(map);
 *
 * -------------------------------
 * ✅ SUMMARY
 * - “map-attached” → AdvancedMarkerElement, DirectionsRenderer, Layers.
 * - “standalone” → Geocoder, DirectionsService, DistanceMatrixService, ElevationService.
 * - “data-only” → Place, Geometry utilities.
 */

/// <reference types="@types/google.maps" />

import { useEffect, useRef, useState } from "react";
import { usePersistFn } from "@/hooks/usePersistFn";
import { cn } from "@/lib/utils";
import { loadGoogleMapsScript } from "@/lib/googleMapsLoader";

declare global {
  interface Window {
    google?: typeof google;
  }
}

interface MapViewProps {
  className?: string;
  initialCenter?: google.maps.LatLngLiteral;
  initialZoom?: number;
  onMapReady?: (map: google.maps.Map) => void;
  forceFailureForTesting?: boolean;
}

export function MapView({
  className,
  initialCenter = { lat: 37.7749, lng: -122.4194 },
  initialZoom = 12,
  onMapReady,
  forceFailureForTesting = false,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);

  const init = usePersistFn(async () => {
    if (forceFailureForTesting) {
      setLoadError(true);
      return;
    }
    try {
      setLoadError(false);
      await loadGoogleMapsScript();
    } catch {
      setLoadError(true);
      return;
    }
    if (!mapContainer.current) {
      console.error("Map container not found");
      return;
    }
    if (!window.google?.maps) {
      setLoadError(true);
      return;
    }
    map.current = new window.google.maps.Map(mapContainer.current, {
      zoom: initialZoom,
      center: initialCenter,
      mapTypeControl: true,
      fullscreenControl: true,
      zoomControl: true,
      streetViewControl: true,
      mapId: "DEMO_MAP_ID",
    });
    if (onMapReady) {
      onMapReady(map.current);
    }
  });

  useEffect(() => {
    init();
  }, [init, retryAttempt]);

  if (loadError) return <div className={cn("relative h-[500px] w-full overflow-hidden bg-[#102b25]", className)} role="status">
    <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "linear-gradient(rgba(213,174,114,.16) 1px,transparent 1px),linear-gradient(90deg,rgba(213,174,114,.16) 1px,transparent 1px)", backgroundSize: "48px 48px", transform: "perspective(600px) rotateX(52deg) scale(1.35)" }} />
    <div className="absolute left-[47%] top-[44%] h-44 w-72 -translate-x-1/2 -translate-y-1/2 rotate-[-12deg] rounded-[46%] border border-[#d5ae72]/35 bg-[#275649]/35 shadow-[0_0_80px_rgba(42,112,90,.35)]" />
    <div className="absolute left-1/2 top-1/2 rounded-2xl border border-white/10 bg-[#10231e]/85 px-5 py-4 text-center text-white shadow-xl backdrop-blur"><p className="text-xs font-semibold">Google Maps is temporarily unavailable</p><p className="mt-1 text-[10px] text-white/50">The map can retry without leaving this page.</p><button type="button" onClick={() => setRetryAttempt((attempt) => attempt + 1)} className="mt-3 rounded-full bg-[#d5ae72] px-3 py-1.5 text-[10px] font-bold text-[#17382f]">Retry map</button></div>
  </div>;

  return <div ref={mapContainer} className={cn("h-[500px] w-full", className)} />;
}
