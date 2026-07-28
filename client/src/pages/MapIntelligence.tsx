import { BrandHeader } from "@/components/BrandHeader";
import { MapView } from "@/components/Map";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import type { Property } from "@shared/propertyData";
import { Box, Building2, Eye, EyeOff, Layers3, LocateFixed, MapPinned, Route, TrainFront, Warehouse, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

type LayerState = { districts: boolean; mrt: boolean; threeD: boolean };

function isCompactMapViewport() {
  return typeof window !== "undefined" && (window.innerWidth < 768 || window.innerHeight < 480);
}

export default function MapIntelligence() {
  const { data: properties = [] } = trpc.property.list.useQuery();
  const forceMapFallback = new URLSearchParams(window.location.search).get("mapFallback") === "1";
  const [selected, setSelected] = useState<Property | null>(null);
  const [layers, setLayers] = useState<LayerState>({ districts: true, mrt: true, threeD: true });
  const [mobilePanelsHidden, setMobilePanelsHidden] = useState(isCompactMapViewport);
  const mapRef = useRef<google.maps.Map | null>(null);
  const compactViewportRef = useRef(isCompactMapViewport());
  const overlaysRef = useRef<{ districts: google.maps.Polygon[]; mrt: google.maps.Circle[]; markers: google.maps.marker.AdvancedMarkerElement[]; cluster?: google.maps.marker.AdvancedMarkerElement } | null>(null);
  useEffect(() => {
    const updateViewportMode = () => {
      const compact = isCompactMapViewport();
      if (compact !== compactViewportRef.current) {
        compactViewportRef.current = compact;
        setMobilePanelsHidden(compact);
      }
    };
    window.addEventListener("resize", updateViewportMode);
    window.addEventListener("orientationchange", updateViewportMode);
    return () => {
      window.removeEventListener("resize", updateViewportMode);
      window.removeEventListener("orientationchange", updateViewportMode);
    };
  }, []);
  const setupMap = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    map.setOptions({ tilt: 45, heading: -18, mapTypeId: "roadmap", gestureHandling: "greedy", styles: [{ featureType: "poi.business", stylers: [{ visibility: "off" }] }] });
    const districtShapes = [
      [{ lat: 1.266, lng: 103.842 }, { lat: 1.266, lng: 103.87 }, { lat: 1.292, lng: 103.87 }, { lat: 1.292, lng: 103.842 }],
      [{ lat: 1.272, lng: 103.786 }, { lat: 1.272, lng: 103.821 }, { lat: 1.297, lng: 103.821 }, { lat: 1.297, lng: 103.786 }],
      [{ lat: 1.292, lng: 103.808 }, { lat: 1.292, lng: 103.84 }, { lat: 1.316, lng: 103.84 }, { lat: 1.316, lng: 103.808 }],
    ];
    const districts = districtShapes.map(paths => new google.maps.Polygon({ map, paths, strokeColor: "#8b6b3d", strokeOpacity: 0.8, strokeWeight: 1.5, fillColor: "#c9a46c", fillOpacity: 0.1, clickable: false }));
    const mrt = properties.map(property => new google.maps.Circle({ map, center: { lat: property.latitude, lng: property.longitude }, radius: Math.max(450, property.mrtMinutes * 90), strokeColor: "#2e7665", strokeOpacity: 0.65, strokeWeight: 1, fillColor: "#5fa58e", fillOpacity: 0.12, clickable: false }));
    const markers = properties.map(property => {
      const markerEl = document.createElement("button");
      const selectAsset = () => {
        setSelected(property);
        map.panTo({ lat: property.latitude, lng: property.longitude });
      };
      markerEl.type = "button";
      markerEl.className = `map-property-pin${property.isCommercial ? " commercial" : ""}`;
      markerEl.setAttribute("aria-label", `View ${property.title}`);
      const value = (property.mode === "Rent" || property.mode === "Rent-Out") && property.monthlyRent ? `${Math.round(property.monthlyRent / 1000)}K/mo` : property.price >= 1000000 ? `${(property.price / 1000000).toFixed(1)}M` : property.price.toLocaleString();
      markerEl.innerHTML = `<small>${property.isCommercial ? "C/I" : "HOME"}</small><span>S$${value}</span>`;
      markerEl.addEventListener("click", selectAsset);
      const marker = new google.maps.marker.AdvancedMarkerElement({ map, position: { lat: property.latitude, lng: property.longitude }, content: markerEl, title: property.title });
      marker.addListener("click", selectAsset);
      return marker;
    });
    const clusterEl = document.createElement("button");
    clusterEl.className = "map-cluster-pin";
    clusterEl.setAttribute("aria-label", `Zoom into ${properties.length} properties`);
    clusterEl.innerHTML = `<strong>${properties.length}</strong><span>assets</span>`;
    const cluster = new google.maps.marker.AdvancedMarkerElement({ map: null, position: { lat: 1.334, lng: 103.817 }, content: clusterEl, title: `${properties.length} properties` });
    cluster.addListener("click", () => { map.setZoom(12); map.panTo({ lat: 1.334, lng: 103.817 }); });
    const updateClusters = () => { const clustered = (map.getZoom() || 13) <= 11; markers.forEach(marker => marker.map = clustered ? null : map); cluster.map = clustered ? map : null; };
    map.addListener("zoom_changed", updateClusters);
    updateClusters();
    overlaysRef.current = { districts, mrt, markers, cluster };
  }, [properties]);
  const toggle = (key: keyof LayerState) => {
    const next = !layers[key]; setLayers(current => ({ ...current, [key]: next }));
    const map = mapRef.current; const overlays = overlaysRef.current; if (!map || !overlays) return;
    if (key === "districts") overlays.districts.forEach(item => item.setMap(next ? map : null));
    if (key === "mrt") overlays.mrt.forEach(item => item.setMap(next ? map : null));
    if (key === "threeD") map.setOptions({ tilt: next ? 45 : 0, heading: next ? -18 : 0 });
  };
  return <div className="h-[var(--app-viewport-height)] min-h-0 overflow-hidden bg-[#10231e] text-[#17382f]"><BrandHeader tone="dark" /><main className="relative h-[calc(var(--app-viewport-height)-var(--site-header-height))] min-h-0">
    <MapView initialCenter={{ lat: 1.334, lng: 103.817 }} initialZoom={11} onMapReady={setupMap} forceFailureForTesting={forceMapFallback} className="h-full w-full" />
    <div id="map-intelligence-controls" className={`absolute left-[max(.75rem,env(safe-area-inset-left))] top-3 z-10 max-h-[calc(100%-5rem)] w-[calc(100%-1.5rem)] max-w-[412px] overflow-y-auto overscroll-contain rounded-[24px] border border-white/60 bg-[#faf9f5]/94 p-4 shadow-2xl backdrop-blur-xl sm:left-4 sm:top-4 sm:max-w-[330px] sm:p-5 ${mobilePanelsHidden ? "hidden md:block" : ""}`}><div className="flex items-start justify-between"><div><p className="eyebrow">Map intelligence</p><h1 className="mt-2 font-display text-2xl">Explore by context.</h1></div><span className="grid size-9 place-items-center rounded-full bg-[#e8eee9] text-[#275649]"><MapPinned className="size-4" /></span></div><p className="mt-3 text-xs leading-5 text-[#4e665f]">Tilt, zoom, and compare homes, offices, shophouses, warehouses, and factories across Singapore.</p><div className="mt-3 flex gap-3 text-[10px] font-bold uppercase tracking-[.12em]"><span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-[#17382f]" />Homes</span><span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-[#a66a2c]" />Commercial / industrial</span></div><div className="mt-5 grid gap-2">{[
      ["threeD", "3D building perspective", Box], ["districts", "District boundaries", Layers3], ["mrt", "MRT walk-time radius", TrainFront],
    ].map(([key, label, Icon]) => <div key={key as string} className="flex items-center gap-3 rounded-xl bg-white px-3 py-3"><span className="grid size-8 place-items-center rounded-full bg-[#edf1ed] text-[#275649]"><Icon className="size-4" /></span><span className="flex-1 text-xs font-semibold">{label as string}</span><Switch aria-label={label as string} checked={layers[key as keyof LayerState]} onCheckedChange={() => toggle(key as keyof LayerState)} /></div>)}</div><div className="mt-4 flex gap-2"><Button size="sm" variant="outline" className="flex-1 rounded-full bg-white" onClick={() => mapRef.current?.setCenter({ lat: 1.334, lng: 103.817 })}><LocateFixed className="mr-2 size-3.5" />Recenter</Button><Button onClick={() => toast.info("Choose a workplace, school, port, or logistics node to configure commute-time routing.")} size="sm" variant="outline" className="flex-1 rounded-full bg-white"><Route className="mr-2 size-3.5" />Commute</Button></div></div>
    <div className="absolute bottom-4 left-4 z-10 hidden rounded-full border border-white/40 bg-[#10231e]/78 px-4 py-2 text-[10px] font-semibold text-white backdrop-blur sm:block">Google Maps · Illustrative district and MRT overlays · Zoom out to cluster</div>
    {selected && <aside id="map-property-preview" aria-live="polite" className="absolute bottom-[max(.75rem,env(safe-area-inset-bottom))] right-[max(.75rem,env(safe-area-inset-right))] z-20 max-h-[calc(100%-5.5rem)] w-[calc(100%-1.5rem)] max-w-[512px] overflow-y-auto overscroll-contain rounded-[24px] border border-white/60 bg-[#faf9f5] shadow-2xl sm:bottom-4 sm:right-4 sm:max-w-[410px]"><div className="relative h-36 sm:h-44"><img src={selected.image} alt={selected.title} className="h-full w-full object-cover" /><button aria-label="Close property preview" onClick={() => setSelected(null)} className="absolute right-3 top-3 grid size-11 place-items-center rounded-full bg-white/90"><X className="size-4" /></button></div><div className="p-4 sm:p-5"><p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#76552f]">{selected.type} · {selected.district}</p><h2 className="mt-2 text-lg font-semibold">{selected.title}</h2><div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-[#4e665f]">{selected.isCommercial ? <><span>{selected.commercialUsage?.split(" · ")[0]}</span><span>{selected.floorLoading} kN/m²</span><span>{selected.ceilingHeight} m clear</span></> : <span>{selected.beds} beds</span>}<span>{selected.size.toLocaleString()} sq ft</span><span>{selected.mrtMinutes} min MRT</span></div><div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-lg font-semibold">{(selected.mode === "Rent" || selected.mode === "Rent-Out") && selected.monthlyRent ? `S$${selected.monthlyRent.toLocaleString()} / mo` : `S$${(selected.price / 1000000).toFixed(2)}M`}</p><Link href={`/property/${selected.id}`} className="w-full sm:w-auto"><Button className="w-full rounded-full bg-[#17382f] sm:w-auto">View property {selected.isCommercial ? <Warehouse className="ml-2 size-4" /> : <Building2 className="ml-2 size-4" />}</Button></Link></div></div></aside>}
    <button type="button" aria-controls="map-intelligence-controls map-property-preview" aria-pressed={!mobilePanelsHidden} onClick={() => setMobilePanelsHidden(hidden => !hidden)} className="absolute right-[max(.75rem,env(safe-area-inset-right))] top-3 z-30 inline-flex min-h-11 max-w-[calc(100%-1.5rem)] items-center gap-2 rounded-full bg-[#17382f] px-4 text-xs font-semibold text-white shadow-xl md:hidden">{mobilePanelsHidden ? <Eye className="size-4" /> : <EyeOff className="size-4" />}{mobilePanelsHidden ? "Show panels" : "Hide panels"}</button>
  </main></div>;
}
