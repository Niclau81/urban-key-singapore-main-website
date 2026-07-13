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
  sceneFilter: string;
  exteriorView: string;
  exteriorBlendMode: "color" | "normal";
  interiorLight: string;
  accent: string;
};

export const TOUR_PERIODS: TourPeriod[] = [
  {
    id: "morning",
    label: "Morning",
    timeRange: "6–10am",
    description: "Soft sunrise warmth",
    sceneFilter: "brightness(1.02) saturate(.98) contrast(1.01)",
    exteriorView:
      "radial-gradient(circle at 62% 65%, rgba(255,226,164,.95) 0 2%, transparent 8%), linear-gradient(155deg, rgba(250,194,126,.78), rgba(159,207,226,.68) 48%, rgba(216,232,224,.42))",
    exteriorBlendMode: "color",
    interiorLight:
      "radial-gradient(circle at 14% 12%, rgba(255,222,165,.2), transparent 24%), radial-gradient(circle at 52% 18%, rgba(255,236,199,.12), transparent 22%)",
    accent: "#f2c985",
  },
  {
    id: "noon",
    label: "Noon",
    timeRange: "10am–2pm",
    description: "Clear overhead daylight",
    sceneFilter: "brightness(1.04) saturate(1) contrast(1.01)",
    exteriorView:
      "radial-gradient(circle at 53% 61%, rgba(255,252,218,.94) 0 2%, transparent 8%), linear-gradient(165deg, rgba(125,200,235,.74), rgba(204,231,238,.46) 58%, rgba(241,239,210,.28))",
    exteriorBlendMode: "color",
    interiorLight:
      "radial-gradient(circle at 48% 5%, rgba(255,250,221,.13), transparent 28%), linear-gradient(115deg, rgba(255,255,255,.07), transparent 42%)",
    accent: "#f7df9f",
  },
  {
    id: "afternoon",
    label: "Afternoon",
    timeRange: "2–5pm",
    description: "Warm directional light",
    sceneFilter: "brightness(1.01) saturate(1.02) contrast(1.02)",
    exteriorView:
      "radial-gradient(circle at 64% 66%, rgba(255,210,132,.9) 0 2%, transparent 9%), linear-gradient(160deg, rgba(116,180,216,.62), rgba(237,181,112,.64) 70%, rgba(231,151,92,.38))",
    exteriorBlendMode: "color",
    interiorLight:
      "radial-gradient(circle at 70% 17%, rgba(255,209,137,.18), transparent 28%), radial-gradient(circle at 24% 22%, rgba(255,235,196,.1), transparent 25%)",
    accent: "#e7b56c",
  },
  {
    id: "evening",
    label: "Evening",
    timeRange: "5–8pm",
    description: "Golden-hour ambience",
    sceneFilter: "brightness(1) saturate(1.01) contrast(1.03)",
    exteriorView:
      "radial-gradient(circle at 63% 70%, rgba(255,172,92,.96) 0 2%, transparent 8%), linear-gradient(165deg, rgba(81,103,150,.76), rgba(226,127,91,.82) 56%, rgba(70,57,91,.62))",
    exteriorBlendMode: "normal",
    interiorLight:
      "radial-gradient(circle at 19% 13%, rgba(255,205,124,.32), transparent 25%), radial-gradient(circle at 56% 17%, rgba(255,221,155,.24), transparent 22%), radial-gradient(circle at 47% 76%, rgba(255,189,102,.16), transparent 28%)",
    accent: "#df9b63",
  },
  {
    id: "night",
    label: "Night",
    timeRange: "8pm–12am",
    description: "City-light atmosphere",
    sceneFilter: "brightness(.98) saturate(.98) contrast(1.04)",
    exteriorView:
      "radial-gradient(circle at 43% 73%, rgba(255,199,101,.85) 0 .45%, transparent 1.2%), radial-gradient(circle at 55% 75%, rgba(255,216,139,.75) 0 .45%, transparent 1.1%), radial-gradient(circle at 65% 71%, rgba(255,184,96,.78) 0 .45%, transparent 1.2%), linear-gradient(170deg, rgba(15,38,70,.94), rgba(8,22,43,.9) 66%, rgba(35,39,53,.78))",
    exteriorBlendMode: "normal",
    interiorLight:
      "radial-gradient(circle at 16% 12%, rgba(255,196,104,.42), transparent 24%), radial-gradient(circle at 53% 16%, rgba(255,220,144,.35), transparent 22%), radial-gradient(circle at 48% 78%, rgba(255,181,83,.22), transparent 28%)",
    accent: "#d5ae72",
  },
  {
    id: "midnight",
    label: "Midnight",
    timeRange: "12–6am",
    description: "Deep nocturnal calm",
    sceneFilter: "brightness(.96) saturate(.94) contrast(1.05)",
    exteriorView:
      "radial-gradient(circle at 62% 64%, rgba(211,227,244,.86) 0 2%, transparent 7%), radial-gradient(circle at 43% 66%, rgba(255,255,255,.65) 0 .18%, transparent .55%), radial-gradient(circle at 53% 62%, rgba(255,255,255,.6) 0 .18%, transparent .5%), radial-gradient(circle at 66% 69%, rgba(255,255,255,.58) 0 .18%, transparent .55%), linear-gradient(170deg, rgba(5,17,42,.98), rgba(2,10,28,.94) 72%, rgba(18,27,44,.86))",
    exteriorBlendMode: "normal",
    interiorLight:
      "radial-gradient(circle at 16% 12%, rgba(255,185,83,.38), transparent 23%), radial-gradient(circle at 53% 16%, rgba(255,210,122,.32), transparent 21%), radial-gradient(circle at 47% 78%, rgba(255,165,66,.2), transparent 27%)",
    accent: "#a9c2df",
  },
];

export function getTourPeriod(id: TourPeriodId): TourPeriod {
  return TOUR_PERIODS.find(period => period.id === id) ?? TOUR_PERIODS[0];
}
