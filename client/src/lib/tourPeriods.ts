export const TOUR_PERIOD_IDS = [
  "morning",
  "noon",
  "afternoon",
  "evening",
  "night",
  "midnight",
] as const;

export type TourPeriodId = (typeof TOUR_PERIOD_IDS)[number];

export type TourPeriod = {
  id: TourPeriodId;
  label: string;
  timeRange: string;
  description: string;
  filter: string;
  overlay: string;
  accent: string;
};

export const TOUR_PERIODS: TourPeriod[] = [
  {
    id: "morning",
    label: "Morning",
    timeRange: "6–10am",
    description: "Soft sunrise warmth",
    filter: "brightness(1.04) saturate(.9) sepia(.08) contrast(.98)",
    overlay:
      "radial-gradient(circle at 18% 18%, rgba(255,219,163,.38), transparent 34%), linear-gradient(to top, rgba(23,56,47,.2), transparent 52%)",
    accent: "#f2c985",
  },
  {
    id: "noon",
    label: "Noon",
    timeRange: "10am–2pm",
    description: "Clear overhead daylight",
    filter: "brightness(1.09) saturate(.96) contrast(1.02)",
    overlay:
      "radial-gradient(circle at 52% 5%, rgba(255,248,214,.3), transparent 32%), linear-gradient(to top, rgba(6,34,38,.14), transparent 46%)",
    accent: "#f7df9f",
  },
  {
    id: "afternoon",
    label: "Afternoon",
    timeRange: "2–5pm",
    description: "Warm directional light",
    filter: "brightness(1.01) saturate(1.04) sepia(.1) contrast(1.01)",
    overlay:
      "radial-gradient(circle at 78% 30%, rgba(240,175,94,.3), transparent 35%), linear-gradient(to top, rgba(45,43,26,.2), transparent 48%)",
    accent: "#e7b56c",
  },
  {
    id: "evening",
    label: "Evening",
    timeRange: "5–8pm",
    description: "Golden-hour ambience",
    filter: "brightness(.76) saturate(.92) sepia(.16) contrast(1.07)",
    overlay:
      "radial-gradient(circle at 76% 28%, rgba(237,158,84,.35), transparent 31%), linear-gradient(to top, rgba(15,38,42,.55), rgba(55,38,46,.08))",
    accent: "#df9b63",
  },
  {
    id: "night",
    label: "Night",
    timeRange: "8pm–12am",
    description: "City-light atmosphere",
    filter: "brightness(.45) saturate(.7) hue-rotate(8deg) contrast(1.08)",
    overlay:
      "radial-gradient(circle at 72% 28%, rgba(228,188,118,.24), transparent 24%), linear-gradient(to top, rgba(8,22,35,.68), rgba(8,22,35,.12))",
    accent: "#d5ae72",
  },
  {
    id: "midnight",
    label: "Midnight",
    timeRange: "12–6am",
    description: "Deep nocturnal calm",
    filter: "brightness(.3) saturate(.54) hue-rotate(16deg) contrast(1.16)",
    overlay:
      "radial-gradient(circle at 80% 18%, rgba(184,207,232,.18), transparent 21%), linear-gradient(to top, rgba(3,12,28,.8), rgba(5,17,36,.3))",
    accent: "#a9c2df",
  },
];

export function getTourPeriod(id: TourPeriodId): TourPeriod {
  return TOUR_PERIODS.find(period => period.id === id) ?? TOUR_PERIODS[0];
}
