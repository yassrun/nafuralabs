# 06 — Module Marchés & Facturation (de zéro)

> **Sévérité** : P0 ⚠️ **MORT FONCTIONNEL** sans ce module — l'ERP n'est pas vendable au Maroc.
> **Estimation** : 2.5 sprints (S3–S5)
> **Dépendances** : `01-foundations`, `02-chantiers-bugs` (drill-down chantier)

## Findings traités

- [ ] **F-08** Module Marchés & Facturation 100% absent

## Goal

Module Marchés couvrant le **cycle commercial-financier complet d'un projet BTP marocain** : marché initial (forfait/BPU/régie/marché public), avenants, facturation par situation, retenue de garantie 7%, cautions bancaires, formule de révision K (CCAG-T), pénalités de retard, spécificités fiscales MA (TVA, retenue source 5%, timbre).

## Concepts BTP Maroc à connaître

Avant de coder, lire :
- **CCAG-T** (Cahier des Clauses Administratives Générales applicables aux marchés publics de Travaux) — Maroc
- **Marché à prix global et forfaitaire** vs **BPU** (Bordereau Prix Unitaires) vs **Régie** vs **Mixte**
- **Décompte mensuel/situation** : facturation au taux d'avancement physique réel
- **Retenue de garantie 7%** : prélevée sur chaque situation, libérée 1 an après réception définitive
- **Caution provisoire** (3% offre), **caution définitive** (3% marché), **caution restitution avance** si avance versée
- **Avance forfaitaire** (10–20% du marché à la signature)
- **Décompte général définitif (DGD)** : solde final à la fin du marché
- **Formule de révision K** = `a + b·BTPxx + c·MO` (indices ANP-IAB et MO main-d'œuvre publiés mensuellement)
- **Retenue à la source 5%** : sur travaux fournis à l'État (art. 158 CGI)
- **TVA 20% standard BTP** mais 14% logements sociaux, 10% certains équipements

## Context to read first

```
app/applications/erp/pages/ventes/                              # ventes existantes (peut être étendu)
app/applications/erp/pages/chantiers/situations/                # situations existantes (drillé par marché)
app/applications/erp/ventes/models/index.ts                     # FactureClient, OffreCommerciale, BC client
app/applications/erp/pages/finance/factures-fournisseurs/       # FF existant
docs/specs/erp-frontend-agents/07-ventes/                       # specs ventes existantes
```

---

## Architecture cible

```
app/applications/erp/pages/marches/
├── marches.routes.ts
├── contrats/                       # Marché initial (le « contrat » avec MOA)
│   ├── contrat-listing/
│   ├── contrat-detail/             # objet, type, montant, conditions, formules révision
│   ├── config/
│   ├── models/                     # Marche, MarcheType, MarcheStatus
│   └── services/
├── avenants/
│   ├── avenant-listing/
│   ├── avenant-detail/             # justifs, +montant, +délai, signature
│   ├── config/
│   ├── models/                     # Avenant
│   └── services/
├── factures/                       # ⚠️ factures CLIENT (pas fournisseur)
│   ├── facture-listing/
│   ├── facture-detail/             # avec situations rattachées
│   ├── config/
│   ├── models/                     # FactureMarche, lignes par situation
│   └── services/
├── cautions/
│   ├── cautions-listing/           # provisoire / définitive / RG / restitution avance
│   ├── caution-detail/
│   ├── config/
│   ├── models/                     # CautionBancaire
│   └── services/
├── penalites/                      # pénalités retard, escomptes
│   └── penalites-listing/
├── revisions-prix/                 # formule K mensuelle
│   ├── revisions-listing/
│   ├── indice-bt-listing/          # référentiel ANP-IAB
│   ├── config/
│   └── services/
└── shared/
    ├── retenue-source.service.ts   # calcul RAS 5% si client = État
    ├── tva-engine.service.ts       # TVA 20/14/10 selon nature
    └── timbre-fiscal.service.ts    # si paiement espèces
```

---

## Task 6.1 — Contrats / Marchés (le cœur)

**Modèle** :

```ts
export type MarcheType = 'FORFAIT' | 'BPU' | 'REGIE' | 'MIXTE';
export type MarcheNature = 'PUBLIC' | 'PRIVE_GRAND_COMPTE' | 'PRIVE_PME' | 'PARTICULIER';
export type MarcheStatus = 'BROUILLON' | 'SIGNE' | 'EN_EXECUTION' | 'RECEPTION_PROVISOIRE' | 'RECEPTION_DEFINITIVE' | 'CLOTURE' | 'RESILIE';

export interface Marche {
  id: string;
  numero: string;                          // MAR-2026-001
  reference?: string;                      // référence MOA
  intitule: string;                         // « Construction Résidence Atlas R+5 »
  chantierId: string;
  chantierCode: string;
  clientId: string;                         // MOA
  clientNom: string;
  clientIce: string;
  clientIf: string;
  clientRc?: string;
  clientPatente?: string;
  type: MarcheType;
  nature: MarcheNature;                     // PUBLIC vs PRIVE → impacte RAS 5%
  montantInitialHt: number;
  montantInitialTtc: number;
  tvaTaux: number;                          // 20 / 14 / 10
  retenueGarantieTaux: number;              // 7% standard
  retenueSourceTaux: number;                // 5% si PUBLIC
  avanceForfaitairePercent?: number;        // si avance versée
  cautionProvisoireMontant?: number;
  cautionDefinitiveMontant?: number;
  cautionRestitutionAvanceMontant?: number;
  formuleRevisionK?: FormuleRevisionK;      // si révisable
  delaiExecutionMois: number;
  penaliteRetardJourPercent?: number;        // ex. 0.1% par jour de retard
  dateOrdreService?: string;
  dateReceptionProvisoire?: string;
  dateReceptionDefinitive?: string;
  status: MarcheStatus;
  // Liens
  avenantsIds: string[];
  cautionsIds: string[];
  facturesIds: string[];
  documentsIds: string[];
}

export interface FormuleRevisionK {
  // K = a + b·BTPxx + c·MO
  termeFixe: number;                        // a (fraction non révisable, ex. 0.15)
  termesVariables: Array<{
    coefficient: number;                    // b ou c
    indiceCode: string;                     // 'BTP01' (béton), 'BTP18' (acier), 'MO' (main d'oeuvre)
    indiceBaseValeur: number;               // valeur à la date de l'offre
  }>;
}
```

**Pages** :
- `/marches/contrats` : listing avec colonnes : N° · Chantier · Client · Type · Nature · Montant HT · Avancement · Statut · Date OS
- `/marches/contrats/:id` : détail multi-onglets (Identité · Ligne budgétaire · Cautions · Avenants · Situations · Factures · Documents · Révisions K)

**Acceptance criteria** :
- [ ] Seed 6 marchés (1 par chantier seedé) avec mix types/natures
- [ ] Création d'un marché : formulaire en 3 étapes (Identité MOA · Caractéristiques marché · Conditions financières)
- [ ] Validation : ICE 15 chiffres, IF strict, montant > 0
- [ ] Drill-down vers chantier `[routerLink]="['/chantiers', chantierId]"`
- [ ] Affichage du montant **avec/sans avenants** : `Initial: 38.2M MAD · Avenants: +2.5M · Total marché: 40.7M`

---

## Task 6.2 — Avenants

**Modèle** :

```ts
export type AvenantType = 'TVX_SUPPLEMENTAIRES' | 'PROLONGATION_DELAI' | 'MIXTE' | 'ADAPTATION_TECHNIQUE' | 'AUTRE';

export interface Avenant {
  id: string;
  numero: string;                            // AV-MAR-2026-001-01
  marcheId: string;
  type: AvenantType;
  objet: string;
  motif: string;
  montantHt: number;                         // peut être négatif
  prolongationJours: number;                  // peut être 0
  dateSignature?: string;
  status: 'BROUILLON' | 'PROPOSE' | 'SIGNE' | 'REJETE';
  documents: string[];
}
```

**UX** :
- Création avenant depuis fiche marché → bouton « + Avenant »
- Recap impact : `Nouveau montant marché: X` + `Nouveau délai: Y mois`

**Acceptance criteria** :
- [ ] Création d'avenant signé → impact recalculé sur fiche marché
- [ ] Statut workflow : BROUILLON → PROPOSE → SIGNE
- [ ] Si REJETE : aucun impact sur le marché

---

## Task 6.3 — Factures de situation

**Concept** : facturer une situation de travaux validée (cf module Chantiers).

**Lien Situation ↔ Facture** :
1. Situation `VALIDEE_MOA` → bouton « Facturer » → crée brouillon facture pré-rempli
2. Facture peut grouper plusieurs situations (rare) ou refacturer partiellement (sous-décompte)
3. Calcul automatique :
   - Montant brut HT = somme situations
   - Avance déduite (si versée)
   - Retenue de garantie (7%)
   - **TVA 20%** (ou 14%/10%)
   - **Retenue source 5%** si MOA = État
   - **Timbre fiscal** si paiement espèces
   - **Net à payer**

**Modèle** :

```ts
export interface FactureMarche {
  id: string;
  numero: string;                            // FM-2026-00001
  marcheId: string;
  chantierId: string;
  situationsIds: string[];
  dateEmission: string;
  dateEcheance: string;                       // J+30, J+60 selon contrat
  // Montants
  montantBrutHt: number;                      // Σ situations
  avanceDeduiteHt: number;
  retenueGarantieHt: number;
  netHt: number;                              // brut - avance - RG
  tvaTaux: number;
  tvaMontant: number;
  netTtc: number;
  retenueSourceTaux: number;
  retenueSourceMontant: number;
  timbreFiscal?: number;
  netAPayer: number;
  // Statut
  status: 'BROUILLON' | 'EMISE' | 'ENVOYEE_MOA' | 'ACCEPTEE' | 'PAYEE_PARTIEL' | 'PAYEE' | 'CONTESTEE';
  paiements: PaiementFactureMarche[];
}
```

**Acceptance criteria** :
- [ ] Bouton « Facturer » sur situation validée → préremplissage correct
- [ ] Calcul TVA, RG, RAS 5%, timbre tous corrects pour cas test
- [ ] PDF facture téléchargeable avec en-tête société + ICE/IF/RC
- [ ] Statut workflow complet
- [ ] Cumul facturé/encaissé visible sur fiche marché

---

## Task 6.4 — Cautions bancaires

**Modèle** :

```ts
export type CautionType = 'PROVISOIRE' | 'DEFINITIVE' | 'RESTITUTION_AVANCE' | 'RETENUE_GARANTIE';
export type CautionStatus = 'EMISE' | 'ACTIVE' | 'LEVEE' | 'EXPIRE' | 'JOUE';

export interface CautionBancaire {
  id: string;
  numero: string;                            // CB-2026-001
  marcheId: string;
  type: CautionType;
  banqueEmettrice: string;                    // AWB, BMCE, CIH, CDM, BMCI, BP, SGMA…
  numeroBancaire?: string;                   // numéro interne banque
  montant: number;
  dateEmission: string;
  dateValiditeJusquA: string;
  dateLevee?: string;
  status: CautionStatus;
  documents: string[];
}
```

**Pages** :
- Listing par chantier ou par marché
- Détail avec timeline (émission → activation → levée)
- Alertes : expiration < J+30

**Acceptance criteria** :
- [ ] Seed 4 cautions par marché (provisoire levée + définitive + RG en cours)
- [ ] Notification dans le centre quand expiration approche

---

## Task 6.5 — Révisions de prix (formule K)

**Concept** : si marché révisable, chaque situation est multipliée par un coefficient K calculé selon les indices BTP-MO publiés mensuellement par l'ANP-IAB (Maroc).

**Modèle indices** :

```ts
export interface IndiceBT {
  code: string;                              // 'BTP01', 'BTP18', 'MO'
  libelle: string;                           // 'Béton armé', 'Acier', 'Main d\'oeuvre'
  mois: string;                              // YYYY-MM
  valeur: number;
}
```

**Calcul K** :

```ts
function calculerK(formule: FormuleRevisionK, indicesMois: Map<string, number>): number {
  let k = formule.termeFixe;
  for (const t of formule.termesVariables) {
    const courant = indicesMois.get(t.indiceCode);
    if (!courant) throw new Error(`Indice manquant: ${t.indiceCode}`);
    k += t.coefficient * (courant / t.indiceBaseValeur);
  }
  return k;
}
```

**Pages** :
- `/marches/revisions-prix/indices-bt` : référentiel mensuel des indices
- `/marches/revisions-prix` : pour chaque marché révisable, K appliqué par situation

**Acceptance criteria** :
- [ ] Référentiel seedé : 12 mois × 5 indices clés
- [ ] Calcul K vérifié avec un cas test connu (validation manuelle)
- [ ] Application sur situation : `montantRevisé = montantBase × K`

---

## Task 6.6 — Pénalités de retard

**Calcul** : si `dateLivraisonReelle > dateLivraisonContractuelle + tolérance`, appliquer `penaliteJour% × jours_retard × montant_marché`.

**Page** : `/marches/penalites` listing + détail.

**Acceptance criteria** :
- [ ] Calcul automatique sur réception provisoire si retard
- [ ] Applicable sur dernière facture (déduction)
- [ ] Possibilité de remise gracieuse (workflow approbation)

---

## Task 6.7 — Spécificités fiscales MA (intégration transversale)

**Service `TvaEngineService`** :

```ts
@Injectable({ providedIn: 'root' })
export class TvaEngineService {
  /**
   * Détermine le taux TVA applicable.
   * - 20% standard
   * - 14% logement social (selon objet marché)
   * - 10% certains équipements (à paramétrer)
   */
  determinerTaux(marche: Marche): number;

  /**
   * Calcule la TVA sur un montant HT.
   */
  calculer(ht: number, taux: number): { tva: number; ttc: number };
}
```

**Service `RetenueSourceService`** :

```ts
@Injectable({ providedIn: 'root' })
export class RetenueSourceService {
  /**
   * Retenue à la source 5% sur travaux fournis à l'État (art. 158 CGI).
   * Conditions : MOA = personne morale de droit public.
   */
  estApplicable(marche: Marche): boolean;
  calculer(montantHt: number, taux: number = 0.05): number;
}
```

**Service `TimbreFiscalService`** :

```ts
@Injectable({ providedIn: 'root' })
export class TimbreFiscalService {
  /**
   * 0.25% du montant si paiement espèces > 10 000 MAD.
   * Plafonnée à 100 MAD par facture.
   */
  calculer(montantTtc: number, modePaiement: ModePaiement): number;
}
```

**Acceptance criteria** :
- [ ] 3 services testés avec cas réels
- [ ] Intégrés dans le calcul facture (Task 6.3)
- [ ] Paramétrables dans `app-settings` (taux configurables)

---

## Task 6.8 — Wirer le routing + sidebar

**Fichier** : `app/applications/erp/marches/marches.routes.ts` (à créer)

```ts
export const MARCHES_ROUTES: Routes = [
  { path: 'marches', pathMatch: 'full', redirectTo: 'marches/contrats' },
  { path: 'marches/contrats', loadChildren: () => import('../pages/marches/contrats/contrats.routes').then(m => m.CONTRATS_ROUTES) },
  { path: 'marches/avenants', loadChildren: () => import('../pages/marches/avenants/avenants.routes').then(m => m.AVENANTS_ROUTES) },
  { path: 'marches/factures', loadChildren: () => import('../pages/marches/factures/factures.routes').then(m => m.FACTURES_MARCHES_ROUTES) },
  { path: 'marches/cautions', loadChildren: () => import('../pages/marches/cautions/cautions.routes').then(m => m.CAUTIONS_ROUTES) },
  { path: 'marches/penalites', loadComponent: () => import('../pages/marches/penalites/penalites-listing/penalites-listing.page').then(m => m.PenalitesListingPage) },
  { path: 'marches/revisions-prix', loadChildren: () => import('../pages/marches/revisions-prix/revisions.routes').then(m => m.REVISIONS_ROUTES) },
];
```

**Sidebar** : la zone `business` doit déjà avoir « Marchés & Facturation » dans `erp-nav.generated.ts`. Sinon ajouter.

**Routes principales à wirer dans le routeur app principal**.

---

## Testing

### E2E parcours critique

```ts
test('cycle complet marché → situation → facture → paiement', async ({ page }) => {
  // 1. créer marché 10M MAD type FORFAIT, MOA État (RAS 5% applicable)
  await page.goto('/marches/contrats/new');
  // ...

  // 2. créer situation 1 à 30% sur le chantier
  await page.goto('/chantiers/situations/new');
  // ...

  // 3. valider situation
  // 4. facturer la situation
  await page.locator('button', { name: /Facturer/ }).click();

  // 5. vérifier le calcul facture
  // brutHt: 3 000 000
  // RG 7% : -210 000
  // netHt : 2 790 000
  // TVA 20% : 558 000
  // TTC : 3 348 000
  // RAS 5% : -167 400
  // Net à payer : 3 180 600
  await expect(page.getByText('3 180 600 MAD')).toBeVisible();
});
```

## Dépendances inverses

- 07-pilotage-approbations (KPI marge marché, cash-flow par chantier)
- 12-exports-impressions (PDF facture marché conforme MOA publique)
