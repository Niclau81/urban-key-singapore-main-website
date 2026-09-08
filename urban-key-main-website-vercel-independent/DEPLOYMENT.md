# UrbanKey Independent Main Website: Deployment Guide

This guide applies to the **flat deployment bundle**. After extraction, `package.json`, `index.html`, `vercel.json`, `src/`, `api/`, and `supabase/` must appear immediately inside the folder you open or upload. Do not deploy the outer ZIP as a web page and do not select a parent folder containing another project folder.

> **Why a blank page happens:** a Vite application was opened as raw `index.html`, or Vercel built from the wrong directory. Vite must build `src/main.tsx` before a browser can run the website. VS Code edits and runs the project; it is not a production host.

## 1. What this independent package includes

The application does not link back to Manus. It is designed for **Vercel**, using **Supabase** for authentication, PostgreSQL data, and private uploads, plus **Google Maps JavaScript API** for maps. It excludes Stripe, every payment or subscription route, Coworking, and all 3D-model functions.

| Main-site capability | Independent implementation |
| --- | --- |
| User and agent sign-in | Supabase email magic links |
| Listings and favourites | Supabase PostgreSQL with Row Level Security (RLS) |
| Viewing / Property Agent enquiries | Supabase `enquiries` table for authorised review |
| Agent work queue | Private `agent_tasks` table |
| Tour-quality media | Private Supabase Storage `tour-media` bucket |
| Map intelligence | Google Maps JavaScript API, using a referrer-restricted browser key |
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

1. Create a new Supabase project owned by your organisation.
2. Open **SQL Editor** and run the package file `supabase/schema.sql`. It creates profiles, listings, favourites, enquiries, and agent tasks and enables RLS.
3. Open **Storage**, create a **private** bucket called `tour-media`, then run the Storage policies at the end of `supabase/schema.sql`.
4. Open **Authentication → URL Configuration**. Set **Site URL** to your Vercel production domain. Add `http://127.0.0.1:5173` and permitted preview URLs to **Redirect URLs**.
5. Open **Authentication → Providers**. Enable Email and configure verified SMTP before public use.
6. Open **Project Settings → API**. Copy only the Project URL and the **publishable key**.

> Browser clients use the Supabase publishable key, so RLS is essential. The service-role key bypasses RLS and must never be placed in a browser value, in source control, or in any `VITE_` variable. [1] [2]

## 5. Configure Google Maps

1. Create a Google Cloud project and enable **Maps JavaScript API**.
2. Create a browser API key.
3. Restrict the key by HTTP referrer to your Vercel production domain, required Vercel preview domain(s), and `http://127.0.0.1:5173/*` for development.
4. Restrict the key by API to **Maps JavaScript API**. Enable Places API only when you implement a clearly defined Places feature.

The Maps key is browser configuration and therefore uses `VITE_GOOGLE_MAPS_API_KEY`. Referrer and API restrictions are required because Vite exposes all `VITE_` variables in the browser bundle. [3] [4]

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

Keep `vercel.json` committed; it preserves direct SPA links such as `/explore`, `/property/...`, and `/agent/portal` after refresh.

## 7. Security and operations checklist

| Area | Required action before public launch |
| --- | --- |
| Enquiries | Add bot protection and rate limiting before treating the anonymous enquiry form as a public lead channel. |
| Listings | Use an authenticated administration workflow; never grant public listing insert, update, or delete permissions. |
| Uploads | Keep `tour-media` private, restrict each object to its owner, scan media server-side, and use signed uploads for large 360° files. |
| Data protection | Publish privacy, consent, retention, access, and deletion procedures before collecting personal data. |
| Email | Use verified SMTP, configure domain authentication, and test magic-link templates. |
| Backups | Configure backups and periodically test a documented restoration procedure. |
| Server secrets | Keep privileged secrets only in Vercel non-`VITE_` variables and access them only from a serverless function. |

## 8. Troubleshooting

| Symptom | Likely cause | Correct action |
| --- | --- | --- |
| Fallback loading page remains visible | Source was opened without Vite, or JavaScript failed to load. | Run `npm ci` then `npm run dev`; open Vite’s address. Check Console and Network tabs. |
| Vercel cannot find `package.json` | Vercel is pointed at a parent directory. | Set Root Directory to the folder containing `package.json`, or place package files at repository root. |
| Vercel shows source files | Build output is not set. | Set build to `npm run build` and output to `dist`. |
| Maps configuration message appears | Maps key is absent, restricted incorrectly, or Maps JavaScript API is disabled. | Set `VITE_GOOGLE_MAPS_API_KEY`, enable the API, and check HTTP-referrer restrictions. |
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
