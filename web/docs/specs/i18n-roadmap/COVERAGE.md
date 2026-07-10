# 📊 i18n Coverage — Nafura ERP

> **Generated** by `npm run i18n:coverage` from `check-i18n-parity.mjs`. Re-run after every PR i18n.
> **Round 1 scope** : FR + EN only (AR reported as info in `i18n:check`).

## 🌍 Global summary

| Metric | Value |
|---|---:|
| Total packs | **60** |
| Total FR keys | **11,245** |
| Total EN keys | **11,245** |
| Global FR↔EN parity | **100%** |
| Total errors (missing in EN) | ✅ **0** |
| Total suspect (identical FR/EN) | 🟡 **0** |

## 🏗️ ERP modules (Wave C scope)

| Pack | FR keys | EN keys | Parity | Status |
|---|---:|---:|---:|---|
| `achats` | 443 | 443 | 100% | ✅ clean |
| `admin` | 651 | 651 | 100% | ✅ clean |
| `chantiers` | 394 | 394 | 100% | ✅ clean |
| `dashboard` | 261 | 261 | 100% | ✅ clean |
| `finance` | 1272 | 1272 | 100% | ✅ clean |
| `hse` | 536 | 536 | 100% | ✅ clean |
| `inventory` | 1061 | 1061 | 100% | ✅ clean |
| `marches` | 357 | 357 | 100% | ✅ clean |
| `rh` | 556 | 556 | 100% | ✅ clean |
| `shared` | 52 | 52 | 100% | ✅ clean |
| `ventes` | 481 | 481 | 100% | ✅ clean |

## 🧩 Core & application shells

| Pack | FR keys | EN keys | Parity | Status |
|---|---:|---:|---:|---|
| `applications/app` | 2 | 2 | 100% | ✅ clean |
| `applications/core` | 5 | 5 | 100% | ✅ clean |
| `applications/erp` | 485 | 485 | 100% | ✅ clean |
| `applications/socle` | 2 | 2 | 100% | ✅ clean |
| `core` | 1263 | 1263 | 100% | ✅ clean |
| `doc-extractor` | 143 | 143 | 100% | ✅ clean |

## 🔌 External domain/feature packs (auto-generated backend scaffolds)

> **Scope** : these packs are **scaffolded from Java backend entities**
> (`Cities`, `Currencies`, `Departments`, `Disposition Codes`,
> `Stock Balances`, `Inventory Tx Lines`…). They are **not** rendered
> directly by the ERP UI — they pre-populate the future domain feature
> catalogue.
>
> **Round 1 cleanup (Wave E3)** : the ~200 residual `Identical FR/EN`
> suspects in these packs were absorbed pragmatically via
> `STUB_JAVA_TOKEN_WHITELIST` in `check-i18n-parity.mjs` (entity field
> names + navigation titles that do not affect any user-facing UI).
>
> **Round 2 scope** : when the Java backend ships
> `messages_fr.properties` / `messages_en.properties`, these JSON
> scaffolds will be regenerated end-to-end from the backend i18n bundles
> and the pragmatic stub whitelist will be retired.
>
> See [`GLOSSARY.md`](./GLOSSARY.md) § « Java entity stubs (Round 2) »
> for the explicit list of whitelisted scaffolded tokens.

| Pack | FR keys | EN keys | Parity | Status |
|---|---:|---:|---:|---|
| `domains/core/accounting` | 54 | 54 | 100% | ✅ clean |
| `domains/core/banking` | 43 | 43 | 100% | ✅ clean |
| `domains/core/core-hr` | 62 | 62 | 100% | ✅ clean |
| `domains/core/crm` | 39 | 39 | 100% | ✅ clean |
| `domains/core/directory` | 48 | 48 | 100% | ✅ clean |
| `domains/core/finance` | 316 | 316 | 100% | ✅ clean |
| `domains/core/geography` | 16 | 16 | 100% | ✅ clean |
| `domains/core/hr` | 340 | 340 | 100% | ✅ clean |
| `domains/core/inventory` | 232 | 232 | 100% | ✅ clean |
| `domains/core/invoicing` | 56 | 56 | 100% | ✅ clean |
| `domains/core/item` | 34 | 34 | 100% | ✅ clean |
| `domains/core/leave` | 29 | 29 | 100% | ✅ clean |
| `domains/core/logistics` | 263 | 263 | 100% | ✅ clean |
| `domains/core/partner` | 34 | 34 | 100% | ✅ clean |
| `domains/core/payroll` | 49 | 49 | 100% | ✅ clean |
| `domains/core/procurement` | 218 | 218 | 100% | ✅ clean |
| `domains/core/purchasing` | 66 | 66 | 100% | ✅ clean |
| `domains/core/sales` | 231 | 231 | 100% | ✅ clean |
| `domains/core/sales-orders` | 53 | 53 | 100% | ✅ clean |
| `domains/core/stock` | 41 | 41 | 100% | ✅ clean |
| `domains/core/tax` | 18 | 18 | 100% | ✅ clean |
| `domains/erp/currency` | 21 | 21 | 100% | ✅ clean |
| `domains/erp/item` | 34 | 34 | 100% | ✅ clean |
| `domains/erp/stock` | 75 | 75 | 100% | ✅ clean |
| `features/collaboration` | 96 | 96 | 100% | ✅ clean |
| `features/finance-ap` | 43 | 43 | 100% | ✅ clean |
| `features/financial` | 39 | 39 | 100% | ✅ clean |
| `features/geo` | 26 | 26 | 100% | ✅ clean |
| `features/inventory` | 28 | 28 | 100% | ✅ clean |
| `features/item` | 35 | 35 | 100% | ✅ clean |
| `features/location` | 15 | 15 | 100% | ✅ clean |
| `features/measurement` | 23 | 23 | 100% | ✅ clean |
| `features/partner` | 45 | 45 | 100% | ✅ clean |
| `features/sysconfig` | 32 | 32 | 100% | ✅ clean |
| `financial` | 53 | 53 | 100% | ✅ clean |
| `fiscal` | 29 | 29 | 100% | ✅ clean |
| `geo` | 45 | 45 | 100% | ✅ clean |
| `inventory` | 182 | 182 | 100% | ✅ clean |
| `item` | 46 | 46 | 100% | ✅ clean |
| `measurement` | 26 | 26 | 100% | ✅ clean |
| `partner` | 74 | 74 | 100% | ✅ clean |
| `sysconfig` | 48 | 48 | 100% | ✅ clean |
| `uom` | 24 | 24 | 100% | ✅ clean |

## ℹ️ AR coverage (Round 2 scope, informational only)

| Pack | AR keys | vs FR | Coverage |
|---|---:|---:|---:|
| `applications/app` | 2 | 2 | 100% |
| `applications/core` | 5 | 5 | 100% |
| `applications/erp` | 485 | 485 | 100% |
| `applications/erp/achats` | 443 | 443 | 100% |
| `applications/erp/admin` | 651 | 651 | 100% |
| `applications/erp/chantiers` | 394 | 394 | 100% |
| `applications/erp/dashboard` | 261 | 261 | 100% |
| `applications/erp/finance` | 1272 | 1272 | 100% |
| `applications/erp/hse` | 536 | 536 | 100% |
| `applications/erp/inventory` | 1061 | 1061 | 100% |
| `applications/erp/marches` | 357 | 357 | 100% |
| `applications/erp/rh` | 556 | 556 | 100% |
| `applications/erp/shared` | 52 | 52 | 100% |
| `applications/erp/ventes` | 481 | 481 | 100% |
| `applications/socle` | 2 | 2 | 100% |
| `core` | 1263 | 1263 | 100% |
| `doc-extractor` | 143 | 143 | 100% |
| `domains/core/accounting` | 54 | 54 | 100% |
| `domains/core/banking` | 43 | 43 | 100% |
| `domains/core/core-hr` | 62 | 62 | 100% |
| `domains/core/crm` | 39 | 39 | 100% |
| `domains/core/directory` | 48 | 48 | 100% |
| `domains/core/finance` | 316 | 316 | 100% |
| `domains/core/geography` | 16 | 16 | 100% |
| `domains/core/hr` | 340 | 340 | 100% |
| `domains/core/inventory` | 232 | 232 | 100% |
| `domains/core/invoicing` | 56 | 56 | 100% |
| `domains/core/item` | 34 | 34 | 100% |
| `domains/core/leave` | 29 | 29 | 100% |
| `domains/core/logistics` | 263 | 263 | 100% |
| `domains/core/partner` | 34 | 34 | 100% |
| `domains/core/payroll` | 49 | 49 | 100% |
| `domains/core/procurement` | 218 | 218 | 100% |
| `domains/core/purchasing` | 66 | 66 | 100% |
| `domains/core/sales` | 231 | 231 | 100% |
| `domains/core/sales-orders` | 53 | 53 | 100% |
| `domains/core/stock` | 41 | 41 | 100% |
| `domains/core/tax` | 18 | 18 | 100% |
| `domains/erp/currency` | 21 | 21 | 100% |
| `domains/erp/item` | 34 | 34 | 100% |
| `domains/erp/stock` | 75 | 75 | 100% |
| `features/collaboration` | 96 | 96 | 100% |
| `features/finance-ap` | 43 | 43 | 100% |
| `features/financial` | 39 | 39 | 100% |
| `features/geo` | 26 | 26 | 100% |
| `features/inventory` | 28 | 28 | 100% |
| `features/item` | 35 | 35 | 100% |
| `features/location` | 15 | 15 | 100% |
| `features/measurement` | 23 | 23 | 100% |
| `features/partner` | 45 | 45 | 100% |
| `features/sysconfig` | 32 | 32 | 100% |
| `financial` | 53 | 53 | 100% |
| `fiscal` | 29 | 29 | 100% |
| `geo` | 45 | 45 | 100% |
| `inventory` | 182 | 182 | 100% |
| `item` | 46 | 46 | 100% |
| `measurement` | 26 | 26 | 100% |
| `partner` | 74 | 74 | 100% |
| `sysconfig` | 48 | 48 | 100% |
| `uom` | 24 | 24 | 100% |

---

## How to update

```bash
cd web
npm run i18n:coverage          # print to stdout
npm run i18n:coverage:write    # rewrite this file
```

Phase 5.2 — auto-generated coverage report. See [`CI.md`](./CI.md) for the CI gates.
