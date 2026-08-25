# UrbanKey Singapore — Main Website

This repository contains the **main UrbanKey Singapore property website**: property discovery, market intelligence, AI Property Agent workflows, virtual property tours, and the supporting server, database, and test code.

## Deliberate scope

The experimental Coworking Design Studio and its interactive 2D/3D floor-plan editing work are **intentionally excluded** from this repository until that feature is approved for release.

## Local development

Install dependencies with `pnpm install`, start the application with `pnpm run dev`, and run the regression suite with `pnpm test`.

## Quality baseline

The source is labelled from the validated main-site baseline. Before merging future changes, run `pnpm exec tsc --noEmit` and `pnpm test`.
