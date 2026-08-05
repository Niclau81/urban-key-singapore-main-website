import { defaultMarketId, getMarketConfig, marketIds, marketOptions, type MarketConfig, type MarketId } from "@shared/marketConfig";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const STORAGE_KEY = "urbankey-active-market";

type MarketContextValue = {
  market: MarketConfig;
  markets: MarketConfig[];
  setMarketId: (marketId: MarketId) => void;
};

const MarketContext = createContext<MarketContextValue | undefined>(undefined);

export function MarketProvider({ children }: { children: ReactNode }) {
  const [marketId, setMarketId] = useState<MarketId>(() => {
    if (typeof window === "undefined") return defaultMarketId;
    const requestedMarket = new URLSearchParams(window.location.search).get("market");
    if (requestedMarket && marketIds.includes(requestedMarket as MarketId)) return requestedMarket as MarketId;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return getMarketConfig(saved ?? undefined).id;
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, marketId);
  }, [marketId]);

  const value = useMemo(() => ({ market: getMarketConfig(marketId), markets: marketOptions, setMarketId }), [marketId]);
  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>;
}

export function useMarket() {
  const context = useContext(MarketContext);
  if (!context) throw new Error("useMarket must be used within MarketProvider");
  return context;
}
