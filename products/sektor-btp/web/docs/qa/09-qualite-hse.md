# 09 — Qualité & HSE

> **Audit 2026-06-19** · incident seed runtime (INC-2026-0001) ; NC **NC-2026-0001** seedée via `seed-qa-hse.mjs`. **Browser QA 20/06** : smoke `/hse/inspections` + `/hse/formations` (auth `erp-audit.json`).

Base : `/hse`. Voir [README](README.md).

---

## A1. Tableau de bord HSE — `/hse/tableau-bord`

- [x] KPI TF / TG / Jours sans accident visibles.
- [x] Pyramide Bird — widget sur `/hse/tableau-bord` · graphe live · QA `dev-20260620213244`.
- [ ] Tendances temporelles.

## A2. Incidents — `/hse/incidents`

- [x] Liste (INC-2026-0001) — clic ligne → détail (`/hse/incidents/inc001` · QA `dev-20260620220828`).
- [x] Créer incident (`/hse/incidents/new`).
- [x] Détail + **Ouvrir investigation** + **Clôturer**.
- [!] **Déclarer CNSS DAT** : implémenté (mock PDF) mais masqué si type ≠ MP/AT_TRAVAIL/AT_TRAJET — seed runtime = presque-accident (18/06).
- [!] Seed runtime ≠ `incidents-seed.json` (presque-accident 18/06 vs AT chute 12/01).
- [!] Détail : URL directe OK ; clic colonne chantier → drill-down via `openChantier`.

## A3. Non-conformités — `/hse/non-conformites`

- [x] Liste + création (`/hse/non-conformites/new`).
- [x] Workflow **Prendre en charge → Marquer vérifiée → Clôturer** validé (API assigner/traiter/verifier 200 · QA `verify-hse-nc-20260620.mjs`).
- [x] Seed NC **enrobage acier** — `NC-2026-0001` · reset **OUVERTE** via `seed-qa-hse.mjs` si CLOTUREE.
- [!] NC clôturée après workflow QA — re-seed avant prochain cycle complet.

## A4–A11. Autres pages HSE

- [x] **Inspections** — `/hse/inspections` : listing charge, en-tête « Inspections HSE » (smoke QA 20/06).
- [x] **Formations** — `/hse/formations` : listing charge, en-tête « Formations HSE », état vide attendu (smoke QA 20/06).
- [x] EPI, DUER (+ export), PHS, PPSPS (+ export), Visites médicales (+ export), Registres légaux — pages accessibles (audit 19/06, non retestées 20/06).

---

## Jeux de données

| Entité | Valeur |
|--------|--------|
| Incident | INC-2026-0001 (runtime seed) |
| NC enrobage acier | **`NC-2026-0001`** · `nc-qa-enrobage-acier` · CH-2026-004 · QUALITE · re-seed pour OUVERTE |

Seed NC : `node web/tests/e2e/scripts/seed-qa-hse.mjs` (idempotent · auth `tests/e2e/.auth/erp-audit.json`).

### Blockers connus

- **Workflow NC** : validé via API ; UI 3 étapes (sans `assigner`).
- **CNSS DAT** : code présent, visibilité conditionnelle au type incident.
- **Bird** : présent `/hse/tableau-bord` + `/dashboard` (live API HSE).
