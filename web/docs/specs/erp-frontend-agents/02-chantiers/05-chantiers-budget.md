# Agent — Chantiers · Budget vs Réalisé

> **Objet** : suivi du budget chantier (matériaux, MO, ST, location, carburant) vs réalisé et engagé. KPI marge.
> **Route** : `/chantiers/budget` · **Permission** : `chantiers.budget.read|reviser`

## 0. Pré-requis

[README chantiers](README.md) — modèle `BudgetLigne`. Dépend de : achats (BC engagés), inventory (matériaux consommés), RH (MO pointée), matériel (locations), finance (factures fournisseurs).

## 1. Concept

Pour chaque chantier, on suit le budget par **rubrique** (`MATERIAUX`, `MO`, `SOUS_TRAITANCE`, `LOCATION_MATERIEL`, `CARBURANT`, `FRAIS_GENERAUX`, `IMPREVUS`) :

- **Budget initial HT** — figé au lancement (depuis devis approuvé ou saisie manuelle).
- **Budget révisé HT** — version courante (avenants, ajustements).
- **Engagé HT** — somme BC validés + contrats ST en cours.
- **Réalisé HT** — somme factures fournisseurs reçues + paie pointée + amortissements engins.
- **Reste à engager** = Budget révisé − Engagé.
- **Écart** = Budget révisé − Réalisé. Couleur : positif vert, négatif rouge.

## 2. Page `BudgetChantierPage`

### Vue 1 — Liste consolidée multi-chantiers (route `/chantiers/budget`)

Listing :

| Key | Label | Type | Largeur |
|-----|-------|------|---------|
| `chantierCode` | Chantier | link | 110px |
| `chantierName` | Désignation | text | flex |
| `budgetInitialHt` | Budget initial | currency | 130px |
| `budgetReviseHt` | Budget révisé | currency | 130px |
| `engageHt` | Engagé | currency | 130px |
| `realiseHt` | Réalisé | currency | 130px |
| `resteAEngagerHt` | Reste à engager | currency | 130px |
| `consommationPercent` | Consommation | progress + couleur | 130px |
| `margeProjeteePercent` | Marge projetée | percent + couleur | 110px |
| `alerte` | ⚠ | icon (si seuil dépassé) | 50px |

`consommationPercent = (engage + realise) / budgetRevise * 100`. Couleur : < 70% vert, 70–90% orange, > 90% rouge. > 100% = badge `Dépassé`.

`margeProjeteePercent = (budgetVente - (engage + realise + resteAExecuter)) / budgetVente`. (V1 simplifié : `(situations.netAPayerHt cumul - realise) / cumul`.)

Filtres : `status` chantier, `consommationRange`, `margeRange`, `enAlerte`.

### Vue 2 — Détail mono-chantier (`/chantiers/:id` onglet Budget OU `/chantiers/budget/:id`)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Budget — CH-2026-001 Résidence Yasmine                                  │
│                                                                          │
│  Budget initial : 24 500 000 │ Révisé : 25 200 000 │ Engagé : 17 850 000│
│  Réalisé : 14 100 000 │ Reste à engager : 7 350 000 │ Marge proj. : 9.2%│
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│ Rubrique          │ Initial │ Révisé │ Engagé │ Réalisé │ Reste │ Écart │
│ Matériaux         │ 8 200 K │ 8 400 K│ 6 100 K│ 5 200 K │ 2 300K│  +60K │
│ Main d'œuvre      │ 4 800 K │ 4 800 K│ 4 800 K│ 3 200 K │ 1 600K│   -- │
│ Sous-traitance    │ 6 500 K │ 7 000 K│ 5 200 K│ 3 800 K │ 1 800K│ -200K │
│ Location matériel │ 1 800 K │ 1 800 K│ 1 100 K│   850 K │   700K│  +50K │
│ Carburant         │   600 K │   650 K│   400 K│   320 K │   250K│   -- │
│ Frais généraux    │   800 K │   800 K│   200 K│   180 K │   600K│   -- │
│ Imprévus          │ 1 800 K │ 1 750 K│    50 K│    50 K │ 1 700K│   -- │
│ ──────────────────│─────────│────────│────────│─────────│───────│───────│
│ TOTAL             │24 500 K │25 200 K│17 850 K│13 600 K │ 8 950K│  -90K │
├──────────────────────────────────────────────────────────────────────────┤
│ ▼ Drilldown matériaux                                                    │
│ Article         │ Qté budg │ Qté cmd │ Qté livr │ Qté cons │ Mt réalisé │
│ Ciment CPJ 35   │  4 200 s │ 3 100 s │ 2 800 s  │ 2 650 s  │   206 700  │
│ Rond T12        │  185 T   │  120 T  │  105 T   │   95 T   │ 1 377 500  │
│ ...                                                                      │
└──────────────────────────────────────────────────────────────────────────┘
```

### Tabs / sections détail

1. **Vue par rubrique** (par défaut) — tableau ci-dessus avec drilldown.
2. **Vue par lot** — même tableau mais réparti par lot du chantier.
3. **Évolution mensuelle** — graphique courbes (engagé vs réalisé vs budget) par mois.
4. **Engagements** — liste des BC liés au chantier, leurs montants, statut, livraisons.
5. **Avenants & révisions** — historique des ajustements de budget initial → révisé avec motif.

### Actions

- `Réviser le budget` (permission `reviser`) → modal d'ajustement par rubrique avec motif obligatoire.
- `Exporter Excel` — export complet avec drilldown.
- `Imprimer suivi budgétaire` — PDF récap pour comité chantier.

## 3. Calculs (V1 mock)

Le module budget agrège des données provenant d'autres modules :

```ts
// BudgetChantierFacade
readonly budgetLignes = computed<BudgetLigne[]>(() => {
  const chantier = this.chantier();
  if (!chantier) return [];
  return BUDGET_RUBRIQUES.map(rubrique => {
    const initial = this.budgetInitialPourRubrique(chantier.id, rubrique);
    const revise = this.budgetRevisePourRubrique(chantier.id, rubrique);
    const engage = this.engagePourRubrique(chantier.id, rubrique); // somme BC validés mappés
    const realise = this.realisePourRubrique(chantier.id, rubrique); // factures fournisseurs liées
    return {
      ...,
      ecart: revise - realise,
      ecartPercent: revise ? +((revise - realise) / revise * 100).toFixed(1) : 0,
    };
  });
});
```

V1 mock : les liens vers BC/factures/paie sont des seeds explicites (chaque BC mock a un `chantierId` et une `rubrique`). Le facade additionne en mémoire.

## 4. Modal `Réviser le budget`

```
┌────────────────────────────────────────┐
│ Réviser le budget                  [X] │
├────────────────────────────────────────┤
│ Rubrique   │ Avant      │ Après        │
│ Matériaux  │ 8 200 K    │ [ 8 400 K  ] │
│ MO         │ 4 800 K    │ [ 4 800 K  ] │
│ ST         │ 6 500 K    │ [ 7 000 K  ] │
│ ...                                    │
│                                        │
│ Δ total : +700 000 MAD HT              │
│                                        │
│ Motif * (oblig.)                       │
│ [ Avenant n°2 — extension parking ]    │
│                                        │
│ Pièce justificative                    │
│ [📎 Uploader avenant.pdf]              │
│                                        │
│ [Annuler]              [Enregistrer]  │
└────────────────────────────────────────┘
```

Création d'une entrée d'historique `BudgetRevision { date, ancienBudgetTotal, nouveauBudgetTotal, motif, pieceUrl }`.

## 5. Mock seed

Pour chaque chantier en cours, créer :

- 7 lignes budgétaires (1 par rubrique) avec montants initiaux cohérents (Matériaux ~30%, MO ~20%, ST ~25%, Location ~7%, Carburant ~3%, FG ~3%, Imprévus ~7%).
- Engagés et réalisés cohérents avec l'avancement du chantier (~ avancement % * budget total).
- 1-2 révisions historiques pour 4 chantiers (avenants démo).

## 6. Files to deliver

```
applications/erp/pages/chantiers/budget/
├── budget-chantier.page.{ts,html,scss}            # vue liste consolidée
├── budget-chantier-detail/
│   ├── budget-detail.page.{ts,html,scss}          # vue mono-chantier (utilisée aussi en onglet)
│   ├── components/
│   │   ├── budget-table-rubrique/
│   │   ├── budget-table-lot/
│   │   ├── budget-evolution-chart/    # ngx-charts ou similar
│   │   ├── engagements-list/
│   │   └── revisions-history/
│   └── index.ts
├── components/
│   ├── consommation-progress/         # progress avec seuil couleur
│   ├── ecart-cell/                    # cellule écart avec couleur
│   └── reviser-budget-dialog/
├── models/budget.model.ts
├── services/{budget-api.service.ts, budget.facade.ts, index.ts}
└── config/listing/{...}
```

## 7. UX details

- **Couleur consommation** : barre de progress avec seuils (≤ 70% vert, 70–90% orange, > 90% rouge, > 100% rouge foncé).
- **Cellule écart** : signe, couleur, tooltip détaillant la composition.
- **Sticky** : ligne TOTAL toujours visible en bas du tableau.
- **Drilldown matériaux** : ouvert au clic sur la ligne `Matériaux` — affiche les articles consommés sur le chantier.
- **Graphique évolution** : empilé "réalisé + engagé" vs ligne `budget`. Période = depuis début chantier.
- **Avertissement** en haut de page si rubrique > 100% : ruban orange/rouge avec lien vers les engagements concernés.

## 8. DoD

- [ ] Vue consolidée liste les chantiers actifs avec leurs budgets.
- [ ] Vue détail accessible via onglet `Budget` de la fiche chantier.
- [ ] Drilldown matériaux fonctionne (lien vers articles consommés).
- [ ] Modal révision fonctionne et crée historique.
- [ ] Graphique évolution mensuelle s'affiche (mock).
- [ ] Export Excel produit un .xlsx propre (V1 : SheetJS / xlsx-populate côté client OK).
- [ ] PDF print propre.
- [ ] Permissions : seul `chantiers.budget.reviser` voit le bouton de révision.
