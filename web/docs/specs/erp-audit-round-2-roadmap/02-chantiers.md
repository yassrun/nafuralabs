# 02 — Chantiers (fiche détail, wizard, équipe, photos, plans, risques)

> **Sévérité** : P0 (M-CHA-01 + M-CHA-02 BLOQUE DÉMO)
> **Estimation** : 2 sprints (S1–S2)
> **Dépendances** : `01-foundations` Round 1 (`SEED_CHANTIERS`), `15-mobile` pour avancements

## Findings traités

- [ ] **M-CHA-01** Fiche détail chantier accessible et fonctionnelle **P0**
- [ ] **M-CHA-02** Wizard création chantier (+ Nouveau) **P0**
- [ ] **M-CHA-03** Onglets fiche chantier (10–12 onglets)
- [ ] **M-CHA-04** Équipe chantier (rôles + téléphones + photos + badges)
- [ ] **M-CHA-05** Carte interactive chantiers (Mapbox/Leaflet)
- [ ] **M-CHA-06** e-signature MOE/MOA sur carnets d'attachement
- [ ] **M-CHA-07** Photos chantier géolocalisées + avant/après
- [ ] **M-CHA-08** Plans BIM/DWG/PDF visionneuse intégrée
- [ ] **M-CHA-09** Registre des risques chantier
- [ ] **M-CHA-10** Exports MS-Project / Primavera / Excel + import
- [ ] **M-CHA-11** Avancements mobile (photo, offline, validation chef)
- [ ] **M-CHA-12** Métrés As-built vs prévisionnels
- [ ] **M-CHA-13** Météo automatique + déclenchement intempérie
- [ ] **M-CHA-14** Réceptions provisoire/définitive + PV + réserves
- [ ] **M-CHA-15** Budget drill engagements (BC, ST, paie) + fix bug `3.250 %`
- [ ] **M-CHA-16** Calendrier équipes (Outlook/Google sync)

## Goal

Faire du module **Chantiers** le **cœur démontrable** de l'ERP. Une fiche chantier qui agrège **toutes** les facettes (équipe, marché, planning, budget, achats liés, stock, matériel, RH, documents, journal, attachements, risques, photos, plans), drillable, avec un wizard de création en 5 étapes et une carte interactive du portefeuille.

## Context to read first

```
app/applications/erp/pages/chantiers/                                   # liste + détail
app/applications/erp/pages/chantiers/detail/chantier-detail.page.ts     # fiche existante (Round 1)
app/applications/erp/pages/chantiers/detail/chantier-detail-placeholder.page.ts  # ⚠️ placeholder à remplacer
app/applications/erp/chantiers/mock/chantiers-mock.service.ts           # mock service
app/applications/erp/chantiers/mock/seeds.ts                            # SEED_CHANTIERS canon
app/applications/erp/chantiers/chantiers.routes.ts                       # routing
app/applications/erp/pages/chantiers/planning/                          # Gantt
app/applications/erp/pages/chantiers/attachements/                      # carnets attachement
app/applications/erp/pages/chantiers/journal/                            # journal chantier
docs/specs/erp-audit-roadmap/02-chantiers-bugs.md                       # Round 1 référence
```

---

## Task 2.1 — Diagnostic + correctif fiche détail (M-CHA-01) **P0**

**Audit Round 2** : la fiche est marquée ✅ dans Round 1 mais le drill-down affiche toujours « Chantier introuvable ». **Régression à investiguer**.

**Hypothèses** :
1. `ChantiersMockService.getChantierById(id)` reçoit un id qui n'existe pas dans `SEED_CHANTIERS` (mélange `ch-00x` / `CH-2025-00x` / `CH-2026-XXX`)
2. Le router n'extrait pas correctement le paramètre `id` depuis URL (`/chantiers/:id` vs `/chantiers/chantier/:id`)
3. Le composant `ChantierDetailPage` est correctement routé mais l'observable est `undefined` au premier tick

**Action** :
1. `console.log` le `paramMap` à l'entrée + vérifier l'`id` envoyé vs ceux retournés par `getAll()`
2. Si mismatch → corriger soit le seed soit le navigation pour utiliser le format unifié `ch-00x` (cf `00-PROGRESS.md` 1.4 Round 1)
3. Ajouter un fallback gracieux si l'id n'existe pas (afficher une vraie 404 chantier avec lien retour, pas un message générique)

**Acceptance criteria** :
- [ ] `/chantiers/ch-001` ouvre la fiche du chantier `ch-001`
- [ ] `/chantiers/ch-999` (inexistant) affiche un état vide propre (`<nf-data-state variant="not-found">`) avec retour liste
- [ ] Drill-down depuis listing « Mes chantiers » ouvre la fiche correspondante
- [ ] Drill-down depuis Gantt (barre chantier) ouvre la fiche correspondante
- [ ] Test e2e Playwright qui itère sur les 6 chantiers du seed

---

## Task 2.2 — Wizard création chantier (M-CHA-02) **P0**

**Fichiers** :
- `app/applications/erp/pages/chantiers/create/chantier-create.page.ts` (nouveau)
- `app/applications/erp/pages/chantiers/create/steps/` (5 sous-composants)
- `app/applications/erp/chantiers/chantiers.routes.ts` (ajouter `/chantiers/new`)
- `app/applications/erp/pages/chantiers/list/chantier-listing.page.ts` (ajouter CTA `+ Nouveau chantier`)

**Étapes** :
1. **Identité** : nom, code (auto-généré `CH-2026-XXX`), description, statut
2. **Client & Marché** : client (autocomplete depuis référentiel), numéro marché, type marché (privé / public CCAG-T), MOA, MOE, BET
3. **Localisation & dates** : adresse, ville, région, géoloc (lat/lng), DAT (date début travaux prév.), durée mois, date fin prévi.
4. **Financier** : montant marché HT, TVA, montant TTC, retenue garantie %, retenue à la source 5 % (P/N marché public), avance démarrage %
5. **Équipe & cautions** : chef chantier, conducteur travaux, ingénieur, types cautions requises (soumission/bonne fin/restitution avance)

**Acceptance criteria** :
- [ ] CTA « + Nouveau chantier » présent sur `/chantiers` (et `/chantiers/mes-chantiers`)
- [ ] Wizard 5 étapes avec barre de progression + validation par étape
- [ ] Bouton « Précédent / Suivant / Brouillon / Créer »
- [ ] Création insère dans `SEED_CHANTIERS` (mock) + redirige vers fiche détail
- [ ] `erpAudit.log('CREATE', 'chantier', {…})`
- [ ] Test e2e Playwright : créer chantier complet → vérifier apparition dans listing + Gantt

---

## Task 2.3 — Onglets fiche chantier (M-CHA-03) **P1**

**Fichiers** :
- `app/applications/erp/pages/chantiers/detail/chantier-detail.page.html` (réorganiser)
- `app/applications/erp/pages/chantiers/detail/tabs/` (nouveaux composants par onglet)

**Onglets cibles** (12) :
1. **Vue d'ensemble** : KPI résumé + carte mini
2. **Marché** : contrat + avenants + cautions + retenues
3. **Planning** : Gantt vue chantier
4. **Budget** : drill-down engagements (BC, ST, paie affectée) — fix M-CHA-15
5. **Avancement** : tableau avancement par lot/phase + saisie
6. **Achats liés** : DA + AO + BC + factures fournisseurs
7. **Stock** : sorties stock + magasin chantier (cf §04)
8. **Matériel** : engins affectés + heures fonctionnement
9. **RH** : pointage + équipe
10. **Documents** : pieces jointes + plans (cf M-CHA-08)
11. **Journal & Attachements** : journal chantier + carnets attachement (cf M-CHA-06)
12. **Risques** : registre risques (cf M-CHA-09)

**Acceptance criteria** :
- [ ] 12 onglets accessibles, deep-link (`/chantiers/ch-001/budget`)
- [ ] Lazy-load par onglet pour éviter coût initial
- [ ] Onglet actif persisté en query param

---

## Task 2.4 — Équipe chantier (M-CHA-04) **P1**

**Modèle** :

```ts
export interface ChantierEquipe {
  chefChantierId: string;
  conducteurTravauxId: string;
  ingenieurId?: string;
  betId?: string;             // Bureau d'Études Technique
  moeId?: string;             // Maître d'Œuvre
  moaId?: string;             // Maître d'Ouvrage
  membres: MembreEquipe[];
}

export interface MembreEquipe {
  employeId: string;
  role: string;
  telephone?: string;
  photoUrl?: string;
  badgeCode?: string;
  dateAffectation: string;
  dateRetrait?: string;
}
```

**Acceptance criteria** :
- [ ] Onglet « Équipe » affiche cartes employés avec photo + tel + rôle
- [ ] Liens cliquables : téléphone (`tel:`), email, drill-down employé
- [ ] Bouton « Affecter membre » avec autocomplete employés disponibles

---

## Task 2.5 — Carte interactive (M-CHA-05) **P1**

**Fichiers** :
- `app/applications/erp/pages/chantiers/map/chantiers-map.page.ts` (nouveau)
- Librairie : `leaflet` (libre + tile OpenStreetMap par défaut, option Mapbox token)

**Action** : route `/chantiers/carte` avec pins par chantier coloré selon statut (vert/jaune/rouge). Popup au survol avec mini-fiche.

**Acceptance criteria** :
- [ ] Carte centrée sur le Maroc, zoom adapté au portefeuille
- [ ] Clic sur pin → drill-down fiche chantier
- [ ] Filtre par statut / ville / société dans toolbar

---

## Task 2.6 — e-signature MOE/MOA sur attachements (M-CHA-06) **P1**

**Fichiers** :
- `app/applications/erp/pages/chantiers/attachements/sign/attachement-sign.page.ts` (nouveau)
- `app/applications/erp/pages/chantiers/attachements/services/e-signature.service.ts` (mock + interface)

**Workflow** :
1. Conducteur travaux remplit l'attachement et le « soumet à signature »
2. Système génère un **lien d'invitation tokenisé** envoyé par mail/WhatsApp au MOE puis MOA
3. MOE/MOA ouvre le lien, voit l'attachement read-only + canvas signature
4. Signature → hash SHA-256 + timestamp + IP loggée, statut passe à « Signé »
5. PDF généré avec signatures embarquées

**Acceptance criteria** :
- [ ] Bouton « Soumettre à signature » sur attachement
- [ ] Page publique tokenisée `/sign/:token` accessible sans login
- [ ] Canvas signature + bouton « Signer »
- [ ] Statut workflow `BROUILLON → SOUMIS → SIGNE_MOE → SIGNE_MOA → CLOS`
- [ ] PDF final avec hash + horodatage

---

## Task 2.7 — Photos géolocalisées + avant/après (M-CHA-07) **P1**

**Fichiers** :
- `app/applications/erp/pages/chantiers/photos/photos.page.ts` (nouveau)
- `app/applications/erp/pages/chantiers/photos/photo-gallery.component.ts`

**Modèle** :

```ts
export interface PhotoChantier {
  id: string;
  chantierId: string;
  zoneCode?: string;          // « ZONE-A », « LOT-GO »
  url: string;
  thumbnailUrl: string;
  dateCapture: string;
  capturePar: string;
  latitude?: number;
  longitude?: number;
  exifIso?: number;
  legende?: string;
  tags: string[];
  comparaisonPaireId?: string; // pour avant/après
}
```

**Acceptance criteria** :
- [ ] Galerie groupée par jour/zone
- [ ] Modal lightbox avec EXIF affiché
- [ ] Mode comparaison avant/après (slider 2 photos côte à côte)
- [ ] Upload depuis mobile (cf M-MOB-04) avec géotag automatique

---

## Task 2.8 — Plans BIM/DWG/PDF visionneuse (M-CHA-08) **P1**

**Librairies** :
- PDF : `pdf.js`
- DWG : `dwg-viewer` ou conversion serveur en PDF (recommandé pour démo)
- BIM IFC : différer S11 (P2)

**Fichiers** :
- `app/applications/erp/pages/chantiers/plans/plans-viewer.component.ts` (nouveau)

**Acceptance criteria** :
- [ ] Onglet « Documents » filtrable par type (Plan / Procès-verbal / Contrat / Photo)
- [ ] Clic sur un plan → ouverture viewer
- [ ] Versioning : `/plans/:planId/v3` accessible
- [ ] Annotations basiques (texte + flèche + carré) avec save

---

## Task 2.9 — Registre des risques (M-CHA-09) **P1**

**Modèle** :

```ts
export interface RisqueChantier {
  id: string;
  chantierId: string;
  description: string;
  categorie: 'SECURITE' | 'PLANNING' | 'BUDGET' | 'TECHNIQUE' | 'ENVIRONNEMENT' | 'CONTRACTUEL';
  probabilite: 1 | 2 | 3 | 4 | 5;
  gravite: 1 | 2 | 3 | 4 | 5;
  criticite: number;          // calcul auto = probabilite × gravite
  proprietaireId: string;
  planAction: string;
  delaiCloture?: string;
  status: 'OUVERT' | 'EN_TRAITEMENT' | 'CLOS' | 'TRANSFERE';
}
```

**Acceptance criteria** :
- [ ] CRUD complet
- [ ] Matrice de criticité 5×5 (heatmap) avec drill-down
- [ ] Export PDF registre conforme ISO 9001/45001 (cf M-HSE-12)

---

## Task 2.10 — Exports planning MS-Project / Primavera (M-CHA-10) **P1**

**Formats** :
- MS-Project : XML (`.xml` standard ProjectExchange)
- Primavera : XER ou XML
- Excel : XLSX hiérarchique

**Fichiers** :
- `app/applications/erp/pages/chantiers/planning/export/planning-export.service.ts` (nouveau)
- Librairies : `xlsx`, `xml2js`

**Acceptance criteria** :
- [ ] Bouton « Export MS-Project XML » sur Gantt
- [ ] Bouton « Export Primavera XML » sur Gantt
- [ ] Import inverse (MS-Project XML) avec mapping lots/phases

---

## Task 2.11 — Avancements mobile + offline (M-CHA-11) **P1**

Cf §15-mobile (M-MOB-01..06). Page mobile dédiée `/m/chantiers/:id/avancement` :
- saisie progress par lot/phase avec curseur
- photo + commentaire
- géoloc
- offline IndexedDB (Round 1 = pattern photo pointage à réutiliser)
- validation chef chantier → push vers situation

**Acceptance criteria** :
- [ ] Page mobile responsive ≤640px
- [ ] Saisie offline 5 avancements puis sync
- [ ] Validation chef → ligne situation pré-remplie

---

## Task 2.12 — Métrés As-built (M-CHA-12) **P2**

Onglet « Avancement » montre 2 colonnes : Métré prévisionnel | Métré réel saisi. Écart calculé automatiquement. Export PDF récap pour MOA.

---

## Task 2.13 — Météo automatique (M-CHA-13) **P2**

**API** : `open-meteo.com` (gratuit, pas de clé) ou DMN si dispo (M-INT-14).

**Action** :
1. À l'ouverture du Journal ou Attachement chantier du jour J, récupérer météo de la lat/lng du chantier
2. Pré-remplir température, précipitations, vent
3. Si précipitations > seuil contractuel → flag « Intempérie » qui peut impacter délai (lien M-MAR-04 OS)

**Acceptance criteria** :
- [ ] Champ météo auto-rempli sur journal du jour
- [ ] Bouton « Déclencher intempérie » génère un brouillon OS

---

## Task 2.14 — Réceptions provisoire / définitive (M-CHA-14) **P2**

Cf M-MAR-08 (workflow PV → levée réserves → libération RG).

---

## Task 2.15 — Budget drill engagements + fix bug `3.250 %` (M-CHA-15) **P2**

**Bug** : marges chantier affichent `3.250 %` (vraisemblablement multiplication par 100 dupliquée).

**Action** :
1. Localiser le calcul (`marges-chantier.page.ts` ?)
2. Fixer le calcul `marge = (CA - cost) / CA` (résultat 0..1) × 100 **une seule fois** pour affichage
3. Ajouter test unitaire sur le service

**Drill-down** : clic sur ligne budget → ouverture panel listant tous les BC, contrats ST, paie affectée à cette rubrique.

**Acceptance criteria** :
- [ ] Marge affichée raisonnable (-20 % … +40 % réaliste)
- [ ] Drill-down depuis ligne budget vers engagements
- [ ] Test unitaire `marges-chantier.service.spec.ts`

---

## Task 2.16 — Calendrier équipes Outlook/Google (M-CHA-16) **P3**

Différer. iCalendar feed `/api/calendar/:chantierId.ics` minimaliste.

---

## Testing

```ts
// e2e/specs/chantiers/detail-flow.spec.ts
test('Fiche détail accessible et complète pour les 6 chantiers du seed', async ({ page }) => {
  const codes = ['ch-001', 'ch-002', 'ch-003', 'ch-004', 'ch-005', 'ch-006'];
  for (const code of codes) {
    await page.goto(`/chantiers/${code}`);
    await expect(page.locator('h1, h2').first()).toContainText(/Résidence|Pont|Tour|Lot/i);
    // 12 onglets
    await expect(page.locator('[role=tab]')).toHaveCount(12);
  }
});

test('Wizard création chantier complet', async ({ page }) => {
  await page.goto('/chantiers');
  await page.click('text=+ Nouveau chantier');
  // … remplir 5 étapes
  await expect(page).toHaveURL(/\/chantiers\/CH-\d{4}-\d{3}/);
});
```

## Dépendances inverses

- 03-achats (drill « Achats liés »)
- 04-stock (drill « Stock chantier »)
- 05-materiel (drill « Matériel affecté »)
- 09-rh (drill « Pointage »)
- 10-hse (drill « Risques + incidents »)
- 15-mobile (M-MOB-01 photos, M-MOB-03 géoloc)
