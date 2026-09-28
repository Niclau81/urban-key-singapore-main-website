# UrbanKey Singapore — Independent Vercel Main Website

This folder is the standalone **Vite + React** deployment package for UrbanKey Singapore. It is designed to run on Vercel with no Manus runtime dependency. It retains the main public marketplace experience and the independent replacements for authentication, data, maps, private workflows, and AI assistance.

> **Deliberately excluded:** Stripe, payments, checkout, subscriptions, Coworking, the Design Studio, and 3D floor-plan conversion. The independent listing-level Building / Floor plate viewer and Google Maps 3D city view are retained; both are conceptual orientation tools, not 3D floor-plan conversion or property surveys.

## What the package now includes

| Area | Independent implementation | Runtime dependency |
| --- | --- | --- |
| Home and public discovery | Responsive UrbanKey home page, 23 Singapore demonstration listings, six future-market planning demonstrations, filters, commercial operational filters, direct profiles, gallery and map focus | Bundled assets + React |
| Markets and languages | Persisted selector for Singapore, Indonesia, Malaysia, Thailand, Vietnam, and the Philippines; English, Indonesian, Malay, Thai, Vietnamese, and Simplified Chinese navigation labels | Browser local storage; local-language listing feeds remain a future data-integration step |
| Public listing data | Clearly labelled bundled illustrative catalogue, overlaid by independently published Supabase records when available | Supabase optional for live records |
| Property profiles and tours | Gallery, guide pricing, residential/commercial facts, transaction context, save and secure enquiry controls; tour-enabled listings have an on-card badge and a full in-page room navigator, matching timed views where published, hotspots, drag-to-look, full screen, and viewing-request hand-off | Bundled assets + React; Supabase for saved items and enquiries |
| Building level orientation | Code-split interactive Building / Floor plate viewer with orbit, pan, zoom, and the listing unit level highlighted | Bundled Three.js; conceptual only |
| Map intelligence | Singapore listing controls and configured Google Maps JavaScript 3D surface with safe bundled fallback | Google Maps JavaScript API |
| AI Concierge | Buyer/tenant and agent/co-broker conversational workflow with a safe server fallback | Optional Vercel server-side `OPENAI_API_KEY` |
| Property Agent | Consent-recorded private cases, workflow checklist, documents and professional hand-off records; no unsupervised external action | Supabase |
| Agent Portal | Magic-link sign-in, professional registration, pending verification, private draft listings and tour-capture review intake | Supabase + private Storage |
| Personal dashboard | Private profile, persona, saved properties, enquiry and Property Agent case counts | Supabase |

All property records must be verified independently before anyone relies on availability, price, ownership, eligibility, legal information, or market conditions. The application does not send messages, file paperwork, make offers, sign documents, or take external action for a user.

Singapore retains the configured **photorealistic 3D** Google Maps mode. The other selectable South-East Asian markets display their clearly marked planning-demo catalogue and use a live standard Google map once the browser Maps key is configured. A country-specific 3D Map ID and published map style can be introduced later without changing the public route or catalogue contract.

### Virtual Property Tour boundary

The optional listing tour is self-contained in `public/assets/tours/`, including the illustrative Marina Cove, Interlace, and Queenstown tour media. Marina Cove has finalized matched **Morning / Noon / Night** compositions for every room. Other rooms present the one published **As photographed** composition rather than inventing or mislabelling a time change. The viewer uses a local Three.js photo-sphere renderer: drag, swipe, arrow keys, and zoom controls move through the selected panorama, while visible room arrows and the floor-layout navigator move between rooms. A visible approved flat-preview fallback is used only when WebGL cannot render. Each tour retains a clear illustrative-media disclosure. It does **not** claim to be a captured 360° survey or a 3D floor-plan model. A real agent upload remains private and requires owner authority, capture consent, privacy review, and approval before publication.

### Building and Floor plate boundary

Property profiles provide a conceptual 3D building orientation view where a demonstrative listing level is known. The viewer highlights the stored unit level (for example, `#28-08 · Level 28`), and the Floor plate control isolates that conceptual level. It is not a building model, official drawing, survey, floor plan, or representation of the actual development.

## Run locally

Open this exact folder in VS Code—the folder containing `package.json`—then run:

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Do **not** open `index.html` directly or use a basic Live Server extension. Vite must compile `src/main.tsx`; otherwise a host may show source files or a non-hydrated page.

Before deployment, run the same checks used by this package:

```bash
npm run verify
npm run preview
```

## Deployment

This package is deployed from the nested folder:

```text
Niclau81/urban-key-singapore-main-website/
└── urban-key-main-website-vercel-independent/
```

In Vercel, set the **Root Directory** to `urban-key-main-website-vercel-independent`. Use the Vite preset, `npm ci`, `npm run build`, and `dist`. The committed `vercel.json` preserves direct links such as `/property/marina-cove-28-08`, `/agent/portal`, and `/dashboard`.

Read [DEPLOYMENT.md](./DEPLOYMENT.md) for the complete Supabase, Google Maps, Vercel environment, AI endpoint, data-protection, and troubleshooting instructions.

## Configuration boundaries

Browser values are intentionally public configuration and start with `VITE_`. Restrict Maps browser keys by referrer/API and protect Supabase with the included RLS policies. Do **not** put a Supabase service-role key, model-provider key, passwords, private migration records, authentication tokens, or payment information in `VITE_*`, source code, or Git.

The optional `OPENAI_API_KEY` is server-side only: set it in Vercel without a `VITE_` prefix. The `/api/assistant` function uses it only for bounded, non-advisory responses. Without it, the website returns a transparent safe workflow response rather than representing a simulated response as live AI.
