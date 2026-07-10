# 11 — Pilotage & Analyses (brancher données, marges, cash-flow dynamique, what-if)

> **Sévérité** : P0 sur M-PIL-01 (KPIs à 0 sur 5 vues)
> **Estimation** : 1 sprint (S4)
> **Dépendances** : Round 1 (Pilotage marges/marge consolidée/cash-flow OK), `13-admin` (multi-société), `08-finance` (analytique)

## Findings traités

- [x] **M-PIL-01** Brancher données réelles sur 5 vues Pilotage & Analyses **P0**
- [ ] **M-PIL-02** Indicateurs de marge multi-axes (chantier/BU/client/MOA) — TCD + export CSV (Excel P1)
- [ ] **M-PIL-03** OPEX vs CAPEX par mois et par chantier — page agrégat ; ventilation mensuelle chantier à faire
- [ ] **M-PIL-04** Reporting groupe multi-société consolidé — page KPI démo ; intercos Task 13
- [x] **M-PIL-05** Cash-flow dynamique (vs projection linéaire bugée)
- [ ] **M-PIL-06** What-if simulator — sliders + comparatif simplifié ; recalcul complet à étendre
- [ ] **M-PIL-07** Exports CAC/DAF (FEC, CGNC, mapping IFRS)
- [ ] **M-PIL-08** Benchmark sectoriel anonymisé (P2)
- [ ] **M-PIL-09** Alertes IA proactives (P3)

## Goal

Faire passer **Pilotage & Analyses** de stubs vides (« Avancement moyen 0% », « Budget total 0 MAD ») à un **poste de pilotage opérationnel** : KPIs réels sur 5 vues (chantiers/financier/stock/achats/RH), marges multi-axes, cash-flow dynamique (vs la projection linéaire bugée actuelle), what-if simulator, exports CAC.

## Context to read first

```
app/applications/erp/pages/pilotage/                                 # Round 1 marges-chantier, marge-consolidee, cash-flow OK
app/applications/erp/pages/pilotage-analyses/                        # 5 vues stubs
app/applications/erp/pages/pilotage-analyses/rentabilite/             # ❌ KPIs 0
app/applications/erp/pages/pilotage-analyses/financier/               # ❌ KPIs 0
app/applications/erp/pages/pilotage-analyses/stock/                   # ❌ KPIs 0
app/applications/erp/pages/pilotage-analyses/achats/                  # ❌ KPIs 0
app/applications/erp/pages/pilotage-analyses/rh/                      # ❌ KPIs 0
app/applications/erp/pilotage/services/                              # Round 1
app/applications/erp/pilotage/services/cash-flow-projection.service.ts  # Round 1 7.8
app/applications/erp/pilotage/services/pilotage-chantier-marges.service.ts
```

---

## Task 11.1 — Brancher données réelles 5 vues (M-PIL-01) **P0**

Pour chaque vue stub, identifier la source de données et brancher :

### Rentabilité
- KPI : marge brute YTD, marge nette YTD, marge moyenne par chantier, top/flop 5 chantiers
- Source : `PilotageChantierMargesService` (Round 1)
- Graphes : courbe marge mensuelle, scatter plot rentabilité × CA

### Financier
- KPI : CA YTD, CA encaissé, créances ouvertes, dettes fournisseurs, BFR, ratio liquidité
- Source : `FinanceComptabiliteMockService` (Round 1) + `JournauxService`
- Graphes : évolution CA mensuel N vs N-1, ratio âge créances

### Stock
- KPI : valeur stock totale, rotation stock, valeur stock chantier vs central, top 10 articles consommés
- Source : `InventoryMockService` + `valorisation.facade.ts` (Round 1)

### Achats
- KPI : volume YTD, nb BC, top fournisseurs, économies vs prix marché, dépendance fournisseur
- Source : `AchatsMockService` + facades fournisseurs

### RH
- KPI : effectif total, masse salariale YTD, taux absentéisme, taux rotation, pyramide âges, heures supp YTD
- Source : `EmployesMockService` + `PaieEngineService`

**Acceptance criteria** :
- [ ] 5 vues affichent des données cohérentes avec les écrans détaillés
- [ ] Aucune KPI à 0 si données existent
- [ ] Drill-down depuis chaque KPI vers liste filtrée
- [ ] Test e2e par vue

---

## Task 11.2 — Marges multi-axes (M-PIL-02) **P1**

Étendre `PilotageChantierMargesService` :
- Axe 1 : chantier
- Axe 2 : BU (Business Unit / société)
- Axe 3 : client
- Axe 4 : MOA
- Axe 5 : type marché (privé / public)

Tableau croisé dynamique avec filtre / pivot / export Excel.

---

## Task 11.3 — OPEX vs CAPEX (M-PIL-03) **P1**

Classement écritures :
- **OPEX** (charges) : achats, MO, frais généraux
- **CAPEX** (investissements) : matériel, formation longue, R&D

Page `/pilotage-analyses/opex-capex` avec ventilation mensuelle + projection.

---

## Task 11.4 — Reporting groupe multi-société (M-PIL-04) **P1**

Cf §13 M-ADM-03 (SocieteService Round 1 existe). Page `/pilotage-analyses/groupe` :
- KPIs consolidés (CA, marge, EBITDA, trésorerie)
- Vue société par société
- Élimination des intercos (factures internes au groupe)

---

## Task 11.5 — Cash-flow dynamique (M-PIL-05) **P1**

**Bug Round 2** : projection actuelle = constante linéaire « +658.148 MAD » × 10 mois. Cassé.

**Action** :
1. Remplacer projection linéaire par calcul dynamique :
   - Encaissements prévus = situations N+1/N+2 (date paiement attendue MOA = J+60 ouvré moyen)
   - Décaissements prévus = factures fournisseur lettrées + salaires + charges sociales + traites
2. Affichage mois par mois avec détail
3. Alerte seuil (cf Round 1 `DEFAULT_CASHFLOW_SEUIL_ALERTE_MAD`)

**Acceptance criteria** :
- [ ] Projection 12 mois non constante (variable réaliste)
- [ ] Drill-down par mois → entrants/sortants détaillés
- [ ] Test unitaire `cash-flow-projection.service.spec.ts` étendu

---

## Task 11.6 — What-if simulator (M-PIL-06) **P1**

Page `/pilotage-analyses/what-if`. Sliders :
- « Retard chantier X de Y jours »
- « OS avec impact coût Z »
- « Hausse prix acier 10 % »
- « Perte chantier en cours »

→ recalcul cash-flow, marges, CA → comparatif scénario actuel vs simulé.

---

## Task 11.7 — Exports CAC (M-PIL-07) **P2**

- **FEC** (Fichier des Écritures Comptables) au format DGI MA
- Balance N-1 vs N
- Mapping IFRS / CGNC (Plan Comptable Général MA)

---

## Task 11.8 — Benchmark sectoriel (M-PIL-08) **P2**

Différer. Nécessite agrégation anonymisée intra-clients Nafura (post production).

---

## Task 11.9 — Alertes IA proactives (M-PIL-09) **P3**

Différer S12+. Modèle simple : régression linéaire trajectoire budget → prédiction dépassement + date.

---

## Testing

```ts
describe('CashFlowProjectionService — Dynamique', () => {
  it('projection variable selon échéances situations', () => { /* … */ });
  it('décaissements salaires fin de mois', () => { /* … */ });
});

// e2e
test('Pilotage & Analyses : aucune KPI à 0 sur 5 vues', async ({ page }) => {
  const urls = ['/pilotage-analyses/rentabilite', '/pilotage-analyses/financier',
                '/pilotage-analyses/stock', '/pilotage-analyses/achats', '/pilotage-analyses/rh'];
  for (const url of urls) {
    await page.goto(url);
    const zeros = await page.locator('[data-kpi-value="0"]').count();
    expect(zeros).toBeLessThan(2);  // tolérance pour KPIs vraiment à 0 (ex: nb litiges)
  }
});
```

## Dépendances inverses

- 01-dashboard (drill-down KPI utilisateur)
- 13-admin (multi-société)
- 08-finance (analytique multi-axes alimente OPEX/CAPEX)
