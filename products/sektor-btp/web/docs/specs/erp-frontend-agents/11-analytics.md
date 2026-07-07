# Agent — Analytics & Reporting

> **Objet** : tableaux de bord analytiques par domaine métier — chantiers, financier, stock, achats, RH. Pilotage stratégique et opérationnel.
> **Routes** : `/analytics/*`
> **Permission** : `analytics.<domain>.read`

## 0. Pré-requis

[00-CONVENTIONS](00-CONVENTIONS.md), [00-UX-PRINCIPES](00-UX-PRINCIPES.md). Dépend des mocks de **tous** les modules — agréger en lecture.

## 1. Vue d'ensemble

Le module analytics propose 5 dashboards thématiques distincts du dashboard d'accueil (qui est généraliste 360°). Chaque dashboard cible un persona / décision spécifique :

| Dashboard | Cible | Décision |
|-----------|-------|----------|
| Chantiers | Direction d'exploitation | Pilotage marges, retards, ressources |
| Financier | DAF / DG | Trésorerie, marges, recouvrement |
| Stock | Magasinier / contrôleur gestion | Rotation, ruptures, valorisation |
| Achats | Acheteur / DAF | Suivi fournisseurs, catégories, optimisation |
| RH | DRH / DG | Effectif, turnover, masse salariale, sécurité |

## 2. Routes

```ts
export const ANALYTICS_ROUTES: Routes = [
  { path: 'analytics/chantiers', loadComponent: () => import('../pages/analytics/chantiers/analytics-chantiers.page').then(m => m.AnalyticsChantiersPage) },
  { path: 'analytics/financier', loadComponent: () => import('../pages/analytics/financier/analytics-financier.page').then(m => m.AnalyticsFinancierPage) },
  { path: 'analytics/stock', loadComponent: () => import('../pages/analytics/stock/analytics-stock.page').then(m => m.AnalyticsStockPage) },
  { path: 'analytics/achats', loadComponent: () => import('../pages/analytics/achats/analytics-achats.page').then(m => m.AnalyticsAchatsPage) },
  { path: 'analytics/rh', loadComponent: () => import('../pages/analytics/rh/analytics-rh.page').then(m => m.AnalyticsRhPage) },
];
```

## 3. Layout commun

Toutes les pages analytics partagent un layout :

```
┌──────────────────────────────────────────────────────────────────────┐
│ Analytics — Chantiers                                                │
│ [Période ▾]  [Chantiers ▾]  [Filtres avancés ▾]    [Export PDF/Excel]│
├──────────────────────────────────────────────────────────────────────┤
│ Row 1 : 4 KPI tiles                                                  │
├──────────────────────────────────────────────────────────────────────┤
│ Row 2 : 2 charts principaux côte à côte                              │
├──────────────────────────────────────────────────────────────────────┤
│ Row 3 : 1 grand chart ou table pivot                                 │
├──────────────────────────────────────────────────────────────────────┤
│ Row 4 : Top 5 / Top 10 / Bottom 5 listes                             │
└──────────────────────────────────────────────────────────────────────┘
```

Composant socle : `<analytics-page-shell>` qui structure header + filtres + grid 2-col responsive.

## 4. `/analytics/chantiers`

### KPIs (Row 1)

| KPI | Calcul |
|-----|--------|
| CA cumulé YTD | Σ situations facturées de l'année |
| Marge moyenne % | Moyenne pondérée marges chantiers actifs |
| Avancement moyen % | Moyenne pondérée avancements chantiers actifs |
| Chantiers en retard | Compte chantiers `EN_COURS` avec `dateFinPrevue < today` |

### Charts (Row 2)

- **Évolution CA mensuel par chantier** — line chart 12 mois.
- **Marges par chantier** — bar chart horizontal triées (vert si > 8%, orange 4-8%, rouge < 4%).

### Table pivot (Row 3)

Pivot chantier × indicateurs :

| Chantier | Statut | Avancement | Budget | Engagé | Réalisé | CA | Marge HT | Marge % | Retard j |

Tri par chantier ou marge décroissante. Drill click → fiche chantier.

### Tops (Row 4)

- **Top 3 chantiers en marge** (€/MAD).
- **Bottom 3 chantiers en marge** (à surveiller).
- **Top 5 sous-traitants** (volume contractuel cumulé).

## 5. `/analytics/financier`

### KPIs

- CA HT YTD.
- EBITDA estimé (CA - charges directes).
- Trésorerie nette (Σ banques + caisses).
- DSO (Days Sales Outstanding) — délai moyen encaissement.

### Charts

- **Trésorerie évolution 90j** — line chart soldes consolidés.
- **Top 10 clients par CA** — bar chart.
- **Balance âgée clients** — stacked bars (0-30j, 31-60j, 61-90j, > 90j).
- **Marge par mois** — bar chart 12 mois (CA - coûts).

### Pivot / Cashflow prévisionnel

Tableau cashflow 90j à venir basé sur :
- Échéances factures clients (entrées prévues).
- Échéances factures fournisseurs (sorties prévues).
- Échéances paie (sorties).
- Solde projeté = solde actuel + entrées - sorties.

Alerte rouge si solde projeté négatif sur une période.

### Tops

- Top 5 clients qui rapportent.
- Top 5 fournisseurs en dépenses.
- Top 5 factures en retard.
- Top 5 marges chantiers.

## 6. `/analytics/stock`

### KPIs

- Valeur stock total.
- Rotation moyenne (j) (= 365 / (sortiesAnnuelles / stockMoyen)).
- Articles en rupture.
- Articles surstockés (qté > stockMax).

### Charts

- **Évolution valorisation stock 12 mois** — line.
- **Répartition par famille** — donut.
- **Mouvements mensuels** — stacked bars (entrées vs sorties).
- **ABC analysis** — pareto valeur cumulée (80/20).

### Pivot

Article × dépôt × indicateurs : qté, valeur, dernière entrée, dernière sortie, jours sans mouvement.

Filtre par famille, dépôt.

### Tops

- Top 10 articles par valeur stock.
- Top 10 articles en rupture / sous mini.
- Top 10 articles à rotation lente (> 90j).

## 7. `/analytics/achats`

### KPIs

- Volume achats HT YTD.
- Nb fournisseurs actifs.
- Délai moyen livraison (j).
- Taux de service fournisseurs (livré ≤ date prévue).

### Charts

- **Évolution achats par catégorie** — stacked area 12 mois.
- **Top 10 fournisseurs** — bar.
- **Délai livraison par fournisseur** — bar chart trié.
- **Taux de litige** — donut.

### Pivot

Fournisseur × catégorie × montant cumulé YTD.

### Tops

- Top 5 fournisseurs par volume.
- Top 5 fournisseurs problématiques (litiges, retards).
- Top 5 catégories en croissance.
- Bottom 5 fournisseurs sous-utilisés.

## 8. `/analytics/rh`

### KPIs

- Effectif total (CDI + CDD + intérim).
- Masse salariale brute mensuelle.
- Taux d'absentéisme % (jours absents / jours ouvrables).
- Turnover annuel %.

### Charts

- **Pyramide des âges** — bar chart double.
- **Effectif par catégorie BTP** — donut.
- **Heures sup mensuelles** — bar chart.
- **Évolution masse salariale** — line 12 mois.
- **Taux fréquence accidents** — Tf = (nb accidents × 1M) / heures travaillées.

### Pivot

Employé × chantier × jours pointés (consolidation analytique).

### Tops

- Top 5 chantiers consommateurs MO.
- Top 5 employés en heures sup.
- Top 5 incidents par chantier.
- Tableau habilitations expirent < 60j.

## 9. Filtres globaux par dashboard

Drawer `Filtres` :
- Période (presets : Mois, Trimestre, Semestre, Année, YTD, Année dernière, Personnalisé).
- Chantiers (multi-select).
- Selon dashboard : départements, fournisseurs, familles, catégories.

Les filtres s'appliquent à **tous les widgets** de la page.

## 10. Export

Bouton `Export` propose :
- **PDF** — capture A3 paysage de toute la page (pour rapport CA / RH).
- **Excel** — données brutes des charts (1 onglet par widget).
- **PowerPoint** (V2) — V1 OK sans.

Lib V1 : `html2canvas` + `jsPDF` ; SheetJS pour Excel.

## 11. Composants partagés analytics

```
applications/erp/analytics/components/
├── analytics-page-shell/             # layout commun
├── kpi-tile-large/                   # tuile KPI grande taille
├── chart-line/                       # wrapper ngx-charts line
├── chart-bar/
├── chart-donut/
├── chart-stacked-area/
├── chart-pareto/
├── pivot-table/                      # table pivot avec totaux
├── balance-agee-chart/
├── top-list/                         # widget top N avec barres
├── filtre-drawer/
└── export-button/
```

## 12. Service & calculs

```ts
// applications/erp/analytics/services/analytics.facade.ts
@Injectable({ providedIn: 'root' })
export class AnalyticsFacade {
  // injecte tous les mock services autres modules
  
  readonly filters = signal<AnalyticsFilters>({});
  
  // Chantiers
  readonly kpisChantiers = computed(() => { ... });
  readonly chantiersDataset = computed(() => { ... });
  
  // Financier
  readonly kpisFinancier = computed(() => { ... });
  readonly cashflowProjection = computed(() => this.computeCashflow(90));
  
  // Stock
  readonly stockMetrics = computed(() => { ... });
  readonly abcAnalysis = computed(() => this.computeABC());
  
  // ... idem achats et RH
}
```

Tous les calculs `computed` mémoïsés par signaux. Les filtres déclenchent recalcul automatique.

## 13. Mock seed (= dérivé des autres modules)

Aucune seed propre. Tous les calculs **dérivent des mocks** des modules :
- Chantiers → pour KPIs marges, avancements, retards.
- Finance → pour KPIs CA, EBITDA, trésorerie.
- Inventory → pour stock, rotation, ABC.
- Achats → pour fournisseurs, délais, catégories.
- RH → pour effectif, masse salariale, turnover, absences.
- HSE → pour Tf, incidents.

## 14. UX details

- **Skeleton screens** par widget pendant calculs (~100-300ms simulés).
- **Tooltips chartiques** explicites (montant + variation + détail).
- **Drilldown** : click bar/segment → modal détail ou navigation vers liste filtrée.
- **Comparaison N-1** : toggle qui ajoute la série de l'année dernière en pointillé.
- **Annotations** : événements clés (lancement chantier, fin chantier, changement de loi) affichés sur courbes.
- **Mode présentation** : bouton plein écran qui masque la nav et passe le titre en grand (pour vidéoprojection).
- **Performance** : pré-calcul au chargement, pas de re-fetch à chaque interaction.

## 15. Files to deliver

```
applications/erp/analytics/
├── analytics.routes.ts
├── components/...
├── services/{analytics.facade.ts, calculations/, exports/}
└── models/

applications/erp/pages/analytics/
├── chantiers/
│   ├── analytics-chantiers.page.{ts,html,scss}
├── financier/
│   ├── analytics-financier.page.{ts,html,scss}
├── stock/
│   ├── analytics-stock.page.{ts,html,scss}
├── achats/
│   ├── analytics-achats.page.{ts,html,scss}
└── rh/
    ├── analytics-rh.page.{ts,html,scss}
```

## 16. DoD

- [ ] 5 dashboards livrés, 1 par domaine.
- [ ] Layout commun via `<analytics-page-shell>`.
- [ ] KPIs et charts cohérents avec mocks des autres modules.
- [ ] Filtres globaux opèrent sur tous les widgets.
- [ ] Export PDF + Excel fonctionnels.
- [ ] Drilldown click → liste filtrée OK.
- [ ] Skeleton screens à l'init.
- [ ] Performance : page rendue < 2s avec tous les widgets.
- [ ] Mode plein écran fonctionne.
- [ ] `analytics.routes.ts` injecté dans erp.routes.generated.ts.
- [ ] Permissions par domaine.
- [ ] Toggle comparaison N-1 sur les charts temporels.
