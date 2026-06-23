# Module Chantiers — Brief Module

> **Le module pivot de tout l'ERP BTP.** Tous les autres modules référencent un chantier (achats, stock, ventes, RH, HSE, finance analytique). À traiter en priorité.

## Entité métier

Un **chantier** = un projet de construction avec un client, un budget, des phases (lots), un planning, des ressources affectées et un cycle de vie commercial (offre → BC client → exécution → situations → réception → DGD).

## Routes nav (source : erp-nav.generated.ts)

| Route | Sub-spec | Description |
|-------|----------|-------------|
| `/chantiers` | [01-chantiers-liste.md](01-chantiers-liste.md) | Liste + détail chantier (entité racine) |
| `/chantiers/planning` | [02-chantiers-planning.md](02-chantiers-planning.md) | Vue Gantt multi-chantiers |
| `/chantiers/avancements` | [03-chantiers-avancements.md](03-chantiers-avancements.md) | Saisie avancement par lot/phase |
| `/chantiers/situations` | [04-chantiers-situations.md](04-chantiers-situations.md) | Situations de travaux (factures progressives) |
| `/chantiers/budget` | [05-chantiers-budget.md](05-chantiers-budget.md) | Budget vs réalisé par chantier |
| `/chantiers/sous-traitance` | [06-chantiers-sous-traitance.md](06-chantiers-sous-traitance.md) | Contrats ST + suivi |
| `/chantiers/documents` | [07-chantiers-documents.md](07-chantiers-documents.md) | GED chantier (plans, PV, photos) |

## Modèle de données partagé

```ts
// applications/erp/chantiers/models/index.ts

export type ChantierStatus = 'PROSPECT' | 'EN_COURS' | 'SUSPENDU' | 'TERMINE' | 'RECEPTIONNE' | 'CLOTURE' | 'ANNULE';
export type ChantierType = 'BATIMENT' | 'TP' | 'VRD' | 'GO' | 'TCE' | 'REHABILITATION';

export interface Chantier {
  id: string;
  code: string;                    // CH-2026-001
  name: string;
  description?: string;
  type: ChantierType;
  clientId: string;
  clientName?: string;
  conducteurTravauxId?: string;    // Employee
  conducteurTravauxName?: string;
  chefChantierId?: string;
  chefChantierName?: string;

  // Géolocalisation
  ville: string;
  adresse?: string;
  latitude?: number;
  longitude?: number;

  // Cycle commercial
  marcheReference?: string;        // Numéro de marché client
  dateOffre?: string;
  dateBcClient?: string;
  dateOrdreService?: string;
  dateDebut: string;
  dateFinPrevue: string;
  dateFinReelle?: string;
  dateReception?: string;

  // Financier
  budgetHt: number;                // MAD HT
  tvaTaux: number;                 // 20 par défaut
  cautionGarantie?: number;        // % retenue garantie (typiquement 7%)
  cautionRestitueeAt?: string;
  avancePercue?: number;
  delaiPaiementJours?: number;     // 60 j fin de mois typique

  // Avancement & financier réalisé
  avancementPercent: number;       // 0..100
  facturesEmisesHt: number;
  encaissementsTtc: number;
  cumulSituationsHt: number;
  marge?: number;                  // calculé

  status: ChantierStatus;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LotChantier {
  id: string;
  chantierId: string;
  code: string;                    // 01, 02, 02.1
  parentLotId?: string;            // hiérarchie possible
  designation: string;             // "Gros œuvre", "Étanchéité"…
  unite?: string;                  // m², m³, ml, U, ff
  quantite?: number;
  prixUnitaireHt?: number;
  montantHt?: number;
  avancementPercent: number;
  ordre: number;
}

export interface PhaseChantier {
  id: string;
  chantierId: string;
  lotId?: string;                  // optionnel : phase peut couvrir plusieurs lots
  code: string;
  designation: string;
  dateDebut: string;
  dateFin: string;
  dependances?: string[];          // ids de phases prédécesseurs
  responsableId?: string;
  avancementPercent: number;
  status: 'PLANIFIE' | 'EN_COURS' | 'TERMINE' | 'EN_RETARD';
}

export interface AvancementLot {
  id: string;
  chantierId: string;
  lotId: string;
  date: string;
  quantiteRealisee: number;
  cumulQuantite: number;
  pourcentage: number;
  saisieParId: string;
  saisieParName?: string;
  notes?: string;
  photos?: string[];               // urls
}

export type SituationStatus = 'BROUILLON' | 'SOUMISE' | 'VALIDEE_MOA' | 'FACTUREE' | 'PAYEE' | 'REJETEE';

export interface Situation {
  id: string;
  chantierId: string;
  numero: string;                  // SIT-CH-001-04
  numeroOrdre: number;             // 4ᵉ situation
  datePeriodeDebut: string;
  datePeriodeFin: string;
  dateEmission: string;

  cumulPrecedentHt: number;
  cumulCourantHt: number;
  travauxPeriodeHt: number;        // = cumulCourant - cumulPrecedent

  retenueGarantiePercent: number;
  retenueGarantieMontant: number;
  retenueAvancePercent?: number;
  retenueAvanceMontant?: number;

  netAPayerHt: number;
  tvaTaux: number;
  netAPayerTtc: number;

  status: SituationStatus;
  factureId?: string;              // si transformée en facture
  approbateurMOAName?: string;
  approbationDate?: string;
  notes?: string;
  lignes: SituationLigne[];
}

export interface SituationLigne {
  id: string;
  lotId: string;
  lotCode?: string;
  designation: string;
  unite?: string;
  quantiteCumulee: number;         // cumul fait à date
  prixUnitaire: number;
  montantHt: number;
}

export type ContratSousTraitanceStatus = 'BROUILLON' | 'SIGNE' | 'EN_COURS' | 'TERMINE' | 'RESILIE';

export interface ContratSousTraitance {
  id: string;
  chantierId: string;
  numero: string;
  sousTraitantId: string;
  sousTraitantName?: string;
  objet: string;
  lotsCouverts?: string[];
  dateSignature?: string;
  dateDebut: string;
  dateFin: string;
  montantHt: number;
  retenueGarantiePercent: number;
  conditionsPaiement: string;
  status: ContratSousTraitanceStatus;
  cumulPaiementsHt: number;
  documents?: ChantierDocument[];
}

export interface ChantierDocument {
  id: string;
  chantierId: string;
  category: 'PLAN' | 'CCTP' | 'CCAP' | 'BPU' | 'PV' | 'PHOTO' | 'CERTIFICAT' | 'AUTRE';
  name: string;
  url: string;                     // mock: blob: ou data:
  taille?: number;
  uploadedById: string;
  uploadedByName?: string;
  uploadedAt: string;
  version?: number;
  notes?: string;
}

export interface BudgetLigne {
  id: string;
  chantierId: string;
  lotId?: string;
  rubrique: 'MATERIAUX' | 'MO' | 'SOUS_TRAITANCE' | 'LOCATION_MATERIEL' | 'CARBURANT' | 'FRAIS_GENERAUX' | 'IMPREVUS';
  budgetInitialHt: number;
  budgetReviseHt?: number;
  realiseHt: number;
  engageHt: number;                // BC engagés non payés
  ecart: number;
  ecartPercent: number;
}
```

## Mock service module-wide

`web/app/applications/erp/chantiers/mock/chantiers-mock.service.ts` — orchestre :

- `chantiers$`, `lots$`, `phases$`, `avancements$`, `situations$`, `contratsST$`, `documents$`, `budgetLignes$`.
- Utilise `localStorage` pour persistance V1.
- Délais simulés 150-400ms.
- Recalcul automatique des champs dérivés (avancementPercent, marge, cumuls situations) sur mutation.

## Permissions

```
chantiers.chantier.read|create|update|delete|reception|cloturer
chantiers.lot.read|create|update|delete
chantiers.avancement.read|saisir
chantiers.situation.read|create|valider|rejeter
chantiers.sousTraitance.read|create|signer|resilier
chantiers.budget.read|reviser
chantiers.document.read|upload|delete
```

## Branche routes module

```ts
// applications/erp/chantiers/chantiers.routes.ts
import { Routes } from '@angular/router';

export const CHANTIERS_ROUTES: Routes = [
  { path: 'chantiers', loadChildren: () => import('../pages/chantiers/liste/chantiers.routes').then(m => m.CHANTIERS_LISTE_ROUTES) },
  { path: 'chantiers/planning', loadComponent: () => import('../pages/chantiers/planning/chantiers-planning.page').then(m => m.ChantiersPlanningPage) },
  { path: 'chantiers/avancements', loadComponent: () => import('../pages/chantiers/avancements/avancements.page').then(m => m.AvancementsPage) },
  { path: 'chantiers/situations', loadChildren: () => import('../pages/chantiers/situations/situations.routes').then(m => m.SITUATIONS_ROUTES) },
  { path: 'chantiers/budget', loadComponent: () => import('../pages/chantiers/budget/budget-chantier.page').then(m => m.BudgetChantierPage) },
  { path: 'chantiers/sous-traitance', loadChildren: () => import('../pages/chantiers/sous-traitance/sous-traitance.routes').then(m => m.SOUS_TRAITANCE_ROUTES) },
  { path: 'chantiers/documents', loadComponent: () => import('../pages/chantiers/documents/documents-chantier.page').then(m => m.DocumentsChantierPage) },
];
```

À spreader dans `erp.routes.generated.ts` (cf. CONVENTIONS).

## Composants partagés à créer dans le module

`applications/erp/chantiers/components/` :

- `chantier-status-badge` — badge avec couleur par statut.
- `chantier-link` — composant `<chantier-link [chantier]>` qui linke vers fiche.
- `avancement-progress` — barre de progression chantier avec % + couleur (rouge si retard).
- `marge-cell` — cellule marge HT avec couleur (vert > 8%, orange 4-8%, rouge < 4%).
- `lots-tree` — arbre des lots/sous-lots éditable.
- `gantt-mini` — mini-gantt embarqué dans la fiche chantier.

## Volumétrie mock cible

- 12 chantiers (cf. `00-MOCK-DATA-STRATEGY.md`).
- 4-8 lots par chantier (en moyenne 6).
- 6-15 phases par chantier.
- ~150 saisies d'avancement réparties sur 6 mois.
- 3-7 situations par chantier en cours (~40 situations totales).
- 2-5 contrats ST par chantier (~35 contrats).
- 8-20 documents par chantier (~150 docs).

## DoD module

- [ ] 7 sub-specs livrées (cf. tableau ci-dessus).
- [ ] Mock service unique cohérent (pas de doublon de chantiers).
- [ ] Tous les KPIs de chantier calculés à la volée par signal/computed (pas en dur).
- [ ] Fiche chantier = onglets Général | Lots | Planning | Budget | Avancements | Situations | Sous-traitance | Documents | Pointage (lien RH) | Stock affecté (lien inventory).
- [ ] Performance : ouverture fiche chantier < 500ms (mock).

## Refs

- Inspiration métier : Onaya (référence française), Sage BTP, Optim BTP, Procore (international).
- Méthode FFB / Fédération BTP Maroc — situations & retenue garantie 7% standard.
