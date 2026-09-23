import { useEffect, useState } from "react";
import type { Property } from "../data";

export type MarketId = Property["marketId"];
export type LocaleId = "en" | "id" | "ms" | "th" | "vi" | "zh-Hans";

export type MarketConfig = {
  id: MarketId;
  name: string;
  countryCode: string;
  locale: string;
  currency: string;
  center: { lat: number; lng: number };
  zoom: number;
  regionLabel: string;
  areaUnit: "sq ft" | "m²";
  transitLabel: string;
};

export const marketConfigs: Record<MarketId, MarketConfig> = {
  singapore: { id: "singapore", name: "Singapore", countryCode: "SG", locale: "en-SG", currency: "SGD", center: { lat: 1.334, lng: 103.817 }, zoom: 11, regionLabel: "District", areaUnit: "sq ft", transitLabel: "MRT" },
  indonesia: { id: "indonesia", name: "Indonesia", countryCode: "ID", locale: "id-ID", currency: "IDR", center: { lat: -6.2088, lng: 106.8456 }, zoom: 10, regionLabel: "Market", areaUnit: "m²", transitLabel: "urban transit" },
  malaysia: { id: "malaysia", name: "Malaysia", countryCode: "MY", locale: "ms-MY", currency: "MYR", center: { lat: 3.139, lng: 101.6869 }, zoom: 10, regionLabel: "Market", areaUnit: "m²", transitLabel: "urban transit" },
  thailand: { id: "thailand", name: "Thailand", countryCode: "TH", locale: "th-TH", currency: "THB", center: { lat: 13.7563, lng: 100.5018 }, zoom: 10, regionLabel: "Market", areaUnit: "m²", transitLabel: "urban transit" },
  vietnam: { id: "vietnam", name: "Vietnam", countryCode: "VN", locale: "vi-VN", currency: "VND", center: { lat: 10.8231, lng: 106.6297 }, zoom: 10, regionLabel: "Market", areaUnit: "m²", transitLabel: "urban transit" },
  philippines: { id: "philippines", name: "Philippines", countryCode: "PH", locale: "en-PH", currency: "PHP", center: { lat: 14.5995, lng: 120.9842 }, zoom: 10, regionLabel: "Market", areaUnit: "m²", transitLabel: "urban transit" },
};

export const markets = Object.values(marketConfigs);
export const locales: { id: LocaleId; label: string; nativeLabel: string }[] = [
  { id: "en", label: "English", nativeLabel: "English" },
  { id: "id", label: "Indonesian", nativeLabel: "Bahasa Indonesia" },
  { id: "ms", label: "Malay", nativeLabel: "Bahasa Melayu" },
  { id: "th", label: "Thai", nativeLabel: "ไทย" },
  { id: "vi", label: "Vietnamese", nativeLabel: "Tiếng Việt" },
  { id: "zh-Hans", label: "Simplified Chinese", nativeLabel: "简体中文" },
];

const uiCopy: Record<LocaleId, Record<string, string>> = {
  en: { buy: "Buy", rent: "Rent", commercial: "Commercial", map: "Map intelligence", concierge: "AI concierge", agent: "Property Agent", portal: "Agent portal", market: "Market", language: "Language", explore: "Explore", allMarkets: "All markets" },
  id: { buy: "Beli", rent: "Sewa", commercial: "Komersial", map: "Kecerdasan peta", concierge: "Asisten AI", agent: "Agen Properti", portal: "Portal agen", market: "Pasar", language: "Bahasa", explore: "Jelajahi", allMarkets: "Semua pasar" },
  ms: { buy: "Beli", rent: "Sewa", commercial: "Komersial", map: "Kecerdasan peta", concierge: "Pembantu AI", agent: "Ejen Hartanah", portal: "Portal ejen", market: "Pasaran", language: "Bahasa", explore: "Teroka", allMarkets: "Semua pasaran" },
  th: { buy: "ซื้อ", rent: "เช่า", commercial: "เชิงพาณิชย์", map: "ข้อมูลแผนที่", concierge: "ผู้ช่วย AI", agent: "ตัวแทนอสังหาริมทรัพย์", portal: "พอร์ทัลเอเจนต์", market: "ตลาด", language: "ภาษา", explore: "สำรวจ", allMarkets: "ทุกตลาด" },
  vi: { buy: "Mua", rent: "Thuê", commercial: "Thương mại", map: "Bản đồ thông minh", concierge: "Trợ lý AI", agent: "Chuyên viên bất động sản", portal: "Cổng đại lý", market: "Thị trường", language: "Ngôn ngữ", explore: "Khám phá", allMarkets: "Tất cả thị trường" },
  "zh-Hans": { buy: "买房", rent: "租房", commercial: "商业", map: "地图智能", concierge: "AI 顾问", agent: "房产代理", portal: "经纪人门户", market: "市场", language: "语言", explore: "探索", allMarkets: "全部市场" },
};

export function translate(locale: LocaleId, key: keyof (typeof uiCopy)["en"]) {
  return uiCopy[locale][key] ?? uiCopy.en[key];
}

export function formatMarketCurrency(amount: number, marketId: MarketId, options?: Intl.NumberFormatOptions) {
  const market = marketConfigs[marketId];
  return new Intl.NumberFormat(market.locale, { style: "currency", currency: market.currency, maximumFractionDigits: 0, ...options }).format(amount);
}

function readChoice<T extends string>(key: string, valid: readonly T[], fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const candidate = window.localStorage.getItem(key) as T | null;
  return candidate && valid.includes(candidate) ? candidate : fallback;
}

export function useMarketPreferences() {
  const [marketId, setMarketId] = useState<MarketId>(() => readChoice("urbanKey.market", Object.keys(marketConfigs) as MarketId[], "singapore"));
  const [locale, setLocale] = useState<LocaleId>(() => readChoice("urbanKey.locale", locales.map(item => item.id), "en"));
  useEffect(() => { window.localStorage.setItem("urbanKey.market", marketId); }, [marketId]);
  useEffect(() => { window.localStorage.setItem("urbanKey.locale", locale); document.documentElement.lang = locales.find(item => item.id === locale)?.id ?? "en"; }, [locale]);
  return { marketId, setMarketId, locale, setLocale, market: marketConfigs[marketId] };
}

export function getMarketConfig(marketId: MarketId) { return marketConfigs[marketId]; }
