# Agent — Études & Devis

> **Objet** : pré-vente — bibliothèque de prix, métrés, devis client, soumissions appels d'offres clients. Cycle amont qui alimente la création de chantiers.
> **Routes** : `/etudes/*`
> **Permission** : `etudes.<entity>.*`

## 0. Pré-requis

[00-CONVENTIONS](00-CONVENTIONS.md), [00-MOCK-DATA-STRATEGY](00-MOCK-DATA-STRATEGY.md), [00-UX-PRINCIPES](00-UX-PRINCIPES.md). Référence métier : Onaya étude (FR), Sage BTP étude.

## 1. Vue d'ensemble

Le module études couvre le cycle commercial **avant** la création d'un chantier :

1. **Bibliothèque de prix** — bordereau type avec ouvrages, sous-détails, prix unitaires (déboursés + frais + bénéfice).
2. **Métrés** — quantitatifs sur plans (saisis manuellement ou import Excel).
3. **Devis** — offre commerciale au client (DPGF — décomposition du prix global et forfaitaire).
4. **Appels d'offres clients** — soumissions à des AO publics ou privés, avec dossiers à constituer.

Si **devis approuvé** ou **AO attribué** → création automatique d'un chantier `EN_COURS`.

## 2. Routes nav

| Route | Description |
|-------|-------------|
| `/etudes/bibliotheque-prix` | Bibliothèque ouvrages + prix |
| `/etudes/metres` | Métrés / quantitatifs |
| `/etudes/devis` | Devis clients |
| `/etudes/appels-offres-clients` | AO publics auxquels on soumissionne |

## 3. Modèle de données

```ts
// applications/erp/etudes/models/

export type CategoryOuvrage = 'TERRASSEMENT' | 'GO' | 'CHARPENTE' | 'ETANCHEITE' | 'CLOISON' | 'REVETEMENT' | 'MENUISERIE' | 'ELECTRICITE' | 'PLOMBERIE' | 'CLIM' | 'PEINTURE' | 'VRD' | 'AUTRE';

export interface Ouvrage {
  id: string;
  code: string;                       // OUV-T01-001
  designation: string;                // "Béton armé pour semelle isolée"
  category: CategoryOuvrage;
  unite: string;                      // m³, m², ml, U, ff
  prixUnitaireHt: number;             // calculé depuis sous-détails
  uniteMain: { heures: number; tauxHoraire: number; total: number };
  composants: ComposantOuvrage[];     // matériaux + sous-traitance
  fraisGenerauxPercent: number;       // par défaut 8%
  beneficePercent: number;            // par défaut 7%
  isActive: boolean;
  notes?: string;
  derniereMaj: string;
}

export interface ComposantOuvrage {
  id: string;
  ouvrageId: string;
  type: 'MATERIAU' | 'SOUS_TRAITANCE' | 'LOCATION' | 'OUTILLAGE';
  articleId?: string;                 // si MATERIAU lié à catalogue
  designation: string;
  unite: string;
  rendement: number;                  // qté nécessaire par unité d'ouvrage
  prixUnitaire: number;
  total: number;
}

export interface Metre {
  id: string;
  numero: string;
  projetNom: string;                  // référence projet (peut être un futur chantier)
  ville?: string;
  dateMetre: string;
  metreurId: string;
  metreurName?: string;
  notes?: string;
  status: 'BROUILLON' | 'TERMINE';
  lignes: MetreLigne[];
}

export interface MetreLigne {
  id: string;
  metreId: string;
  ouvrageId?: string;
  designationLibre?: string;
  unite: string;
  longueur?: number;
  largeur?: number;
  hauteur?: number;
  nombre?: number;
  formule?: string;                   // libellé formule "L*l*h*n"
  quantiteCalculee: number;
  notes?: string;
}

export type DevisStatus = 'BROUILLON' | 'EMIS' | 'NEGOCIATION' | 'APPROUVE' | 'PERDU' | 'ANNULE' | 'EXPIRE';

export interface Devis {
  id: string;
  numero: string;                     // DV-2026-0089
  clientId: string;
  clientName?: string;
  contactClient?: string;
  objet: string;
  ville?: string;
  dateEmission: string;
  dateValidite: string;
  metreId?: string;
  bibliothequeReference?: string;
  conditionsPaiement: string;
  delaiExecutionJours?: number;
  totalHt: number;
  tvaTaux: number;
  totalTva: number;
  totalTtc: number;
  remiseGlobalePercent?: number;
  status: DevisStatus;
  motifRefus?: string;
  chantierGenereId?: string;          // si APPROUVE
  notes?: string;
  lignes: DevisLigne[];
  documents?: { name: string; url: string }[];
  historiqueVersions: DevisVersion[];
}

export interface DevisLigne {
  id: string;
  devisId: string;
  ordre: number;
  parentLigneId?: string;             // hiérarchie chapitres
  type: 'CHAPITRE' | 'OUVRAGE' | 'TEXTE';
  code?: string;
  designation: string;
  ouvrageId?: string;                 // si lié à bibliothèque
  unite?: string;
  quantite?: number;
  prixUnitaireHt?: number;
  totalHt?: number;
  remisePercent?: number;
  notes?: string;
}

export interface DevisVersion {
  id: string;
  devisId: string;
  version: number;                    // 1, 2, 3
  date: string;
  totalHt: number;
  modifications: string;
  url?: string;                       // PDF figé
}

export type AOClientStatus = 'A_ETUDIER' | 'EN_PREPARATION' | 'SOUMIS' | 'ATTRIBUE' | 'PERDU' | 'INFRUCTUEUX' | 'ANNULE';

export interface AppelOffreClient {
  id: string;
  numero: string;                     // AOC-2026-0024
  reference: string;                  // référence officielle MOA
  objet: string;
  donneurOrdre: string;               // "Ministère de l'Equipement"
  type: 'PUBLIC' | 'PRIVE';
  dateLimiteDepot: string;
  dateOuverturePlis?: string;
  cautionProvisoire?: number;
  cautionDefinitive?: number;
  cautionRetenueGarantie?: number;
  estimationMoaHt?: number;
  ville?: string;
  delaiExecutionJours?: number;
  status: AOClientStatus;
  devisId?: string;                   // devis associé (offre commerciale)
  metreId?: string;
  resultatRangNotre?: number;
  resultatNbPlis?: number;
  resultatAttributaire?: string;
  resultatMontantHt?: number;
  chantierGenereId?: string;
  documents: AOClientDocument[];
  notes?: string;
}

export interface AOClientDocument {
  id: string;
  aocId: string;
  category: 'DCE' | 'CCAP' | 'CCTP' | 'BPU' | 'PLAN' | 'REPONSE' | 'CAUTION' | 'AUTRE';
  name: string;
  url: string;
  obligatoire: boolean;
  fourni: boolean;
}
```

## 4. `/etudes/bibliotheque-prix`

### Listing

Vue arbre par catégorie + table.

Colonnes : `code`, `designation`, `category`, `unite`, `prixUnitaireHt`, `derniereMaj`, `isActive`.

Filtres : `category`, `isActive`, `prixRange`.

CTA `+ Nouvel ouvrage`.

### Detail / éditeur ouvrage

Sections :
1. **Identité** — code, désignation, catégorie, unité, notes.
2. **Sous-détail** :
   ```
   Composant         │ Type    │ Unité │ Rendement │ PU MAD │ Total MAD
   Ciment CPJ 35     │MATERIAU │  sac  │   2.4     │   78   │  187.20
   Sable 0/4         │MATERIAU │  m³   │   0.4     │  180   │   72.00
   Gravette 4/6      │MATERIAU │  m³   │   0.8     │  220   │  176.00
   MO maçon          │MO       │   h   │   2.0     │   60   │  120.00
   MO ouvrier        │MO       │   h   │   3.5     │   40   │  140.00
   ───────────────────│─────────│───────│───────────│────────│───────────
   Sous-total débour. │         │       │           │        │  695.20
   Frais généraux 8%  │         │       │           │        │   55.62
   Bénéfice 7%        │         │       │           │        │   52.56
   ───────────────────│─────────│───────│───────────│────────│───────────
   Prix unitaire HT  │         │       │           │        │  803.38
   ```
3. **Versions historiques** — variations prix sur 12 mois (graphique).

Auto-calcul : `prixUnitaireHt = (sousTotalDebour * (1 + FG%)) * (1 + Bénéfice%)`.

### Mock seed

40-60 ouvrages BTP types couvrant tous les corps d'état. Cohérent avec articles existants pour les composants.

## 5. `/etudes/metres`

### Listing

Colonnes : `numero`, `projetNom`, `ville`, `dateMetre`, `metreurName`, `nbLignes`, `quantiteTotaleEstimee`, `status`.

### Detail / éditeur

Tableau de métré :

```
N° │ Désignation     │ Ouvrage(lookup) │ Unité │ L  │ l  │ h  │ N │ Formule    │ Qté
1  │ Semelles iso    │ Béton armé S.I. │  m³  │ 2.5│ 2.5│ 0.5│ 12│ L*l*h*N    │ 37.50
2  │ Longrines       │ Béton armé long.│  m³  │ 0.4│ 0.4│ ML │ — │ L*l*ml     │ 64.00
3  │ Dalle RDC       │ Béton dalle 15  │  m²  │ 12 │ 8  │  — │ — │ L*l        │ 96.00
...
```

Champs L/l/h/N/Formule/Qté calculée :
- Si formule libre, l'utilisateur peut écrire (ex: `(L*l)-(L1*l1)`).
- Sinon, calcul auto : `qte = (L||1)*(l||1)*(h||1)*(N||1)`.

CTA `Importer Excel` : parse un fichier xlsx avec colonnes pré-définies (utiliser SheetJS).

CTA `Générer devis depuis ce métré` → ouvre `/etudes/devis/new?metreId=...` avec lignes pré-remplies.

## 6. `/etudes/devis`

### Listing

Colonnes : `numero`, `clientName`, `objet`, `dateEmission`, `dateValidite`, `totalHt`, `totalTtc`, `status`, `version`.

Filtres : client, status, dateRange, montantRange.

Chips : `Brouillons`, `Émis en attente`, `À relancer` (EMIS depuis > 14j), `Approuvés`, `Perdus`.

### Detail / éditeur

Sections :
1. **En-tête** — client, contact, objet, ville, dates, conditions paiement, délai exécution, validité.
2. **DPGF** (Décomposition prix global forfaitaire) — éditeur arborescent :
   ```
   ▼ Lot 01 — Gros Œuvre              350 000.00 MAD HT
     ├ 1.1  Terrassements                12 500.00
     │ ├ 1.1.1 Décapage TV               m³  500   25.00   12 500
     │ └ ...
     ├ 1.2  Semelles                     45 000.00
     └ ...
   ▼ Lot 02 — Étanchéité               85 000.00 MAD HT
     ...
   ```
   Drag&drop pour réordonner. Hiérarchie 3 niveaux (lot → poste → sous-poste).
   Lignes liées à la bibliothèque : prix auto-pré-rempli.
   Lignes libres autorisées (texte ou ouvrage non-référencé).
3. **Conditions** — paiement, garanties, délais, mentions légales.
4. **Récap** sticky : Total HT, TVA, Total TTC, remise globale.
5. **Annexes** — documents à joindre (mémoire technique, références).
6. **Versions** — historique des versions du devis (V1, V2…) avec PDF figés.

### Workflow

```
BROUILLON ─(émettre)─► EMIS ─(client négocie)─► NEGOCIATION ─► EMIS (V2,V3...)
EMIS/NEGOCIATION ─(approuvé)─► APPROUVE ─► [chantier généré]
EMIS/NEGOCIATION ─(refusé)─► PERDU (motif)
* ─(date validité dépassée)─► EXPIRE
```

À l'émission d'une nouvelle version, snapshot du devis dans `historiqueVersions[]` + version++.

À l'approbation, propose : `Convertir en chantier ?` → wizard de création chantier pré-rempli (client, budget HT = total HT devis, lots = lots du devis).

### Actions

- `Émettre PDF` — PDF officiel A4 + accusé réception client.
- `Dupliquer` — copie en BROUILLON V1.
- `Nouvelle version` — incrémente version courante.
- `Convertir en chantier` (si APPROUVE).
- `Marquer perdu` — motif obligatoire.

## 7. `/etudes/appels-offres-clients`

### Listing

Colonnes : `numero`, `donneurOrdre`, `objet`, `type`, `dateLimiteDepot`, `estimationMoaHt`, `cautionProvisoire`, `status`, `delaiRestant` (j).

Couleur `delaiRestant` : > 30j vert, 7-30j orange, < 7j rouge.

Filtres : status, type, dateRange, donneurOrdre.

Chips : `À étudier`, `En préparation`, `Soumis attente`, `Attribués`.

### Detail à onglets

1. **Identité** — référence officielle, donneur d'ordre, type, dates clés, ville, délai, cautions.
2. **Documents** — liste pré-définie (DCE, CCAP, CCTP, BPU, plans) avec tracking `obligatoire/fourni`. Jauge de complétude (`6/8 documents fournis`).
3. **Étude** — métré + devis associés (création depuis cet onglet).
4. **Préparation dossier** — checklist :
   - Caution provisoire émise (banque) ✓
   - Mémoire technique rédigé ✓
   - Références chantiers ✓
   - Attestations CNSS, IGR, RC à jour ✓
   - PV de signature responsables ✓
   - Plis cachetés et déposés ✓
5. **Résultat** (post-soumission) — rang, attributaire, montant gagnant.
6. **Documents joints** — upload dossier complet.

Workflow : `A_ETUDIER → EN_PREPARATION → SOUMIS → ATTRIBUE | PERDU | INFRUCTUEUX | ANNULE`.

À `ATTRIBUE` : option `Convertir en chantier`.

### Mock seed

8-15 AO clients sur les 6 derniers mois. Mix gagnés/perdus/en cours/à étudier. Donneurs d'ordre cohérents (ADM, ONEE, Ministères, communes, privés).

## 8. Composants partagés

```
applications/erp/etudes/components/
├── etudes-status-badge/
├── ouvrage-tree-picker/         # arbre bibliothèque pour piocher
├── dpgf-editor/                 # éditeur DPGF arborescent drag&drop
├── metre-table-editor/          # tableau métré avec formules
├── devis-print/                 # template PDF devis
├── caution-tracker/             # widget suivi cautions AO
└── delai-cell/                  # cellule délai avec couleur
```

## 9. Files to deliver

```
applications/erp/etudes/
├── etudes.routes.ts
├── components/...
├── mock/{etudes-mock.service.ts, seeds.ts}
└── models/index.ts

applications/erp/pages/etudes/
├── bibliotheque-prix/
├── metres/
├── devis/
└── appels-offres-clients/
```

## 10. UX details

- **DPGF éditeur** : drag&drop pour réordonner, indentation (Tab) pour hiérarchiser, raccourcis clavier (Ctrl+Entrée pour ajouter ligne).
- **Saisie métré** : formules libres parsées (eval sécurisé via librairie `expr-eval`), conversion auto m³→m² etc.
- **PDF devis** : template DPGF officiel A4 (cf. modèles Onaya), avec pied de page mentions légales (ICE, RC), cachet société.
- **Suivi délai AO** : countdown visible sur fiche + alerte 7j et 24h avant date limite.
- **Versions devis** : comparaison côte-à-côte V1 vs V2 (diff visuel surligné).

## 11. DoD

- [ ] Bibliothèque prix : 40+ ouvrages couvrant tous les corps d'état.
- [ ] Métrés : tableau avec formules + import Excel.
- [ ] Devis : DPGF arborescent éditable + PDF + workflow complet.
- [ ] AO clients : checklist documents + suivi délai + résultat post-soumission.
- [ ] Conversion devis approuvé → chantier fonctionne.
- [ ] Conversion AO attribué → chantier fonctionne.
- [ ] Mock cohérent : devis liés à clients réels, prix cohérents marché Maroc.
- [ ] `etudes.routes.ts` injecté dans erp.routes.generated.ts.
- [ ] Permissions par entité.
- [ ] Performance : éditeur DPGF gère 500+ lignes sans freeze.
