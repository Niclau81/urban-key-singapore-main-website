import { describe, expect, it } from "vitest";
import { getLocaleConfig, localeConfigs, localeIds, translate, translationDictionaries, translationKeys } from "@shared/localeConfig";

describe("South-East Asian localization configuration", () => {
  it("offers the complete selectable South-East Asian locale set with valid language tags", () => {
    expect(localeIds).toEqual(["en", "id", "ms", "th", "vi", "zh-Hans"]);
    for (const localeId of localeIds) {
      expect(localeConfigs[localeId]).toMatchObject({ id: localeId, languageTag: expect.any(String), nativeLabel: expect.any(String), region: "Southeast Asia" });
    }
  });

  it("keeps every selectable locale dictionary complete and interpolates market-aware copy", () => {
    for (const localeId of localeIds) {
      expect(Object.keys(translationDictionaries[localeId]).sort()).toEqual([...translationKeys].sort());
    }
    expect(translate("th", "home.eyebrow", { country: "Singapore" })).toContain("Singapore");
    expect(translate("zh-Hans", "explore.discover", { country: "新加坡" })).toContain("新加坡");
  });

  it("falls back safely to the default locale for unknown saved preferences", () => {
    expect(getLocaleConfig("unknown-locale").id).toBe("en");
  });
});
