# Claude Development Guide — UrbanKey Main Website

## Repository Boundary

This is the **main UrbanKey website** only. Do not introduce the Coworking Design Studio or its 2D/3D floor-plan editor into this repository without an explicit release request. Preserve the platform’s Singapore property discovery, agent, map, market intelligence, and virtual-tour functions.

## Architecture

The frontend is React 19 with Vite and Tailwind CSS. The backend is Express 4 and tRPC 11. Drizzle targets MySQL/TiDB. Frontend pages live in `client/src/pages`; reusable components live in `client/src/components`; API procedures are in `server/routers.ts`; database schema lives in `drizzle/schema.ts`; tests live under `server/*.test.ts`.

## Safe Commands

Run the following after each meaningful change:

```bash
pnpm check
pnpm test
```

Use `pnpm dev` for local development and `pnpm build` to test the production build. Do not use destructive Git commands. Do not add generated output, credentials, `.env` files, or large media files to the repository.

## Environment and Service Boundaries

The hosted version uses OAuth, database, storage, AI, maps, analytics, notifications, and Stripe integrations. Outside that hosted environment, these integrations require values in `.env` or explicit adapter replacements. Never invent credentials. Maintain graceful error or disabled states when an integration is unavailable.

## Change Standards

Keep tRPC contracts typed end to end. Add or update Vitest coverage for behavior changes. Preserve accessible controls, mobile layouts, loading states, and user-visible error states. For public-facing content, do not fabricate reviews, ratings, testimonials, property availability, or transaction outcomes. State clearly when a feature uses illustrative or demo data.

## Verification Checklist

Before proposing a change, confirm that TypeScript and tests pass, review the relevant UI at desktop and mobile sizes, and explain any configuration or migration steps required to run the change locally.
