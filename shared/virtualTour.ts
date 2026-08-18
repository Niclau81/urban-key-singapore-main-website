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
  /** Approximate room rectangle on the interactive floor plan, expressed as percentages. */
  floorPlanBounds?: { x: number; y: number; width: number; height: number };
  viewerPosition: { x: number; y: number };
  /** Optional original illustrative photo sequence for the honest guided-photo fallback. */
  timedPhotos?: VirtualTourTimedPhoto[];
  /** Optional panorama source per selected time; used only for approved or explicitly illustrative panorama states. */
  panoramaPreviewByTiming?: Partial<Record<VirtualTourTimedPhoto["id"], string>>;
  /** Connected rooms are used for deliberate door-to-door traversal rather than exposing every room from every panorama. */
  connections?: Array<{ roomId: string; direction: "left" | "right" | "up" | "down" }>;
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
