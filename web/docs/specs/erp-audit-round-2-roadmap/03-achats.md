# 03 — Achats & Sous-traitance (3-way matching, scoring AO, portail, Art. 187)

> **Sévérité** : P0 (M-ACH-01 + M-ACH-02)
> **Estimation** : 1.5 sprint (S5–S6 partiel)
> **Dépendances** : Round 1 06-marches, `13-admin` (référentiel fournisseurs), `14-transverse` (workflow approbation)

## Findings traités

- [x] **M-ACH-01** Module Réceptions intégré (3-way matching BC↔BL↔Facture) **P0** *(socle livré : UI + service + tests — param UI seuils via code `DEFAULT_MATCHING_TOLERANCE`)*
- [x] **M-ACH-02** Comparatif fournisseurs / scoring AO **P0** *(page comparatif + scoring + attribution + audit override)*
- [ ] **M-ACH-03** Fournisseur 360° (KPI YTD, OTIF %, attestations)
- [ ] **M-ACH-04** Workflow DA→AO→BC→Réception→Facture traçabilité
- [ ] **M-ACH-05** Catalogue articles fournisseurs + tarifs négociés
- [ ] **M-ACH-06** Portail fournisseur (login + soumission AO + dépôt factures)
- [ ] **M-ACH-07** Attestations légales auto (CNSS/fiscale/AMO/RC/IF/ICE/Patente/RIB)
- [ ] **M-ACH-08** Sous-traitance Art. 187 CGI + RG + validation MOA
- [ ] **M-ACH-09** BC catalogue / contrat cadre rapide
- [ ] **M-ACH-10** Cadre normatif marchés publics (BPU/PUF/PGF/régie/OS)
- [ ] **M-ACH-11** Tableau de bord achats
- [ ] **M-ACH-12** IA suggestion achats (P3)

## Goal

Rendre le cycle Achats **traçable bout-en-bout** (DA → AO → BC → Réception → Facture) avec **3-way matching** automatique, attestations légales auto-vérifiées (conformité Art. 60 LF 2024), scoring fournisseurs sur AO, et portail fournisseur.

## Context to read first

```
app/applications/erp/pages/achats/                                # DA, AO, BC, Contrats, Fournisseurs
app/applications/erp/pages/inventory/mouvements/receptions/       # Réceptions Round 1 (à intégrer côté BC)
app/applications/erp/pages/achats/fournisseurs/                   # référentiel
app/applications/erp/pages/finance/factures-fournisseurs/         # facture côté finance
app/applications/erp/shared/services/fiscal-settings.service.ts   # Round 1
```

---

## Task 3.1 — 3-way matching BC ↔ BL ↔ Facture (M-ACH-01) **P0**

**Modèle** :

```ts
export interface MatchingReception {
  id: string;
  bcId: string;
  bcNumero: string;
  receptionId: string;
  receptionNumero: string;
  factureFournisseurId?: string;
  factureNumero?: string;
  lignes: MatchingLigne[];
  ecartsQuantite: number;
  ecartsPrix: number;
  status: 'NON_RECU' | 'RECU_PARTIEL' | 'RECU_COMPLET' | 'FACTURE_PARTIEL' | 'FACTURE_COMPLET' | 'ECART_BLOQUE';
  matched3Way: boolean;
}

export interface MatchingLigne {
  articleId: string;
  qteCommandee: number;
  qteRecue: number;
  qteFacturee: number;
  pxUnitaireBC: number;
  pxUnitaireFacture: number;
  ecartQte: number;
  ecartPx: number;
  bloquant: boolean;
}
```

**Action** :
1. Page `/achats/bc/:id` : onglet « Réceptions » montrant les BL liés (et leurs statuts)
2. Page `/inventory/mouvements/receptions` : colonne « BC d'origine » cliquable
3. Page `/finance/factures-fournisseurs/:id` : onglet « Matching » montrant BC + BL + écarts
4. Seuils paramétrables (tolérance ±2 % prix, ±5 % qté) → si dépassé, statut `ECART_BLOQUE` qui bloque validation facture

**Acceptance criteria** :
- [ ] Création réception depuis BC : préremplit lignes
- [ ] Création facture depuis BL : préremplit prix/qtés
- [ ] Statut `matched3Way` calculé auto
- [ ] Tableau des écarts non résolus
- [ ] Test unitaire `matching.service.spec.ts`

---

## Task 3.2 — Scoring AO (M-ACH-02) **P0**

**Modèle** :

```ts
export interface ScoringAO {
  aoId: string;
  fournisseurId: string;
  offre: OffreAOLigne[];
  scoreFinal: number;       // 0..100
  scoreDetail: {
    prix: number;             // /50
    delai: number;            // /15
    qualite: number;          // /15 (note historique)
    historique: number;       // /10 (volume YTD)
    art187: number;           // /10 (déclaration OK ?)
  };
  recommandation: 'TOP' | 'OK' | 'A_VERIFIER' | 'A_EXCLURE';
  raisonRecommandation: string;
}
```

**Action** : page `/achats/ao/:id/comparatif` qui :
1. Liste les fournisseurs ayant soumis avec leurs offres
2. Calcule un score auto + recommandation
3. Permet override manuel avec justification (loggé `erpAudit`)

**Acceptance criteria** :
- [ ] Matrice comparative (lignes fournisseurs × colonnes critères)
- [ ] Bouton « Attribuer » qui génère le BC depuis l'offre retenue
- [ ] Test unitaire scoring (composants + total)

---

## Task 3.3 — Fournisseur 360° (M-ACH-03) **P1**

Onglets fiche fournisseur :
- **Identité** : raison sociale, ICE, IF, RC, Patente, RIB, contacts
- **KPIs** : CA YTD, nb BC, OTIF % (% livré à l'heure), délai moyen, taux litige
- **Catalogue** : articles + prix négociés (M-ACH-05)
- **Attestations** : CNSS/fiscale/AMO/RC/IF/ICE/Patente/RIB avec dates expiration (M-ACH-07)
- **Historique** : timeline AO/BC/factures/paiements
- **Notes & évaluations** : champs libres + notation 1–5 étoiles

**Acceptance criteria** :
- [ ] 6 onglets opérationnels
- [ ] KPI OTIF cohérent calculé depuis Réceptions
- [ ] Alerte « 2 attestations expirées » affichée en haut de fiche

---

## Task 3.4 — Workflow DA→AO→BC→Réception→Facture (M-ACH-04) **P1**

**Action** : sur chaque entité, afficher la chaîne traçable (« breadcrumb fonctionnel ») :
- DA `DA-2026-018` (status SOUMISE) → AO `AO-2026-005` → BC `BC-2026-042` → BL `BL-2026-097` → Facture `FF-2026-123`

**Acceptance criteria** :
- [ ] Card « Origine » sur chaque écran avec liens cliquables
- [ ] Audit trail intégré (date passage chaque étape, qui)
- [ ] Drill-down depuis tout point de la chaîne

---

## Task 3.5 — Catalogue articles fournisseurs (M-ACH-05) **P1**

**Modèle** :

```ts
export interface CatalogueFournisseur {
  fournisseurId: string;
  articleId: string;
  referenceFournisseur?: string;
  prixUnitaireNegocie: number;
  remise?: number;
  uomEquivalence?: { interne: string; fournisseur: string; ratio: number };
  delaiLivraisonJours: number;
  dateValidite?: string;
  contrat?: string;          // contrat cadre référence
}
```

**Acceptance criteria** :
- [ ] CRUD catalogue par fournisseur
- [ ] Import Excel/CSV
- [ ] À la création d'un BC, le prix se pré-remplit depuis le catalogue fournisseur si présent

---

## Task 3.6 — Portail fournisseur (M-ACH-06) **P1**

**Action** :
1. Sous-domaine `portail.fournisseurs.nafura.ma` (mock = nouvelle route `/portail-fournisseur`)
2. Login fournisseur (mock + JWT)
3. Pages : Mes AO en cours / Mes BC / Déposer attestation / Déposer facture / Suivi paiements

**Acceptance criteria** :
- [ ] Login fournisseur séparé du login interne
- [ ] Soumission AO depuis le portail = visible directement dans `/achats/ao/:id/comparatif`
- [ ] Dépôt facture en PDF = ligne créée côté `/finance/factures-fournisseurs` en statut `EN_ATTENTE_VALIDATION`

---

## Task 3.7 — Attestations légales auto (M-ACH-07) **P1**

**Modèle** :

```ts
export type AttestationType = 'CNSS' | 'FISCALE' | 'AMO' | 'RC' | 'IF' | 'ICE' | 'PATENTE' | 'RIB';

export interface AttestationFournisseur {
  id: string;
  fournisseurId: string;
  type: AttestationType;
  numero?: string;
  dateEmission: string;
  dateExpiration?: string;
  documentUrl: string;
  status: 'VALIDE' | 'EXPIREE' | 'A_RENOUVELER';
  alerteJ30: boolean;
}
```

**Règle** :
- À l'émission d'un BC, vérifier que les attestations fournisseur sont **toutes valides**
- Sinon bloquer ou alerter (paramétrable cf M-ADM-09)
- À chaque règlement, idem (conformité Art. 60 LF 2024)

**Acceptance criteria** :
- [ ] Dashboard fournisseur : 8 chips d'attestations avec couleurs (vert / orange / rouge)
- [ ] Job quotidien (mock = timer) qui recalcule statut + génère alertes
- [ ] Blocage règlement si attestations fiscale + CNSS expirées (configurable)

---

## Task 3.8 — Sous-traitance Art. 187 CGI (M-ACH-08) **P1**

**Modèle complément** :

```ts
export interface ContratSousTraitance {
  // … champs existants Round 1
  art187Declare: boolean;
  art187DateDeclarationMOA?: string;
  art187ValideMoa: boolean;
  retenueGarantieTaux: number;       // 7-10 %
  retenueGarantieMontantCumule: number;
  paiementDirectMOA: boolean;        // si Art. 187 imposé par CCAG
}
```

**Acceptance criteria** :
- [ ] Champs « Art. 187 déclaré » et « Validé MOA » sur fiche contrat ST
- [ ] PDF contrat type généré avec clauses Art. 187 conformes
- [ ] RG calculée sur chaque situation ST + cumul affiché
- [ ] Workflow paiement direct MOA (P2 → différer si besoin)

---

## Task 3.9 — BC catalogue / contrat cadre rapide (M-ACH-09) **P1**

**Action** : page `/achats/bc/rapide` avec :
- sélection contrat cadre ou catalogue interne
- ligne par ligne : article + qté → prix auto + livraison auto
- pas de workflow AO requis si montant < seuil paramétré
- approbation simplifiée (1 étape)

**Acceptance criteria** :
- [ ] Création BC en < 30 secondes pour cas courant
- [ ] Skip workflow AO si critères respectés
- [ ] Bouton sur listing BC : « + BC rapide »

---

## Task 3.10 — Cadre normatif marchés publics (M-ACH-10) **P2**

Compléter types de marchés MA :
- **BPU** : Bordereau Prix Unitaire
- **PUF** : Prix Unitaire Forfaitaire
- **PGF** : Prix Global Forfaitaire
- **Marché de régie** : main d'œuvre + matériaux refacturés
- **OS d'arrêt / OS de reprise / OS de modification**

Aligner avec `Marche.typeMarche` enum + comportements (calcul situations) côté §07-marches.

---

## Task 3.11 — Tableau de bord achats (M-ACH-11) **P2**

Page `/achats/dashboard` :
- Économies réalisées vs prix marché (top 10 par article)
- Dépendance fournisseur > 25 % CA achats (alerte)
- Top fournisseurs litige
- Mix BC standards vs BC rapides

---

## Task 3.12 — IA suggestion achats (M-ACH-12) **P3**

Différer (S12+). Heuristique : article × planning chantier × stock projeté → suggestion brouillon DA.

---

## Testing

```ts
// e2e/specs/achats/3way-matching.spec.ts
test('3-way matching bloque facture avec écart prix > tolérance', async ({ page }) => {
  // 1. Créer BC à 100 MAD
  // 2. Réception 100 MAD
  // 3. Facture 150 MAD
  // 4. Vérifier statut ECART_BLOQUE
});
```

```ts
// unit
describe('ScoringAOService', () => {
  it('attribue 50/50 prix au moins-disant', () => { /* … */ });
  it('exclut fournisseur sans Art. 187 si marché public', () => { /* … */ });
});
```

## Dépendances inverses

- 07-marches (M-MAR-07 sous-traitance déclarative côté MOA)
- 08-finance (matching → facture fournisseur → règlement)
- 13-admin (attestations légales configurables)
