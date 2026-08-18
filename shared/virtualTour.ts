export type VirtualTourTimedPhoto = {
  id: "morning" | "noon" | "night";
  label: "Morning" | "Noon" | "Night";
  timeRange: string;
  description: string;
  src: string;
};

export type VirtualTourRoom = {
  id: string;
  label: string;
  imageIndex: number;
  note: string;
  approvedHighlights: string[];
  floorPlanPosition: { x: number; y: number };
  viewerPosition: { x: number; y: number };
  /** Optional original illustrative photo sequence for the honest guided-photo fallback. */
  timedPhotos?: VirtualTourTimedPhoto[];
};

export type VirtualPropertyTour = {
  badgeLabel: string;
  disclosure: string;
  captureMode: "guided-photo" | "illustrative-panorama" | "verified-360";
  /** Legacy single-room panorama source. New real tours should provide `panoramaUrls` per room. */
  panoramaUrl?: string;
  /** Room-specific equirectangular sources. Verified sources can be shown as a true interactive photo sphere after approval. */
  panoramaUrls?: Partial<Record<string, string>>;
  panoramaPreviewUrls?: Partial<Record<string, string>>;
  floors: Array<{
    id: string;
    label: string;
    roomIds: string[];
  }>;
  rooms: VirtualTourRoom[];
  aiGuide: {
    enabled: boolean;
    intro: string;
  };
  privacyReview: {
    automatedRedactionRequired: true;
    manualReviewRequired: true;
    protectedTargets: string[];
    status: "demo-review-required" | "reviewed";
  };
  analytics: {
    scope: "on-device";
    events: ("tour_opened" | "room_visited" | "appointment_intent")[];
  };
};
