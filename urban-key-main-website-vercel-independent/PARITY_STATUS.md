# UrbanKey Main-Site Parity Status

**Release scope:** independent Vercel package in `urban-key-main-website-vercel-independent`

**Reference application:** the managed UrbanKey Singapore main marketplace
**Current release objective:** retain all requested **main public-site** behaviour without any Manus runtime connection.

## Delivered independent scope

| Area | Independent Vercel implementation | Data/runtime boundary |
| --- | --- | --- |
| Visual identity and public navigation | Responsive UrbanKey header, rectangular skyline hero, marketplace presentation, property cards, detail profiles, responsive layout, and direct routes | Vite + bundled local media |
| Discovery | Buy, Sell, Rent, Rent-out, free-text search, district, type, tenure, area, MRT/proximity, guide-price, and commercial operational filters | Bundled illustrative catalogue plus optional published Supabase listings |
| Listings | 23 Singapore demonstration records, commercial and industrial records, and labelled Indonesia, Malaysia, Thailand, Vietnam, and Philippines planning demonstrations | Planning demonstrations are explicitly not live inventory |
| Market and language readiness | Persisted market selector and navigation labels in English, Indonesian, Malay, Thai, Vietnamese, and Simplified Chinese | Browser preference only; full local-language content feeds require future verified source data |
| Property profiles | Gallery, guide price/rent, transaction context, save control, secure enquiry form, map hand-off, AI Concierge hand-off | Saves and enquiries use Supabase when configured |
| Virtual Property Tours | Optional badge, full room navigator, clickable layout regions, room hotspots, Morning/Noon/Night media, drag-to-look, fullscreen, and viewing-request hand-off | Bundled illustrative media; captured 360° media remains private until review and approval |
| Map Intelligence | Listing focus, context controls, standard Google Maps fallback and configured Singapore photorealistic 3D Maps element | Browser-restricted Maps key and published Singapore Map ID required |
| AI Concierge | Buyer/tenant and agent/co-broker bounded workflow assistant with transparent server fallback | Optional Vercel-only `OPENAI_API_KEY`; no external communications or binding actions |
| Property Agent | Consent-recorded case creation and approval-controlled workflow structure | Supabase tables/RLS after schema migration |
| Agent portal and dashboard | Magic-link access, professional registration, private draft listings, private media review intake, profile and dashboard data | Supabase Auth, database, and private Storage after configuration |

## Required deployment configuration

The Vercel project must keep `urban-key-main-website-vercel-independent` as its Root Directory. The deployed application requires only public Vite configuration for Supabase and Google Maps, with private server-side configuration for the optional AI endpoint. The included [deployment guide](./DEPLOYMENT.md) documents the exact variables and security controls.

The existing Singapore Maps key and Map ID remain browser-visible configuration by design, so they must be restricted by referrer and API in Google Cloud. Supabase's publishable key is likewise public browser configuration; the included RLS schema is therefore mandatory before collecting real user data.

## Explicit exclusions

The independent package deliberately excludes all Stripe or payment processing, Coworking, the Design Studio, 3D floor-plan conversion, and every property-model feature. These exclusions follow the Vercel main-site scope and do not remove the standalone Google Maps 3D city map or the approved listing-level virtual-tour viewer.

## Validation record

The release candidate was checked with TypeScript, 14 automated tests, a Vite production build, and browser verification of the home page, discovery, direct property profile, selected-market flow, map route, agent routes, dashboard shell, and virtual-tour controls. The virtual-tour browser test verified the packaged WebP assets return HTTP 200 with `image/webp`, that Night changes the active source, and that choosing Room 2 preserves the selected night treatment.

The production Maps route has a live `gmp-map-3d` element and Google 3D configuration requests. The automated environment cannot guarantee a GPU/WebGL draw, so a normal GPU-capable desktop browser is still the final visual confirmation point for terrain/buildings. The application intentionally displays a preparation state rather than replacing a potentially valid, slow 3D renderer.

## Before using real information

Every bundled listing and virtual-tour asset is illustrative unless separately marked as independently verified in your Supabase data. Verify availability, ownership, legal records, prices, condition, and eligibility independently. Keep agent verification, consent, privacy review, professional review, and explicit user authorisation in place before contacting parties, sharing documents, making commitments, or submitting records.
