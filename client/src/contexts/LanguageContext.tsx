import { defaultLocaleId, getLocaleConfig, localeIds, localeOptions, translate, type LocaleConfig, type LocaleId, type TranslationKey, type TranslationValues } from "@shared/localeConfig";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const STORAGE_KEY = "urbankey-display-language";

type LanguageContextValue = {
  locale: LocaleConfig;
  locales: LocaleConfig[];
  setLocaleId: (localeId: LocaleId) => void;
  t: (key: TranslationKey, values?: TranslationValues) => string;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [localeId, setLocaleId] = useState<LocaleId>(() => {
    if (typeof window === "undefined") return defaultLocaleId;
    const requestedLocale = new URLSearchParams(window.location.search).get("lang");
    if (requestedLocale && localeIds.includes(requestedLocale as LocaleId)) return requestedLocale as LocaleId;
    const savedLocale = window.localStorage.getItem(STORAGE_KEY);
    return getLocaleConfig(savedLocale).id;
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, localeId);
    const locale = getLocaleConfig(localeId);
    document.documentElement.lang = locale.languageTag;
    document.documentElement.dataset.locale = locale.id;
  }, [localeId]);

  const t = useCallback((key: TranslationKey, values?: TranslationValues) => translate(localeId, key, values), [localeId]);
  const value = useMemo(() => ({ locale: getLocaleConfig(localeId), locales: localeOptions, setLocaleId, t }), [localeId, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
