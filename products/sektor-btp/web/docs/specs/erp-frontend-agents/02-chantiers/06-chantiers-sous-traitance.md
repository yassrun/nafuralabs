# Agent — Chantiers · Sous-traitance

> **Objet** : gérer les contrats de sous-traitance par chantier (signature, suivi paiements, retenues, résiliation).
> **Route** : `/chantiers/sous-traitance` · **Permission** : `chantiers.sousTraitance.*`

## 0. Pré-requis

[README chantiers](README.md) — modèle `ContratSousTraitance`. [00-MOCK-DATA-STRATEGY §Sous-traitants](../00-MOCK-DATA-STRATEGY.md).

## 1. Routes

```ts
export const SOUS_TRAITANCE_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./contrat-listing/contrat-listing.page').then(m => m.ContratListingPage) },
  { path: 'new', loadComponent: () => import('./contrat-detail/contrat-detail.page').then(m => m.ContratDetailPage) },
  { path: ':id', loadComponent: () => import('./contrat-detail/contrat-detail.page').then(m => m.ContratDetailPage) },
  { path: ':id/paiements', loadComponent: () => import('./contrat-paiements/contrat-paiements.page').then(m => m.ContratPaiementsPage) },
];
```

## 2. Listing — `ContratListingPage`

### Colonnes

| Key | Label | Type | Largeur |
|-----|-------|------|---------|
| `numero` | N° contrat | text | 130px |
| `chantierCode` | Chantier | link | 120px |
| `sousTraitantName` | Sous-traitant | text | 180px |
| `objet` | Objet | text | flex |
| `dateDebut` | Début | date | 100px |
| `dateFin` | Fin | date | 100px |
| `montantHt` | Montant HT | currency | 130px |
| `cumulPaiementsHt` | Payé | currency | 120px |
| `resteHt` | Reste | currency | 120px |
| `consommationPercent` | Consommation | progress | 120px |
| `status` | Statut | badge | 110px |

`resteHt = montantHt - cumulPaiementsHt`.

### Filtres

- `chantierId`, `sousTraitantId`, `status`, `dateRange`, `montantRange`.

### Filtres rapides

- `Actifs`, `À signer`, `À échéance < 30j`, `Terminés`, `En litige` (montant restant > 0 et dateFin dépassée).

### CTA

`+ Nouveau contrat`.

### Actions ligne

- `Signer` (si BROUILLON) — modal upload contrat signé scanné.
- `Enregistrer paiement` — modal montant + référence + date.
- `Résilier` — modal motif + date résiliation.
- `Imprimer contrat`.

## 3. Detail — `ContratDetailPage`

### Layout (mode consultation)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ← ST-2026-0042   ETB Mansouri — Terrassements   [SIGNE]                 │
│                                                                          │
│  Chantier : CH-2026-001 │ Du 05/04/2026 au 30/06/2026                   │
│                                                                          │
│  Montant HT : 1 450 000 │ Payé : 580 000 │ Reste : 870 000 (60%)        │
│                                                                          │
│  [⋯] [Imprimer] [+ Paiement] [Résilier]                                 │
├──────────────────────────────────────────────────────────────────────────┤
│ [Général] [Lots couverts] [Paiements] [Documents] [Activité]            │
└──────────────────────────────────────────────────────────────────────────┘
```

### Onglet `Général`

Sections :

1. **Identité contrat** — numéro, chantier (lien), sous-traitant (lien), objet, dates.
2. **Conditions financières** — montant HT, retenue garantie %, conditions de paiement, mode (virement / chèque).
3. **Garanties** — cautionnement bancaire, montant, banque émettrice (V2 — V1 champ texte OK).
4. **Référent** — chef chantier responsable du suivi.

### Onglet `Lots couverts`

Multi-select des lots du chantier que le contrat couvre. Affichage tabulaire : code lot, désignation, quantité couverte, %.

### Onglet `Paiements`

Liste des paiements effectués au sous-traitant :

| Date | Référence | Mode | Montant HT | Retenue 7% | Net payé | Justif |
|------|-----------|------|------------|------------|----------|--------|

CTA `+ Enregistrer paiement` → modal saisie. Crée une entrée `PaiementSousTraitant`.

Footer sticky : `Cumul payé : ... / Engagement : ... / Reste : ...`.

### Onglet `Documents`

GED scoping contrat : contrat signé, attestations, CNSS, factures sous-traitant, PV de réception.

### Onglet `Activité`

Timeline événements (création, signature, paiements, résiliation).

## 4. Workflow

```
BROUILLON ──(signer)──► SIGNE ──(démarrage)──► EN_COURS ──(échéance ou clôture)──► TERMINE
SIGNE/EN_COURS ──(résilier)──► RESILIE
```

Action `Démarrer travaux` (SIGNE → EN_COURS) automatique à la première date d'avancement saisie pour les lots couverts (ou bouton manuel).

## 5. Mock seed

2-5 contrats par chantier en cours (~35 contrats au total). Spécialités variées :
- 1 contrat terrassement par chantier (15-25% du budget).
- 1 contrat étanchéité (3-7% du budget).
- 1 contrat électricité (8-12% du budget).
- 1-2 contrats spécialisés (façade, ascenseurs…) selon type chantier.

Statuts répartis : 70% EN_COURS, 15% SIGNE, 10% TERMINE, 5% RESILIE.

Cumul paiements cohérent avec avancement chantier (~ avancement % × montant).

## 6. Files to deliver

```
applications/erp/pages/chantiers/sous-traitance/
├── sous-traitance.routes.ts
├── models/contrat-sous-traitance.model.ts
├── services/{contrat-api.service.ts, contrat.facade.ts, paiement-st.facade.ts, index.ts}
├── config/listing/{...}
├── config/detail/{...}
├── contrat-listing/...
├── contrat-detail/
│   ├── contrat-detail.page.{ts,html,scss}
│   ├── tabs/{tab-general,tab-lots,tab-paiements,tab-documents,tab-activite}.component.{ts,html,scss}
│   └── index.ts
├── contrat-paiements/
│   ├── contrat-paiements.page.{ts,html,scss}
│   └── components/paiement-form-dialog/
└── components/
    └── contrat-print/                # template A4 contrat
```

## 7. UX details

- **Alerte rouge** sur le header si `dateFin < today` et `cumulPaiements < montantHt`.
- **Footer sticky paiements** toujours visible.
- **Calcul retenue 7%** automatique sur saisie paiement.
- **Lien retour** : depuis la fiche du contrat, breadcrumb retour vers chantier parent.
- **Print contrat** : template officiel avec mentions légales (objet, parties, montant, durée, retenues, garanties, juridiction Tanger/Casa selon chantier).

## 8. DoD

- [ ] Listing avec filtres rapides opérationnel.
- [ ] Création contrat avec sélection chantier + sous-traitant + lots couverts.
- [ ] Signature : upload mock OK + bascule statut.
- [ ] Saisie paiement : recalcule cumul et reste.
- [ ] Résiliation : motif obligatoire, lock champs.
- [ ] Mock cohérent : tous contrats référencent un chantier valide et un sous-traitant valide.
- [ ] Permissions : `signer`, `resilier` distinctes du `read`.
