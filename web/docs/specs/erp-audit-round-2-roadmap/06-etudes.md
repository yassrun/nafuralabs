# 06 — Études & Soumissions (DPU, DPGF, mémoire technique, BPU)

> **Sévérité** : P0 sur M-ETU-01 + M-ETU-02
> **Estimation** : 1.5 sprint (S5–S6 partiel)
> **Dépendances** : Round 1 (bibliothèque prix + métrés basiques), `02-chantiers` (génération chantier depuis devis gagné)

## Findings traités

- [x] **M-ETU-01** DPU — Décomposition Prix Unitaire (matière × MO × matériel × FG × marge) **P0** (mock + UI biblio ; versioning snapshots)
- [x] **M-ETU-02** Métré → DPGF → Devis auto **P0** (mock + pages `metres/:id/dpgf`, `devis/from-dpgf/:id` ; PDF = impression navigateur)
- [ ] **M-ETU-03** Soumission AO client (assistant complet)
- [ ] **M-ETU-04** Courbe en S prévisionnelle
- [ ] **M-ETU-05** Bibliothèque prix avancée (versioning, BTP01/BTP18)
- [ ] **M-ETU-06** Mémoire technique auto-généré
- [ ] **M-ETU-07** Variantes de chiffrage côte à côte
- [ ] **M-ETU-08** Import BPU client (Excel/CSV)
- [ ] **M-ETU-09** Bibliothèque qualifs & références
- [ ] **M-ETU-10** Bordereaux officiels MA (MTE/AFRA)
- [ ] **M-ETU-11** Comparatif AO reçus
- [ ] **M-ETU-12** IA mémoire technique (P3)

## Goal

Faire du module **Études** un vrai **chiffrage sérieux** avec déboursé sec (matière + MO + matériel + frais généraux), pivoter du métré au DPGF puis au devis, importer les BPU clients, générer mémoire technique et courbe en S.

## Context to read first

```
app/applications/erp/pages/etudes/                            # Round 1 basique
app/applications/erp/pages/etudes/bibliotheque-prix/
app/applications/erp/pages/etudes/metres/
app/applications/erp/pages/etudes/devis/
app/applications/erp/pages/etudes/aoc/                         # AO clients
```

---

## Task 6.1 — DPU — Déboursé sec (M-ETU-01) **P0**

**Modèle** :

```ts
export interface PrixDPU {
  articleId: string;
  unite: string;                // m³, ml, m²

  // Composantes déboursé sec
  composants: ComposantDPU[];

  // Calculs
  deboursSec: number;            // Σ composants
  fraisGeneraux: number;          // % paramétrable (10-20 %)
  margeBeneficiaire: number;     // % paramétrable (8-15 %)
  prixVenteHT: number;
  prixVenteTTC: number;
}

export interface ComposantDPU {
  type: 'MATIERE' | 'MAIN_DOEUVRE' | 'MATERIEL' | 'SOUS_TRAITANCE';
  articleOuPosteId: string;
  quantite: number;
  unite: string;
  prixUnitaire: number;          // depuis biblio fournisseur ou taux MO
  total: number;                 // calcul auto
}
```

**Action** :
1. Sur `/etudes/bibliotheque-prix/:articleId`, onglet « DPU » avec éditeur composants
2. Calcul auto Frais Généraux + Marge → Prix Vente
3. Sliders FG % et Marge % avec impact temps réel
4. Bouton « Mettre à jour prix vente biblio »

**Acceptance criteria** :
- [ ] Éditeur ligne par ligne (ajout/suppression/duplication)
- [ ] Calcul auto déboursé sec → prix vente
- [ ] Versioning DPU (historique des modifs)
- [ ] Test unitaire `dpu.service.spec.ts`

---

## Task 6.2 — Métré → DPGF → Devis auto (M-ETU-02) **P0**

**Modèle** :

```ts
export interface DPGF {
  id: string;
  numero: string;                // DPGF-2026-001
  devisId: string;
  metreId?: string;
  hierarchie: NoeudDPGF[];        // arbre lots > sous-lots > articles
  totalHT: number;
  tva: number;
  totalTTC: number;
}

export interface NoeudDPGF {
  id: string;
  type: 'LOT' | 'SOUS_LOT' | 'ARTICLE';
  code: string;                   // « 01.01.005 »
  libelle: string;
  enfants?: NoeudDPGF[];
  // Pour articles :
  articleId?: string;
  quantite?: number;
  unite?: string;
  prixUnitaire?: number;
  total?: number;                 // qte × prix
}
```

**Workflow** :
1. Créer Métré (saisie ou import) → arbre lots/sous-lots/articles avec quantités
2. Générer DPGF auto → prix unitaires depuis biblio (DPU)
3. Générer Devis auto depuis DPGF → édition finale

**Pages** :
- `/etudes/metres/:id/dpgf` : passage du métré au DPGF
- `/etudes/devis/from-dpgf/:dpgfId` : génération devis

**Acceptance criteria** :
- [ ] Arbre 3 niveaux navigable (TreeView)
- [ ] Génération DPGF depuis Métré en 1 clic
- [ ] Génération Devis depuis DPGF en 1 clic
- [ ] PDF DPGF avec sommaire conforme CCAG-T MA

---

## Task 6.3 — Soumission AO client (M-ETU-03) **P1**

**Assistant** : étapes pour préparer une soumission complète :
1. Métré (depuis cahier des charges ou import BPU client)
2. Bordereau prix (depuis biblio)
3. Mémoire technique (M-ETU-06)
4. Planning prévisionnel (lien avec module Chantiers planning)
5. Cautions soumission/bonne fin
6. Dossier qualification (M-ETU-09)
7. Dossier final (PDF + ZIP)

Page `/etudes/aoc/:id/soumission-wizard`.

---

## Task 6.4 — Courbe en S prévisionnelle (M-ETU-04) **P1**

Depuis DPGF + planning prévisionnel → courbe S cumulée du CA prévu. Comparaison avec réalisé pendant exécution chantier.

Graphique `chart.js` avec deux courbes : prévisionnel (S parfait) vs réalisé (avancements).

---

## Task 6.5 — Bibliothèque prix avancée (M-ETU-05) **P1**

Compléter `/etudes/bibliotheque-prix` :
- Import Excel/CSV avec mapping colonnes
- Export Excel
- Versioning (snapshots) avec restauration
- Marge cible globale (slider 0..30 %)
- Indexation prix sur indices BTP01 / BTP18 / MO (lien §07-marches révision K)

---

## Task 6.6 — Mémoire technique auto (M-ETU-06) **P1**

**Concept** : éditeur WYSIWYG (`tinymce` ou `quill`) avec :
- Bibliothèque de paragraphes réutilisables (présentation entreprise, méthodologie, organisation chantier, HSE, qualité)
- Variables auto (raison sociale, chantiers récents, certifications, CV équipe)
- Génération PDF officiel

Page `/etudes/aoc/:id/memoire-technique`.

**Acceptance criteria** :
- [ ] Bibliothèque 20+ paragraphes types BTP MA seedés
- [ ] Drag & drop paragraphes
- [ ] PDF généré conforme exigences MOA publics

---

## Task 6.7 — Variantes de chiffrage (M-ETU-07) **P1**

Pour un devis, créer N variantes (option béton armé vs précontraint, hauteur 4 vs 5 étages). Comparatif côté à côte avec deltas (montant, marge, durée).

---

## Task 6.8 — Import BPU client (M-ETU-08) **P1**

Page `/etudes/import-bpu` :
- Upload Excel/CSV
- Wizard mapping colonnes (article / désignation / unité / quantité)
- Génération métré pré-rempli
- Saisie prix unitaires côté entreprise → réponse

---

## Task 6.9 — Bibliothèque qualifs (M-ETU-09) **P2**

Référentiel qualifications BTP MA :
- Qualif & Classif (1ère cat. / 2ème cat. / etc.)
- Certifications ISO 9001 / 14001 / 45001
- Habilitations RGE équivalent MA
- Références chantiers récents (fiches PDF auto)

---

## Task 6.10 — Bordereaux officiels MA (M-ETU-10) **P2**

Import bordereaux MTE (Ministère Travaux) / AFRA / Provinces. Référentiel des prix officiels par activité × région × année.

---

## Task 6.11 — Comparatif AO reçus (M-ETU-11) **P2**

Si AO public publié, importer les résultats publics (lauréat, montants concurrents) → analyse concurrents par chantier.

---

## Task 6.12 — IA mémoire technique (M-ETU-12) **P3**

Différer. Appel LLM avec contexte fiches références + cahier des charges → première version mémoire.

---

## Testing

```ts
// unit
describe('DPUService', () => {
  it('calcule prix vente = déboursé × (1+FG) × (1+marge)', () => { /* … */ });
});

describe('DPGFService', () => {
  it('agrège totaux par lot puis total général', () => { /* … */ });
});

// e2e
test('Métré → DPGF → Devis auto', async ({ page }) => { /* … */ });
```

## Dépendances inverses

- 02-chantiers (devis gagné → wizard création chantier — M-CHA-02 préremplit depuis devis)
- 07-marches (BPU client = base contrat)
- 11-pilotage (courbe S réalisé vs prévi)
