# Agent — Finance · Comptabilité

> **Objet** : journaux, balance, analytique, factures fournisseurs. Cœur comptable conforme CGNC marocain.
> **Routes** : `/finance/journaux`, `/finance/balance`, `/finance/analytique`, `/finance/factures-fournisseurs`
> **Permission** : `finance.<entity>.*`

## 0. Pré-requis

[README finance](README.md), [00-MOCK-DATA-STRATEGY §Plan comptable, §TVA](../00-MOCK-DATA-STRATEGY.md). Dépend du **plan comptable** (sub-spec 03).

## 1. Modèle

```ts
// applications/erp/finance/models/

export type EcritureStatus = 'BROUILLON' | 'VALIDEE' | 'CLOTUREE';

export interface Ecriture {
  id: string;
  numero: string;                      // EC-2026-00582
  journalCode: string;                 // 'VT', 'AC', 'BQ-AWB', 'CA1', 'OD'
  dateEcriture: string;
  exercice: number;                    // 2026
  periode: number;                     // 1..12
  reference?: string;                  // n° pièce origine
  libelle: string;
  status: EcritureStatus;
  origine?: 'MANUELLE' | 'AUTO_FACTURE_CLIENT' | 'AUTO_FACTURE_FOURN' | 'AUTO_REGLEMENT' | 'AUTO_PAIE' | 'AUTO_AVOIR';
  origineId?: string;                  // id du document source
  totalDebit: number;
  totalCredit: number;
  validateurId?: string;
  validationDate?: string;
  lignes: LigneEcriture[];
}

export interface LigneEcriture {
  id: string;
  ecritureId: string;
  ordre: number;
  compteCode: string;                  // ex: 6111
  compteLibelle?: string;
  debit: number;
  credit: number;
  libelle: string;
  axeAnalytique?: string;              // chantierId, departmentId
  tiersId?: string;                    // fournisseur ou client
  echeance?: string;                   // pour comptes 4411, 3421
}

export interface Journal {
  id: string;
  code: string;                        // 'VT', 'AC', 'BQ-AWB', 'OD'
  libelle: string;
  type: 'VENTE' | 'ACHAT' | 'BANQUE' | 'CAISSE' | 'OPERATIONS_DIVERSES' | 'NOUVEAUX';
  contrePartieDefautCode?: string;     // pour banque/caisse
  isActive: boolean;
}

export interface Compte {
  id: string;
  code: string;                        // '6111'
  libelle: string;                     // 'Achats matières premières'
  classe: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  type: 'CHARGE' | 'PRODUIT' | 'ACTIF' | 'PASSIF' | 'TIERS' | 'TRESORERIE';
  parentCompteCode?: string;           // hiérarchie 6 → 61 → 611 → 6111
  isCollectif: boolean;                // si oui, comptes auxiliaires obligatoires (4411xxx)
  isLettrable: boolean;                // pour comptes tiers
  isAuxiliaire: boolean;
  axeAnalytiqueObligatoire?: boolean;
  isActive: boolean;
}

export type FactureFournStatus = 'BROUILLON' | 'VALIDEE' | 'PARTIELLEMENT_PAYEE' | 'PAYEE' | 'EN_LITIGE' | 'AVOIRISEE' | 'ANNULEE';

export interface FactureFournisseur {
  id: string;
  numeroInterne: string;               // FF-2026-00214
  numeroFournisseur: string;           // n° facture émise par le fournisseur
  fournisseurId: string;
  fournisseurName?: string;
  bcId?: string;                       // BC source
  receptionId?: string;                // BL source
  chantierId?: string;
  rubrique?: string;
  
  dateFacture: string;                 // date émission (par fournisseur)
  dateReception: string;               // date arrivée chez nous
  dateEcheance: string;
  
  totalHt: number;
  totalTva: number;
  totalTtc: number;
  retenueTvaPercent?: number;          // RAS TVA si applicable
  retenueTvaMontant?: number;
  netAPayerTtc: number;
  
  cumulRegleTtc: number;
  resteARegler: number;
  
  status: FactureFournStatus;
  ecritureId?: string;                 // écriture comptable générée
  documents?: { name: string; url: string }[];
  notes?: string;
  lignes: FactureFournLigne[];
}

export interface FactureFournLigne {
  id: string;
  factureId: string;
  ordre: number;
  designation: string;
  bcLigneId?: string;                  // si lignes BC matchées
  compteCode: string;                  // 6111, 6131, 6132...
  axeAnalytique?: string;              // chantierId
  quantite?: number;
  prixUnitaireHt?: number;
  totalHt: number;
  tvaTaux: number;
}

export interface AxeAnalytique {
  id: string;
  type: 'CHANTIER' | 'DEPARTEMENT' | 'ACTIVITE';
  code: string;
  libelle: string;
  parentId?: string;
  isActive: boolean;
}
```

## 2. `/finance/journaux`

### Listing par défaut

Affichage par journal × période :

```
┌──────────────────────────────────────────────────────────────────────┐
│ Journaux                                                             │
│ [Période: Avr 2026 ▾]  [Journal: Tous ▾]  [Status: Tous ▾]          │
├──────────────────────────────────────────────────────────────────────┤
│ Journal │ Code │ Total Débit │ Total Crédit │ Solde   │ Nb écritures│
│ Ventes  │  VT  │ 4,250,000   │ 4,250,000    │   0     │     32      │
│ Achats  │  AC  │ 2,890,000   │ 2,890,000    │   0     │     54      │
│ BQ AWB  │BQ-AWB│ 1,950,000   │ 2,140,000    │ -190 K  │     28      │
│ ...                                                                  │
│ TOTAL   │      │ 12,840,000  │ 12,840,000   │   0     │    214      │
└──────────────────────────────────────────────────────────────────────┘
```

Click sur ligne journal → drill vers liste écritures du journal × période.

### Liste écritures (drill)

Colonnes : `numero`, `dateEcriture`, `reference`, `libelle`, `totalDebit`, `totalCredit`, `status`, `origine`.

Filtres : journal, période, status, axeAnalytique, tiersId, search libellé.

Chips : `Brouillons`, `À valider`, `Auto`, `Manuelles`.

Action ligne → ouvre détail écriture.

### Detail écriture

```
┌──────────────────────────────────────────────────────────────────────┐
│ EC-2026-00582  Vente situation SIT-CH-001-04        [VALIDEE]        │
│ Journal VT │ Date 02/05/2026 │ Période Avr 2026                     │
│ Référence : SIT-CH-001-04 │ Origine : AUTO_FACTURE_CLIENT          │
├──────────────────────────────────────────────────────────────────────┤
│ Compte │ Libellé compte           │ Tiers       │ Débit    │ Crédit  │
│ 3421   │ Clients                  │ OCP Promo.  │1,504,800 │         │
│ 7111   │ Ventes travaux           │             │          │1,254,000│
│ 4456   │ TVA collectée            │             │          │  250,800│
│ ────────────────────────────────────────────────────────────────────│
│ TOTAL                                            │1,504,800 │1,504,800│
│ Équilibre : ✓ Débit = Crédit                                        │
└──────────────────────────────────────────────────────────────────────┘
```

### Saisie écriture manuelle (`/finance/journaux/nouvelle`)

Form :
- Journal (select).
- Date.
- Référence + libellé.
- Lignes : table éditable (compte autocomplete, libellé, débit/crédit, axe analytique pour comptes charges/produits).
- Footer sticky : Total Débit, Total Crédit, Δ. Bouton `Valider` activé si Δ = 0.

### Workflow

```
BROUILLON ─(valider)─► VALIDEE ─(clôture mensuelle)─► CLOTUREE
```

Les écritures `CLOTUREE` ne sont plus modifiables. Une `BROUILLON` peut être supprimée. Une `VALIDEE` peut être contre-passée (génère une écriture inverse).

### Génération automatique

Sur les événements suivants, écriture auto générée (mock simulé) :

| Événement | Journal | Lignes |
|-----------|---------|--------|
| Émission facture client | VT | 3421 D / 7111 + 4456 C |
| Émission situation | (via facture) | idem |
| Validation facture fournisseur | AC | 6111/6131/etc. + 3455 D / 4411 C |
| Encaissement client | BQ-xxx | 5141 D / 3421 C |
| Règlement fournisseur | BQ-xxx | 4411 D / 5141 C |
| Paiement paie | OD | 617 + 618 D / 444 + 5141 C |

## 3. `/finance/balance`

### Vue par défaut — balance générale

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Balance générale  [Période: 01/01/2026 → 30/04/2026]   [Exporter Excel] │
│  Vue: [Générale] [Auxiliaire clients] [Auxiliaire fournisseurs]         │
├──────────────────────────────────────────────────────────────────────────┤
│ Compte │ Libellé          │ Reports D │ Reports C │ Mvt D    │ Mvt C   │
│ 2331   │ Constructions    │ 4,200,000 │           │          │         │
│ 3111   │ Marchandises     │ 1,840,000 │           │  890,000 │ 540,000 │
│ 3421   │ Clients          │ 2,400,000 │           │5,200,000 │3,800,000│
│ 4411   │ Fournisseurs     │           │ 1,560,000 │1,800,000 │2,400,000│
│ 5141   │ Banque AWB       │ 1,200,000 │           │3,800,000 │3,950,000│
│ 6111   │ Achats matières  │           │           │1,400,000 │         │
│ 7111   │ Ventes travaux   │           │           │          │5,200,000│
│ ...                                                                      │
└──────────────────────────────────────────────────────────────────────────┘
```

Colonnes : Code compte, Libellé, Reports débit, Reports crédit, Mouvements débit période, Mouvements crédit période, Solde débit, Solde crédit.

Filtres : période, classe (1-7), type compte, axeAnalytique.

Toggle vue : Générale / Auxiliaire clients (3421xxx) / Auxiliaire fournisseurs (4411xxx).

CTA `Exporter Excel` (xlsx via SheetJS).

### Validation totaux

Footer : Total Débit doit = Total Crédit (afficher ✓ ou ⚠).

## 4. `/finance/analytique`

Vue analytique = balance répartie sur axes (chantiers, départements).

### Layout pivot

```
┌──────────────────────────────────────────────────────────────────────┐
│ Analytique  [Axe: Chantier ▾] [Période] [Comptes: 6,7 ▾]            │
├──────────────────────────────────────────────────────────────────────┤
│ Compte │ Libellé          │CH-001  │CH-002 │CH-003  │Non aff.│ Total│
│ 6111   │ Achats matières  │ 540 K  │ 280 K │ 380 K  │  20 K  │1.22M │
│ 6131   │ Sous-traitance   │ 380 K  │ 540 K │ 220 K  │   0    │1.14M │
│ 6132   │ Location matér.  │  85 K  │ 180 K │  45 K  │   8 K  │ 318K │
│ 617    │ Salaires         │ 320 K  │ 480 K │ 220 K  │ 180 K  │1.20M │
│ 7111   │ Ventes travaux   │1.254 M │ 920 K │ 980 K  │   0    │3.15M │
│ ────────────────────────────────────────────────────────────────────│
│ MARGE  │                  │ -71 K  │-560 K │ 115 K  │        │      │
└──────────────────────────────────────────────────────────────────────┘
```

Pivot dynamique : axe en colonne, compte en ligne.

Colonnes calculées :
- Total par compte.
- Marge par axe (Σ classe 7 - Σ classe 6).

Filtres : période, axe, classe comptes, search.

Toggle : montants HT (par défaut) / TTC (V2).

Drill down : click cellule (compte × axe) → liste des lignes d'écritures qui ont composé ce montant.

## 5. `/finance/factures-fournisseurs`

### Listing

Colonnes : `numeroInterne`, `numeroFournisseur`, `fournisseurName`, `dateFacture`, `dateEcheance`, `totalTtc`, `cumulRegleTtc`, `resteARegler`, `status`, `delaiRetard`.

Couleur `delaiRetard` : 0-7j gris, 7-30j orange, > 30j rouge.

Filtres : fournisseur, status, dateRange, montantRange, chantier, rubrique.

Chips : `À valider`, `À payer`, `En retard`, `Payées ce mois`, `En litige`, `Sans BC matché`.

CTA `+ Saisir facture` (workflow scan + saisie).

### Detail / saisie

Sections :
1. **Identité** — fournisseur (autocomplete), n° fournisseur, dates (facture, réception, échéance), BC source (autocomplete BC validés du fournisseur), réception/BL source, chantier, rubrique.
2. **Lignes** — table éditable :
   - Si BC source choisi : préremplie avec lignes du BC. User ajuste qté/PU pour matcher la facture réelle (fréquent : qté facture = qté livrée < qté commandée).
   - Sinon saisie libre.
   - Compte de charge (auto-suggéré selon rubrique : 6111 Matériaux, 6131 ST, 6132 Location, 6125 Carburant…).
   - Axe analytique (chantier) hérité.
3. **Récap** sticky : Total HT, TVA, TTC, retenue TVA si applicable, Net à payer.
4. **Pièces** — upload facture scannée (mock OCR V2 — V1 simple upload).
5. **Activité** — timeline.

### Workflow

```
BROUILLON ─(valider)─► VALIDEE ─► [écriture comptable auto générée]
VALIDEE ─(règlement partiel)─► PARTIELLEMENT_PAYEE ─(complet)─► PAYEE
VALIDEE ─(litige)─► EN_LITIGE
VALIDEE ─(avoir total)─► AVOIRISEE
* ─(annuler)─► ANNULEE
```

Actions :
- `Valider` → génère écriture (`AC` journal, lignes : compte charge D + 3455 TVA D / 4411 C).
- `Régler` → ouvre form règlement (cf. spec trésorerie).
- `Marquer en litige` → motif obligatoire.
- `Saisir avoir reçu` → ouvre form avoir fournisseur.

### Mock seed

30+ factures fournisseurs réparties 6 mois :
- Lien BC matché pour 80%.
- Lien chantier pour 90%.
- Statuts variés.
- Cumul réglé cohérent.

## 6. Composants partagés finance

```
applications/erp/finance/components/
├── compte-autocomplete/             # autocomplete sur plan comptable
├── ecriture-balance-indicator/      # ✓/⚠ équilibre D/C
├── ecriture-print/                  # template imprimable écriture
├── balance-row/                     # ligne balance avec calculs
├── analytique-pivot-cell/
├── ff-print/                        # facture fournisseur archivée
├── retard-paiement-cell/
└── status-badge-finance/
```

## 7. Mock seed

- ~80-120 comptes (cf. plan comptable §00-MOCK-DATA, à seeder dans sub-spec 03).
- 200+ écritures réparties 6 mois (mix manuelles + auto issues factures/règlements/paie).
- 30+ factures fournisseurs.
- Axes analytiques : tous les chantiers du seed + 4 départements (Direction, Études, Exploitation, Finance & RH).

## 8. Files to deliver

```
applications/erp/finance/
├── finance.routes.ts
├── components/...
├── mock/{finance-mock.service.ts, ecritures-generator.ts, seeds.ts}
└── models/index.ts

applications/erp/pages/finance/
├── journaux/
│   ├── journaux.routes.ts
│   ├── models/, services/, config/...
│   ├── journal-listing/, ecritures-listing/, ecriture-detail/
│   └── ecriture-saisie/
├── balance/
│   └── balance.page.{ts,html,scss}
├── analytique/
│   └── analytique.page.{ts,html,scss}
└── factures-fournisseurs/
    ├── ff.routes.ts
    ├── ff-listing/, ff-detail/
    └── components/ff-line-editor/
```

## 9. UX details

- **Autocomplete compte** : recherche par code OU libellé, affichage hiérarchique.
- **Validation équilibre** : sur saisie écriture, indicateur live ✓ ou Δ rouge.
- **Génération auto** : transparente — afficher dans timeline de l'écriture la source (`Auto depuis facture client FC-2026-...`) avec lien.
- **Export Excel** : balance, analytique, journaux exportables (SheetJS).
- **Période en cours** : par défaut mois en cours pour journaux/balance, exercice en cours pour analytique.
- **Drill cohérent** : journal → écritures, écriture → lignes, balance → écritures du compte, analytique → écritures du compte × axe.
- **Validation auxiliaire** : si compte collectif (4411, 3421), tiers obligatoire. Validation bloquante.

## 10. DoD

- [ ] Journaux listing + drill écritures + saisie manuelle équilibrée.
- [ ] Balance affiche tous les comptes avec calculs corrects.
- [ ] Analytique pivot multi-axes + drill.
- [ ] Factures fournisseurs : workflow + génération écriture comptable.
- [ ] Génération auto d'écritures sur événements externes (factures clients, règlements).
- [ ] Plan comptable BTP Maroc seedé (cf. sub-spec 03).
- [ ] Export Excel sur balance et analytique.
- [ ] Validation équilibre Σ Débit = Σ Crédit sur 100% des écritures.
- [ ] Permissions par entité.
- [ ] Performance : balance 200+ comptes < 800ms.
