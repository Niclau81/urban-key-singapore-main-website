# UrbanKey Main Website — Portable Deployment Package

This is a **separate Vite/React code set for the whole main UrbanKey website**, intended for VS Code and Vercel. It works independently from Manus once you configure the selected external services: **Supabase** for authentication, database, and storage, plus **Google Maps JavaScript API** for map display. It does **not** contain the Coworking Design Studio, the HDB 3D model, any other 3D model function, Stripe, checkout, subscriptions, or payment history.

The package reproduces the main marketplace experience as a portable front end: the home page, listing exploration and property profiles, map-intelligence interface, AI concierge interface, AI Property Agent flow, agent portal, tour quality checklist, plans, checkout preview, payment-history preview, and customer dashboard.

> Before external configuration, the package uses clearly labelled illustrative listing data. After configuration, it supports independent email magic-link sign-in, listings, favourites, enquiries, private tour-media uploads, private agent tasks, and Google Maps. The package does not submit payments or connect to Stripe.

## Important: use the flat package root

The corrected archive is named `urban-key-main-website-vercel-netlify-flat.zip`. Extract it before use. The resulting folder has `package.json` at its top level. Open **that folder** in VS Code and use it as the Vercel or Netlify repository root. This removes the nested-folder mistake that can cause a host to serve source files rather than the compiled website.

## Run in VS Code

Open this folder in VS Code and use its integrated terminal:

```bash
npm ci
npm run dev
```

For the same production build Vercel and Netlify use:

```bash
npm run check
npm run build
npm run preview
```

Vite writes the deployable static output to `dist/`. Do not open `index.html` directly and do not use a basic Live Server extension on the source folder; Vite must compile the React and TypeScript entry point first. A visible loading message remains if the bundle does not start, rather than an empty page.

Read **[DEPLOYMENT.md](./DEPLOYMENT.md)** before deployment. It contains the exact VS Code, Vercel, Netlify, routing, Node/npm, security, and blank-page troubleshooting steps.

## Local validation completed

The package passed `npm run check` and `npm run build` in a clean local install. The generated production preview was opened at the home route, the `/explore` marketplace route, the direct `/agent/portal` route, and the direct `/property-agent` route. The header provides the main-site routes and has no Coworking or 3D model entry point.

## Deploy on Vercel

Create a new **private** GitHub repository and push the contents of this folder. In Vercel choose **Add New → Project**, import the repository, and deploy using the detected Vite settings. The included `vercel.json` defines `npm run build`, uses `dist`, and provides the client-side routing rewrite documented for Vite SPAs. [1]

## Deploy on Netlify

In Netlify select **Add new site → Import an existing project**, choose the repository, and use the defaults in `netlify.toml`: build command `npm run build`, publish folder `dist`, and Node 20. Netlify documents these Vite defaults and the project also includes an SPA fallback. [2]

## Service migration boundary

| Existing managed capability | Portable site behaviour | Production replacement needed |
| --- | --- | --- |
| Authentication and roles | Demonstration navigation only | An identity provider and secure session layer |
| Property records and saved content | Local illustrative data | Your database and server-side API |
| Map intelligence | Static interface | Public map provider plus secure service integration |
| AI concierge and Property Agent | Non-sending interaction preview | Server-side AI and approval workflow |
| Uploads, tours, and documents | Quality-check layout only | Object storage and privacy-review workflow |
| Plans and payments | No-charge demo checkout | Server-side payment integration and webhooks |

Do not expose private secrets with `VITE_` variables. Browser values with this prefix are bundled into the public website. Keep all sensitive keys in your Vercel/Netlify server-side environment settings and call them only from serverless functions or a separate backend.

## References

[1] [Vercel — Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite)

[2] [Netlify — Vite framework guide](https://docs.netlify.com/build/frameworks/framework-setup-guides/vite/)
