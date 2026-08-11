# Localization Architecture

UrbanKey keeps **market** and **display language** independent. A market controls listing supply, currency, geography, map viewport, and local property terminology. A locale controls interface language, accessibility labels, and application copy. This separation allows a Vietnamese-speaking user to browse a Singapore market, or an English-speaking user to browse an Indonesian market, without creating duplicate country pages.

| Initial selectable language | Locale ID | Script support |
| --- | --- | --- |
| English | `en` | Latin |
| Bahasa Indonesia | `id` | Latin |
| Bahasa Melayu | `ms` | Latin |
| Thai | `th` | Thai |
| Vietnamese | `vi` | Latin with diacritics |
| Simplified Chinese | `zh-Hans` | Han |

## Adding a future global language

Add the locale ID and display metadata to `shared/localeConfig.ts`, then provide a full dictionary using `withEnglishFallback`. The regression suite verifies that the dictionary has every defined translation key, while the fallback protects new UI keys during development. Add an appropriate web font when a script is not covered by the existing typography stack, update any locale-sensitive date or number presentation only where it is a **display-language** concern, and add a visual check for text expansion and right-to-left layout if applicable.

> Listing records, titles, supplied descriptions, legal disclosures, and official transaction data remain source-language data. They should be translated through an approved content workflow rather than automatically altered in the interface.
