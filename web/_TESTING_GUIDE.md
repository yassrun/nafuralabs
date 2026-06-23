# Testing Guide

This workspace now includes four complementary testing layers:

- `npm run test:ci`: unit tests with Karma/Jasmine.
- `npm run e2e`: Playwright end-to-end coverage, including the offline-first pointage flow.
- `npm run e2e:a11y`: axe-core audits — **pointage mobile** (`tests/e2e/pointage-a11y.spec.ts`) + **9 pages ERP clés** (`tests/e2e/critical-pages-a11y.spec.ts`, desktop viewport). Exécuter avec `--project=chromium-desktop` ou `--project=chromium-mobile` selon la cible.
- `npm run pdf:demo`: script Node `scripts/pdf-demo/render-pdf.mjs` (wrapper `npx playwright pdf`) — voir `docs/specs/erp-audit-roadmap/pdf-server-demo.md`.
- `npm run lighthouse:ci`: Lighthouse CI for dashboard and pointage entry routes.
- `npm run test:load`: Artillery smoke-load profile for the pointage route.
- `npm run storybook`: local component sandbox.
- `npm run test:storybook`: Storybook interaction/a11y checks against the running Storybook server.

## Recommended local order

1. Install browsers once with `npm run e2e:install`.
2. Run `npm run test:ci` for unit checks.
3. Run `npm run e2e` for browser flows.
4. Run `npm run e2e:a11y` before merging UI changes.
5. Run `npm run lighthouse:ci` on shell, routing, or performance-sensitive changes.
6. Run `npm run storybook` when editing shared UI components.

## Current seeded coverage

- Playwright smoke flow: offline queue then resync on `/rh/pointage/saisie`.
- axe-core: pointage mobile + 9 routes critiques (dashboard, chantiers, BC, marchés factures, finance journaux, RH employés, HSE incidents, admin membres).
- Lighthouse pages: `/dashboard` and `/rh/pointage/saisie`.
- Storybook baseline story: `Anatomy/Atoms/Status Badge`.
- Load smoke: GET traffic ramp against `/rh/pointage/saisie`.

## CI notes

- Playwright uses the Angular dev server via `playwright.config.ts`.
- Lighthouse CI starts its own Angular dev server on port `4300`.
- Storybook tests expect a running Storybook instance on port `6006`.
- The pointage offline flow does not require a backend because the ERP mock services persist locally.