# 07 — Marchés BTP (DGD, OS, situations auto, avances, sous-traitance Art. 187)

> **Sévérité** : P1 majoritairement (Round 1 = bon socle, enrichir)
> **Estimation** : 1.5 sprint (S5–S6 partiel)
> **Dépendances** : Round 1 06-marches-facturation (Contrats, Avenants, Situations, Cautions, K, Pénalités), `03-achats` (M-ACH-08 Art. 187)

## Findings traités

- [x] **Task 7.0** — Fusion sidebar : un groupe `Marchés & Facturation` (`erp-nav.generated.ts` + i18n `nav.marches`).
- [x] **M-MAR-01** — Propagation impact avenant signé (mock) : budget chantier, montants marché, cautions ; audit + confirmation.
- [x] **M-MAR-02** — `DgdService` + tests ; page `/marches/dgd` + seed (PDF CCAG-T à brancher).
- [x] **M-MAR-03** — Tableau 3 colonnes cautions + alertes expiration (J-30) ; PDF demande renouvellement : à brancher.
- [x] **M-MAR-04** — Page `/marches/os` + seed CRUD / PDF / pause Gantt : partiel.
- [x] **M-MAR-05** — `SituationGenerationService` + tests ; bouton fiche chantier onglet Situations (brouillon démo).
- [x] **M-MAR-06** — Modèle + seed avance démarrage `mar-002` ; amortissement auto sur situations : à brancher.
- [ ] **M-MAR-07** — Sous-traitance déclarative Art. 187 + paiement direct MOA
- [ ] **M-MAR-08** — Réception provisoire / définitive workflow
- [ ] **M-MAR-09** — Indices BTP01..xx auto (ANP/HCP CSV)
- [ ] **M-MAR-10** — Litige / réclamation MOA (P3)

> **Sidebar** : ✅ fusionnée (plus de double entrée de premier niveau).

## Goal

Compléter le module Marchés (déjà très bon selon l'audit) avec : workflow avenants complet (impact propagé), DGD auto depuis cumul situations + K + RG, alertes cautions, OS reliés au marché, situations auto depuis avancements, avances de démarrage avec amortissement, et Art. 187 CGI.

## Context to read first

```
app/applications/erp/pages/marches/contrats/                  # Round 1 OK
app/applications/erp/pages/marches/avenants/                  # Round 1 OK (workflow signature)
app/applications/erp/pages/marches/situations/                # Round 1 OK (calcul + impression)
app/applications/erp/pages/marches/cautions/                  # Round 1 OK
app/applications/erp/pages/marches/revisions-k/               # Round 1 OK
app/applications/erp/pages/marches/penalites/                 # Round 1 OK
app/applications/erp/marches/services/                        # services métier
app/applications/erp/marches/services/k-formula.service.ts    # Round 1 calculerK
```

---

## Task 7.0 — Fusion sidebar Marchés (Préalable) **P0**

**Action** : décider stratégie et exécuter.

**Recommandation** : fusionner les 2 entrées sidebar en une seule **« Marchés & Facturation »** (label porteur), avec sous-routes claires :
- Contrats
- Avenants
- Situations (factures de situation)
- Cautions
- Révisions K
- Pénalités
- DGD (M-MAR-02)
- OS (M-MAR-04)

**Acceptance criteria** :
- [x] 1 seul groupe sidebar (plus de duplication)
- [x] Routes `/ventes/*` inchangées (pas de renommage d’URL ; liens existants conservés)

---

## Task 7.1 — Avenants workflow complet (M-MAR-01) **P1**

Étendre Round 1 6.2 :
- À la signature avenant, propager impact automatique sur :
  - Budget chantier (nouveau montant marché)
  - Planning (rallongement / raccourcissement)
  - Cautions (nouveau montant de bonne fin)
  - Échéancier paiements (mise à jour cash-flow)

**Acceptance criteria** :
- [x] Bouton « Propager impact » sur avenant signé
- [x] Confirmation utilisateur avec récap des changements
- [x] Audit log de la propagation

---

## Task 7.2 — DGD auto (M-MAR-02) **P1**

**Modèle** :

```ts
export interface DGD {
  id: string;
  numero: string;                // DGD-2026-001
  marcheId: string;
  cumulSituationsTTC: number;
  cumulRetenueGarantie: number;
  cumulRevisionK: number;
  cumulPenalites: number;
  reprisesRG: number;            // depuis garanties bancaires
  montantNetAPayer: number;       // = cumul - RG + reprises - pénalités + K
  status: 'BROUILLON' | 'SOUMIS_MOA' | 'NOTIFIE' | 'PAYE' | 'CONTESTE';
  dateSoumission?: string;
  dateNotification?: string;
  documentUrl?: string;
}
```

**Workflow** :
1. À la **réception définitive** (M-MAR-08), bouton « Générer DGD »
2. Calcul auto depuis cumul situations + retenues + K + pénalités + reprises RG
3. PDF officiel CCAG-T MA
4. Soumission MOA (état `SOUMIS_MOA`)
5. Notification MOA → état `NOTIFIE`
6. Paiement → libération solde RG (côté caution / banque)

**Acceptance criteria** :
- [ ] Page `/marches/dgd` listing
- [ ] Génération PDF DGD officiel
- [ ] Lien automatique au solde RG et caution restitution
- [ ] Test unitaire calcul DGD

---

## Task 7.3 — Caution alerte expiration + workflow (M-MAR-03) **P1**

Étendre Round 1 6.4 :
- Alerte J-30 et J-7 avant expiration
- Workflow renouvellement : génération demande banque → suivi → caution renouvelée
- Workflow mainlevée : demande à banque après DGD / réception définitive → suivi
- Dossier électronique caution (PDF + accusés réception banque)

**Acceptance criteria** :
- [ ] Dashboard cautions : 3 colonnes par statut (Active / À renouveler / Mainlevée)
- [ ] Alerte dashboard : « 2 cautions expirent dans 30 jours »
- [ ] PDF demande renouvellement / mainlevée pré-rempli

---

## Task 7.4 — OS (Ordre de Service) (M-MAR-04) **P1**

**Modèle** :

```ts
export interface OrdreService {
  id: string;
  numero: string;                // OS-2026-001
  marcheId: string;
  chantierId: string;
  type: 'COMMENCEMENT' | 'ARRET' | 'REPRISE' | 'MODIFICATION' | 'NOTIFICATION';
  dateEmission: string;
  emetteur: 'MOA' | 'MOE' | 'NAFURA';
  objet: string;
  description: string;
  impactDelai?: number;          // jours (+/-)
  impactCout?: number;            // MAD (+/-)
  dateAccuseReception?: string;
  documentUrl?: string;
  status: 'EMIS' | 'RECEPTIONNE' | 'CONTESTE' | 'CLOS';
}
```

**Pages** :
- `/marches/os` listing
- `/marches/os/:id` fiche avec impact propagé (planning + budget)

**Acceptance criteria** :
- [ ] CRUD OS
- [ ] Impact délai → modifie planning (avec confirmation)
- [ ] PDF OS officiel CCAG-T MA
- [ ] OS d'arrêt déclenche pause Gantt

---

## Task 7.5 — Situations auto depuis avancements (M-MAR-05) **P1**

**Action** : sur fiche chantier, à la fin du mois, bouton « Générer situation mensuelle » qui :
1. Récupère avancements physiques saisis du mois
2. Multiplie par métré × prix unitaires DPGF
3. Calcule révision K (M-MAR-09)
4. Ajoute pénalités éventuelles (Round 1 6.6)
5. Calcule TVA et RG
6. Crée brouillon situation (l'utilisateur valide)

**Acceptance criteria** :
- [ ] Bouton « Générer situation N » sur fiche chantier
- [ ] Brouillon pré-rempli avec lignes par lot
- [ ] Édition possible avant validation
- [ ] Test unitaire `situation-generation.service.spec.ts`

---

## Task 7.6 — Avances de démarrage (M-MAR-06) **P1**

**Modèle** :

```ts
export interface AvanceDemarrage {
  id: string;
  marcheId: string;
  tauxPct: number;               // 10-30 %
  montantHT: number;
  montantTTC: number;
  cautionRestitutionId?: string; // caution requise
  dateVersement?: string;
  rythmeAmortissement: 'LINEAIRE_SUR_DUREE' | 'PRORATA_SITUATIONS';
  cumulAmorti: number;
  resteAAmortir: number;
}
```

**Règle MA** : avance de démarrage typique 10-30 % marché public, conditionnée par caution de restitution d'avance. Amortie sur les situations successives.

**Acceptance criteria** :
- [ ] Champ « Avance démarrage » sur création marché
- [ ] Caution restitution liée
- [ ] Amortissement automatique sur situations
- [ ] PDF demande versement avance

---

## Task 7.7 — Sous-traitance Art. 187 + paiement direct MOA (M-MAR-07) **P2**

Cf §03-achats M-ACH-08. Côté marché :
- Tableau sous-traitants déclarés + validation MOA
- Si paiement direct MOA configuré : extraction des montants ST de chaque situation, génération paiement séparé

---

## Task 7.8 — Réception provisoire + définitive (M-MAR-08) **P2**

**Modèle** :

```ts
export interface Reception {
  id: string;
  marcheId: string;
  type: 'PROVISOIRE' | 'DEFINITIVE';
  dateConvocation: string;
  dateRealisation?: string;
  participants: string[];
  reserves: ReserveReception[];
  pv?: string;                    // PDF
  status: 'PLANIFIEE' | 'REALISEE' | 'PRONONCEE_AVEC_RESERVES' | 'PRONONCEE' | 'REFUSEE';
}

export interface ReserveReception {
  description: string;
  zoneCode?: string;
  photoUrls: string[];
  delaiLevee: string;
  statusLevee: 'EN_COURS' | 'LEVEE' | 'EN_RETARD';
}
```

**Workflow** :
1. Convocation réception provisoire
2. Visite + liste réserves
3. Prononcé avec ou sans réserves
4. Levée réserves (photos « après »)
5. Délai garantie → réception définitive → libération RG

**Acceptance criteria** :
- [ ] CRUD réceptions + réserves
- [ ] PDF PV officiel
- [ ] Workflow levée réserves
- [ ] Réception définitive → trigger DGD auto

---

## Task 7.9 — Indices BTP01..xx auto (M-MAR-09) **P2**

Cf §16-integrations M-INT-06. Import CSV mensuel ANP/HCP → mise à jour table indices. Auto-déclenchement révision K mensuelle (si formule paramétrée sur marché).

---

## Task 7.10 — Litige / réclamation MOA (M-MAR-10) **P3**

Différer.

---

## Testing

```ts
describe('DGDService', () => {
  it('calcule DGD net = cumul - RG + reprises - pénalités + K', () => { /* … */ });
});

describe('SituationGenerationService', () => {
  it('génère brouillon situation depuis avancements', () => { /* … */ });
});

// e2e
test('Avenant signé propage impact budget + planning', async ({ page }) => { /* … */ });
```

## Dépendances inverses

- 02-chantiers (avancements alimentent situations auto)
- 03-achats (sous-traitance Art. 187)
- 08-finance (DGD → règlement, retenues source)
- 11-pilotage (cash-flow réagit à avances et DGD)
- 16-integrations (indices ANP/HCP)
