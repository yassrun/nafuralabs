# Agent — Chantiers · Avancements

> **Objet** : saisie d'avancement par lot/phase. Écran terrain (chef chantier sur tablette) + écran consolidation (conducteur travaux PC).
> **Route** : `/chantiers/avancements` · **Permission** : `chantiers.avancement.read|saisir`

## 0. Pré-requis

[README chantiers](README.md) (modèle `AvancementLot`, `LotChantier`).

## 1. Routes

```ts
export const AVANCEMENTS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./avancements-listing/avancements-listing.page').then(m => m.AvancementsListingPage) },
  { path: 'saisie', loadComponent: () => import('./avancement-saisie/avancement-saisie.page').then(m => m.AvancementSaisiePage) },
  { path: 'saisie/:chantierId', loadComponent: () => import('./avancement-saisie/avancement-saisie.page').then(m => m.AvancementSaisiePage) },
];
```

## 2. Listing — `AvancementsListingPage` (consolidation)

### Colonnes

| Key | Label | Type | Largeur |
|-----|-------|------|---------|
| `date` | Date | date | 100px |
| `chantierCode` | Chantier | text + lien | 120px |
| `lotCode` | Lot | text | 80px |
| `lotDesignation` | Désignation | text | flex |
| `quantiteRealisee` | Qté période | number | 100px |
| `cumulQuantite` | Cumul | number | 100px |
| `pourcentage` | % cumulé | progress | 130px |
| `saisieParName` | Saisi par | text | 140px |
| `photos` | Photos | icon-count (📷 N) | 60px |

### Filtres

- `chantierId` — multi-select.
- `lotId` — autocomplete (dépendant du chantier sélectionné).
- `dateRange` — par défaut 30 derniers jours.
- `saisieParId` — autocomplete employés.
- `avecPhotos` — boolean.

### Filtres rapides (chips)

- `Cette semaine`, `Ce mois`, `Mes saisies`, `En retard de saisie` (lots actifs sans saisie depuis > 14j).

### CTA

`+ Saisir avancement` → `/chantiers/avancements/saisie`.

### Actions ligne

- `Voir photos` — modal galerie.
- `Modifier` (si saisie < 7j et user = saisieParId).
- `Supprimer` (admin uniquement).

## 3. Saisie — `AvancementSaisiePage` (écran terrain prioritaire)

### Layout mobile-first

```
┌─────────────────────────────────────┐
│ ← Saisir avancement       [💾]      │
├─────────────────────────────────────┤
│ Chantier *                          │
│ [▾ Choisir chantier              ]  │
│                                     │
│ Date *                              │
│ [📅 08/05/2026                   ]  │
│                                     │
│ ─── Lots à saisir ──────────────    │
│                                     │
│ ┌───────────────────────────────┐   │
│ │ 02 Gros œuvre superstructure  │   │
│ │ Cumul actuel : 78% (1 248 m³) │   │
│ │ ┌──────────────┬────────────┐ │   │
│ │ │ Période m³   │ Cumul m³   │ │   │
│ │ │ [    52    ] │   1 300    │ │   │
│ │ └──────────────┴────────────┘ │   │
│ │ Avancement : 78% → 81%   +3%  │   │
│ │ [📷 Ajouter photo]   [📝 Note]│   │
│ └───────────────────────────────┘   │
│                                     │
│ ┌───────────────────────────────┐   │
│ │ 05 Plomberie sanitaire        │   │
│ │ Cumul actuel : 8% (56 ml)     │   │
│ │ Période ml : [   24   ]       │   │
│ │ Avancement : 8% → 11%    +3%  │   │
│ └───────────────────────────────┘   │
│                                     │
│ + Ajouter un lot                    │
│                                     │
│ [   Enregistrer brouillon  ][Valider]│
└─────────────────────────────────────┘
```

### Comportement

- **Sélection chantier** : autocomplete avec préférence chantiers où user est conducteur ou chef.
- **Liste lots** : à la sélection chantier, charge automatiquement tous les lots `EN_COURS` (avancement < 100%). User peut en retirer ou en ajouter.
- **Calcul automatique** : à la saisie de quantité période, recalcule cumul et nouveau pourcentage en temps réel (`computed`).
- **Photos** : input `<input type="file" accept="image/*" capture="environment">` pour ouvrir caméra direct sur mobile. Upload mock = blob URL ou data URL.
- **Notes** : textarea optionnelle par lot.
- **Validation** :
  - quantité période > 0 obligatoire pour qu'un lot soit retenu.
  - cumul ne peut pas dépasser quantité totale du lot (warning, pas bloquant).
- **Sticky bar bas** : `Enregistrer brouillon` (gris) | `Valider` (primary). Sur valider, persiste les avancements + met à jour `LotChantier.avancementPercent`.
- **Mode hors-ligne V2** : toléré V1 sans, mais structure persistance localStorage déjà OK.

## 4. Calculs dérivés

```ts
// dans AvancementSaisieFacade
addLotSaisie(lotId: string, quantitePeriode: number) {
  const lot = this.lots().find(l => l.id === lotId);
  const lastCumul = this.dernierCumul(lotId); // depuis avancements existants
  const nouveauCumul = lastCumul + quantitePeriode;
  const pourcentage = lot.quantite ? Math.min(100, +(nouveauCumul / lot.quantite * 100).toFixed(1)) : 0;
  // ...
}
```

## 5. Mock seed

~150 saisies réparties sur 6 mois pour les chantiers actifs. Densité variable :
- Lots actifs : 1-2 saisies par semaine.
- Lots terminés : saisies historiques jusqu'à 100%.
- Photos : 30% des saisies en ont (1-3 par saisie).

## 6. Files to deliver

```
applications/erp/pages/chantiers/avancements/
├── avancements.routes.ts
├── models/avancement.model.ts (réexport depuis chantiers/models)
├── services/{avancement-api.service.ts, avancement.facade.ts, index.ts}
├── config/listing/{columns,filters,routes,config,index}.ts
├── avancements-listing/{avancements-listing.page.ts/html/scss, index.ts}
└── avancement-saisie/
    ├── avancement-saisie.page.{ts,html,scss}
    ├── components/
    │   ├── lot-saisie-card/    # carte lot avec inputs
    │   └── photo-uploader/     # input camera + thumbnails
    └── index.ts
```

## 7. UX details

- **Page saisie** : responsive 100% — sur PC, layout 2 colonnes (chantier + lots à gauche, sidebar récap à droite).
- **Sidebar récap** (PC only) : montre l'impact total : "+3% sur 2 lots → avancement chantier 62% → 64%".
- **Tooltip avertissement** si la quantité saisie semble incohérente (> 30% en une saisie).
- **Confirm dialog** sur Valider montrant le récap avant écriture.
- Touch ergonomie mobile : zones tap ≥ 44px, inputs numériques avec `inputmode="decimal"`.

## 8. DoD

- [ ] Listing avec filtres et chips fonctionnels.
- [ ] Saisie multi-lots ergonomique sur mobile (test sur 360px).
- [ ] Calculs cumul/% en temps réel.
- [ ] Upload photo (mock) avec preview.
- [ ] Persistance déclenche mise à jour `lots[]` et recalcul `Chantier.avancementPercent`.
- [ ] Validation soft : warning si cumul > qté totale.
- [ ] Permissions appliquées : un user sans `chantiers.avancement.saisir` ne voit pas le CTA.
