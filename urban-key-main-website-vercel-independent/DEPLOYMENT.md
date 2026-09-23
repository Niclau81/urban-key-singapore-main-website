# UrbanKey Independent Main Website: Deployment Guide

This guide applies to the **flat deployment bundle**. After extraction, `package.json`, `index.html`, `vercel.json`, `src/`, `api/`, and `supabase/` must appear immediately inside the folder you open or upload. Do not deploy the outer ZIP as a web page and do not select a parent folder containing another project folder.

> **Why a blank page happens:** a Vite application was opened as raw `index.html`, or Vercel built from the wrong directory. Vite must build `src/main.tsx` before a browser can run the website. VS Code edits and runs the project; it is not a production host.

## 1. What this independent package includes

The application does not link back to Manus. It is designed for **Vercel**, using **Supabase** for authentication, PostgreSQL data, and private uploads, plus **Google Maps JavaScript API** for maps. It excludes Stripe, every payment or subscription route, Coworking, and all 3D-model functions.

| Main-site capability | Independent implementation |
| --- | --- |
| User and agent sign-in | Supabase email magic links |
| Listings and favourites | Bundled labelled demo catalogue plus Supabase published listings; separate RLS-protected saves for both |
| Viewing / Property Agent enquiries | Supabase `enquiries` table for authenticated, authorised review; packaged record IDs are stored safely as `catalog_listing_id` |
| Property Agent workflow | Consent-recorded private cases, tasks, document checklist, hand-off records, and audit log; no external submission capability |
| Agent workspace | Magic-link sign-in, pending professional registration, private draft listings, and account-scoped work queue |
| Tour-quality media | Private Supabase Storage `tour-media` bucket with owner authority and consent confirmations |
| AI concierge | Optional Vercel serverless `/api/assistant` route with server-side provider key and transparent safe fallback |
| Map intelligence | Google Maps JavaScript API 3D surface, listing focus controls, and bundled Singapore fallback |
| Health status | Vercel `/api/health` serverless endpoint |

The app does not verify availability, property ownership, legal records, prices, identity, documents, or listings. Retain a qualified human review before external communication, commitments, or high-impact decisions.

## 2. Required local dependencies

| Requirement | Supported value | Purpose |
| --- | --- | --- |
| Node.js | **20.19.0 or later** | Matches `.nvmrc` and the package engine. |
| npm | Installed with Node.js | Installs the locked dependency versions. |
| VS Code | A current desktop version | Edits code and runs the integrated terminal. |
| Browser | Current Chrome, Edge, Firefox, or Safari | Runs the local or deployed site. |

Install Node from [nodejs.org](https://nodejs.org/) if `node --version` does not show v20.19.0 or later.

## 3. Run correctly in VS Code

1. Extract `urban-key-main-website-vercel-independent.zip` to a normal folder, for example `Documents/urban-key-main-website`.
2. In VS Code select **File → Open Folder** and select that extracted folder. Confirm `package.json` appears at the top of the Explorer.
3. Open **Terminal → New Terminal** and run:

   ```bash
   node --version
   npm ci
   cp .env.example .env.local
   npm run dev
   ```

4. Open the local address printed by Vite, normally `http://127.0.0.1:5173`.
5. Do **not** double-click `index.html` and do **not** use a basic Live Server extension in the source folder. Either approach bypasses Vite compilation and will keep the fallback loading page visible.
6. Before committing or deploying, run:

   ```bash
   npm run verify
   npm run preview
   ```

`npm run verify` runs TypeScript checks, unit tests, and the production build. The deployable static files are written to `dist/`.

## 4. Configure Supabase

1. Create a new Supabase project owned by your organisation. For an existing project, take a database backup and review the SQL against current policies before applying it.
2. Open **SQL Editor** and run the package file `supabase/schema.sql` once. It creates profiles, agent profiles, listings, separate published/demo favourites, enquiries, Property Agent cases and audit records, agent tasks, tour captures, private buckets, and RLS policies.
3. The schema creates the private `tour-media`, `listing-media`, and `property-agent-documents` buckets and their owner-only policies. Verify that all three buckets are private in **Storage** after execution.
4. Open **Authentication → URL Configuration**. Set **Site URL** to your Vercel production domain. Add `http://127.0.0.1:5173` and permitted preview URLs to **Redirect URLs**.
5. Open **Authentication → Providers**. Enable Email and configure verified SMTP before public use.
6. Open **Project Settings → API**. Copy only the Project URL and the **publishable key**. If you need initial administrators, set their `profiles.role` to `admin` only from the Supabase Dashboard or a secure service-role task—not from the browser.

> Browser clients use the Supabase publishable key, so RLS is essential. The service-role key bypasses RLS and must never be placed in a browser value, in source control, or in any `VITE_` variable. [1] [2]

## 5. Configure Google Maps

1. Create a Google Cloud project and enable **Maps JavaScript API**.
2. Create a browser API key.
3. Restrict the key by HTTP referrer to your Vercel production domain, required Vercel preview domain(s), and `http://127.0.0.1:5173/*` for development.
4. Restrict the key by API to **Maps JavaScript API**. Enable Places API only when you implement a clearly defined Places feature.
5. For the actual 3D Singapore view, open **Google Maps Platform → Map Management**, create a JavaScript Map ID, create a cloud map style with **3D Hybrid** and light mode, associate that style with the Map ID, and publish it. The code uses the Maps JavaScript `maps3d` library only when this Map ID is present. [7] [8]

The Maps key is browser configuration and therefore uses `VITE_GOOGLE_MAPS_API_KEY`. Referrer and API restrictions are required because Vite exposes all `VITE_` variables in the browser bundle. [3] [4]

The public selector includes **Singapore, Indonesia, Malaysia, Thailand, Vietnam, and the Philippines**. Singapore is the configured photorealistic 3D deployment. The other selectable markets use their planning-demo catalogue and a live standard Google Map centred on the selected country. Do not reuse the Singapore 3D Map ID for another country: publish a country-specific map style and ID before enabling that market’s 3D mode.

## 6. Configure Vercel and deploy

Create a **private** GitHub repository with the extracted project files at its root.

```bash
git init
git add .
git commit -m "Independent UrbanKey Vercel application"
git branch -M main
git remote add origin https://github.com/YOUR-ACCOUNT/YOUR-REPOSITORY.git
git push -u origin main
```

In Vercel, select **Add New → Project**, import that repository, and use the settings below. Vercel documents the Vite deployment flow. [5]

| Vercel setting | Value |
| --- | --- |
| Framework preset | Vite |
| Root Directory | `.` — the directory containing `package.json` |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Node.js | 20.x |

Then add these variables in **Project → Settings → Environment Variables** for **Production**, **Preview**, and **Development**, then redeploy. Vercel only applies variable changes to newly created deployments. [6]

| Variable | Value | Visibility |
| --- | --- | --- |
| `VITE_APP_TITLE` | `UrbanKey Singapore` | Public browser configuration |
| `VITE_SUPABASE_URL` | Your Supabase Project URL | Public browser configuration |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Your Supabase publishable key | Public browser configuration |
| `VITE_GOOGLE_MAPS_API_KEY` | Your restricted browser Maps key | Public, restricted by referrer and API |
| `VITE_GOOGLE_MAPS_MAP_ID` | JavaScript Map ID associated with a published 3D Hybrid style | Public map identifier; required for photorealistic 3D mode |
| `OPENAI_API_KEY` | Optional model-provider key for `/api/assistant` | **Server-side only**, no `VITE_` prefix |
| `OPENAI_MODEL` | Optional model name, default `gpt-4o-mini` | Server-side only |

Keep `vercel.json` committed; it preserves direct SPA links such as `/explore`, `/property/...`, and `/agent/portal` after refresh.

The assistant endpoint accepts only bounded conversation history, applies a non-advisory system guardrail, and returns a transparent workflow fallback if no provider key is configured. Do not expose a provider key in browser configuration, commit it to Git, or use it to automate messages, offers, signatures, professional advice, or government submissions.

## 6A. Visual assets and user-data JSON

The files under `public/assets/` are included in the ZIP and copied into Vercel’s `dist/assets/` output on every build. They cover the homepage skyline, listing photos, and `singapore-map-fallback.svg`. The fallback displays when the Google Maps key is missing, restricted incorrectly, the Maps script cannot load, the Map ID is invalid, or Google reports that 3D initialization failed. When a 3D Map ID is configured, the application shows a visible preparation state until Google Maps emits its steady-state event; this is a progress signal only and never uses a timeout to replace a potentially valid slow renderer. A configured `VITE_GOOGLE_MAPS_API_KEY` enables the standard interactive map; add `VITE_GOOGLE_MAPS_MAP_ID` from a Google Cloud map style configured for 3D/vector use to request the 3D-capable Singapore map mode.

The package also contains `supabase/user-data-schema.json`. This is a **JSON schema and empty import template**, not an export of private people or authentication records. Create account users through Supabase Auth first, then map their returned UUIDs to the `profiles`, `favourites`, `enquiries`, and `agent_tasks` data before importing. Never place passwords, tokens, sessions, or a service-role key in JSON or source control.

## 7. Security and operations checklist

| Area | Required action before public launch |
| --- | --- |
| Enquiries | The package requires authenticated submissions. Add bot protection and rate limiting before public launch, and keep contact review human-controlled. |
| Listings | Use verified agent/admin workflows; never grant public listing insert, update, or delete permissions. Demonstration catalog entries remain bundled and clearly labelled. |
| Uploads | Keep `tour-media` private, restrict each object to its owner, scan media server-side, and use signed uploads for large 360° files. |
| Data protection | Publish privacy, consent, retention, access, and deletion procedures before collecting personal data. |
| Email | Use verified SMTP, configure domain authentication, and test magic-link templates. |
| Backups | Configure backups and periodically test a documented restoration procedure. |
| AI assistance | Keep provider keys only in Vercel non-`VITE_` variables. Audit prompts/outputs, rate-limit the endpoint, and retain the human-review and no-external-action boundary. |
| Server secrets | Keep privileged secrets only in Vercel non-`VITE_` variables and access them only from a serverless function. |

## 8. Troubleshooting

| Symptom | Likely cause | Correct action |
| --- | --- | --- |
| Fallback loading page remains visible | Source was opened without Vite, or JavaScript failed to load. | Run `npm ci` then `npm run dev`; open Vite’s address. Check Console and Network tabs. |
| Vercel cannot find `package.json` | Vercel is pointed at a parent directory. | Set Root Directory to the folder containing `package.json`, or place package files at repository root. |
| Vercel shows source files | Build output is not set. | Set build to `npm run build` and output to `dist`. |
| Maps configuration message appears | Maps key is absent, restricted incorrectly, or Maps JavaScript API is disabled. | Set `VITE_GOOGLE_MAPS_API_KEY`, enable the API, and check HTTP-referrer restrictions. |
| Map is interactive but not 3D | The Map ID is absent, invalid, unpublished, or not associated with a 3D Hybrid style. | Set `VITE_GOOGLE_MAPS_MAP_ID`, publish the 3D Hybrid map style, then create a new Vercel deployment. |
| 3D preparation state stays visible | Google Maps is still preparing high-detail terrain/buildings, or the browser cannot initialise WebGL. | Keep the map visible while it prepares. Check browser WebGL support and Google Maps console events; a direct `gmp-error` automatically shows the bundled fallback. |
| Magic-link email does not return to the app | Supabase redirect URL is absent. | Add the exact Vercel and local URLs in Supabase Auth URL Configuration. |
| “Permission denied” from Supabase | RLS policy blocks the action or the user is signed out. | Sign in, review `supabase/schema.sql`, and confirm each policy matches the expected role and table. |
| Direct link returns 404 | SPA rewrite is missing. | Restore `vercel.json` and redeploy. |

## References

[1] [Supabase — React quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/reactjs)

[2] [Supabase — Storage access control](https://supabase.com/docs/guides/storage/security/access-control)

[3] [Google Maps Platform — Maps JavaScript API overview](https://developers.google.com/maps/documentation/javascript/overview)

[4] [Vite — Env variables and modes](https://vite.dev/guide/env-and-mode)

[5] [Vercel — Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite)

[6] [Vercel — Environment variables](https://vercel.com/docs/environment-variables)

[7] [Google Maps — 3D Maps overview](https://developers.google.com/maps/documentation/javascript/3d/overview)

[8] [Google Maps — Customize 3D Maps](https://developers.google.com/maps/documentation/javascript/3d/customize-maps)
