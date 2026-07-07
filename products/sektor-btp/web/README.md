# Sektor BTP — Frontend

Workspace Angular complet pour Sektor BTP (ERP BTP Maroc).

## Structure

| Chemin | Rôle |
|--------|------|
| `app/` | Bootstrap (`app.routes.ts`) + code métier ERP |
| `src/` | `main.ts`, environnements, styles globaux |
| `public/` | i18n, assets statiques |
| `tests/` | Playwright e2e |
| `../../../platform/web/` | Platform partagée (`@platform/*`) |

## Commandes

```bash
cd products/sektor-btp/web
npm ci
npm run start:erp          # dev local (port 4200)
npm run build:staging      # build staging
npm run build:prod         # build prod
npm run e2e                # tests Playwright
```

## Alias TypeScript

| Alias | Cible |
|-------|-------|
| `@applications/*` | `./app/*` |
| `@platform/*` | `../../../platform/web/*` |
