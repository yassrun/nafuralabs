# Agent — RH · Paie

> **Objet** : génération paie mensuelle BTP Maroc — bulletins, journal de paie, déclarations CNSS/AMO/IGR.
> **Route** : `/rh/paie` · **Permission** : `rh.paie.*`, `rh.bulletin.*`

## 0. Pré-requis

[README rh](README.md), [01-rh-employes](01-rh-employes.md), [02-rh-pointage-planning](02-rh-pointage-planning.md). [00-MOCK-DATA §plan comptable, TVA](../00-MOCK-DATA-STRATEGY.md). Connaissance fiscalité Maroc (CNSS, AMO, IGR, CIMR).

## 1. Concept métier

Cycle paie BTP Maroc :

1. **Préparation** : à partir du J+15 du mois M, RH lance la prépa pour mois M.
2. **Collecte variables** :
   - Pointages validés du mois (heures normales + sup).
   - Congés pris.
   - Primes ponctuelles (performance, prime fin année prorata).
   - Retenues exceptionnelles (avances sur salaire, sanctions, prêts).
   - Indemnités (transport, panier, déplacement chantier).
3. **Calcul brut** : salaire base + heures sup × tauxHoraire × majoration + primes + indemnités.
4. **Charges salariales** : CNSS, AMO, IGR.
5. **Charges patronales** : CNSS-employeur, AMO-employeur, taxe formation prof.
6. **Net à payer** = Brut - charges salariales.
7. **Validation** : RH puis DAF.
8. **Génération bulletins** PDF.
9. **Virements** : génération fichier de virement bancaire (txt format AWB ou SIMT).
10. **Comptabilisation** : génère écritures comptables auto.
11. **Déclarations** : CNSS (BDS), IGR mensuel (état 9421).

## 2. Modèle

```ts
// applications/erp/rh/models/paie.model.ts

export type PaieStatus = 'PREPARATION' | 'CALCULEE' | 'VALIDEE_RH' | 'VALIDEE_DAF' | 'CLOTUREE' | 'PAYEE';

export interface Paie {
  id: string;
  exercice: number;                   // 2026
  mois: number;                       // 1..12
  libelle: string;                    // 'Paie Avril 2026'
  dateOuverture: string;
  dateCloture?: string;
  datePaiementPrevu: string;          // typ. fin du mois
  datePaiementReel?: string;
  
  status: PaieStatus;
  
  // Synthèse
  nbBulletins: number;
  totalBrut: number;
  totalChargesSalariales: number;
  totalNetAPayer: number;
  totalChargesPatronales: number;
  totalCoutEntreprise: number;        // brut + charges patronales
  
  validateurRhId?: string;
  validateurRhDate?: string;
  validateurDafId?: string;
  validateurDafDate?: string;
  
  ecritureId?: string;                // écriture comptable générée
  fichierVirementUrl?: string;        // fichier AWB/SIMT
  declarationCnssUrl?: string;
  declarationIgrUrl?: string;
}

export interface Bulletin {
  id: string;
  paieId: string;
  employeId: string;
  employeName?: string;
  matricule?: string;
  poste?: string;
  category?: string;
  departmentName?: string;
  contratId: string;
  
  // Période
  exercice: number;
  mois: number;
  joursOuvrables: number;
  joursTravailles: number;
  joursAbsence: number;
  joursConge: number;
  
  // Heures
  heuresNormales: number;
  heuresSupp25: number;
  heuresSupp50: number;
  heuresSupp100: number;
  
  // Rémunération brute (lignes détaillées)
  rubriques: BulletinRubrique[];
  totalBrut: number;
  totalGains: number;
  totalRetenues: number;
  
  // Cotisations
  cnssSalarial: number;               // 4.48% plafond 6000
  amoSalarial: number;                // 2.26%
  igr: number;                        // calculé barème
  cimrSalarial?: number;
  totalCotisationsSalariales: number;
  
  cnssPatronal: number;               // 8.6% + AT 1.5% etc.
  amoPatronal: number;                // 4.11%
  taxeFormation: number;              // 1.6%
  cimrPatronal?: number;
  totalCotisationsPatronales: number;
  
  // Net
  netImposable: number;
  netAPayer: number;
  
  // Cumul annuel à date
  cumulBrutAnnuel: number;
  cumulNetAnnuel: number;
  cumulIgrAnnuel: number;
  
  // Mode paiement
  modePaiement: 'VIREMENT' | 'CHEQUE' | 'ESPECES';
  rib?: string;
  banque?: string;
  
  notes?: string;
  pdfUrl?: string;
}

export interface BulletinRubrique {
  id: string;
  bulletinId: string;
  ordre: number;
  type: 'GAIN' | 'RETENUE' | 'COTISATION' | 'INFO';
  code: string;                       // 'SAL_BASE', 'HS_25', 'PRIME_PERF', 'AVANCE'
  libelle: string;
  base?: number;
  taux?: number;
  quantite?: number;
  prixUnitaire?: number;
  montantGain: number;
  montantRetenue: number;
  imposable?: boolean;
  cotisable?: boolean;
}

export interface VariablePaie {
  id: string;
  paieId: string;
  employeId: string;
  type: 'PRIME' | 'INDEMNITE' | 'AVANCE' | 'RETENUE' | 'AUTRE';
  code: string;
  libelle: string;
  montant: number;                    // positif = gain, négatif = retenue
  motif?: string;
  saisieParId: string;
  saisieDate: string;
}
```

## 3. Page principale `/rh/paie`

### Listing paies

Vue table par mois :

| Mois | Libellé | Bulletins | Brut total | Net total | Coût ent. | Date paiement | Status |
|------|---------|-----------|------------|-----------|-----------|---------------|--------|
| 04/2026 | Avril 2026 | 40 | 412 K | 318 K | 504 K | 30/04/2026 | CLOTUREE |
| 03/2026 | Mars 2026 | 38 | 398 K | 305 K | 487 K | 31/03/2026 | PAYEE |
| ...

Filtres : exercice, status.

CTA `+ Préparer paie [Mai 2026]` (mois en cours non encore préparé).

### Detail paie

```
┌──────────────────────────────────────────────────────────────────────┐
│ ← Paie Avril 2026                                  [VALIDEE_DAF]    │
│                                                                      │
│ ┌──────────┬──────────┬──────────┬──────────┐                       │
│ │ Bullet.  │ Brut     │ Net      │ Coût ent.│                       │
│ │   40     │ 412,580  │ 318,720  │ 504,300  │                       │
│ └──────────┴──────────┴──────────┴──────────┘                       │
│                                                                      │
│ [⋯] [Valider RH] [Valider DAF] [Clôturer] [Imprimer journal]        │
│ [Générer fichier virement] [Déclaration CNSS] [Comptabiliser]       │
├──────────────────────────────────────────────────────────────────────┤
│ [Bulletins] [Variables] [Synthèse rubriques] [Comptabilité] [Activ.]│
└──────────────────────────────────────────────────────────────────────┘
```

### Onglet `Bulletins`

Listing 40 bulletins :

| Matricule | Nom | Catégorie | J. travaillés | Brut | Net | Mode | Statut |

Click → modal preview bulletin PDF + boutons (download, envoi email).

### Onglet `Variables`

Saisie des variables paie pour le mois (primes, retenues, avances) :

| Employé | Type | Code | Libellé | Montant | Motif |

CTA `+ Variable` → modal saisie. Bouton `Importer Excel`.

### Onglet `Synthèse rubriques`

Tableau cumul par rubrique (utile pour audit) :

| Code | Libellé | Type | Nb employés | Total |
| SAL_BASE | Salaire de base | GAIN | 40 | 350,000 |
| HS_25 | Heures sup 25% | GAIN | 18 | 24,580 |
| PRIME_TRANS | Indemnité transport | GAIN | 22 | 11,000 |
| CNSS_SAL | CNSS part salarié | COTISATION | 40 | 18,490 |
| ...

### Onglet `Comptabilité`

Aperçu de l'écriture comptable globale qui sera générée :

```
Compte │ Libellé                  │ Débit  │ Crédit
617    │ Salaires (brut)          │412,580 │
618    │ Charges sociales         │ 91,720 │
4441   │ Personnel — rém. dues    │        │318,720
4443   │ CNSS, AMO à payer        │        │ 76,490
4452   │ État, IGR                │        │ 49,800
4448   │ Caisse retraite (CIMR)   │        │  9,500
4458   │ Taxe formation prof.     │        │  6,580
TOTAL                              │504,300 │504,300 ✓
```

Bouton `Comptabiliser` → génère l'écriture sur le journal `OD` (Opérations Diverses).

### Onglet `Activité`

Timeline événements paie.

## 4. Préparation paie — wizard

```
Étape 1 — Période
  ☐ Mois : Mai 2026
  ☐ Date paiement prévue : 31/05/2026

Étape 2 — Collecte automatique
  ✓ Pointages mois validés : 1,082 saisies
  ✓ Congés du mois : 5 demandes (12 jours)
  ✓ Salaires base contrats actifs : 40 employés
  ⚠ Variables manuelles à saisir : 0

Étape 3 — Variables individuelles
  [ Saisir / importer variables ]

Étape 4 — Calcul & vérification
  [ Lancer le calcul ] → calcule tous les bulletins
  Bulletins anomalies : 0
  
Étape 5 — Validation
  [Soumettre validation RH]
```

## 5. Calcul d'un bulletin (algo)

```ts
// applications/erp/rh/mock/paie-calculator.ts

export function calculBulletin(
  employe: Employe,
  contrat: Contrat,
  pointages: Pointage[],
  variables: VariablePaie[],
  conges: DemandeConge[],
  paramsFiscaux: ParamsFiscaux,
): Bulletin {
  // 1. Heures
  const heuresNormales = sum(pointages.map(p => p.heuresNormales));
  const heuresSupp25 = sum(pointages.map(p => p.heuresSupp25));
  // ...
  
  // 2. Salaire base
  let salBase = contrat.salaireBaseBrut;
  if (contrat.modeRemuneration === 'HORAIRE') {
    salBase = heuresNormales * contrat.tauxHoraire;
  }
  
  // 3. Heures sup
  const tauxH = contrat.tauxHoraire || (contrat.salaireBaseBrut / (contrat.heuresHebdo * 4.33));
  const gainHS25 = heuresSupp25 * tauxH * 1.25;
  const gainHS50 = heuresSupp50 * tauxH * 1.50;
  const gainHS100 = heuresSupp100 * tauxH * 2.00;
  
  // 4. Primes & indemnités
  const indTransport = contrat.indemniteTransport || 0;
  const indPanier = (contrat.indemnitePanier || 0) * joursTravailles;
  const primeAnciennete = salBase * (contrat.primeAnciennetePercent || 0) / 100;
  // ... primes ponctuelles depuis variables
  
  // 5. Brut imposable
  const brut = salBase + gainHS25 + gainHS50 + gainHS100 
             + indTransport + indPanier + primeAnciennete + primesPonctuelles
             - retenuesPonctuelles;
  
  // 6. Cotisations salariales
  const baseCnss = Math.min(brut, 6000);  // plafond
  const cnssSalarial = baseCnss * 0.0448;
  const amoSalarial = brut * 0.0226;
  const cimrSalarial = contrat.cimrAdherent ? brut * 0.06 : 0;
  
  // 7. IGR — barème progressif
  const netImposable = brut - cnssSalarial - amoSalarial - cimrSalarial - fraisProfessionnels(brut);
  const igrBrut = calcIgrBrut(netImposable * 12) / 12;
  const charges Familiales = 30 * (employe.nbEnfantsACharge + (employe.situationFamiliale === 'MARIE' ? 1 : 0));
  const igr = Math.max(0, igrBrut - chargesFamiliales);
  
  // 8. Net à payer
  const totalCotisationsSalariales = cnssSalarial + amoSalarial + cimrSalarial + igr;
  const netAPayer = brut - totalCotisationsSalariales;
  
  // 9. Charges patronales
  const cnssPatronal = baseCnss * 0.086 + brut * 0.015;  // 8.6% retraite + 1.5% AT
  const amoPatronal = brut * 0.0411;
  const taxeFormation = brut * 0.016;
  const cimrPatronal = contrat.cimrAdherent ? brut * 0.06 : 0;
  
  return { /* tout le bulletin */ };
}

function calcIgrBrut(revenuAnnuelImposable: number): number {
  // Barème IGR 2025 Maroc (simplifié)
  if (revenuAnnuelImposable <= 30000) return 0;
  if (revenuAnnuelImposable <= 50000) return revenuAnnuelImposable * 0.10 - 3000;
  if (revenuAnnuelImposable <= 60000) return revenuAnnuelImposable * 0.20 - 8000;
  if (revenuAnnuelImposable <= 80000) return revenuAnnuelImposable * 0.30 - 14000;
  if (revenuAnnuelImposable <= 180000) return revenuAnnuelImposable * 0.34 - 17200;
  return revenuAnnuelImposable * 0.38 - 24400;
}
```

## 6. Bulletin PDF

Template A4 conforme légalement Maroc :
- En-tête société (raison sociale, ICE, RC, CNSS-IDE).
- Période, employé (matricule, nom, CIN, CNSS, situation familiale).
- Tableau rubriques : Code, Libellé, Base, Taux, Gains, Retenues.
- Totaux : brut, cotisations salariales, net imposable, IGR, **net à payer**.
- Cumul annuel.
- Mode paiement, banque, RIB.
- Cachet société + mention légale.

Template Angular `<bulletin-print>` rendu dans iframe + `window.print()` ou `jsPDF`.

## 7. Génération fichier de virement

Format AWB simplifié (V1 mock) — fichier texte :

```
H;PAIE;MAI2026;30/05/2026;XXX
D;EMP-001;Yassine KARKAFI;007780000123456789012345;28000.50;PAIE MAI 2026
D;EMP-002;...
F;Total;504300.00;40
```

Bouton `Générer fichier virement` → download `.txt`.

## 8. Composants

```
applications/erp/rh/components/
├── paie-status-badge/
├── paie-summary-card/
├── bulletin-print/                  # template PDF bulletin
├── bulletin-preview-modal/
├── variable-form-dialog/
├── paie-wizard-steps/
└── igr-barometre/                   # info-bulle barème IGR
```

## 9. Mock seed

6 paies mensuelles validées (Nov 2025 → Avril 2026) avec 40 bulletins chacune :
- Cohérents avec pointages mock.
- Cumuls annuels recalculés.
- Statuts mix : 5 PAYEE, 1 CLOTUREE.
- Paie courante (Mai 2026) en PREPARATION.

## 10. Files to deliver

```
applications/erp/pages/rh/paie/
├── paie.routes.ts
├── models/, services/, config/...
├── paie-listing/...
├── paie-detail/
│   ├── paie-detail.page.{ts,html,scss}
│   └── tabs/{tab-bulletins,tab-variables,tab-rubriques,tab-comptabilite,tab-activite}.component.{ts,html,scss}
├── paie-preparation-wizard/
│   ├── paie-preparation-wizard.page.{ts,html,scss}
│   └── steps/{step-periode,step-collecte,step-variables,step-calcul,step-validation}.component.{ts,html,scss}
└── components/{bulletin-row, bulletin-preview, variable-dialog, comptabilite-preview}/
```

## 11. UX details

- **Wizard préparation** : étapes guidées, progress bar.
- **Preview bulletin** : modal avec PDF iframe, navigation employé suivant/précédent.
- **Audit** : rubriques avec base/taux toujours visibles (pas seulement montant).
- **Récap visuel** : carte synthèse en haut de la fiche paie avec 4 KPIs.
- **Comparaison N-1** : bouton `Comparer Avril 2025` → table delta brut/net/coût.
- **Anomalies** : avant calcul, lister les anomalies (pointages manquants, congés en attente, RIB manquants) avec bouton de correction direct.
- **Verrouillage** : paie CLOTUREE non modifiable. Re-calcul interdit, sauf annulation explicite avec écriture inverse.

## 12. DoD

- [ ] Wizard préparation paie 5 étapes opérationnel.
- [ ] Calcul correct CNSS / AMO / IGR / charges patronales selon barème Maroc 2025.
- [ ] 40 bulletins générés et previewables en PDF.
- [ ] Validation 2 niveaux (RH + DAF).
- [ ] Génération fichier virement bancaire (mock format).
- [ ] Comptabilisation : écriture OD générée et balanced.
- [ ] Synthèse rubriques cohérente.
- [ ] Mock seed 6 mois de paies validées + 1 paie courante en préparation.
- [ ] Performance : calcul 40 bulletins < 1.5s.
- [ ] Permissions : `validerRh`, `validerDaf`, `cloturer` distinctes.
