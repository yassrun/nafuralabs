# Agent — Finance · Trésorerie

> **Objet** : caisses, virements internes, règlements clients/fournisseurs, rapprochement bancaire.
> **Routes** : `/finance/caisses`, `/finance/virements`, `/finance/reglements`, `/finance/rapprochement`
> **Permission** : `finance.<entity>.*`

## 0. Pré-requis

[README finance](README.md), [01-finance-comptabilite.md](01-finance-comptabilite.md) — plan comptable et écritures auto.

## 1. Modèle

```ts
// applications/erp/finance/models/

export type CompteFinancierType = 'BANQUE' | 'CAISSE';

export interface CompteFinancier {
  id: string;
  code: string;                      // CB-AWB-01, CA-CASA-01
  libelle: string;
  type: CompteFinancierType;
  banque?: string;                   // 'AWB', 'BMCE', 'CIH'
  rib?: string;
  agence?: string;
  devise: string;                    // 'MAD' par défaut
  compteCgncCode: string;            // 5141 ou 5161
  soldeInitial: number;              // au début de l'exercice
  soldeActuel: number;               // calculé
  responsableId?: string;
  isActive: boolean;
  notes?: string;
}

export type MouvementTresorerieType = 
  | 'REGLEMENT_CLIENT' 
  | 'REGLEMENT_FOURN' 
  | 'PAIEMENT_PAIE' 
  | 'VIREMENT_INTERNE' 
  | 'FRAIS_BANCAIRES' 
  | 'COMMISSIONS' 
  | 'AUTRE_RECETTE' 
  | 'AUTRE_DEPENSE';

export interface MouvementTresorerie {
  id: string;
  numero: string;                    // MV-2026-00874
  compteFinancierId: string;
  compteFinancierLibelle?: string;
  date: string;
  type: MouvementTresorerieType;
  modePaiement: 'VIREMENT' | 'CHEQUE' | 'EFFET' | 'ESPECES' | 'CARTE';
  reference?: string;                // n° chèque, n° virement
  contrePartieType?: 'CLIENT' | 'FOURNISSEUR' | 'EMPLOYE' | 'COMPTE_INTERNE' | 'AUTRE';
  contrePartieId?: string;
  contrePartieName?: string;
  factureClientId?: string;
  factureFournId?: string;
  virementInterneId?: string;
  recette: number;                   // 0 si dépense
  depense: number;                   // 0 si recette
  libelle: string;
  ecritureId?: string;
  rapprocheId?: string;              // si rapproché
  notes?: string;
  createdAt: string;
}

export interface VirementInterne {
  id: string;
  numero: string;                    // VI-2026-0042
  date: string;
  compteSourceId: string;
  compteSourceLibelle?: string;
  compteDestId: string;
  compteDestLibelle?: string;
  montant: number;
  motif: string;
  status: 'BROUILLON' | 'VALIDE' | 'ANNULE';
  ecritureId?: string;
}

export type ReglementStatus = 'BROUILLON' | 'VALIDE' | 'ANNULE';

export interface Reglement {
  id: string;
  numero: string;                    // RG-2026-0238
  type: 'CLIENT' | 'FOURNISSEUR' | 'EMPLOYE';
  date: string;
  modePaiement: 'VIREMENT' | 'CHEQUE' | 'EFFET' | 'ESPECES' | 'COMPENSATION';
  reference?: string;                // n° chèque, virement
  banqueEmise?: string;              // pour chèques
  
  contrePartieId: string;
  contrePartieName?: string;
  
  compteFinancierId: string;
  compteFinancierLibelle?: string;
  
  montantTotal: number;
  
  imputations: ReglementImputation[]; // détail par facture imputée
  
  status: ReglementStatus;
  ecritureId?: string;
  notes?: string;
}

export interface ReglementImputation {
  id: string;
  reglementId: string;
  factureId: string;                 // FactureClient ou FactureFournisseur selon type
  factureNumero?: string;
  factureRestant?: number;
  montantImpute: number;
}

export interface Rapprochement {
  id: string;
  compteFinancierId: string;
  compteFinancierLibelle?: string;
  dateDebut: string;
  dateFin: string;
  soldeDebutComptable: number;
  soldeFinComptable: number;
  soldeFinReleve: number;
  ecart: number;
  status: 'EN_COURS' | 'VALIDE' | 'ANOMALIE';
  validateurId?: string;
  dateValidation?: string;
  releveDocumentUrl?: string;
}
```

## 2. `/finance/caisses` — Caisses & Banques

### Listing

Vue tuiles (cards) par compte financier — mieux que table dense, peu de comptes (< 10).

```
┌─ Banque AWB Casa ────────────────────────┐  ┌─ Banque BMCE ─────────────┐
│ 5141 — CB-AWB-01                         │  │ 5141 — CB-BMCE-02         │
│ ─────────────────────────────────────    │  │ ─────────                  │
│ RIB: 007 780 0001234567890123 45         │  │ RIB: 011 ...               │
│                                          │  │                            │
│ Solde actuel : 3 205 480,00 MAD          │  │ Solde : 1 240 000 MAD      │
│ ▲ +180k vs hier                          │  │                            │
│                                          │  │ [Voir mouvements]          │
│ Mouvements ce mois : 28                  │  │                            │
│ Recettes : 4,2 M  Dépenses : 3,9 M       │  └────────────────────────────┘
│                                          │                                 
│ [Voir mouvements]  [Saisir mvt]          │                                 
└──────────────────────────────────────────┘                                 

┌─ Caisse Casablanca ──────────────────────┐  ┌─ Caisse Pont Bouregreg ───┐
│ 5161 — CA-CASA-01                        │  │ 5161 — CA-CHANT-02        │
│ Solde : 12 450 MAD (espèces)             │  │ Solde : 4 800 MAD         │
│ ...                                      │  │ Pour menues dépenses      │
└──────────────────────────────────────────┘  └────────────────────────────┘
```

### Drill compte → mouvements

Click `Voir mouvements` ou sur le card → table des `MouvementTresorerie` filtrés sur ce compte.

Colonnes : `date`, `numero`, `type`, `libelle`, `reference`, `contrePartieName`, `recette`, `depense`, `solde après`, `rapproche` (✓ icon).

Footer sticky : Solde initial, Total recettes, Total dépenses, Solde final.

### Saisie mouvement

Form :
- Type de mouvement (radio cards : règlement client, règlement fournisseur, virement interne, frais bancaires, autre…).
- Selon type, redirige vers form spécifique :
  - Règlement → `/finance/reglements/new?type=CLIENT|FOURNISSEUR&...`.
  - Virement interne → `/finance/virements/new`.
  - Autre recette/dépense → form simple direct.

## 3. `/finance/virements` — Virements internes

### Listing

Colonnes : `numero`, `date`, `compteSourceLibelle`, `compteDestLibelle`, `montant`, `motif`, `status`.

Filtres : compte source/dest, dateRange, montantRange, status.

CTA `+ Nouveau virement`.

### Saisie

- Compte source (autocomplete comptes financiers actifs).
- Compte destination (autocomplete, exclut le compte source).
- Montant.
- Motif (textarea).
- Date.

À la validation, génère 2 mouvements (sortie source / entrée destination, même montant) + écriture comptable :
- Compte dest D / Compte source C.

## 4. `/finance/reglements` — Règlements

### Listing

Colonnes : `numero`, `type`, `date`, `modePaiement`, `reference`, `contrePartieName`, `montantTotal`, `nbFacturesImputees`, `compteFinancierLibelle`, `status`.

Filtres : type (client/fournisseur), modePaiement, dateRange, status, contrePartie.

Chips : `Aujourd'hui`, `Cette semaine`, `Ce mois`, `Brouillons`.

CTA `+ Nouveau règlement` → choix type (client / fournisseur / employé) → form.

### Saisie règlement client

```
┌────────────────────────────────────────────────────────────┐
│ Nouveau règlement client                                   │
│                                                            │
│ Date : [08/05/2026]  Mode : [Virement ▾] Réf : [VIR-...]  │
│ Banque émise : [AWB]   Compte recevoir : [CB-AWB-01 ▾]    │
│                                                            │
│ Client : [▾ OCP Promotion SA                          ]    │
│                                                            │
│ ─── Factures ouvertes (3) ─── Total dû : 4 250 000 ───    │
│ ☑ FC-2026-00056  Sit. 04 CH-001   Reste 1,504,800        │
│ ☐ FC-2026-00059  Sit. 03 CH-001   Reste   980,000        │
│ ☐ FC-2026-00074  Sit. 05 CH-001   Reste 1,765,200        │
│                                                            │
│ Montant total reçu : [ 1 504 800,00 ]   MAD               │
│                                                            │
│ Affectation auto ✓                                         │
│  → FC-2026-00056 : 1,504,800 (solde)                     │
│                                                            │
│ Notes : [ ... ]                                           │
│                                                            │
│ [Annuler]                            [Enregistrer & Valider]│
└────────────────────────────────────────────────────────────┘
```

Logique :
- Liste factures du client non payées (status EMISE / PARTIELLEMENT_PAYEE).
- Cocher les factures à imputer → calcul total à recevoir.
- L'utilisateur saisit le montant reçu réel.
- Affectation automatique : impute par ordre d'échéance (la plus ancienne en premier) jusqu'à concurrence.
- Possibilité d'ajuster manuellement (override).
- Validation génère `Reglement` + `ReglementImputation[]` + `MouvementTresorerie` + écriture comptable + mise à jour `cumulEncaisseTtc` des factures.

### Saisie règlement fournisseur

Symétrique : choisit le fournisseur, liste factures fournisseurs ouvertes, génère décaissement.

## 5. `/finance/rapprochement` — Rapprochement bancaire

### Page principale

Layout :

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Rapprochement bancaire                                                   │
│ Compte : [▾ AWB CB-AWB-01]   Période : [01/04/2026 → 30/04/2026]        │
├──────────────────────────────────────────────────────────────────────────┤
│ ┌─ Solde comptable au 30/04/2026 : 3,205,480 MAD ───────────────────┐  │
│ │ Solde relevé bancaire au 30/04/2026 :  [  3,180,200 MAD  ]        │  │
│ │ Écart à rapprocher : 25,280 MAD                                    │  │
│ └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│ Mouvements non rapprochés (15)            [Importer relevé CSV/Excel]   │
│ ┌──────────────────────────────────────────────────────────────────┐   │
│ │ ✓ Date       │ Numéro     │ Libellé              │Recette│Dépense│   │
│ │ ☐ 28/04/2026 │ MV-...0851 │ Frais bancaires      │       │   180 │   │
│ │ ☐ 27/04/2026 │ MV-...0840 │ Vrt OCP Promo SIT-04 │1,504K │       │   │
│ │ ☑ 26/04/2026 │ MV-...0838 │ Chq Sonasid 145632   │       │ 145 K │   │
│ │ ...                                                                │   │
│ └────────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│ ┌─ Lignes du relevé non matchées ────────────────────────────────────┐  │
│ │ 28/04/2026 │ Commission CB                          │  -180        │   │
│ │ 27/04/2026 │ Vir. OCP Promotion FC056               │ +1,504,800   │   │
│ │ 25/04/2026 │ Frais tenue compte                     │  -55         │   │
│ └────────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│ [Suggérer matchings auto]   [Valider le rapprochement]                  │
└──────────────────────────────────────────────────────────────────────────┘
```

### Workflow

1. Sélection compte + période (mois en cours par défaut).
2. Affiche solde comptable calculé + zone saisie solde relevé.
3. Liste des mouvements non rapprochés sur la période.
4. Optionnel : import CSV/Excel du relevé bancaire (parser SheetJS) → liste des lignes du relevé.
5. **Matching auto** : algorithme rapproche par (date ± 3j, montant exact, sens) — cocher les matchings proposés.
6. **Matching manuel** : drag&drop ligne mouvement ↔ ligne relevé.
7. **Lignes orphelines relevé** → bouton `Créer mouvement comptable` (frais bancaires, commissions, agios non encore saisis).
8. À la validation : marque les mouvements `rapproche = true` + crée un `Rapprochement` historisé.

### Mock seed

3-5 rapprochements mensuels par banque (Janvier → Avril 2026).

## 6. Composants partagés

```
applications/erp/finance/components/
├── compte-financier-card/
├── mouvement-row/
├── reglement-imputation-table/
├── rapprochement-matcher/             # 2 colonnes drag&drop
├── solde-indicator/                   # affiche solde + variation
└── tresorerie-mini-chart/             # graph 30j flux
```

## 7. UX details

- **Soldes en temps réel** : recalculés à chaque mutation via `computed`.
- **Affectation auto règlement** : par ordre d'échéance (FIFO sur les plus anciennes factures).
- **Avertissement écart** : si rapprochement validé avec écart résiduel ≠ 0, statut = `ANOMALIE` et alerte sur dashboard.
- **Mode espèces** : pour caisses, modal `Sortie espèces` avec justificatif obligatoire (note de frais simulée).
- **Multi-règlement** : un règlement peut imputer plusieurs factures (typique : un virement client qui paye 3 factures d'un coup).

## 8. Files to deliver

```
applications/erp/pages/finance/
├── caisses/
│   ├── caisses.routes.ts
│   ├── compte-financier-listing/, compte-financier-detail/
│   ├── mouvements-listing/        # drill mouvements par compte
│   └── components/{compte-card, saisie-mvt-dialog}/
├── virements/
│   ├── virements.routes.ts
│   ├── virement-listing/, virement-detail/
├── reglements/
│   ├── reglements.routes.ts
│   ├── reglement-listing/, reglement-saisie/
│   └── components/imputation-picker/
└── rapprochement/
    ├── rapprochement.page.{ts,html,scss}
    └── components/{matcher, releve-import-dialog, ligne-rapproch}/
```

## 9. DoD

- [ ] Caisses & banques : vue tuiles + drill mouvements.
- [ ] Virements internes : 2 mouvements générés + écriture comptable.
- [ ] Règlements : imputation multi-factures + génération écriture + maj statut factures.
- [ ] Rapprochement : matching auto + manuel + import relevé CSV.
- [ ] Solde par compte recalculé live à chaque mutation.
- [ ] Mock seeds cohérents (cumul mouvements = solde affiché).
- [ ] Permissions par entité.
- [ ] Performance : rapprochement 100+ lignes mouvements < 1s.
