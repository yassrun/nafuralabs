# Agent — Finance · Configuration

> **Objet** : devises, taux de change, conditions de paiement, plan comptable. Référentiels socle.
> **Routes** : `/finance/devises`, `/finance/taux-change`, `/finance/conditions-paiement`, `/finance/plans-comptables`
> **Permission** : `finance.config.<entity>.*`

## 0. Pré-requis

[README finance](README.md). NB : devises, taux change et payment-terms ont déjà des routes générées via `erp.routes.generated.ts`. Il faut **finir l'implémentation des pages générées** + ajouter les pages manquantes (conditions-paiement custom, plans-comptables nouveau).

## 1. `/finance/devises` — Devises

### Modèle

```ts
export interface Devise {
  id: string;
  code: string;                       // 'MAD', 'EUR', 'USD'
  symbole: string;                    // 'DH', '€', '$'
  libelle: string;
  isDeviseDeReference: boolean;       // une seule (MAD)
  precisionDecimales: number;         // 2 par défaut
  isActive: boolean;
}
```

### Page

Listing simple :

| Code | Libellé | Symbole | Précision | Référence | Actif |

CTA `+ Nouvelle devise`. Validation : 1 seule `isDeviseDeReference` à la fois.

Seed : MAD (référence), EUR, USD, GBP, AED, SAR.

### État actuel

Vérifier la page générée sous `pages/finance/configuration/currencies/`. Compléter si pages manquantes (listing/detail).

## 2. `/finance/taux-change` — Taux de change

### Modèle

```ts
export interface TauxChange {
  id: string;
  deviseDeId: string;                 // 'EUR'
  deviseDeCode?: string;
  deviseVersId: string;               // 'MAD'
  deviseVersCode?: string;
  dateValidite: string;               // taux valable à partir de cette date
  taux: number;                       // 1 EUR = 10.85 MAD
  source?: 'BAM' | 'MANUEL' | 'API';  // Bank Al-Maghrib
  isActive: boolean;
}
```

### Page

Listing : `dateValidite`, `deviseDeCode → deviseVersCode`, `taux`, `source`, `isActive`.

Filtres : devise, dateRange.

Vue alternative : graphique évolution taux EUR/MAD, USD/MAD sur 12 mois.

CTA `+ Nouveau taux` ou `Importer depuis BAM` (mock simulé).

### Logique

- Le taux le plus récent valide à une date donnée s'applique pour la conversion.
- Sur saisie facture en devise étrangère, conversion auto en MAD au taux du jour de la facture.

### Seed

Taux historiques EUR/MAD (10.50 → 11.20 sur 12 mois), USD/MAD (9.80 → 10.20). Saisies hebdomadaires.

## 3. `/finance/conditions-paiement` — Conditions de paiement

### Modèle

```ts
export interface ConditionPaiement {
  id: string;
  code: string;                        // 'COMPTANT', '30J', '60J-FM', '90J'
  libelle: string;                     // '30 jours fin de mois'
  type: 'IMMEDIAT' | 'DELAI_SIMPLE' | 'FIN_DE_MOIS' | 'ECHEANCES_MULTIPLES';
  delaiJours?: number;                 // 30, 60, 90
  echeances?: EcheancePaiement[];     // si ECHEANCES_MULTIPLES
  isActive: boolean;
  isDefaut: boolean;
  notes?: string;
}

export interface EcheancePaiement {
  id: string;
  conditionId: string;
  ordre: number;
  pourcentage: number;                 // 30%, 70%
  delaiJours: number;                  // 0 (à la commande), 60 (livraison + 60j)
  description: string;
}
```

### Page

Listing : `code`, `libelle`, `type`, `delaiJours` ou `nbEcheances`, `isDefaut`, `isActive`.

CTA `+ Nouvelle condition`.

### Detail

Form :
- Code, libellé, type.
- Selon type :
  - `IMMEDIAT` : aucun champ.
  - `DELAI_SIMPLE` : delaiJours.
  - `FIN_DE_MOIS` : delaiJours (jusqu'à fin de mois + N).
  - `ECHEANCES_MULTIPLES` : table d'échéances éditable :
    ```
    Ordre │ %     │ Délai │ Description
    1     │ 30%   │  0j   │ À la commande
    2     │ 40%   │ 30j   │ Mi-livraison
    3     │ 30%   │ 60j   │ Réception
    ```
- Validation : Σ pourcentages = 100%.

### Seed

- COMPTANT : Immédiat.
- 30J : 30 jours.
- 60J : 60 jours.
- 30J-FM : 30 jours fin de mois.
- 60J-FM : 60 jours fin de mois (le plus courant en BTP).
- 90J : 90 jours (clients publics).
- 30-40-30 : 3 échéances multiples.

## 4. `/finance/plans-comptables` — Plan comptable

### Modèle

Réutiliser `Compte` et `Journal` du modèle [01-finance-comptabilite §1](01-finance-comptabilite.md).

### Page Plan comptable

Vue arborescente du plan :

```
┌──────────────────────────────────────────────────────────────────────┐
│ Plan comptable BTP — CGNC Maroc       [Importer modèle BTP]  [+]    │
├──────────────────────────────────────────────────────────────────────┤
│ [🔍 Rechercher compte...]                                            │
│                                                                      │
│ ▼ Classe 2 — Immobilisations                                         │
│   ▼ 23 — Immobilisations corporelles                                 │
│     ▼ 233 — Constructions                                            │
│       2331 Constructions                                             │
│     ▼ 234 — Matériel et outillage                                    │
│       2340 Matériel et outillage                                     │
│ ▼ Classe 3 — Stocks et créances                                      │
│   ▼ 31 — Stocks                                                      │
│     3111 Marchandises                                                │
│     3121 Matières premières                                          │
│   ▼ 34 — Créances de l'actif circulant                              │
│     3421 Clients                                                     │
│       ▼ 3421-CLI-001  OCP Promotion (auxiliaire)                    │
│       ▼ 3421-CLI-002  ADM (auxiliaire)                              │
│ ▼ Classe 4 — Dettes du passif circulant                              │
│   4411 Fournisseurs                                                  │
│   4456 État, TVA collectée                                           │
│   3455 État, TVA récupérable                                         │
│ ▼ Classe 5 — Trésorerie                                              │
│   5141 Banques                                                       │
│   5161 Caisses                                                       │
│ ▼ Classe 6 — Charges                                                 │
│   6111 Achats matières premières                                     │
│   6125 Achats de carburants                                          │
│   6131 Sous-traitance                                                │
│   6132 Locations matériel                                            │
│   617 Charges de personnel                                           │
│ ▼ Classe 7 — Produits                                                │
│   7111 Ventes de travaux                                             │
└──────────────────────────────────────────────────────────────────────┘
```

### Comportements

- Click compte → drawer détail (libellé, type, hiérarchie, attributs : collectif, lettrable, axe analytique obligatoire).
- Édition libellé en place.
- CTA `+ Nouveau compte` → form avec code (validation hiérarchie 4-6 chiffres).
- `Importer modèle BTP` → seed initial complet du plan BTP Maroc en un clic (déjà mocké).
- Indicateur d'usage : compte utilisé dans X écritures (compteur).
- Suppression bloquée si compte utilisé.

### Page Journaux (sous-section)

Pour gérer les `Journal` :

| Code | Libellé | Type | Contre-partie défaut | Actif |
| VT | Ventes | VENTE | — | ✓ |
| AC | Achats | ACHAT | — | ✓ |
| BQ-AWB | Banque AWB | BANQUE | 5141 | ✓ |
| BQ-BMCE | Banque BMCE | BANQUE | 5141 | ✓ |
| CA | Caisse Casa | CAISSE | 5161 | ✓ |
| OD | Opérations diverses | OD | — | ✓ |
| AN | À nouveaux | NOUVEAUX | — | ✓ |

CTA `+ Nouveau journal`. Routes : `/finance/journaux/configuration` ou onglet sur la page plan comptable.

## 5. Composants partagés

```
applications/erp/finance/components/
├── compte-tree-picker/                  # arbre du plan dans drawer
├── condition-paiement-display/          # affiche libellé condition
├── taux-change-converter/               # widget conversion live
└── devise-flag/                         # drapeau pays
```

## 6. Mock seed plan comptable BTP

Plan complet à seeder (~80 comptes) — extrait :

```
Classe 2 — Immobilisations
  2311 Terrains
  2331 Constructions
  2340 Matériel et outillage
  2350 Matériel de transport
  2382 Matériel informatique

Classe 3 — Stocks et créances
  3111 Marchandises
  3121 Matières premières
  3411 Travaux en cours
  3421 Clients (collectif)
  3427 Avances clients
  3455 État, TVA récupérable
  3458 État, autres comptes débiteurs

Classe 4 — Dettes
  4411 Fournisseurs (collectif)
  4456 État, TVA collectée
  4486 Retenues garantie
  4441 Personnel — rémunérations dues
  4443 Personnel — charges sociales

Classe 5 — Trésorerie
  5115 Virements de fonds
  5141 Banques
  5161 Caisses

Classe 6 — Charges d'exploitation
  6111 Achats matières premières
  6121 Achats matières et fournitures consommables
  6125 Carburants
  6131 Sous-traitance
  6132 Locations
  6135 Entretien et réparations
  6141 Études et recherches
  6142 Transports
  6145 Frais postaux et téléco
  617 Charges de personnel
  618 Charges sociales

Classe 7 — Produits d'exploitation
  7111 Ventes travaux
  7121 Ventes prestations
```

## 7. Files to deliver

Pour chaque entité, structure standard :

```
applications/erp/pages/finance/
├── conditions-paiement/                 # NEW (custom, hand-written)
│   ├── conditions-paiement.routes.ts
│   ├── models/, services/, config/listing/, config/detail/
│   ├── condition-listing/, condition-detail/
├── plans-comptables/                    # NEW
│   ├── plan-comptable.routes.ts
│   ├── plan-comptable.page.{ts,html,scss}    # vue arbre
│   ├── components/{compte-tree, compte-edit-drawer, journal-config}/
│   ├── models/, services/
├── configuration/currencies/            # COMPLETE existant si pages vides
└── configuration/exchange-rates/        # COMPLETE existant si pages vides
```

## 8. DoD

- [ ] Devises : listing + detail + validation référence unique.
- [ ] Taux de change : listing + graphique évolution + import simulé BAM.
- [ ] Conditions paiement : 7 conditions seedées + validation Σ% = 100% pour échéances multiples.
- [ ] Plan comptable : arbre complet BTP Maroc seedé + édition + indicateur usage.
- [ ] Journaux : 7 journaux seedés + édition.
- [ ] Routes existantes (currencies, exchange-rates, payment-terms) complétées si pages vides.
- [ ] Permissions `finance.config.*`.
- [ ] Performance : arbre 80+ comptes rendu < 300ms.
