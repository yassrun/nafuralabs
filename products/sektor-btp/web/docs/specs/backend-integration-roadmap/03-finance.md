# Wave 1 — Finance

## Findings traités

D'après `migration_plan.md` §2 et `00-MOCK-INVENTORY.md` §2.9 :

- Le module Finance est en état très inégal : 3 services pure HTTP (`currency`, `exchange-rate`, `payment-term`) mais le reste — comptabilité, trésorerie, lettrage, rapprochement, recouvrement, virements, effets, caisses — tape directement sur **4 mocks distincts** : `FinanceConfigMockService`, `FinanceComptabiliteMockService`, `FinanceTresorerieMockService`, `FinanceRound2MockService`.
- Le mock `FinanceComptabiliteMockService` est même injecté par d'autres mocks frontend (`finance-comptabilite-mock.service.ts:inject(…)`), preuve d'une architecture entièrement mock-first à démêler.
- Surfaces frontend dupliquées : `pages/finance/configuration/currencies` et `pages/finance/devises` parlent de la même réalité — à consolider en backend pour ne pas exporter le doublon.

## Goal

Faire passer le module Finance à **zéro mock**, avec un backend qui supporte :

1. Configuration finance (devises, taux change, conditions paiement, modes règlement).
2. Comptabilité générale (plan comptable, journaux, écritures, lettrage).
3. Trésorerie (banques, virements, effets, rapprochement bancaire).
4. Règlements clients & fournisseurs.
5. Caisses chantier (mouvements + valorisation).
6. Read endpoints pour balance, analytique, recouvrement.

Les **calculs critiques** (lettrage, équilibrage écritures, soldes, projection cash-flow) descendent côté backend.

## Source-of-truth frontend

Cf. `00-MOCK-INVENTORY.md` §2.9 — 24+ fichiers à nettoyer.

Services Class A déjà pure HTTP (à valider) :
```
pages/finance/configuration/currencies/services/currency-api.service.ts
pages/finance/configuration/exchange-rates/services/exchange-rate-api.service.ts
pages/finance/configuration/payment-terms/services/payment-term-api.service.ts
pages/finance/conditions-paiement/services/condition-paiement-api.service.ts   ← inject FinanceConfigMockService → à nettoyer
pages/finance/devises/services/devise-api.service.ts                            ← inject FinanceConfigMockService → à nettoyer
pages/finance/taux-change/services/taux-change-api.service.ts                   ← inject FinanceConfigMockService → à nettoyer
```

## Cible backend

```
backend/domains/currency/         (existant — stabilisation)
backend/domains/finance/          (NOUVEAU — comptabilité + trésorerie + règlements)
```

> **Décision :** on **ne crée pas** un domaine séparé `accounting` / `treasury` / `payments`. Le frontend a un seul module `finance/` → backend a un seul domaine `finance`. Le code reste lisible et la frontière correspond à un chef de projet financier.

### Entités à créer

| Entité | Description |
|---|---|
| `PaymentMode` | Modes règlement (VIREMENT, CHEQUE, ESPECES, EFFET, …) |
| `ChartOfAccount` | Plan comptable (compte 411, 401, 7XX, 6XX…) |
| `AccountingJournal` | Journal comptable (AC, BQ, OD, CA, VE) |
| `JournalEntry` | Écriture (header) |
| `JournalEntryLine` | Ligne d'écriture (compte + débit + crédit + lettrage) |
| `Lettrage` | Lettrage d'écritures (411/401) — `code_lettrage` lié à plusieurs lignes |
| `BankAccount` | Compte bancaire société (RIB + banque + IBAN + SWIFT) |
| `BankStatement` | Relevé bancaire importé |
| `BankStatementLine` | Ligne de relevé + état rapprochement |
| `Reglement` | Règlement client ou fournisseur |
| `Virement` | Virement (préparation + statut + XML banque) |
| `EffetCommerce` | Effet de commerce (LCR/LCN/Traite) |
| `Caisse` | Caisse (centrale ou chantier) |
| `CaisseMouvement` | Mouvement de caisse |
| `FactureFournisseur` | Facture fournisseur (header + lignes + matching BC) |

## Tasks

### B-FIN-01 — Devises + taux change (purge doublons)

**Goal :** stabiliser les 3 services Class A finance et **supprimer le doublon** `currencies` vs `devises`.

**À faire :**

1. Décision UX : la roadmap Round 2 prévoit de garder `pages/finance/devises` (FR) et supprimer `pages/finance/configuration/currencies` (EN technique). Confirmer avec le PO.
2. Backend : déjà OK pour `currency` + `ExchangeRate` (existant dans `backend/domains/currency`).
3. Désinjecter `FinanceConfigMockService` de `devises/services/devise-api.service.ts` et `taux-change/services/taux-change-api.service.ts`.

**Effort :** 1-2 j.h

---

### B-FIN-02 — Conditions paiement + modes règlement

**Goal :** entités `PaymentTerm` (existant) + `PaymentMode` (nouveau).

**À faire :**

1. `PaymentTerm` : déjà existant dans `backend/domains/currency` → vérifier qu'il est consommé par `pages/finance/conditions-paiement` en HTTP réel.
2. Créer `PaymentMode` dans `backend/domains/finance` (premier CRUD du nouveau domaine).

**Endpoints :**
```
GET /api/v1/payment-modes
GET /api/v1/payment-modes/lookup
POST/PUT/DELETE /api/v1/payment-modes
```

**Désinjection :** `conditions-paiement/services/condition-paiement-api.service.ts`.

**Effort :** 1-2 j.h

---

### B-FIN-03 — Plan comptable + journaux

**Goal :** entités `ChartOfAccount` + `AccountingJournal` + `JournalEntry` + `JournalEntryLine`.

**Endpoints :**
```
GET    /api/v1/chart-of-accounts              ← plan comptable hiérarchique
GET    /api/v1/journals                       ← AC/BQ/OD/CA/VE
GET    /api/v1/journal-entries
POST   /api/v1/journal-entries                ← création avec lignes (équilibre vérifié server-side)
PUT    /api/v1/journal-entries/{id}
DELETE /api/v1/journal-entries/{id}           ← uniquement BROUILLON
POST   /api/v1/journal-entries/{id}/post      ← passage en POSTE (irréversible)
GET    /api/v1/balance?from=...&to=...        ← balance comptable (read endpoint)
```

**Règle :** une écriture POSTE est immuable. Création d'écritures d'extourne uniquement.

**Désinjection :**
- `pages/finance/journaux/**` (4 fichiers)
- `pages/finance/plans-comptables/services/plan-comptable.facade.ts`
- `pages/finance/balance/balance.page.ts`

**Effort :** 2-3 j.h

---

### B-FIN-04 — Règlements clients & fournisseurs

**Goal :** entités `Reglement` couvrant l'encaissement client et le paiement fournisseur.

**Logique :**

- `Reglement.type` ∈ {ENCAISSEMENT_CLIENT, PAIEMENT_FOURNISSEUR}
- `Reglement.partnerId` → `Partner` (Wave 0)
- `Reglement.factureIds[]` → factures pointées
- `Reglement.modePaiement` → `PaymentMode`
- Génération auto d'écriture comptable à `POST /api/v1/reglements/{id}/comptabiliser`.

**Endpoints :**
```
GET    /api/v1/reglements?type=ENCAISSEMENT_CLIENT&partnerId=...
POST   /api/v1/reglements
POST   /api/v1/reglements/{id}/comptabiliser
DELETE /api/v1/reglements/{id}                 ← uniquement non comptabilisé
```

**Désinjection :** `pages/finance/reglements/**` (2 fichiers).

**Effort :** 2-3 j.h

---

### B-FIN-05 — Lettrage écritures

**Goal :** entité `Lettrage` avec code (`AAA`, `AAB`, …) liant N lignes d'écriture (411/401) dont le solde est zéro.

**Endpoints :**
```
POST /api/v1/lettrage                          ← création (lignes + code auto)
GET  /api/v1/lettrage/non-lettrees?account=411&partnerId=...
POST /api/v1/lettrage/auto-match               ← matching auto par paire évidente
DELETE /api/v1/lettrage/{code}                  ← délettrage
GET  /api/v1/lettrage/{code}/export.csv
```

**Logique :** somme(débit) - somme(crédit) sur les lignes lettrées = 0 (vérification server-side).

**Désinjection :** `pages/finance/lettrage/lettrage.page.ts`.

**Effort :** 2 j.h

---

### B-FIN-06 — Rapprochement bancaire (import OFX/CSV)

**Goal :** entités `BankAccount`, `BankStatement`, `BankStatementLine` + matching auto.

**Endpoints :**
```
GET    /api/v1/bank-accounts
GET    /api/v1/bank-statements?bankAccountId=...
POST   /api/v1/bank-statements/import          ← upload OFX/CSV multipart
GET    /api/v1/bank-statements/{id}/lines
POST   /api/v1/bank-statement-lines/{id}/match ← lier à une écriture
POST   /api/v1/bank-statement-lines/{id}/auto-match
```

**Désinjection :** `pages/finance/rapprochement/rapprochement.page.ts`.

**Effort :** 2-3 j.h

---

### B-FIN-07 — Effets de commerce + virements

**Goal :** entités `EffetCommerce` + `Virement` (+ génération XML banque MA).

**Endpoints :**
```
GET    /api/v1/effets?status=PORTEFEUILLE
POST   /api/v1/effets
POST   /api/v1/effets/{id}/remise-encaissement
POST   /api/v1/effets/{id}/escompte
POST   /api/v1/effets/{id}/impaye

GET    /api/v1/virements?status=PREPARATION
POST   /api/v1/virements
POST   /api/v1/virements/{id}/generate-xml?banque=AWB
POST   /api/v1/virements/{id}/marquer-envoye
```

**Désinjection :**
- `pages/finance/effets/effets-commerce.page.ts`
- `pages/finance/virements/**` (3 fichiers)

**Effort :** 2 j.h

---

### B-FIN-08 — Caisses chantier

**Goal :** entités `Caisse` (CENTRALE / CHANTIER) + `CaisseMouvement` (AVANCE_RECUE / DEPENSE / JUSTIFICATIF / RETOUR).

**Endpoints :**
```
GET    /api/v1/caisses?type=CHANTIER&chantierId=...
GET    /api/v1/caisse-mouvements?caisseId=...
POST   /api/v1/caisse-mouvements
POST   /api/v1/caisse-mouvements/{id}/valider
GET    /api/v1/caisses/{id}/solde
```

**Logique :** solde caisse calculé server-side.

**Désinjection :**
- `pages/finance/caisses/**` (5 fichiers)
- `pages/finance/caisses-chantier/caisses-chantier.page.ts`

**Effort :** 1-2 j.h

---

### Factures fournisseurs (rattachement à Achats)

> **Note :** `FactureFournisseur` est implémentée en Wave 2 — Achats (cf. `04-achats.md` B-ACH-07) car son cycle de vie (3-way matching) est piloté par l'achat. Le frontend `pages/finance/factures-fournisseurs/` reste sous le menu Finance mais consomme un endpoint Achats.

## Frontend cleanup

À la fin de Wave 1 Finance :

```bash
grep -rE "inject\((Finance(Config|Comptabilite|Tresorerie|Round2)MockService)\)" \
  web/app/applications/erp/finance/ \
  web/app/applications/erp/pages/finance/ \
  2>/dev/null
# (vide attendu)
```

## Testing

| Test | Type | Périmètre |
|---|---|---|
| `JournalEntryServiceTest` | JUnit | équilibre débit/crédit, transition POST |
| `LettrageServiceTest` | JUnit | matching auto + délettrage |
| `ReglementServiceTest` | JUnit | génération écriture comptable |
| `BankReconciliationServiceTest` | JUnit | import OFX + auto-match |
| `VirementServiceTest` | JUnit | génération XML AWB/BMCE/CIH/BP |
| `finance-flow.e2e.spec.ts` | Playwright | facture → règlement → lettrage → balance |

## Dependencies

- **Wave 0 complete** (partner pour règlements).
- **Indépendant** des autres modules Wave 1 (peut tourner en parallèle d'Inventory).
- Sera consommé par **Achats** (factures fournisseurs, règlements) et **Ventes** (factures, encaissements).

## Definition of Done — Finance

- [ ] B-FIN-01 → B-FIN-08 toutes `[x]`
- [ ] `grep Finance.*MockService` → vide
- [ ] Les 4 mocks Finance quarantinés
- [ ] `00-PROGRESS.md` à jour
