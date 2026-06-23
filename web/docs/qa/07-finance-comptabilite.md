# 07 — Finance & Comptabilité

> **Audit 2026-06-20 (trésorerie)** · Playwright + API (`verify-finance-qa-20260620.mjs`) : **B1/B3/B5 PASS**. Comptes bancaires **CB-AWB-01 / CB-BMCE-02 / CB-CIH-03** visibles sur `/finance/caisses` ; règlement fournisseur **RG-2026-00001** créé avec imputation **FF-2026-0345** ; `/finance/rapprochement` charge (select compte OK).
>
> **Audit 2026-06-20 (workflow)** · Playwright + API (`verify-finance-qa-20260620.mjs`) : **A1/A2/A5/B3 PASS** après fix `ensureTenantDefaults()` (contourne `DemoSeedRuntimeGuardAspect` sur `seedIfEmpty`). Comptes bancaires : **CB-AWB-01**, **CB-BMCE-02**, **CB-CIH-03**.
>
> **Audit 2026-06-19** · pages chargent (h1 OK) ; icônes Lucide sidebar OK — crawl **119/119** routes. i18n conditions-paiement corrigé. Plan CGNC **116 comptes** via `seedFromClasspath`.

Base : `/finance`.
Comptabilité générale + analytique, trésorerie, déclarations fiscales (Maroc), configuration.

---

## A. Comptabilité

### A1. Journaux — `/finance/journaux`

- [x] **Écriture seed visible** — `/finance/journaux/ecritures` : **EC-2026-00001** (Achats ciment BC Sika) ; détail ouvre lignes **6111 / 34552 / 4411**, total **137 280 MAD**.
- [x] Liste des écritures par journal + détail — liste **EC-2026-00001** + filtres `journalCode=AC` / période juin ; détail lignes OK (2026-06-20).
- [x] **Créer** une écriture (équilibre débit = crédit obligatoire) — API rejette déséquilibre (400) ; création **EC-2026-00002** ; formulaire `/finance/journaux/nouvelle` OK.
- [x] Filtre par journal, période, compte — query params journal/période (UI + API) ; drill-down compte depuis balance → écritures.

### A2. Balance — `/finance/balance`

- [x] Balance générale (débit/crédit/solde par compte) — comptes **6111**, **4411**, **5141** ; totaux équilibrés après validation écritures.
- [x] Filtre période, niveau de compte — filtre dates + classe **6** (API + UI).
- [x] **Export CSV** de la balance — téléchargement `balance-2026-01-01_2026-12-31.csv`.

### A3. Analytique — `/finance/analytique`

- [ ] Ventilation analytique par chantier/section.
- [ ] Imputation des charges/produits par axe.

### A4. Factures fournisseurs — `/finance/factures-fournisseurs`

- [x] Liste affiche facture seed **FF-2026-0345** (Sika Maroc · `FF-2026-00002` interne).
- [x] **Détail ouvre** `FF-2026-00002 — Sika Maroc SARL` (montant **137 280 MAD**, n° fournisseur **FF-2026-0345**) — clic depuis la liste, pas d'erreur 500.
- [ ] **Créer/éditer** une facture fournisseur.
- [ ] Rapprochement BC ↔ réception ↔ facture (3-way match).
- [ ] Échéancier, comptabilisation.

### A5. Lettrage — `/finance/lettrage`

- [x] Lettrage des écritures client/fournisseur (rapprochement partiel/total) — paire **4411** facture Sika + paiement QA ; lettrage code **AAA** via API.
- [x] **Export CSV** de l'historique de lettrage — `GET /api/v1/lettrage/{code}/export.csv` OK.
- [x] Délettrage — `DELETE /api/v1/lettrage/{code}` → 204.

---

## B. Trésorerie

### B1. Caisses — `/finance/caisses`

- [x] **Liste** comptes trésorerie — page charge (h1 « Caisses & banques ») ; **3 banques** seedées visibles (**CB-AWB-01**, **CB-BMCE-02**, **CB-CIH-03**) ; `GET /api/v1/bank-accounts` → 3.
- [x] Caisse CENTRALE seedée — `GET /api/v1/caisses?type=CENTRALE` → **2** (**CA-CASA-01** solde 15 000 MAD) · fix `ensureTenantDefaults` · QA 20/06.
- [x] Solde + création mouvement espèces — API `POST /api/v1/caisse-mouvements` → **201** (verify script).

### B2. Virements — `/finance/virements`

- [ ] Saisie d'ordres de virement, bénéficiaires.
- [ ] **Remise de virements** — `/finance/virements/remise` : génération du fichier de remise bancaire.

### B3. Règlements — `/finance/reglements`

- [x] Page **Règlements fournisseurs** charge (h1 OK) ; liste affiche **RG-2026-00001** après verify (`GET /api/v1/reglements` → 1).
- [x] Enregistrement des règlements — **RG-2026-00001** créé via API (virement **CB-AWB-01**, Sika Maroc, **5 000 MAD**) avec **imputation FF-2026-0345** ; formulaire `/finance/reglements/new?type=FOURNISSEUR` OK.

### B4. Recouvrement — `/finance/recouvrement`

- [ ] Suivi des créances échues, relances (mail).
- [ ] Balance âgée client.

### B5. Rapprochement bancaire — `/finance/rapprochement`

- [x] **Page charge** — h1 « Rapprochement bancaire », sélecteur compte bancaire OK ; `GET /api/v1/bank-statements` → 0 relevé.
- [ ] Import relevé, pointage écritures ↔ relevé, écarts.

### B6. Effets — `/finance/effets`

- [ ] Gestion des effets (traites/LCN), échéances, statut.

### B7. Caisses chantier — `/finance/caisses-chantier`

- [ ] Caisses régie par chantier, dépenses terrain, justificatifs.

---

## C. Déclarations fiscales (Maroc)

### C1. Retenue à la source — `/finance/declarations/retenue-source`

- [ ] Calcul RAS (honoraires, non-résidents), états.

### C2. SIMPL-IS — `/finance/declarations/simpl-is`

- [ ] Préparation IS, **export** du fichier de télédéclaration.

### C3. État 9421 — `/finance/declarations/etat-9421`

- [ ] Édition de l'état 9421 (CA exporté).

### C4. État 1208 — `/finance/declarations/etat-1208`

- [ ] Édition de l'état 1208 (achats/TVA déductible).

---

## D. Configuration

### D1. Devises — `/finance/devises`

- [ ] CRUD devises (MAD par défaut), code ISO, symbole.

### D2. Taux de change — `/finance/taux-change`

- [x] Liste affiche taux seed **EUR** (10,85) et **USD** (9,95) — 2 lignes.
- [ ] CRUD taux par date, devise.

### D3. Conditions de paiement — `/finance/conditions-paiement`

- [x] Liste affiche condition seed **60FDM** (60 jours fin de mois).
- [ ] CRUD conditions (comptant, 30/60/90 j, fin de mois).

### D4. Plans comptables — `/finance/plans-comptables`

- [x] Plan **CGNC Maroc** charge — h1 « Plan comptable BTP — CGNC Maroc », compteur **116 comptes** (API + stats page).
- [ ] Arborescence comptes navigable (expansion nœuds 6111, 4411…).
- [ ] Plan comptable (CGNC Maroc), comptes, classes.

---

## Jeux de données

> **Seed API** · `node tests/e2e/scripts/seed-qa-finance.mjs` (auth : `tests/e2e/.auth/erp-audit.json`, idempotent).
> État **2026-06-20** — re-vérifié navigateur (spot-check). Seed inchangé depuis 2026-06-19.

| Entité | Statut | Identifiant / repère |
|--------|--------|----------------------|
| Condition paiement `60FDM` | ✅ créée | id `8cfdbbd7-8677-4a34-bf61-01ca447d48ac` |
| Taux EUR → MAD (10,85) | ✅ créé | id `4185bf91-…`, date 2026-06-19 |
| Taux USD → MAD (9,95) | ✅ créé | id `f7c12cd0-…`, date 2026-06-19 |
| Plan comptable CGNC | ✅ auto-seed | **116 comptes** + 8 journaux (`ComptabiliteSeedService.seedFromClasspath`) |
| Journal achats `AC` | ✅ créé (API) | id `d7e1704e-…` |
| Écriture achats Sika | ✅ créée | `EC-2026-00001`, ref `QA-FIN-2026-EC-ACH-SIKA` |
| Facture `FF-2026-0345` | ✅ créée | interne `FF-2026-00002` · Sika Maroc · 137 280 MAD TTC · visible UI |

### Endpoints API utilisés

| Ressource | Méthode | Chemin |
|-----------|---------|--------|
| Conditions paiement | GET/POST | `/api/v1/payment-terms` |
| Devises | GET | `/api/v1/currencies` |
| Taux de change | GET/POST | `/api/v1/exchange-rates` |
| Plan comptable | GET | `/api/v1/chart-of-accounts` |
| Journaux | GET/POST | `/api/v1/journals` |
| Écritures | GET/POST | `/api/v1/journal-entries` |
| Fournisseurs | GET | `/api/v1/partners?role=FOURNISSEUR` |
| Factures fournisseur | GET/POST | `/api/v1/factures-fournisseur` |

### Blockers connus

- **Comptes bancaires** : `BankAccountSeedService.seedIfEmpty()` héritait du `@Transactional(readOnly=true)` de `listAccounts()` — aucun compte seedé. Corrigé (`Propagation.REQUIRES_NEW`) ; redeploy requis pour **B3** règlements.
- **Facture fournisseur** : création OK avec `bcId` (ex. `FF-2026-00002` / `FF-2026-0345` via `seed-qa-finance.mjs`). Le matching 3-way est calculé à la validation ou via `GET …/matching`, pas à la création. Prérequis : `seed-qa-achats.mjs` (BC Sika + réception).
- **Plan comptable CGNC** : **116 comptes** + 8 journaux chargés automatiquement au premier GET `/api/v1/chart-of-accounts` (`ComptabiliteSeedService.seedFromClasspath`, source `comptabilite-seed.json`).

### Écriture (journal achats)

| Compte | Libellé | Débit | Crédit |
|--------|---------|-------|--------|
| 6111 | Achats ciment (BC Sika) | 114 400 | |
| 34552 | TVA déductible 20 % | 22 880 | |
| 4411 | Fournisseur Sika Maroc | | 137 280 |

### Facture fournisseur

| Champ | Valeur |
|-------|--------|
| Fournisseur | Sika Maroc SARL |
| N° facture | FF-2026-0345 |
| Montant TTC | 137 280 MAD |
| Échéance | 30 j (18/07/2026) |
| Rapprochement | BC achats ↔ réception DEP-ALM |

### Condition de paiement

| Code | Libellé | Délai |
|------|---------|-------|
| 60FDM | 60 jours fin de mois | 60 j FDM |

### Devise / taux

| Devise | Code | Taux (vs MAD) | Date |
|--------|------|---------------|------|
| Euro | EUR | 10,85 | 19/06/2026 |
| Dollar US | USD | 9,95 | 19/06/2026 |
