# Agent — Chantiers · Liste & Fiche

> **Objet** : entité racine du module Chantiers. Liste tous les chantiers + fiche détail à onglets. Centre de gravité de l'ERP.
> **Route** : `/chantiers` · **Permission** : `chantiers.chantier.*`

## 0. Contexte (lecture obligatoire)

- [00-INDEX.md](../00-INDEX.md), [00-CONVENTIONS.md](../00-CONVENTIONS.md), [00-MOCK-DATA-STRATEGY.md](../00-MOCK-DATA-STRATEGY.md), [00-UX-PRINCIPES.md](../00-UX-PRINCIPES.md)
- [README.md](README.md) — modèle de données partagé du module.

## 1. Routes à livrer

```ts
// pages/chantiers/liste/chantiers.routes.ts
export const CHANTIERS_LISTE_ROUTES: Routes = [
  { path: '', pathMatch: 'full', loadComponent: () => import('./chantier-listing/chantier-listing.page').then(m => m.ChantierListingPage) },
  { path: 'new', loadComponent: () => import('./chantier-detail/chantier-detail.page').then(m => m.ChantierDetailPage) },
  { path: ':id', loadComponent: () => import('./chantier-detail/chantier-detail.page').then(m => m.ChantierDetailPage) },
  { path: ':id/lots', loadComponent: () => import('./chantier-lots/chantier-lots.page').then(m => m.ChantierLotsPage) },
  { path: ':id/budget', loadComponent: () => import('../budget/budget-chantier.page').then(m => m.BudgetChantierPage) },
];
```

## 2. Listing — `ChantierListingPage`

### Colonnes (config-driven)

| Key | Label | Type | Largeur | Sortable |
|-----|-------|------|---------|----------|
| `code` | Code | text | 110px | ✓ |
| `name` | Désignation | text | flex | ✓ |
| `clientName` | Client | text | 160px | ✓ |
| `type` | Type | badge | 110px | ✓ |
| `ville` | Ville | text | 120px | — |
| `dateDebut` | Démarrage | date (`JJ/MM/AAAA`) | 110px | ✓ |
| `dateFinPrevue` | Fin prévue | date | 110px | ✓ |
| `budgetHt` | Budget HT (MAD) | currency | 130px | ✓ |
| `avancementPercent` | Avancement | progress (avec %) | 130px | ✓ |
| `marge` | Marge % | percent + couleur | 90px | ✓ |
| `status` | Statut | badge | 130px | ✓ |
| `conducteurTravauxName` | Conducteur | text | 140px | — |

### Filtres (panel droit, fermé par défaut)

- `status` — multi-select : Prospect, En cours, Suspendu, Terminé, Réceptionné, Clôturé, Annulé.
- `type` — multi-select : Bâtiment, TP, VRD, GO, TCE, Réhabilitation.
- `clientId` — autocomplete via lookup `clients`.
- `ville` — text.
- `conducteurTravauxId` — autocomplete via lookup `employees`.
- `dateDebutRange` — date range.
- `budgetHtRange` — number range.
- `avancementRange` — slider 0..100.
- `enRetard` — boolean (true si `dateFinPrevue < today` et `status === 'EN_COURS'`).

### Filtres rapides (chips)

- `Actifs` (status `EN_COURS` ou `SUSPENDU`) — par défaut.
- `Tous`
- `En retard`
- `Terminés cette année`
- `Mes chantiers` (filtre sur user courant comme conducteur ou chef chantier)

### Actions de masse (sélection multiple)

- `Exporter Excel`
- `Imprimer fiche synthèse`
- `Affecter conducteur` (modal de sélection)

### Actions ligne

- Cliquer ouvre détail.
- Menu kebab : `Dupliquer`, `Suspendre`, `Clôturer`, `Archiver`, `Supprimer` (selon statut).

### CTA principal

`+ Nouveau chantier` — ouvre `/chantiers/new`.

### Empty state

Icône `hard-hat`, texte _"Aucun chantier ne correspond aux filtres."_, bouton `Effacer les filtres`.

## 3. Création / Édition — `ChantierDetailPage`

### Mode édition

Mode wizard 3 étapes pour la création (`/chantiers/new`) :

**Étape 1 — Identité**
- Code (auto-généré `CH-AAAA-NNN` modifiable)
- Désignation
- Type (radio cards visuelles avec icône par type)
- Description (textarea)

**Étape 2 — Client & marché**
- Client (autocomplete clients ou bouton `+ Nouveau client` qui ouvre modal)
- Référence marché
- Date d'offre, date BC client, date ordre de service
- Date de début, date de fin prévue
- Conducteur de travaux (autocomplete employés)
- Chef de chantier (autocomplete employés)

**Étape 3 — Localisation & financier**
- Ville (autocomplete villes Maroc)
- Adresse
- Coordonnées GPS (optionnel — bouton `Localiser sur la carte` qui ouvre une mini-carte modal)
- Budget HT
- TVA (20% par défaut)
- Caution / retenue garantie % (7% par défaut)
- Délai paiement (60j fin de mois par défaut)
- Avance reçue (optionnel)

À la création, statut initial = `EN_COURS`. Si la date d'offre est saisie sans date BC client, statut = `PROSPECT`.

### Mode consultation (`/chantiers/:id`)

Plein écran avec **header sticky** :

```
┌──────────────────────────────────────────────────────────────────────┐
│ ← Retour    CH-2026-001 — Résidence Yasmine Casa  [Badge En cours]  │
│                                                                      │
│  Client : OCP Promotion │ Conducteur : H. Bennani │ Ville : Casa    │
│                                                                      │
│  ┌────────┬────────┬────────┬────────┬────────┐                     │
│  │ Avanc. │ Budget │ Marge  │ Factur │ Encaiss│   [⋯ Actions]       │
│  │  62%   │ 24,5M  │ 9.2%   │ 14,7M  │ 12,3M  │                     │
│  └────────┴────────┴────────┴────────┴────────┘                     │
│                                                                      │
│  [Général] [Lots] [Planning] [Budget] [Avancements] [Situations]    │
│  [Sous-traitance] [Documents] [Pointage] [Stock] [Activité]         │
└──────────────────────────────────────────────────────────────────────┘
```

### Onglet `Général`

Sections :

1. **Identité** — code, désignation, type, description (read-only avec bouton `Modifier`).
2. **Client & marché** — client (lien), marché, dates clés.
3. **Équipe** — conducteur, chef chantier, équipe affectée (compteur + lien vers planning).
4. **Localisation** — ville, adresse, mini-carte (si GPS).
5. **Financier** — budget HT, TVA, retenue, avances, délai paiement.
6. **Audit** — créé par, le, modifié par, le.

### Onglet `Lots`

→ délégué à la page `/chantiers/:id/lots` mais embarqué en onglet : tree-table éditable des lots.

Colonnes : code, désignation, unité, qté, PU, montant HT, avancement %, ordre.

Actions : ajouter sous-lot, dupliquer ligne, importer depuis devis (bouton `Importer du devis approuvé`).

### Onglets `Planning`, `Budget`, `Avancements`, `Situations`, `Sous-traitance`, `Documents`

→ embarquent les pages dédiées (cf. autres sub-specs) en mode contextualisé sur le chantier (filtre auto sur `chantierId`).

### Onglet `Pointage`

→ embarque listing pointages du module RH filtré sur ce chantier (read-only — saisie via `/rh/pointage`).

### Onglet `Stock`

→ liste des articles affectés sur les locations CHANTIER de ce chantier (lookup vers `inventory`).

### Onglet `Activité`

Timeline des événements chantier (création, changement statut, ajout lot, validation situation, upload doc…) chronologique inverse, infinite scroll.

## 4. Workflow / state machine

```
PROSPECT ──(BC client signé)──► EN_COURS
EN_COURS ──(suspendre)──► SUSPENDU ──(reprendre)──► EN_COURS
EN_COURS ──(travaux finis)──► TERMINE ──(PV réception)──► RECEPTIONNE ──(DGD payée + caution restituée)──► CLOTURE
PROSPECT/EN_COURS ──(annuler)──► ANNULE
```

À configurer dans `detail/config.ts` via `statusMachine`.

Actions custom de la fiche :
- `Suspendre` (si EN_COURS) — modal motif obligatoire.
- `Reprendre` (si SUSPENDU).
- `Marquer terminé` (si EN_COURS) — confirme date fin réelle.
- `Réceptionner` (si TERMINE) — modal date réception + upload PV.
- `Clôturer` (si RECEPTIONNE) — confirme caution restituée.

## 5. Calculs dérivés (signal-based dans facade)

```ts
// dans ChantierFacade
readonly chantier = signal<Chantier | null>(null);
readonly avancements = signal<AvancementLot[]>([]);
readonly situations = signal<Situation[]>([]);

readonly avancementPercent = computed(() => {
  const lots = this.lots();
  if (!lots.length) return 0;
  const total = lots.reduce((s, l) => s + (l.montantHt || 0), 0);
  const realise = lots.reduce((s, l) => s + (l.montantHt || 0) * (l.avancementPercent / 100), 0);
  return total ? Math.round((realise / total) * 100) : 0;
});

readonly facturesEmisesHt = computed(() =>
  this.situations().filter(s => s.status === 'FACTUREE' || s.status === 'PAYEE')
    .reduce((s, sit) => s + sit.netAPayerHt, 0)
);

readonly margeMontant = computed(() => {
  const c = this.chantier();
  if (!c) return 0;
  return c.facturesEmisesHt - this.coutReelHt();
});

readonly margePercent = computed(() => {
  const m = this.margeMontant();
  const f = this.facturesEmisesHt();
  return f ? +(m / f * 100).toFixed(1) : 0;
});

readonly enRetard = computed(() => {
  const c = this.chantier();
  if (!c || c.status !== 'EN_COURS') return false;
  return new Date(c.dateFinPrevue) < new Date();
});
```

`coutReelHt()` agrège : factures fournisseurs allouées + paie ouvriers (lien RH) + sous-traitance + locations matériel + carburant. En V1 : juste somme des montants alloués au chantier dans les mocks.

## 6. Mock seed

12 chantiers du `00-MOCK-DATA-STRATEGY.md`, étoffés avec :

- 4-8 lots cohérents par chantier (cf. nomenclature BTP : 01 GO, 02 Maçonnerie, 03 Étanchéité, 04 Cloisons, 05 Revêtements sols, 06 Faïence, 07 Peinture, 08 Menuiserie, 09 Électricité, 10 Plomberie, 11 Climatisation, 12 VRD).
- Avancements répartis sur 6 derniers mois (saisies hebdo réalistes — pas linéaires).
- 3-7 situations émises par chantier en cours, avec retenue garantie 7%, retenue avance 5% si avance perçue.
- Conducteurs et chefs assignés depuis le seed RH.

## 7. UX details

- **Header sticky** au scroll (cf. UX-PRINCIPES §6).
- **Onglets sticky** sous le header.
- **Carte mini** (Leaflet) sur l'onglet Général si lat/lon présents — sinon zone "Définir localisation".
- **Bouton `Imprimer fiche synthèse`** : génère un PDF A4 récapitulant identité + KPIs + dernière situation + dernière photo.
- **Lien depuis nav `/chantiers`** : la liste s'ouvre par défaut sur le filtre `Actifs`.
- **En consultation**, les champs ne sont **pas** dans des `<input>` mais affichés en `<dl>` (description list) avec ratio label/valeur 35/65, fond légèrement teinté pour distinguer.
- **CTA `Modifier`** en haut à droite de l'onglet Général ouvre la version `<input>` éditable de la même section.
- **Ruban d'alerte** en haut du header si :
  - en retard (rouge),
  - marge < 4% (orange),
  - aucune situation émise depuis > 60j (jaune),
  - documents PV/CCAP manquants à la création (info bleu).

## 8. Files to deliver

```
applications/erp/chantiers/
├── chantiers.routes.ts                              [NEW]
├── chantiers/                                       [NEW folder]
├── components/
│   ├── chantier-status-badge/                       [NEW]
│   ├── chantier-link/                               [NEW]
│   ├── avancement-progress/                         [NEW]
│   ├── marge-cell/                                  [NEW]
│   └── lots-tree/                                   [NEW]
├── mock/
│   ├── chantiers-mock.service.ts                    [NEW]
│   └── seeds.ts                                     [NEW]
└── models/
    ├── index.ts                                     [NEW]
    └── chantier.model.ts                            [NEW]

applications/erp/pages/chantiers/liste/
├── chantiers.routes.ts                              [NEW]
├── models/index.ts
├── services/
│   ├── chantier-api.service.ts
│   ├── chantier.facade.ts                           [extends GridFacade]
│   └── index.ts
├── config/
│   ├── index.ts
│   ├── listing/{columns,filters,routes,config,index}.ts
│   └── detail/{fields,sections,routes,config,index}.ts
├── chantier-listing/
│   ├── chantier-listing.page.{ts,html,scss}
│   └── index.ts
├── chantier-detail/
│   ├── chantier-detail.page.{ts,html,scss}          # avec tabs
│   ├── tabs/
│   │   ├── tab-general.component.{ts,html,scss}
│   │   ├── tab-lots.component.{ts,html,scss}
│   │   ├── tab-activite.component.{ts,html,scss}
│   │   └── ... (les autres tabs proxy vers les pages dédiées)
│   └── index.ts
└── chantier-lots/
    ├── chantier-lots.page.{ts,html,scss}            # tree-table editable
    └── index.ts
```

## 9. DoD

- [ ] Listing affiche 12 chantiers du seed avec tri, filtre, recherche fonctionnels.
- [ ] Création wizard 3 étapes sans bug, génère un chantier qui apparaît dans la liste.
- [ ] Fiche chantier ouvre instantanément depuis la liste, header sticky.
- [ ] Tous les onglets se chargent (lazy ou inline) et affichent au moins un état vide cohérent.
- [ ] Ruban d'alerte visible quand conditions remplies.
- [ ] Bouton `Imprimer fiche synthèse` produit un PDF (V1 : `window.print()` sur un template dédié OK).
- [ ] Calculs avancement, marge, en-retard signal-based, mis à jour à toute mutation.
- [ ] Permissions configurées : pas de bouton sans le permission prefix.
- [ ] Lookups partagés (clients, employees) consommés depuis `shared/mock/global-lookups.service.ts` (créer si absent).
- [ ] `npm run typecheck` vert.
- [ ] Démo : créer chantier → suspendre → reprendre → réceptionner → clôturer fonctionne.
