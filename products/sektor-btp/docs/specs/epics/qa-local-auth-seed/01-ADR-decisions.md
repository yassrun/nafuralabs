# ADR — QA local auth + seed

**Statut :** accepted (spec) · 2026-08-10  
**Contexte :** epic `qa-local-auth-seed`

## Décisions tranchées

| # | Question | Décision |
|---|----------|----------|
| D1 | Tenant | **Nouveau** tenant dédié `qa-local` / `QA Local` — pas réparer le bootstrap Nafura comme SSOT QA |
| D2 | Owner | **`qa@nafuralabs.local`** — un seul user pour humain + agents Cursor/Claude |
| D3 | Auth | Étendre le chemin **cursor-session** Mode B (HS256) — **pas** Keycloak passwordless / magic-link |
| D4 | Seed | **Réutiliser** `TenantPresetOrchestratorService` / `seedReferenceData` à la provision — interdiction d’un user SQL sans preset |
| D5 | Wizard UI | Skip OK pour agents (`cursorAuthAutoLogin`) ; seed backend **obligatoire** |
| D6 | `cursor.qa@…` | **Déprécié** : config/docs pointent vers `qa@…` ; migration compat optionnelle (alias) |
| D7 | Envs | Flags `NAFURA_DEV_*` **local only** — jamais staging/prod K8s |
| D8 | API agents | Court terme = JWT cursor-session ; CLI `qa-token` ; `nfk_` optionnel plus tard |
| D9 | Même vue | Humain en `dev-up` + `start:erp:cursor` = **même** stack que les agents |

## Ouvertes (Lot 4+)

| # | Question | Notes |
|---|----------|-------|
| O1 | Périmètre seed métier au-delà du référentiel | Partenaires, chantiers, articles démo — inventaire keep/kill |
| O2 | Reset local | Commande `qa-reset` (drop tenant data + re-seed) ? |
| O3 | Permissions API key si Lot 6 | `*` local vs scoped |

## Non-goals

- Login email-only fancy en prod
- Remplacer Keycloak sur staging
- Unifier Playwright e2e sur Keycloak password dans cette epic (suivi possible Lot 5)
