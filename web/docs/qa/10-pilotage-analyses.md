# 10 — Pilotage & Analyses

> **Audit 2026-06-20** · `erp-web:dev-20260620005515` · KPI partiels malgré seed doc « vide ».

Base : `/pilotage`, `/pilotage-analyses`, `/analytics`.

---

## Socle

- [x] Routes testées chargent sans perte de session.
- [x] Filtres présents (marges, etc.).
- [x] Export CSV sur marges, rentabilité, déclarations liées.
- [x] `/analytics/stock` — `TableauStockPage` (h1 « Analytics — Stock »), pas de redirect inventaire ; KPI live : valeur **59 760 MAD**, rotation **4 j**, stock central **59 760 MAD**, stock chantier **0 MAD**.

## A. Pilotage `/pilotage`

- [x] A1 Marges chantier — **5 chantiers actifs**, 6 lignes tableau, export CSV.
- [x] A2 Marge consolidée — page **Pilotage — Marge consolidée** (`/pilotage/marge-consolidee` · fix tour onboarding exact-prefix · QA `dev-20260620130151`).
- [x] A3 Cash-flow — route `/pilotage/cash-flow` (même fix tour ; non rejoué en browser cette passe).

## B. Analyses `/pilotage-analyses`

- [x] B1 Rentabilité (+ export).
- [x] B2 Financier (ratios MAD).
- [x] B3 Stock, B4 Achats, B5 RH, B6 What-if, B7 OPEX/CAPEX, B8 Groupe.

## C. Analytics `/analytics`

- [x] Chantiers (6 total · 5 en cours · avancement moyen **12 %** · budget **12 500 000 MAD**), Financier, Achats, RH.
- [x] Stock — `TableauStockPage` à `/analytics/stock`.

---

## Jeux de données

Pilotage affiche **5 chantiers actifs**, portefeuille **12 500 000 MAD**, marge globale **16,4 %**. Dashboard avancement pondéré **23 %** (≠ analytics chantiers **12 %** · ≠ CH-2026-004 seul **40 %**).
