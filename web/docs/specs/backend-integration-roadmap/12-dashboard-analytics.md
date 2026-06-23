# Wave 5 — Dashboard, Analytics, Pilotage

## Findings traités

D'après `migration_plan.md` §10 et `00-MOCK-INVENTORY.md` §2.11 :

- **Pas un domaine.** Le frontend a 4 dossiers `dashboard/`, `analytics/`, `pilotage/`, `pilotage-analyses/` qui sont des **lecteurs d'agrégats** sur les autres modules.
- 10+ fichiers (pages tableaux analytics, dashboard, services pilotage) injectent **plusieurs** mocks à la fois (`AchatsMockService`, `VentesMockService`, `ChantiersMockService`, `RhMockService`, `HseMockService`, `InventoryMockService`).
- Round 2 audit signale : KPIs à 0 sur 5 vues Pilotage & Analyses, projection cash-flow linéaire bugée (`+658.148 MAD × 10 mois`).
- **Conséquence pour la migration :** ces pages ne peuvent être migrées **que** lorsque tous les domaines sources sont livrés.

## Goal

**Pas de nouveau domaine.** À la place :

1. Exposer des **read endpoints d'agrégat** sur les domaines sources existants.
2. Refactorer les pages frontend pour qu'elles appellent ces endpoints (et plus les mocks).
3. Calculer les KPIs **server-side**, pas dans les helpers Angular.

## Source-of-truth frontend

Cf. `00-MOCK-INVENTORY.md` §2.11 — 10+ fichiers à nettoyer.

```
pages/dashboard/dashboard.page.ts
pages/analytics/tableau-{achats,chantiers,financier,hse,rh}/                    ← 5 pages
pages/pilotage/services/{cash-flow-projection,pilotage-chantier-marges}.service.ts
pages/pilotage-analyses/services/pilotage-analyses-data.service.ts
shell/erp-notifications.service.ts
shell/chantier-drilldown.service.ts
```

## Cible backend

**Aucun nouveau domaine.** On enrichit les domaines existants :

```
backend/domains/chantiers/  → endpoint /api/v1/dashboard/kpis (orchestre via service shared)
backend/domains/chantiers/  → endpoint /api/v1/pilotage/cash-flow-projection
backend/domains/chantiers/  → endpoint /api/v1/pilotage/marges
backend/domains/finance/    → endpoint /api/v1/analytics/finance
backend/domains/achats/     → endpoint /api/v1/analytics/achats
backend/domains/rh/         → endpoint /api/v1/analytics/rh
backend/domains/hse/        → endpoint /api/v1/analytics/hse
```

> **Décision :** chaque agrégat vit dans le domaine source de la **donnée principale**. Le dashboard global (qui mixe tout) appelle plusieurs endpoints depuis le frontend (le `DashboardFacade` orchestre).
>
> **Alternative rejetée :** créer un service backend `aggregator` qui fait du fan-out vers tous les domaines. Trop couplant. Mieux de garder les responsabilités claires.

## Tasks

### B-DSH-01 — Read model `DashboardKpi`

**Goal :** chaque domaine expose un endpoint `/kpis` pour les tuiles du dashboard global.

**Endpoints :**
```
GET /api/v1/chantiers/kpis?societeId=...                  → { nbActifs, totalCA, totalMarges, alertesBudget, alertesRetard }
GET /api/v1/ventes/kpis?from=...&to=...                   → { caCumule, caEncaisse, creancesOuvertes, facturesEnRetard, nbDevisGagnes }
GET /api/v1/achats/kpis?from=...&to=...                   → { volumeAchatsYTD, nbBcEnCours, dependanceTop3, economiesYTD }
GET /api/v1/finance/kpis                                   → { tresorerieCourante, ratioLiquidite, bfr, dettesFournisseurs }
GET /api/v1/rh/kpis                                        → { effectifs, masseSalarialeYTD, absenteisme, rotationAnnuelle }
GET /api/v1/hse/kpis                                       → { tf1, tf2, tg, joursSansAccident, nbIncidents12mois }
GET /api/v1/stock/kpis                                     → { valorisationStock, rotation, valoMagasinChantier }
GET /api/v1/marches/kpis                                   → { nbContratsActifs, cumulSituations, cumulRG, cautionsExpirant30j }
```

**Désinjection :**
- `pages/dashboard/dashboard.page.ts` → consomme `DashboardFacade.loadAllKpis()` qui orchestre les 8 endpoints en parallèle.

**Effort :** 2-3 j.h (1 endpoint par domaine + 1 facade frontend)

---

### B-DSH-02 — Read model `AnalyticsBucket` (multi-axes)

**Goal :** chaque domaine expose un endpoint `/analytics` qui renvoie des buckets multi-axes prêts pour les pages `tableau-*`.

**Pattern :**
```
GET /api/v1/chantiers/analytics?dimensions=societe,bu,client&from=...&to=...&metrics=ca,marge,nbChantiers
→ {
    dimensions: ["societe", "bu", "client"],
    rows: [
      { keys: ["SocA", "BU1", "ClientX"], metrics: { ca: 1234567, marge: 12.5, nbChantiers: 3 } },
      ...
    ]
  }
```

Idem pour `/ventes/analytics`, `/achats/analytics`, `/rh/analytics`, `/hse/analytics`, `/finance/analytics`.

**Désinjection :**
- `pages/analytics/tableau-achats/tableau-achats.page.ts`
- `pages/analytics/tableau-chantiers/tableau-chantiers.page.ts`
- `pages/analytics/tableau-financier/tableau-financier.page.ts`
- `pages/analytics/tableau-hse/tableau-hse.page.ts`
- `pages/analytics/tableau-rh/tableau-rh.page.ts`
- `pages/pilotage-analyses/services/pilotage-analyses-data.service.ts`

**Tests unitaires :** `AnalyticsBucketServiceTest` (par domaine, sur seeds connus, assertions exactes).

**Effort :** 2-3 j.h (1 endpoint par domaine + facades frontend dédiées)

---

### B-DSH-03 — Read model `CashFlowProjection` (dynamique)

**Goal :** corriger le bug Round 2 M-PIL-05 (projection linéaire constante) en faisant un calcul dynamique côté backend.

**Logique :**
```
Encaissements_M = somme(situations_attendues_M) - somme(rg_immobilisee_M)
                 + somme(echeances_factures_clients_M)
Décaissements_M = somme(factures_fournisseurs_echeance_M)
                 + somme(salaires_M) + somme(charges_sociales_M)
                 + somme(traites_M) + somme(virements_planifies_M)
Solde_M = Solde_M-1 + Encaissements_M - Décaissements_M
```

**Endpoint :**
```
GET /api/v1/pilotage/cash-flow-projection?from=2026-05&to=2027-05&societeId=...
→ [
    { mois: "2026-05", soldeOuverture, encaissements, decaissements, soldeCloture },
    ...
  ]
```

**Désinjection :**
- `pages/pilotage/services/cash-flow-projection.service.ts` → pure HTTP
- `pages/pilotage/services/pilotage-chantier-marges.service.ts` → pure HTTP
- `pages/pilotage-analyses/services/pilotage-analyses-data.service.ts` → pure HTTP

**Tests unitaires obligatoires :** `CashFlowProjectionServiceTest` (sur seeds : pas de plateau constant).

**Effort :** 2-3 j.h

## Frontend cleanup

```bash
grep -rE "inject\((AchatsMockService|VentesMockService|ChantiersMockService|RhMockService|HseMockService|InventoryMockService|FinanceComptabiliteMockService))\)" \
  web/app/applications/erp/pages/dashboard/ \
  web/app/applications/erp/pages/analytics/ \
  web/app/applications/erp/pages/pilotage/ \
  web/app/applications/erp/pages/pilotage-analyses/ \
  web/app/applications/erp/shell/ \
  2>/dev/null
# (vide attendu)
```

**Smoke test final de toute la migration :**
```bash
grep -rE "inject\(\w+MockService\)" web/app/applications/erp/ 2>/dev/null | grep -v "\.spec\.ts"
# (vide attendu — fin de migration)
```

## Testing

| Test | Type | Périmètre |
|---|---|---|
| `DashboardKpiServiceTest` (par domaine) | JUnit | smoke values sur seeds |
| `AnalyticsBucketServiceTest` (par domaine) | JUnit | dimensions multiples |
| `CashFlowProjectionServiceTest` | JUnit | non-linéarité + cohérence |
| `dashboard-flow.e2e.spec.ts` | Playwright | dashboard charge 8 KPIs réels, drill-down sur chaque |
| `analytics-flow.e2e.spec.ts` | Playwright | 5 vues, KPIs ≠ 0 |
| `migration-final.e2e.spec.ts` | Playwright | aucun mock dans la couche shell |

## Dependencies

- **Toutes les Waves précédentes** doivent être au moins `[~]` (sources de données disponibles).
- Wave 5 démarre **strictement après** Waves 0-4 stables.

## Definition of Done — Dashboard / Analytics / Pilotage

- [ ] B-DSH-01 → B-DSH-03 toutes `[x]`
- [ ] Aucun mock service injecté dans `pages/dashboard/`, `pages/analytics/`, `pages/pilotage*/`, `shell/`
- [ ] KPIs ≠ 0 sur les 5 vues Pilotage & Analyses (correction Round 2 M-PIL-01)
- [ ] Cash-flow projection dynamique (correction Round 2 M-PIL-05)
- [ ] **Migration complète :** `grep MockService` sur tout `web/app/applications/erp/` (hors specs) → vide
- [ ] `00-PROGRESS.md` à jour
