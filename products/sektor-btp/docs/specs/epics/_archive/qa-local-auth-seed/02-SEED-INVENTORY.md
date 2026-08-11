# Inventaire seed QA — Lot 4

**Statut :** draft inventaire (pas de refonte massive)  
**Epic :** `qa-local-auth-seed` · 2026-08-10

Principe : le **référentiel** (UoM, devises, motifs, emplacements, familles, plan, articles
preset) est désormais seedé par `QaLocalProvisioner` → `applyPreset` / `seedReferenceData`.
Les scripts / docs ci-dessous ne doivent plus être le chemin Mode B.

## Verdict

| Artefact | Verdict | Notes |
|----------|---------|-------|
| `classpath:onboarding/reference-data.json` | **keep** | SSOT référentiel via `TenantReferenceDataSeedService` |
| `onboarding/articles-*.json` | **keep** | Seedés par `applyPreset` (secteur BATIMENT pour QA) |
| `QaLocalProvisioner` (boot, flag-gated) | **keep** | SSOT provision Mode B |
| `data/v1.1/001_cursor_qa_user.sql` | **deprecate / keep SQL** | Legacy `cursor.qa` sur tenant bootstrap — ne plus documenter ; laisser pour idempotence Liquibase |
| `web/tests/e2e/scripts/seed-qa-ref-data.mjs` | **update later** | Hosts `erp.nafura.local` / auth Playwright — viser `127.0.0.1:4200` + `qa-token` |
| `web/tests/e2e/scripts/seed-qa-*.mjs` (autres) | **update later** | Jeux métier e2e ; hors Mode B agent tant que hosts legacy |
| `web/tests/e2e/scripts/seed-qa-all.mjs` | **update later** | Orchestrateur des scripts ci-dessus |
| `web/docs/qa/README.md` + checklists | **update later** | Encore `erp.nafura.local` / `nafura-erp-dev` — périmé vs Mode B |
| Zenit partner extras dans `001_cursor_qa_user.sql` | **kill later / optional move** | Liés au tenant bootstrap Nafura ; si besoin QA → seed métier dédié sur `qa-local` (O1) |

## Hors vague (O1 ADR)

Partenaires démo, chantiers QA, articles hors preset onboarding : **pas** dans le socle
auth+seed. À décider dans une vague métier séparée.

## Next (hors Lot 4 code)

1. Pointer les scripts e2e vers `localhost:8082` + `eval "$(bash toolchain/ops/qa-token.sh)"`.
2. Remplacer l’intro `web/docs/qa/README.md` (hosts + namespace) par Mode B.
3. Ne pas dupliquer `seedReferenceData` dans les scripts mjs.
