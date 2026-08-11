import { BrandHeader } from "@/components/BrandHeader";
import { MapView } from "@/components/Map";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMarket } from "@/contexts/MarketContext";
import { trpc } from "@/lib/trpc";
import { formatMarketCurrency } from "@shared/marketConfig";
import type { Property } from "@shared/propertyData";
import { Box, Building2, Eye, EyeOff, Layers3, LocateFixed, MapPinned, Route, TrainFront, Warehouse, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

type LayerState = { districts: boolean; mrt: boolean; threeD: boolean };

function isCompactMapViewport() {
  return typeof window !== "undefined" && (window.innerWidth < 768 || window.innerHeight < 480);
}

export default function MapIntelligence() {
  const { market } = useMarket();
  const { t } = useLanguage();
  const propertyQuery = useMemo(() => ({ marketId: market.id }), [market.id]);
  const { data: properties = [], isLoading: isLoadingProperties } = trpc.property.list.useQuery(propertyQuery);
  const forceMapFallback = new URLSearchParams(window.location.search).get("mapFallback") === "1";
  const [selected, setSelected] = useState<Property | null>(null);
  const [layers, setLayers] = useState<LayerState>({ districts: true, mrt: true, threeD: true });
  const [mobilePanelsHidden, setMobilePanelsHidden] = useState(isCompactMapViewport);
  const mapRef = useRef<google.maps.Map | null>(null);
  const compactViewportRef = useRef(isCompactMapViewport());
  const overlaysRef = useRef<{ districts: google.maps.Polygon[]; mrt: google.maps.Circle[]; markers: google.maps.marker.AdvancedMarkerElement[]; cluster?: google.maps.marker.AdvancedMarkerElement } | null>(null);
  const mapListenersRef = useRef<google.maps.MapsEventListener[]>([]);
  useEffect(() => setSelected(null), [market.id]);
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
    mapListenersRef.current.forEach(listener => listener.remove());
    mapListenersRef.current = [];
    const existing = overlaysRef.current;
    if (existing) {
      existing.districts.forEach(item => item.setMap(null));
      existing.mrt.forEach(item => item.setMap(null));
      existing.markers.forEach(item => item.map = null);
      if (existing.cluster) existing.cluster.map = null;
      overlaysRef.current = null;
    }
    map.setOptions({ tilt: layers.threeD ? 45 : 0, heading: layers.threeD ? -18 : 0, mapTypeId: "roadmap", gestureHandling: "greedy", styles: [{ featureType: "poi.business", stylers: [{ visibility: "off" }] }] });
    map.setCenter(market.map.center);
    map.setZoom(market.map.zoom);
    const districts = (market.map.regionPolygons ?? []).map(paths => new google.maps.Polygon({ map: layers.districts ? map : null, paths, strokeColor: "#8b6b3d", strokeOpacity: 0.8, strokeWeight: 1.5, fillColor: "#c9a46c", fillOpacity: 0.1, clickable: false }));
    const mrt = properties.map(property => new google.maps.Circle({ map: layers.mrt ? map : null, center: { lat: property.latitude, lng: property.longitude }, radius: Math.max(450, property.mrtMinutes * 90), strokeColor: "#2e7665", strokeOpacity: 0.65, strokeWeight: 1, fillColor: "#5fa58e", fillOpacity: 0.12, clickable: false }));
    const markers = properties.map(property => {
      const markerEl = document.createElement("button");
      const selectAsset = () => {
        setSelected(property);
        map.panTo({ lat: property.latitude, lng: property.longitude });
      };
      markerEl.type = "button";
      markerEl.className = `map-property-pin${property.isCommercial ? " commercial" : ""}`;
      markerEl.setAttribute("aria-label", t("map.viewAsset", { title: property.title }));
      const value = (property.mode === "Rent" || property.mode === "Rent-Out") && property.monthlyRent ? `${formatMarketCurrency(property.monthlyRent, market, { notation: "compact", maximumFractionDigits: 1 })}${t("card.perMonth")}` : formatMarketCurrency(property.price, market, { notation: "compact", maximumFractionDigits: 1 });
      markerEl.innerHTML = `<small>${property.isCommercial ? t("map.commercialPin") : t("map.homePin")}</small><span>${value}</span>`;
      markerEl.addEventListener("click", selectAsset);
      const marker = new google.maps.marker.AdvancedMarkerElement({ map, position: { lat: property.latitude, lng: property.longitude }, content: markerEl, title: property.title });
      marker.addListener("click", selectAsset);
      return marker;
    });
    const clusterEl = document.createElement("button");
    clusterEl.className = "map-cluster-pin";
    clusterEl.setAttribute("aria-label", t("map.zoomAssets", { count: properties.length, properties: market.terminology.propertyPlural }));
    clusterEl.innerHTML = `<strong>${properties.length}</strong><span>${t("map.assets")}</span>`;
    const cluster = new google.maps.marker.AdvancedMarkerElement({ map: null, position: market.map.center, content: clusterEl, title: `${properties.length} ${market.terminology.propertyPlural}` });
    cluster.addListener("click", () => { map.setZoom(Math.max(market.map.zoom + 1, 12)); map.panTo(market.map.center); });
    const updateClusters = () => { const clustered = (map.getZoom() || market.map.zoom) <= Math.max(market.map.zoom, 11); markers.forEach(marker => marker.map = clustered ? null : map); cluster.map = clustered && properties.length > 0 ? map : null; };
    mapListenersRef.current.push(map.addListener("zoom_changed", updateClusters));
    updateClusters();
    overlaysRef.current = { districts, mrt, markers, cluster };
  }, [layers.districts, layers.mrt, layers.threeD, market, properties, t]);
  useEffect(() => {
    if (mapRef.current) setupMap(mapRef.current);
  }, [setupMap]);
  const toggle = (key: keyof LayerState) => {
    const next = !layers[key]; setLayers(current => ({ ...current, [key]: next }));
    const map = mapRef.current; const overlays = overlaysRef.current; if (!map || !overlays) return;
    if (key === "districts") overlays.districts.forEach(item => item.setMap(next ? map : null));
    if (key === "mrt") overlays.mrt.forEach(item => item.setMap(next ? map : null));
    if (key === "threeD") map.setOptions({ tilt: next ? 45 : 0, heading: next ? -18 : 0 });
  };
  return <div className="h-[var(--app-viewport-height)] min-h-0 overflow-hidden bg-[#10231e] text-[#17382f]"><BrandHeader tone="dark" /><main className="relative h-[calc(var(--app-viewport-height)-var(--site-header-height))] min-h-0">
    <MapView initialCenter={market.map.center} initialZoom={market.map.zoom} onMapReady={setupMap} forceFailureForTesting={forceMapFallback} className="h-full w-full" />
    <div id="map-intelligence-controls" className={`absolute left-[max(.75rem,env(safe-area-inset-left))] top-3 z-10 max-h-[calc(100%-5rem)] w-[calc(100%-1.5rem)] max-w-[412px] overflow-y-auto overscroll-contain rounded-[24px] border border-white/60 bg-[#faf9f5]/94 p-4 shadow-2xl backdrop-blur-xl sm:left-4 sm:top-4 sm:max-w-[330px] sm:p-5 ${mobilePanelsHidden ? "hidden md:block" : ""}`}><div className="flex items-start justify-between"><div><p className="eyebrow">{t("map.eyebrow")}</p><h1 className="mt-2 font-display text-2xl">{t("map.title")}</h1></div><span className="grid size-9 place-items-center rounded-full bg-[#e8eee9] text-[#275649]"><MapPinned className="size-4" /></span></div><p className="mt-3 text-xs leading-5 text-[#4e665f]">{t("map.description", { country: market.countryName })}</p><p className="mt-3 rounded-xl bg-[#edf1ed] px-3 py-2 text-[11px] font-semibold text-[#275649]" aria-live="polite">{isLoadingProperties ? t("map.loading") : properties.length ? t("map.mapped", { count: properties.length }) : t("map.empty", { country: market.countryName })}</p><div className="mt-3 flex gap-3 text-[10px] font-bold uppercase tracking-[.12em]"><span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-[#17382f]" />{t("map.homes")}</span><span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-[#a66a2c]" />{t("map.commercial")}</span></div><div className="mt-5 grid gap-2">{[
      ["threeD", t("map.threeD"), Box], ["districts", t("map.boundaries", { region: market.geography.regionLabel }), Layers3], ["mrt", t("map.transitRadius", { transit: market.terminology.transit }), TrainFront],
    ].map(([key, label, Icon]) => <div key={key as string} className="flex items-center gap-3 rounded-xl bg-white px-3 py-3"><span className="grid size-8 place-items-center rounded-full bg-[#edf1ed] text-[#275649]"><Icon className="size-4" /></span><span className="flex-1 text-xs font-semibold">{label as string}</span><Switch aria-label={label as string} checked={layers[key as keyof LayerState]} onCheckedChange={() => toggle(key as keyof LayerState)} /></div>)}</div><div className="mt-4 flex gap-2"><Button size="sm" variant="outline" className="flex-1 rounded-full bg-white" onClick={() => { mapRef.current?.setCenter(market.map.center); mapRef.current?.setZoom(market.map.zoom); }}><LocateFixed className="mr-2 size-3.5" />{t("map.recenter")}</Button><Button onClick={() => toast.info(t("map.commuteInfo"))} size="sm" variant="outline" className="flex-1 rounded-full bg-white"><Route className="mr-2 size-3.5" />{t("map.commute")}</Button></div></div>
    <div className="absolute bottom-4 left-4 z-10 hidden rounded-full border border-white/40 bg-[#10231e]/78 px-4 py-2 text-[10px] font-semibold text-white backdrop-blur sm:block">{t("map.footer", { region: market.geography.regionLabel.toLowerCase(), transit: market.terminology.transit })}</div>
    {selected && <aside id="map-property-preview" aria-live="polite" className="absolute bottom-[max(.75rem,env(safe-area-inset-bottom))] right-[max(.75rem,env(safe-area-inset-right))] z-20 max-h-[calc(100%-5.5rem)] w-[calc(100%-1.5rem)] max-w-[512px] overflow-y-auto overscroll-contain rounded-[24px] border border-white/60 bg-[#faf9f5] shadow-2xl sm:bottom-4 sm:right-4 sm:max-w-[410px]"><div className="relative h-36 sm:h-44"><img src={selected.image} alt={selected.title} className="h-full w-full object-cover" /><button aria-label={t("map.closePreview")} onClick={() => setSelected(null)} className="absolute right-3 top-3 grid size-11 place-items-center rounded-full bg-white/90"><X className="size-4" /></button></div><div className="p-4 sm:p-5"><p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#76552f]">{selected.type} · {selected.district}</p><h2 className="mt-2 text-lg font-semibold">{selected.title}</h2><div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-[#4e665f]">{selected.isCommercial ? <><span>{selected.commercialUsage?.split(" · ")[0]}</span><span>{selected.floorLoading} kN/m²</span><span>{selected.ceilingHeight} {t("map.clear")}</span></> : <span>{selected.beds} {t("map.beds")}</span>}<span>{selected.size.toLocaleString(market.locale)} {market.terminology.areaUnit}</span><span>{selected.mrtMinutes} {t("card.minute")} {market.terminology.transit}</span></div><div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-lg font-semibold">{(selected.mode === "Rent" || selected.mode === "Rent-Out") && selected.monthlyRent ? `${formatMarketCurrency(selected.monthlyRent, market)} ${t("card.perMonth")}` : formatMarketCurrency(selected.price, market)}</p><Link href={`/property/${selected.id}`} className="w-full sm:w-auto"><Button className="w-full rounded-full bg-[#17382f] sm:w-auto">{t("map.viewProperty")} {selected.isCommercial ? <Warehouse className="ml-2 size-4" /> : <Building2 className="ml-2 size-4" />}</Button></Link></div></div></aside>}
    <button type="button" aria-controls="map-intelligence-controls map-property-preview" aria-pressed={!mobilePanelsHidden} onClick={() => setMobilePanelsHidden(hidden => !hidden)} className="absolute right-[max(.75rem,env(safe-area-inset-right))] top-3 z-30 inline-flex min-h-11 max-w-[calc(100%-1.5rem)] items-center gap-2 rounded-full bg-[#17382f] px-4 text-xs font-semibold text-white shadow-xl md:hidden">{mobilePanelsHidden ? <Eye className="size-4" /> : <EyeOff className="size-4" />}{mobilePanelsHidden ? t("map.showPanels") : t("map.hidePanels")}</button>
  </main></div>;
}
