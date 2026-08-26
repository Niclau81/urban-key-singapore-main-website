# UrbanKey Singapore — Main Website

This repository contains the **main UrbanKey Singapore property website**: property discovery, market intelligence, AI Property Agent workflows, virtual property tours, and the supporting React, Express, tRPC, Drizzle, and Vitest code.

## Scope

The experimental Coworking Design Studio and its interactive 2D/3D floor-plan editing work are **intentionally excluded** until that feature has passed a separate release review. This makes the repository appropriate for main-site work only.

## Claude-ready development

The source is readable by Claude.ai and is structured for Claude Code or any standard Node.js development environment. Claude can inspect, explain, refactor, and test this codebase; running the complete production feature set requires the environment variables and backing services described below.

```bash
git clone https://github.com/Niclau81/urban-key-singapore-main-website.git
cd urban-key-singapore-main-website
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env
pnpm verify
pnpm dev
```

Use **Node.js 22** and **pnpm 10**. `pnpm dev` starts the combined Express/Vite development server. `pnpm verify` runs TypeScript checks followed by the regression suite.

## Runtime configuration

Copy `.env.example` to `.env` and supply development values for the services you intend to use. Do not commit `.env` or real credentials. The public browsing experience can be developed independently, but the following integrations require compatible replacements or valid service credentials outside the original hosted environment.

| Capability | Required configuration | Portability note |
|---|---|---|
| User sessions | `VITE_APP_ID`, `OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL`, `JWT_SECRET` | Replace the hosted OAuth provider or supply compatible development credentials. |
| Database-backed features | `DATABASE_URL` | Use a MySQL/TiDB-compatible connection and run the Drizzle migration workflow. |
| AI, storage, maps, and notifications | `BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY`, related public Forge variables | These are hosted-service integrations. Replace their adapters or provide equivalent APIs in an external environment. |
| Payments | Stripe variables | Keep test and production keys separate. |

## Working with Claude

Read [`CLAUDE.md`](./CLAUDE.md) first. It records the architecture, safe commands, project conventions, quality gates, and boundaries for AI-assisted changes. Ask Claude to make a small change, run `pnpm verify`, and describe any environment-dependent behavior that cannot be exercised locally.

## Quality baseline

Before committing or opening a pull request, run:

```bash
pnpm verify
```

The repository includes focused Vitest coverage for property discovery, tours, localisation, agent flows, payment states, maps, and responsive layout behavior.
