# Prompts agents — **un prompt par fichier de tâche** (Task 01–17)

> **Usage** : copier-coller le prompt correspondant à la tâche dans une nouvelle session agent.
> **Source de vérité** : `web/docs/specs/erp-audit-round-2-roadmap/00-PROGRESS.md`.
> **Audit d'origine** : `web/docs/specs/ROUNDéAUDIT/AUDIT_round_2`.

---

## Règles communes (préfixe à coller en tête de **chaque** prompt si besoin)

```text
Règles projet :
- Workspace : `web/` (Angular ERP BTP Maroc).
- Lire AVANT de coder : `web/docs/specs/erp-audit-roadmap/00-PROGRESS.md` (Round 1, ~68% implémenté) pour identifier ce qui existe déjà → enrichir, pas réécrire.
- Après chaque tâche : `ng build` sans erreur + tests ciblés + `npm run lint:no-dollar`.
- Mettre à jour `web/docs/specs/erp-audit-round-2-roadmap/00-PROGRESS.md` (statut + colonne évidence + date + agent).
- Conventions :
  - Devise : `| mad` pipe (jamais `| currency`).
  - Codes chantiers : seed `ch-00x` / label `CH-2025-00x` (cf SEED_CHANTIERS Round 1).
  - i18n : aucun string FR/EN inline ; toutes les clés via `TranslateService`.
  - Multi-tenant : filtrer mocks par `currentSocieteId` quand applicable.
- Ne pas casser les ✅ Round 1.
```

---

## Task 01 — Dashboard (M-DASH-01..08)

### Prompt copier-coller

```text
Tu es l'agent en charge de la TASK 01 — Dashboard.

Spec : `web/docs/specs/erp-audit-round-2-roadmap/01-dashboard.md`.
Findings : M-DASH-01..08.
Sprint cible : S2 (drill) + S11 (reste).

Goal : transformer le dashboard (8 tuiles statiques actuelles) en poste de pilotage drillable, filtrable, personnalisable par rôle.

Livrables P0/P1 dans l'ordre :
1. M-DASH-03 — Drill-down KPI. Rendre les 8 tuiles cliquables avec route + queryParams (ex. « Factures en retard 6 » → `/finance/regles-paiement?filter=overdue`). Hover state + curseur pointer. Test e2e clic sur chaque tuile.
2. M-DASH-02 — Graphes & tendances : courbe CA cumul N vs N-1, sparklines marges top 10, top 5 chantiers en alerte (budget>90%, retard>15j, RG immobilisée), pyramide Bird HSE. Lib `chart.js` / `ng2-charts` Angular. Responsive ≥320px.
3. M-DASH-01 — Personnalisation drag & drop avec `@angular/cdk/drag-drop`. 3 layouts par défaut (DG / Conducteur travaux / Comptable). Persistance localStorage. Bouton « Réinitialiser layout ».

Backlog P2/P3 (S11+) :
4. M-DASH-04 — Alertes temps réel : panel ouvrable depuis dashboard avec règles (engagement>90%, situations>60j, cautions<30j, retard pointage>48h). Compteur badge avec sévérité.
5. M-DASH-05 — Filtres dashboard : société, chantier, période, MOA, métier. Impact temps réel + persistance localStorage.
6. M-DASH-06 — Export PDF dashboard du jour. Réutiliser pipeline PDF Round 1 (`pdf-server-demo.md`).
7. M-DASH-07 — Widgets HSE/RH enrichis.
8. M-DASH-08 — Mode TV plein écran (optionnel).

Fichiers à toucher :
- `app/applications/erp/pages/dashboard/dashboard.page.{ts,html}`
- `app/applications/erp/pages/dashboard/widgets/` (créer kpi-tile, ca-cumul-chart, sparkline, top-alertes, alerts-panel)
- `app/applications/erp/pages/dashboard/dashboard-layout.service.ts` (nouveau)

Tests : e2e Playwright drill chaque KPI + unitaire service layout.

Mettre à jour `00-PROGRESS.md` (section 01-dashboard).
```

---

## Task 02 — Chantiers (M-CHA-01..16)

### Prompt copier-coller

```text
Tu es l'agent en charge de la TASK 02 — Chantiers.

Spec : `web/docs/specs/erp-audit-round-2-roadmap/02-chantiers.md`.
Findings : M-CHA-01..16.
Sprint cible : S1–S2 (P0) + S7–S10 (P1).

Goal : cœur démontrable de l'ERP. Fiche chantier réparée (régression Round 2) + wizard création + 12 onglets + équipe + carte interactive + e-signature + photos géolocalisées + plans BIM/DWG + risques + exports planning + avancements mobile.

Priorité absolue (S1–S2) — bloquant démo :
1. M-CHA-01 — DIAGNOSTIQUER pourquoi `/chantiers/:id` retourne « Chantier introuvable » alors que Round 1 marquait ✅. Hypothèses : mismatch ID seed (`ch-00x` vs `CH-2025-XXX`), routing param mal lu, `getChantierById` undefined. Fix + fallback gracieux (`<nf-data-state variant="not-found">`) + test e2e Playwright itérant sur les 6 chantiers de SEED_CHANTIERS.

2. M-CHA-02 — Wizard création chantier 5 étapes :
   - Identité (nom, code auto `CH-2026-XXX`, description, statut)
   - Client & Marché (client autocomplete, numéro marché, type CCAG-T, MOA/MOE/BET)
   - Localisation & dates (adresse, lat/lng, DAT, durée mois)
   - Financier (montant HT, TVA, RG %, RAS 5%, avance %)
   - Équipe & cautions (chef, conducteur, ingénieur, cautions requises)
   Route `/chantiers/new`, CTA « + Nouveau chantier » sur listing. Insertion dans `SEED_CHANTIERS` (mock) + redirection fiche détail + `erpAudit.log('CREATE', 'chantier', ...)`. Test e2e.

Livrables P1 (S7–S10) :
3. M-CHA-03 — 12 onglets fiche chantier (Vue d'ensemble / Marché / Planning / Budget / Avancement / Achats liés / Stock / Matériel / RH / Documents / Journal+Attachements / Risques). Deep-link `/chantiers/ch-001/budget`. Lazy-load par onglet.
4. M-CHA-04 — Équipe chantier : modèle `ChantierEquipe` + `MembreEquipe`. Cartes employés (photo + tel + rôle + badge). Liens `tel:`, email, drill employé.
5. M-CHA-05 — Carte interactive Leaflet (OpenStreetMap tiles). Route `/chantiers/carte`. Pins colorés par statut. Filtre statut/ville/société.
6. M-CHA-06 — e-signature MOE/MOA attachements. Workflow tokenisé `/sign/:token` (sans login). Canvas signature + hash SHA-256 + horodatage + IP. Statuts BROUILLON → SOUMIS → SIGNE_MOE → SIGNE_MOA → CLOS. PDF avec signatures embarquées.
7. M-CHA-07 — Photos géolocalisées : modèle `PhotoChantier` (lat/lng/EXIF/zone). Galerie groupée jour/zone. Modal lightbox. Mode avant/après slider. Upload mobile (coord Task 15).
8. M-CHA-08 — Plans BIM/DWG/PDF visionneuse `pdf.js`. Versioning `/plans/:planId/v3`. Annotations basiques.
9. M-CHA-09 — Registre risques : modèle `RisqueChantier` (criticité = probabilité × gravité). Matrice 5×5 heatmap. Export PDF conforme ISO.
10. M-CHA-10 — Exports planning MS-Project XML, Primavera XML, Excel hiérarchique. Import inverse.
11. M-CHA-11 — Avancements mobile + offline (coord Task 15). Page `/m/chantiers/:id/avancement`. Saisie progress par lot/phase + photo + commentaire + géoloc. Validation chef → ligne situation.

Backlog P2/P3 (S11+) :
12. M-CHA-12 — Métrés As-built vs prévisionnels (écarts par lot)
13. M-CHA-13 — Météo automatique open-meteo + déclenchement intempérie
14. M-CHA-14 — Réceptions provisoire/définitive (coord Task 07 M-MAR-08)
15. M-CHA-15 — Fix bug marges `3.250 %` (localiser calcul, fixer formule × 100 dupliquée) + drill-down ligne budget → engagements (BC, ST, paie). Test unitaire `marges-chantier.service.spec.ts`.
16. M-CHA-16 — Calendrier équipes Outlook/Google (iCal feed).

Fichiers à toucher :
- `app/applications/erp/pages/chantiers/detail/chantier-detail.page.ts` (fix + 12 onglets)
- `app/applications/erp/pages/chantiers/create/` (nouveau wizard)
- `app/applications/erp/pages/chantiers/map/` (nouveau)
- `app/applications/erp/pages/chantiers/photos/` (nouveau)
- `app/applications/erp/pages/chantiers/plans/` (nouveau)
- `app/applications/erp/pages/chantiers/risques/` (nouveau)
- `app/applications/erp/chantiers/chantiers.routes.ts`

Tests : e2e Playwright itération 6 chantiers + wizard complet + drill-down Gantt préservé.

Coordination : Task 12 (workflow approbation transversal) + Task 14 (drill universel) + Task 15 (mobile photo/géoloc/signature).

Mettre à jour `00-PROGRESS.md` (section 02-chantiers).
```

---

## Task 03 — Achats & Sous-traitance (M-ACH-01..12)

### Prompt copier-coller

```text
Tu es l'agent en charge de la TASK 03 — Achats & Sous-traitance.

Spec : `web/docs/specs/erp-audit-round-2-roadmap/03-achats.md`.
Findings : M-ACH-01..12.
Sprint cible : S5–S6 (P0) + S7–S10 (P1).

Goal : rendre le cycle Achats traçable bout-en-bout (DA→AO→BC→Réception→Facture) avec 3-way matching, attestations légales auto-vérifiées (Art. 60 LF 2024), scoring fournisseurs, portail fournisseur.

Priorité absolue (S5–S6) :
1. M-ACH-01 — 3-way matching BC ↔ BL ↔ Facture. Modèle `MatchingReception` + `MatchingLigne`. Page BC onglet « Réceptions », page Réceptions colonne « BC d'origine », page Facture onglet « Matching ». Seuils tolérance configurables (±2% prix, ±5% qté). Statut `ECART_BLOQUE` bloque validation facture. Test unitaire `matching.service.spec.ts`.

2. M-ACH-02 — Scoring AO. Modèle `ScoringAO` avec composantes (prix /50, délai /15, qualité /15, historique /10, art187 /10). Page `/achats/ao/:id/comparatif` avec matrice fournisseurs × critères + recommandation IA. Bouton « Attribuer » → BC depuis offre retenue. Override manuel loggé `erpAudit`.

Livrables P1 (S7–S10) :
3. M-ACH-03 — Fournisseur 360° : onglets Identité / KPIs (CA YTD, OTIF %, délai moyen, taux litige) / Catalogue / Attestations / Historique / Notes. Alerte « attestations expirées » top de fiche.

4. M-ACH-04 — Workflow DA→AO→BC→Réception→Facture. Card « Origine » sur chaque écran avec liens cliquables. Audit trail intégré.

5. M-ACH-05 — Catalogue articles fournisseurs : modèle `CatalogueFournisseur` (prix négocié, délai, contrat cadre). Import Excel/CSV. À la création BC, prix pré-rempli depuis catalogue.

6. M-ACH-06 — Portail fournisseur. Sous-domaine `portail.fournisseurs.nafura.ma` (mock route `/portail-fournisseur`). Login séparé. Pages : Mes AO, Mes BC, Dépôt attestations, Dépôt factures, Suivi paiements.

7. M-ACH-07 — Attestations légales auto. Modèle `AttestationFournisseur` (8 types : CNSS, FISCALE, AMO, RC, IF, ICE, PATENTE, RIB). Dashboard fournisseur 8 chips colorées (vert/orange/rouge). Blocage règlement si fiscale + CNSS expirées (configurable). Job quotidien mock recalcule statuts.

8. M-ACH-08 — Sous-traitance Art. 187 CGI. Étendre `ContratSousTraitance` : `art187Declare`, `art187ValideMoa`, `retenueGarantieTaux`, `paiementDirectMOA`. PDF contrat type avec clauses Art. 187. RG calculée sur chaque situation ST + cumul.

9. M-ACH-09 — BC catalogue/contrat cadre rapide. Page `/achats/bc/rapide`. Skip workflow AO si < seuil. Approbation 1 étape simplifiée. Création < 30 secondes.

Backlog P2/P3 (S11+) :
10. M-ACH-10 — Cadre normatif marchés publics (BPU/PUF/PGF/régie/OS d'arrêt/reprise/modification).
11. M-ACH-11 — Tableau de bord achats (économies vs marché, dépendance >25%, top litige).
12. M-ACH-12 — IA suggestion articles.

Fichiers à toucher :
- `app/applications/erp/pages/achats/` (étendre)
- `app/applications/erp/pages/inventory/mouvements/receptions/` (lien BC)
- `app/applications/erp/pages/finance/factures-fournisseurs/` (onglet matching)
- `app/applications/erp/achats/services/` (matching, scoring, attestations)

Coordination : Task 07 (M-MAR-07 sous-traitance MOA), Task 08 (matching → facture), Task 13 (référentiel fournisseurs + RBAC), Task 17 (Art. 187, attestations MA).

Tests : unitaire matching/scoring + e2e 3-way matching bloque facture avec écart.

Mettre à jour `00-PROGRESS.md` (section 03-achats).
```

---

## Task 04 — Stock & Logistique (M-STK-01..12)

### Prompt copier-coller

```text
Tu es l'agent en charge de la TASK 04 — Stock & Logistique.

Spec : `web/docs/specs/erp-audit-round-2-roadmap/04-stock.md`.
Findings : M-STK-01..12.
Sprint cible : S7.

Goal : faire monter le module Stock (Round 1 = 16 sous-routes, le plus complet de l'ERP) au niveau d'un WMS BTP : scanner mobile, réservation chantier, magasin chantier digital relié au budget, lots+emplacements, péremption, réappro auto.

NE PAS casser Round 1 (`SEED_CHANTIERS`, `valorisation.facade.ts`, `costing-methods`, `Article.posteBudgetId` V2).

Livrables P1 :
1. M-STK-01 — Scanner mobile QR/code-barres (coord Task 15). Lib `@zxing/ngx-scanner`. Route `/m/inventory/scan/:context` (RECEPTION/SORTIE/INVENTAIRE). Beep + vibration. Mode offline.

2. M-STK-02 — Réservation stock chantier. Modèle `ReservationStock` (article + qté + chantier + dateBesoin + dateExpiration). Disponible = Stock - Réservations actives. Auto-libération à expiration. Sortie consomme réservations FIFO.

3. M-STK-03 — Magasin chantier digital. Concept : 1 dépôt typé CHANTIER par chantier. Entrée par transfert BC, sortie par bon de matières signé chef (coord Task 15 signature), inventaire hebdo. Page `/inventory/magasin-chantier/:chantierId` avec valorisation. Liaison budget chantier.

4. M-STK-04 — Étendre liaison sortie ↔ budget (Round 1 V2 démarré). `BudgetFacade.realisesMatieresParPoste(chantierId)`. Onglet Budget chantier nouvelle colonne « Réalisé matière ». Drill ligne budget → sorties stock du poste. KPI dashboard « Top 3 chantiers sur-consommation ».

5. M-STK-05 — Étiquetage QR par lot/emplacement. Bouton « Imprimer étiquettes » sur article + réception. PDF 50×30 mm multi-étiquettes. Format QR `nafura://article/<id>?lot=<lot>&emp=<emp>`.

6. M-STK-06 — Multi-emplacements par dépôt. Modèle `Emplacement` (code « A-12-03 » allée-rack-niveau). `Article.emplacementsPossibles`, `emplacementParDefaut`. Sortie/réception demande emplacement.

7. M-STK-07 — Date péremption / lot. Modèle `LotStock`. `Article.isPerissable` → lot obligatoire à réception. Sortie FEFO (First Expired First Out). Alerte J-30 + bloquant J-7 (config).

Backlog P2/P3 (S11+) :
8. M-STK-08 — Demande transfert workflow chantier A → magasin → transporteur → chantier B.
9. M-STK-09 — Vérifier CMP/FIFO sur méthode `costing-methods`. UI affiche méthode par article.
10. M-STK-10 — ABC analysis Pareto 80/20.
11. M-STK-11 — Suggestion réappro auto → DA brouillon.
12. M-STK-12 — Carte dépôts + tournée optimale.

Fichiers à toucher :
- `app/applications/erp/pages/inventory/` (étendre)
- `app/applications/erp/inventory/services/` (étendre `inventory-tx.facade.ts`, `stock-budget-sync.service.ts`)
- `app/applications/erp/pages/inventory/magasin-chantier/` (nouveau)
- `app/applications/erp/pages/inventory/reservations/` (nouveau)

Coordination : Task 02 (onglet Stock fiche chantier), Task 03 (réappro → DA), Task 15 (scanner mobile, bon matières signé).

Tests : e2e magasin chantier sortie impacte budget réalisé ; unitaire `stock-budget-sync.service.spec.ts` étendu.

Mettre à jour `00-PROGRESS.md` (section 04-stock).
```

---

## Task 05 — Matériel & Équipements (M-MAT-01..11)

### Prompt copier-coller

```text
Tu es l'agent en charge de la TASK 05 — Matériel & Équipements.

Spec : `web/docs/specs/erp-audit-round-2-roadmap/05-materiel.md`.
Findings : M-MAT-01..11.
Sprint cible : S3–S4 (P0) + S7 (P1).

Goal : implémenter une vraie GMAO BTP. Round 1 = Parc + Affectations OK, mais Maintenance et Carburant redirigent vers `/parc` (modules absents) et Locations = stub.

Priorité absolue (S3–S4) — modules absents :
1. M-MAT-01 — Maintenance GMAO. Modèles `PlanMaintenance` (déclencheur HEURES/KILOMETRES/CALENDAIRE + seuil + alerte) + `OrdreTravail` (PREVENTIF/CORRECTIF/AMELIORATION + pièces + MO + coûts auto). Pages : `/materiel/maintenance/plans`, `/ot`, `/historique/:engineId`. Alerte « 3 entretiens à programmer cette semaine ».

2. M-MAT-02 — Carburant & Consommables. Modèles `CarnetCarburant` (1 par engin) + `PleinCarburant` (jauge début/fin, anomalie si `litres > capacité - jaugeDebut + tolérance`). Pages : `/materiel/carburant/carnets`, `/pleins`, `/consommations`. Coût analytique chantier si `chantierId` rempli. Saisie mobile < 30s.

Livrables P1 (S7) :
3. M-MAT-03 — Fiche engin 360° (onglets : identité, technique, affectations, maintenance, carburant, contrôles, conducteurs habilités, documents).

4. M-MAT-04 — Locations externes vraies. Modèles `ContratLocation` + `EtatContradictoire` (entrée/sortie avec heures, km, carburant, photos, signatures). Pages contrats / états / échéances. Alerte retour J-7. PDF état contradictoire.

5. M-MAT-05 — Planning matériel Gantt par engin × chantiers. Détection conflits (2 affectations même période → tooltip rouge). Drag-resize.

6. M-MAT-06 — Pointage matériel chantier. Modèle `PointageEngin` (heures fonctionnement quotidien × chantier). Saisie mobile chef chantier en fin de journée. Cumul → coût horaire engin × heures dans budget. Croisement carnet carburant (anomalies si heures déclarées << conso).

7. M-MAT-07 — Contrôles réglementaires. Modèle `ControleReglementaire` (VGP, CT, étalonnage, assurance, carte grise). Règle bloquante : si VGP expiré → bloquer affectation chantier (configurable). Alerte J-30.

Backlog P2/P3 :
8. M-MAT-08 — GPS / télémétrie (Fleetio/Geotab/SQUOR API mock).
9. M-MAT-09 — Habilitations CACES (croisé Task 09 RH M-RH-05).
10. M-MAT-10 — TCO par engin (achat + amort + maintenance + carburant + utilisation).
11. M-MAT-11 — Maintenance prédictive IA.

Fichiers à créer :
- `app/applications/erp/pages/materiel/maintenance/` (plans, ot, historique)
- `app/applications/erp/pages/materiel/carburant/` (carnets, pleins, consommations)
- `app/applications/erp/pages/materiel/fiche-360/`
- `app/applications/erp/pages/materiel/locations/` (étendre stub)
- `app/applications/erp/pages/materiel/planning/`
- `app/applications/erp/pages/materiel/pointage/`
- `app/applications/erp/pages/materiel/controles/`

Coordination : Task 02 (onglet Matériel fiche chantier), Task 09 (CACES), Task 14 (drill universel).

Tests : unitaire `MaintenanceService` calcul prochain seuil + blocage affectation VGP expiré.

Mettre à jour `00-PROGRESS.md` (section 05-materiel).
```

---

## Task 06 — Études & Soumissions (M-ETU-01..12)

### Prompt copier-coller

```text
Tu es l'agent en charge de la TASK 06 — Études & Soumissions.

Spec : `web/docs/specs/erp-audit-round-2-roadmap/06-etudes.md`.
Findings : M-ETU-01..12.
Sprint cible : S5–S6 (P0) + S7–S10 (P1).

Goal : faire des Études un vrai chiffrage sérieux avec déboursé sec, pivoter du métré au DPGF puis au devis, importer BPU clients, générer mémoire technique et courbe en S.

Priorité absolue (S5–S6) :
1. M-ETU-01 — DPU (Décomposition Prix Unitaire). Modèle `PrixDPU` avec composantes `ComposantDPU` (MATIERE/MAIN_DOEUVRE/MATERIEL/SOUS_TRAITANCE × qté × prixUnitaire). Calcul auto déboursé sec + frais généraux % + marge % → prix vente HT. Éditeur ligne par ligne sur `/etudes/bibliotheque-prix/:articleId` onglet DPU. Sliders FG % et marge % temps réel. Versioning DPU. Test unitaire.

2. M-ETU-02 — Métré → DPGF → Devis auto. Modèle `DPGF` avec hiérarchie `NoeudDPGF` (LOT > SOUS_LOT > ARTICLE, 3 niveaux). Pages `/etudes/metres/:id/dpgf` et `/etudes/devis/from-dpgf/:dpgfId`. Génération 1-clic depuis métré (prix unitaires depuis biblio DPU). PDF DPGF avec sommaire conforme CCAG-T MA.

Livrables P1 (S7–S10) :
3. M-ETU-03 — Soumission AO client assistant complet (cahier des charges → métré → bordereau → mémoire → planning → cautions → qualifs). Page `/etudes/aoc/:id/soumission-wizard`.

4. M-ETU-04 — Courbe en S prévisionnelle depuis DPGF + planning + cash plan. Chart.js avec courbe prévi vs réalisé.

5. M-ETU-05 — Bibliothèque prix avancée : import Excel/CSV (mapping colonnes), export, versioning + restauration, marge cible globale slider, indexation BTP01/BTP18/MO.

6. M-ETU-06 — Mémoire technique auto. Éditeur WYSIWYG (`tinymce` ou `quill`). Bibliothèque 20+ paragraphes types BTP MA seedés (présentation, méthodo, organisation, HSE, qualité). Variables auto (raison sociale, références, CV équipe). PDF officiel MOA publics.

7. M-ETU-07 — Variantes de chiffrage (N variantes par devis, comparatif côte à côte avec deltas).

8. M-ETU-08 — Import BPU client (Excel/CSV) → wizard mapping → génération métré pré-rempli → saisie prix entreprise.

Backlog P2/P3 :
9. M-ETU-09 — Bibliothèque qualifs MA (Qualibat équivalent, ISO 9001/14001/45001, RGE).
10. M-ETU-10 — Bordereaux officiels MA (MTE, AFRA, Provinces).
11. M-ETU-11 — Comparatif AO reçus (miroir Achats côté Études).
12. M-ETU-12 — IA mémoire technique (LLM).

Fichiers à toucher :
- `app/applications/erp/pages/etudes/bibliotheque-prix/` (onglet DPU)
- `app/applications/erp/pages/etudes/metres/` (DPGF generation)
- `app/applications/erp/pages/etudes/devis/` (génération depuis DPGF)
- `app/applications/erp/pages/etudes/aoc/` (soumission wizard)
- `app/applications/erp/etudes/services/` (DPUService, DPGFService)

Coordination : Task 02 (devis gagné → wizard création chantier), Task 07 (BPU = base contrat), Task 11 (courbe S réalisé vs prévi).

Tests : unitaire DPUService calcul prix vente + DPGFService agrégation totaux.

Mettre à jour `00-PROGRESS.md` (section 06-etudes).
```

---

## Task 07 — Marchés BTP (M-MAR-01..10)

### Prompt copier-coller

```text
Tu es l'agent en charge de la TASK 07 — Marchés BTP.

Spec : `web/docs/specs/erp-audit-round-2-roadmap/07-marches.md`.
Findings : M-MAR-01..10 + Task 7.0 fusion sidebar.
Sprint cible : S5–S6 partiel + S7–S10.

Goal : Round 1 = très bon socle (Contrats/Avenants/Situations/Cautions/K/Pénalités à ~94%). Compléter avec DGD auto, OS, situations auto, avances démarrage, sous-traitance Art. 187, et fusionner sidebar duplicate.

Préalable P0 :
0. Task 7.0 — Fusion sidebar « Marchés BTP » + « Marchés & Facturation » → 1 seule entrée « Marchés & Facturation ». Routes existantes redirigées si renommées.

Livrables P1 (S7–S10) :
1. M-MAR-01 — Avenants workflow propagation impact. Étendre Round 1 6.2 : à la signature avenant, bouton « Propager impact » qui met à jour budget chantier, planning, cautions, échéancier. Confirmation user avec récap. Audit log.

2. M-MAR-02 — DGD (Décompte Général Définitif) auto. Modèle `DGD` (cumulSituations + cumulRG + cumulK + cumulPénalités + reprisesRG → netAPayer). Workflow BROUILLON → SOUMIS_MOA → NOTIFIE → PAYE. Génération sur réception définitive. PDF officiel CCAG-T. Test unitaire calcul DGD.

3. M-MAR-03 — Caution alerte expiration + workflow. Alertes J-30 / J-7. Workflow renouvellement banque + mainlevée après DGD. Dossier électronique. Dashboard cautions 3 colonnes (Active/À renouveler/Mainlevée). PDF demande renouvellement.

4. M-MAR-04 — OS (Ordre de Service). Modèle `OrdreService` (types : COMMENCEMENT/ARRET/REPRISE/MODIFICATION/NOTIFICATION). Impact délai propagé sur planning (avec confirmation). PDF officiel. OS d'arrêt déclenche pause Gantt.

5. M-MAR-05 — Situations auto depuis avancements physiques. Bouton « Générer situation N » sur fiche chantier → brouillon préremplie depuis avancements + métré + K + pénalités + TVA + RG. Édition possible avant validation. Test unitaire `situation-generation.service.spec.ts`.

6. M-MAR-06 — Avances de démarrage 10-30 % marchés publics. Modèle `AvanceDemarrage` avec caution restitution liée + amortissement automatique sur situations (LINEAIRE_SUR_DUREE ou PRORATA_SITUATIONS). PDF demande versement.

Backlog P2/P3 :
7. M-MAR-07 — Sous-traitance déclarative Art. 187 côté MOA + paiement direct (coord Task 03).
8. M-MAR-08 — Réception provisoire + levée réserves + définitive. Modèle `Reception` + `ReserveReception`. Photos avant/après. Trigger DGD auto à réception définitive.
9. M-MAR-09 — Indices BTP01..xx auto via ANP/HCP CSV (coord Task 16 M-INT-06).
10. M-MAR-10 — Litige / réclamation MOA (P3).

Fichiers à toucher :
- `app/applications/erp/pages/marches/` (étendre)
- `app/applications/erp/pages/marches/dgd/` (nouveau)
- `app/applications/erp/pages/marches/os/` (nouveau)
- `app/applications/erp/pages/marches/reception/` (nouveau)
- `app/applications/erp/marches/services/` (DGDService, OSService, SituationGenerationService)
- `app/applications/erp/shell/erp-nav.generated.ts` (fusion sidebar)

Coordination : Task 02 (avancements alimentent situations), Task 03 (Art. 187), Task 08 (DGD → règlement, RAS), Task 11 (cash-flow réagit), Task 16 (indices ANP).

Tests : unitaire DGDService + SituationGenerationService + e2e avenant signé propage impact.

Mettre à jour `00-PROGRESS.md` (section 07-marches).
```

---

## Task 08 — Finance & Trésorerie (M-FIN-01..14)

### Prompt copier-coller

```text
Tu es l'agent en charge de la TASK 08 — Finance & Trésorerie.

Spec : `web/docs/specs/erp-audit-round-2-roadmap/08-finance.md`.
Findings : M-FIN-01..14.
Sprint cible : S7–S8.

Goal : Round 1 = 15 sous-routes Finance très complet. Compléter avec lettrage, recouvrement, effets commerce, multi-banques, rapprochement OFX, e-facture DGI, RAS 5%, caisses chantier, analytique multi-axes, clôture, liasse.

Livrables P1 (S7–S8) :
1. M-FIN-01 — Lettrage facture ↔ règlement. Modèle `Lettrage` + `LigneLettrage`. Page `/finance/lettrage` UI pivot (compte 411/401 → écritures non lettrées → checkboxes → calcul auto débit/crédit/diff). Lettrage auto si paire évidente. Partiel (acompte). Délettrage. Export CSV. Test unitaire.

2. M-FIN-02 — Recouvrement / relances. Modèle `SuiviRecouvrement` (joursRetard auto, niveauRelance 0..4 = ok/J+15/J+30/J+45/mise en demeure). Modèle `ModeleRelance` (canal EMAIL/SMS/COURRIER/WHATSAPP). Page `/finance/recouvrement`. Job mock quotidien recalcule + génère brouillons. PDF mise en demeure MA.

3. M-FIN-03 — Effets de commerce LCR/LCN. Modèle `EffetCommerce`. Pages portefeuille / remise encaissement / escompte / impayés. Bordereau remise multi-effets PDF. Suivi impayés.

4. M-FIN-04 — Multi-banques XML virements. Formats SEPA + AWB + BMCE + CIH + BP + autres. Page `/finance/virements/remise` génère XML batch selon banque sélectionnée. Test unitaire par format.

5. M-FIN-05 — Rapprochement OFX/CSV. Étendre `/finance/rapprochement`. Import OFX (banques int.) ou CSV (banques MA). Matching auto par montant + libellé + date. UI pivot relevé ↔ écritures. Génération frais bancaires/agios en 1 clic.

6. M-FIN-06 — e-facture DGI (2026-2027 obligatoire CA>50M MAD). Modèle FactureVente étendu : hashEfacture, qrCodeData, signatureCertId, archiveElectroniqueUrl. Calcul hash + QR + signature à validation facture. Archive PDF 10 ans. Transmission API DGI (mock + coord Task 16 M-INT-05).

7. M-FIN-07 — RAS 5 % marchés publics (coord Task 17 M-MA-02). Calcul auto sur facture vente si marché public. Comptabilisation 4453. Déclaration trimestrielle.

8. M-FIN-08 — Régime auto-entrepreneur fournisseurs. Flag `Fournisseur.regimeAutoEntrepreneur` qui force autoliquidation TVA + RAS spécifique.

9. M-FIN-09 — Caisses chantier. Modèles `CaisseChantier` + `MouvementCaisseChantier` (AVANCE_RECUE/DEPENSE/JUSTIFICATIF/RETOUR). Mobile-first (coord Task 15) : ticket photo + montant + chantier + géoloc. Validation conducteur travaux. Refacturation analytique chantier.

Backlog P2/P3 :
10. M-FIN-10 — Analytique multi-axes (chantier × lot × phase × catégorie × société). TCD + export pivot.
11. M-FIN-11 — Budget trésorerie glissant 12 mois par chantier et consolidé.
12. M-FIN-12 — Clôture périodique (mensuelle/annuelle) + report à nouveau.
13. M-FIN-13 — Liasse fiscale (Bilan, CPC, ESG, Tableau financement) format DGI CGNC.
14. M-FIN-14 — Open Banking AWB/CIH OpenAPI.

Fichiers à toucher :
- `app/applications/erp/pages/finance/lettrage/` (nouveau)
- `app/applications/erp/pages/finance/recouvrement/` (nouveau)
- `app/applications/erp/pages/finance/effets/` (nouveau)
- `app/applications/erp/pages/finance/virements/remise/` (nouveau)
- `app/applications/erp/pages/finance/rapprochement/` (étendre)
- `app/applications/erp/pages/finance/caisses-chantier/` (nouveau)
- `app/applications/erp/finance/services/` (LettrageService, RecouvrementService, EfactureService)

Coordination : Task 07 (DGD → règlement), Task 03 (matching → facture), Task 16 (XML banques, e-facture DGI API), Task 17 (RAS 5%, timbre, TVA).

Tests : unitaire LettrageService + RecouvrementService + EfactureService (QR conforme DGI).

Mettre à jour `00-PROGRESS.md` (section 08-finance).
```

---

## Task 09 — Ressources Humaines (M-RH-01..14)

### Prompt copier-coller

```text
Tu es l'agent en charge de la TASK 09 — Ressources Humaines.

Spec : `web/docs/specs/erp-audit-round-2-roadmap/09-rh.md`.
Findings : M-RH-01..14.
Sprint cible : S7–S8.

Goal : Round 1 = Paie/IGR/DAMANCOM solides. Compléter avec pointage mobile robuste (différenciateur fort), contrats auto, heures supp MA, frais déplacement, carrière, sécurité paie, paie intérim, congés, AT CNSS DAT, maladies.

Priorité absolue (S7–S8) :
1. M-RH-01 — Durcir pointage mobile chantier (coord Task 15 PWA). Round 1 13.1 = photo IndexedDB démo. Étendre :
   - Multi-pointage équipe : 1 chef pointe 10 ouvriers en 1 min (multi-sélection + photo groupe + signature unique)
   - Géofencing : refus pointage si > rayon chantier (200m configurable)
   - Mode offline 7 jours sans crash
   - Sync robuste vraie API (pas seulement mock localStorage)
   - Signature canvas par employé (option) ou collective chef
   - Test e2e mobile emulation (iPhone 14, Pixel 7)

Livrables P1 :
2. M-RH-02 — Contrats auto. Modèle `ContratEmploye` (CDI/CDD/CDD_CHANTIER/INTERIM/ANAPEC). 5 templates PDF avec champs MA (CNSS, AMO, IF). Signature canvas + horodatage. Archivage 5 ans (compliance MA).

3. M-RH-03 — Heures supplémentaires barèmes MA. Modèle `HeureSupplementaire`. Règles : HS25 (>44h/sem ou >8h/jour) +25%, HS50 (nuit 21h-6h ou dimanche) +50%, HS100 (jour férié) +100%. Saisie pointage chef → validation hiérarchique → intégration paie auto. Test unitaire `paie-engine.service.spec.ts` cas HS.

4. M-RH-04 — Frais de déplacement. Modèle `FraisDeplacement` (INDEMNITE_KM/PANIER_REPAS/HEBERGEMENT). Workflow soumission → validation → paie ou remboursement. Refacturation analytique chantier.

5. M-RH-05 — Carrière. Modèles `EntretienAnnuel` + `Habilitation` (CACES_R482/486/489/490, SST, BE/BR/HE/HF, travail en hauteur). Page `/rh/employes/:id/carriere`. Alerte J-30 expiration habilitation. Blocage affectation (coord Task 05 M-MAT-09).

6. M-RH-06 — Sécurité paie. RBAC route `/rh/paie/*` aux rôles RH+DAF+DG (coord Task 13). Signature DRH fiche paie. Archivage 5 ans. Watermark filigrane si pré-signée.

7. M-RH-07 — Paie intérim. Pages commandes / heures / factures. Workflow commande agence → saisie heures → réception facture → refact analytique chantier.

8. M-RH-08 — Congés. Modèles `CongeSolde` + `DemandeConge`. Compteur acquis 1,5j/mois (18j/an min MA). Workflow demande → approbation hiérarchique → impact planning équipe. Calcul jours ouvrés (excl. we + fériés). Test unitaire.

9. M-RH-09 — Accidents du travail CNSS DAT (coord Task 10 HSE + Task 16 M-INT-03). Quand incident type AT → bouton « Déclarer CNSS DAT » → PDF officiel + alerte 48h. Suivi IJSS.

10. M-RH-10 — Maladies & arrêts. Modèle similaire congé maladie. Suivi IJSS CNSS + contre-visite. Impact paie (déduction jours).

Backlog P2/P3 :
11. M-RH-11 — Self-service employé `/portail-employe` (fiche paie download, demandes, attestations, habilitations).
12. M-RH-12 — Formation TFP 1,6% OFPPT (budget, conventions, remboursements).
13. M-RH-13 — Médecine du travail (coord Round 1 9.4, étendre blocage INAPTE).
14. M-RH-14 — Engagement / pulse surveys (P3).

Fichiers à toucher :
- `app/applications/erp/pages/rh/pointage/` (durcir, multi-pointage équipe)
- `app/applications/erp/pages/rh/contrats/` (nouveau)
- `app/applications/erp/pages/rh/heures-sup/` (nouveau)
- `app/applications/erp/pages/rh/frais-deplacement/` (nouveau)
- `app/applications/erp/pages/rh/carriere/` (nouveau)
- `app/applications/erp/pages/rh/conges/` (étendre)
- `app/applications/erp/pages/rh/interim/` (nouveau)
- `app/applications/erp/rh/services/paie-engine.service.ts` (étendre HS, CIMR)

Coordination : Task 10 (AT), Task 15 (pointage mobile), Task 16 (CNSS DAMANCOM + DAT API), Task 17 (CIMR cadres).

Tests : `paie-engine.service.spec.ts` étendu (HS25/50/100, CIMR), `conges.service.spec.ts` compteur + jours ouvrés.

Mettre à jour `00-PROGRESS.md` (section 09-rh).
```

---

## Task 10 — Qualité & HSE (M-HSE-01..14)

### Prompt copier-coller

```text
Tu es l'agent en charge de la TASK 10 — Qualité & HSE.

Spec : `web/docs/specs/erp-audit-round-2-roadmap/10-hse.md`.
Findings : M-HSE-01..14 + Task 10.0 activer route.
Sprint cible : S3–S4.

Goal : ACTIVER le module HSE. Round 1 a posé modèles + stubs mais audit Round 2 constate route `/qualite` → 404 au runtime. Bloque MOA publics + grands MOA privés (OCP, ONEE, ADM, Holdings).

Préalable P0 :
0. Task 10.0 — DIAGNOSTIQUER pourquoi `/qualite` retourne 404. Hypothèses : sidebar pointe `/qualite` mais routing déclaré sur `/hse` (alias absent), `HSE_ROUTES` non importé dans `app.routes.ts`, lazy loading échoue silencieusement. Fix + alias `/qualite` ↔ `/hse` + test e2e.

Livrables P0 (S3–S4) :
1. M-HSE-01 — Registre incidents/accidents. Étendre Round 1 (modèle Incident défini). Compléter : UI listing avec filtres (chantier/type/gravité/statut). Fiche détail workflow OUVERT → INVESTIGATION → CLOS. Si type AT* ou MP → bouton « Déclarer CNSS DAT » (coord Task 16 M-INT-03) + alerte 48h + PDF officiel. Photos + témoins + plan d'action.

2. M-HSE-02 — Non-conformités + CAPA. Étendre Round 1 (modèle NonConformite défini). Workflow CAPA avec responsable, échéance, vérification efficacité. Création NC depuis Inspection ou Audit. Drill chantier + zone.

3. M-HSE-03 — PPSPS par chantier. Modèle `PPSPS` + `PPSPSSection` (conforme art. R4532-65 équivalent MA). 8 sections types (administratif, ouvrage, prévention, organisation, technique, DUER, secours, coactivité). Éditeur sections markdown. PDF officiel. Versioning.

4. M-HSE-04 — PHS générique société. Document chapeau société (politique HSE globale, avant PPSPS chantier). Modèle similaire PPSPS niveau société.

Livrables P1 (S7–S10) :
5. M-HSE-05 — Causerie 1/4 h sécurité. Modèle `Causerie` (sujet, animateur, présents, points clés, signatures). Mobile-first chef chantier matin (coord Task 15). Bibliothèque 20+ sujets seedés. Export PDF registre mensuel par chantier.

6. M-HSE-06 — Audits HSE checklists. Modèles `AuditHSE` + `AuditTemplate` (rubriques/items OUI_NON/NOTE_5/TEXTE). 3 templates seedés (mensuel chantier, EPI, environnement). Saisie mobile-first. Création auto NC si réponse « non » critique.

7. M-HSE-07 — EPI dotation + renouvellement. Étendre Round 1 9.2 (volets démarrés). Attribution employé + alerte J-30 + sortie auto stock à l'attribution.

8. M-HSE-08 — Risques chimiques FDS. Modèle `FDSProduit` (pictogrammes GHS, utilisations autorisées, formation requise). Référentiel produits dangereux.

9. M-HSE-09 — Plans évacuation + exercices + alarmes (registre).

10. M-HSE-10 — KPIs HSE. Calculs : TF1 (AT avec arrêt × 1M / heures), TF2 (tous AT × 1M / h), TG (jours arrêt × 1000 / h), Ratio dépenses HSE/CA, Jours sans accident. Page `/hse/tableau-bord` étendue Round 1 9.6. Graphiques évolution 12 mois + pyramide Bird.

11. M-HSE-11 — Déclarations CNSS DAT + CNAOPS (coord Task 16 M-INT-03).

Backlog P2 :
12. M-HSE-12 — Audits ISO 9001/14001/45001 checklists configurables.
13. M-HSE-13 — Risques environnementaux chantier (eau, déchets, bruit, poussière).
14. M-HSE-14 — PV levée réserves QHSE (audits MOA).

Fichiers à toucher :
- `app/applications/erp/hse/hse.routes.ts` (vérifier + alias /qualite)
- `app/applications/erp/pages/hse/` (étendre incidents, NC, PPSPS, PHS, causerie, audits, EPI, FDS, evac, KPIs)
- `app/applications/erp/hse/services/` (IncidentService, HseKpiService)

Coordination : Task 09 (AT lien employé), Task 02 (PPSPS par chantier + risques chantier), Task 05 (CACES bloquant via Task 09), Task 11 (KPI HSE), Task 16 (CNSS DAT API).

Tests : unitaire `IncidentService` (CNSS DAT + alerte 48h) + `HseKpiService` (TF1 formule). E2e `/qualite` ne retourne plus 404.

Mettre à jour `00-PROGRESS.md` (section 10-hse).
```

---

## Task 11 — Pilotage & Analyses (M-PIL-01..09)

### Prompt copier-coller

```text
Tu es l'agent en charge de la TASK 11 — Pilotage & Analyses.

Spec : `web/docs/specs/erp-audit-round-2-roadmap/11-pilotage.md`.
Findings : M-PIL-01..09.
Sprint cible : S4 (P0) + S11 (reste).

Goal : faire passer Pilotage & Analyses de stubs vides (« Avancement moyen 0% », « Budget total 0 MAD ») à un vrai poste de pilotage avec marges multi-axes, cash-flow dynamique (vs projection linéaire bugée), what-if simulator.

Priorité absolue (S4) :
1. M-PIL-01 — Brancher données réelles sur 5 vues Pilotage & Analyses. Pour CHAQUE vue :
   - **Rentabilité** : marge brute YTD, marge nette YTD, top/flop 5 chantiers. Source : `PilotageChantierMargesService` Round 1.
   - **Financier** : CA YTD, CA encaissé, créances ouvertes, dettes, BFR, ratio liquidité. Source : `FinanceComptabiliteMockService` + `JournauxService`.
   - **Stock** : valeur stock totale, rotation, valeur stock chantier vs central, top 10 articles consommés. Source : `InventoryMockService` + `valorisation.facade.ts`.
   - **Achats** : volume YTD, nb BC, top fournisseurs, économies, dépendance. Source : `AchatsMockService`.
   - **RH** : effectif, masse salariale YTD, absentéisme, rotation, pyramide âges, HS YTD. Source : `EmployesMockService` + `PaieEngineService`.
   Aucune KPI à 0 si données existent. Drill-down depuis chaque KPI. Test e2e itère 5 vues + assert KPI > 0.

Livrables P1 (S7–S10) :
2. M-PIL-02 — Marges multi-axes. Étendre `PilotageChantierMargesService` avec 5 axes (chantier/BU/client/MOA/typeMarché). TCD avec filtre/pivot/export Excel.

3. M-PIL-03 — OPEX vs CAPEX par mois et chantier. Classement écritures + page dédiée.

4. M-PIL-04 — Reporting groupe multi-société. Page `/pilotage-analyses/groupe`. KPIs consolidés + vue par société + élimination intercos.

5. M-PIL-05 — Cash-flow dynamique. FIX projection linéaire bugée Round 2 (`+658.148 MAD × 10 mois` constant). Remplacer par calcul réel depuis :
   - Encaissements = situations N+1/N+2 (J+60 ouvré moyen)
   - Décaissements = factures fournisseur + salaires + charges sociales + traites
   Drill par mois. Test unitaire `cash-flow-projection.service.spec.ts` étendu.

6. M-PIL-06 — What-if simulator. Page `/pilotage-analyses/what-if`. Sliders : « Retard chantier X de Y jours », « OS impact Z », « Hausse acier 10% », « Perte chantier ». Comparatif scénario actuel vs simulé.

Backlog P2/P3 :
7. M-PIL-07 — Exports CAC/DAF (FEC, balance N-1, mapping IFRS/CGNC).
8. M-PIL-08 — Benchmark sectoriel anonymisé.
9. M-PIL-09 — Alertes IA proactives.

Fichiers à toucher :
- `app/applications/erp/pages/pilotage-analyses/rentabilite/` (étendre)
- `app/applications/erp/pages/pilotage-analyses/financier/`
- `app/applications/erp/pages/pilotage-analyses/stock/`
- `app/applications/erp/pages/pilotage-analyses/achats/`
- `app/applications/erp/pages/pilotage-analyses/rh/`
- `app/applications/erp/pages/pilotage-analyses/what-if/` (nouveau)
- `app/applications/erp/pilotage/services/cash-flow-projection.service.ts` (étendre)

Coordination : Task 01 (drill KPI utilisateur dashboard), Task 13 (multi-société), Task 08 (analytique → OPEX/CAPEX).

Tests : e2e « aucune KPI à 0 sur 5 vues » + unitaire `CashFlowProjectionService` dynamique.

Mettre à jour `00-PROGRESS.md` (section 11-pilotage).
```

---

## Task 12 — Approbations (M-APR-01..08)

### Prompt copier-coller

```text
Tu es l'agent en charge de la TASK 12 — Approbations.

Spec : `web/docs/specs/erp-audit-round-2-roadmap/12-approbations.md`.
Findings : M-APR-01..08.
Sprint cible : S2.

Goal : construire un engine workflow générique capable de gérer les approbations de tous types d'entités (DA, AO, BC, FF, SIT, CONGE, PAIE, VIR, AVN, OS) avec configuration matricielle, délégation, notifications + escalade SLA, et inbox approbateur productif.

Round 1 = barre soumission + inbox démo, mais pas de configurateur matriciel ni délégation/escalade.

Priorité absolue (S2) :
1. M-APR-01 — Engine workflow générique. Modèles :
   - `ApprovalWorkflow` (entité × conditions × étapes série/parallèle × SLA × escalade)
   - `ApprovalCondition` (champ/opérateur/valeur, ex. montant >= 500000)
   - `EtapeWorkflow` (ordre, série/parallèle, approbateurs, quorum%)
   - `ApprovateurConfig` (type ROLE/PERSONNE/MANAGER/DELEGATION)
   - `ApprovalRequest` (workflow + entité + état + étapeActuelle + historique)
   - `ApprovalEvent` (action SOUMIS/APPROUVE/REJETE/DEMANDE_COMPLEMENT/DELEGUE/COMMENTE/ESCALADE + hash chaîné SHA-256 pour M-APR-08).
   Service `ApprovalEngineService` testé unitairement. 5 workflows seedés (BC standard, BC>500K, Congés, Paie, Virement).

2. M-APR-02 — Approbations multi-types. Brancher `<app-submit-approval-button>` Round 1 sur 10 types : DA, AO attribution, BC, FF (facture fournisseur), SIT (situation), CONGE, PAIE, VIR (virement bancaire), AVN (avenant), OS (ordre service). Workflow auto-sélectionné selon entité + conditions. Test e2e par type.

3. M-APR-03 — Inbox approbateur enrichie. Étendre Round 1 `/approbations` :
   - Vue cards résumé entité + montant + initiateur + ancienneté
   - Actions : Approuver / Rejeter / **Demander complément** / Commenter / Déléguer
   - Filtre par type / société / urgence
   - Tri par SLA (le plus en retard en haut)
   - Audit log immuable hash SHA-256 chaîné

Livrables P1 (S7–S10) :
4. M-APR-04 — Délégation absence. Modèle `DelegationApprobation`. Page `/admin/delegations` (user lui-même). Si délégation active, engine route vers délégué.

5. M-APR-05 — Notifications multi-canal + escalade. In-app + Email (mock SMTP démo) + Push (coord Task 15 M-MOB-07) + WhatsApp (coord Task 16 M-INT-09). Si étape non traitée après `escaladeApresJ` → notif N+1.

6. M-APR-06 — Matrice pouvoirs. Page `/admin/approvals/matrice`. Tableau croisé type entité × seuils → rôles. Ex BC <50K → Directeur travaux, 50-500K → DG, >500K → Comité. Config par société/division/chantier.

7. M-APR-07 — Approbation mobile 1-clic. Email/notif avec token JWT → page mobile `/m/approuver/:token` (sans login si token <24h) avec boutons Approuver/Rejeter.

Backlog P2 :
8. M-APR-08 — Audit trail hash chaîné. Étendre `ApprovalEvent.hash` = SHA-256(previousHash + eventData). Vérification intégrité (changement N invalide hashes suivants). Export PDF avec preuve intégrité.

Fichiers à toucher :
- `app/applications/erp/approbations/services/approval-engine.service.ts` (nouveau)
- `app/applications/erp/approbations/models/` (étendre)
- `app/applications/erp/pages/approbations/` (étendre inbox)
- `app/applications/erp/pages/administration/approbations/matrice/` (nouveau)
- `app/applications/erp/pages/administration/delegations/` (nouveau)

NE PAS dupliquer `approval-rules.service.ts` Round 1 7.2.

Coordination : TOUTES les Tasks (entités approuvables) : 03/06/07/08/09. Task 13 (rôles + sociétés). Task 14 M-TRA-03 (alias transversal). Task 15 M-MOB-07 (push). Task 16 M-INT-09 (WhatsApp).

Tests : unitaire `ApprovalEngineService` (sélection workflow, avancement étape, escalade, délégation) + e2e workflow BC 1M passe 3 étapes série.

Mettre à jour `00-PROGRESS.md` (section 12-approbations).
```

---

## Task 13 — Administration (M-ADM-01..16)

### Prompt copier-coller

```text
Tu es l'agent en charge de la TASK 13 — Administration.

Spec : `web/docs/specs/erp-audit-round-2-roadmap/13-admin.md`.
Findings : M-ADM-01..16 + Task 13.0 activer route.
Sprint cible : S3–S4.

Goal : ACTIVER le module Administration. Route `/admin` retourne 404 au runtime → bloque vente B2B. Construire le back-office complet : RBAC, SSO+2FA, multi-tenant, paramètres société, référentiels, audit log, templates, numérotation, fiscal, mappings, abonnements, backup.

Préalable P0 :
0. Task 13.0 — Activer route `/admin`. Créer hub `/admin` qui liste toutes les sous-sections. Vérifier routing top-level + alias. Test e2e `/admin` ≠ 404.

Livrables P0 (S3–S4) :
1. M-ADM-01 — Utilisateurs & Rôles RBAC granulaire. Modèles `User`, `Role`, `Permission` (module × action × scope SOCIETE/DIVISION/CHANTIER/SOI), `UserRole`. Pages `/admin/utilisateurs` et `/admin/roles`. Guard `RbacGuard` sur routes sensibles. Directive `*hasPermission`. Seeds 8 rôles BTP : DG, DAF, RAF, Conducteur travaux, Chef chantier, Acheteur, RH, HSE. Test e2e user sans permission Finance ne voit pas sidebar.

2. M-ADM-02 — SSO + 2FA. OIDC générique. Connecteurs Microsoft Entra ID + Google Workspace. Boutons « Se connecter avec MS/Google » sur login. 2FA TOTP (Authenticator) + SMS. Forçage 2FA rôles sensibles. Conserver Round 1 8.7 démo.

3. M-ADM-03 — Sociétés multi-tenant. Étendre Round 1 `SocieteService`. Page `/admin/societes` CRUD. Page `/admin/etablissements`. Vue arbre groupe → filiales → établissements. **Filtrer TOUS les mocks par `currentSocieteId`** (backlog Round 1 ouvert). Audit log trace société courante. Test : switch société → données changent.

4. M-ADM-04 — Paramètres société complets. Étendre `Societe` : raisonSociale, formeJuridique, ICE 15 chiffres + clé, IF 8, RC (n° + ville), Patente, CNSS, CNAEM, capitalSocial, RIBs multi-banques (24 + clé), logoUrl, adresseSiege, adressesEtablissements, exercicesComptables. Multi-RIB. Logo upload + PDF. Validation formats.

5. M-ADM-05 — Référentiels manquants : `/admin/referentiels/clients`, `/admin/referentiels/moa`, `/admin/referentiels/banques` (fournisseurs/articles/employés déjà OK Round 1).

Livrables P1 (S7–S10) :
6. M-ADM-06 — Audit log UI. Étendre Round 1 `erpAudit`. Page `/admin/audit-log` avec filtres user/module/action/date/société/entité. Export CSV/PDF.

7. M-ADM-07 — Templates documents WYSIWYG. Page `/admin/templates-docs` avec éditeur (`tinymce`/`quill`) + variables `{{societe.raisonSociale}}` + preview PDF temps réel. Templates par type doc.

8. M-ADM-08 — Numérotation séquentielle. Étendre `NumberingService` Round 1. Page `/admin/numerotation`. Modèle `{type}-{annee}-{seq:5}` configurable par type doc × société. Reset annuel.

9. M-ADM-09 — Paramètres fiscaux. Étendre Round 1 `FiscalSettingsService`. Page `/admin/parametres-fiscal`. Taux TVA (20/14/10/7/0), RAS, timbres, exonérations. Activation par société.

10. M-ADM-10 — Mappings comptables. Page `/admin/mappings-comptables`. Pour chaque type opération, comptes auto (facture vente 4111/7XXX/4456, achat 401X/61XX/4456, paie 64XX/4432/4453/4438). Mode expert + assisté (templates PME/ETI/BTP).

11. M-ADM-11 — Abonnements / licences SaaS (users souscrits/utilisés, modules activés, usage, renouvellement).

12. M-ADM-12 — Sauvegarde & restauration. Page `/admin/backup`. Mock = export JSON complet. Restauration depuis fichier. Backup planifié mock.

Backlog P2/P3 :
13. M-ADM-13 — API publique + webhooks (tokens, scopes, quotas).
14. M-ADM-14 — Import / migration Sage/Batigest/Excel/Odoo/SAGEAR (wizards + mapping + dry-run).
15. M-ADM-15 — i18n locales (FR/AR/EN + calendrier hijri optionnel + formats date/nombre/devise).
16. M-ADM-16 — Thème / white-label (couleurs CSS variables, favicon, footer PDF).

Fichiers à créer :
- `app/applications/erp/administration/administration.routes.ts` (étendre)
- `app/applications/erp/pages/administration/hub/admin-hub.page.ts`
- `app/applications/erp/pages/administration/utilisateurs/` (étendre)
- `app/applications/erp/pages/administration/roles/` (étendre)
- `app/applications/erp/pages/administration/societes/`
- `app/applications/erp/pages/administration/etablissements/`
- `app/applications/erp/pages/administration/referentiels/{clients,moa,banques}/`
- `app/applications/erp/pages/administration/audit-log/`
- `app/applications/erp/pages/administration/templates-docs/`
- `app/applications/erp/pages/administration/numerotation/`
- `app/applications/erp/pages/administration/mappings-comptables/`
- `app/applications/erp/pages/administration/backup/`
- `app/platform/core/auth/sso/`
- `app/platform/core/auth/2fa/`
- `app/platform/core/rbac/rbac.guard.ts`
- `app/platform/core/rbac/has-permission.directive.ts`

Coordination : TOUTES les Tasks (multi-tenant + RBAC + numérotation). Task 12 (rôles approbateurs). Task 14 (audit log universel).

Tests : `RbacGuard` (refus + accept selon scope) + `AuditLogService` (hash chaîné) + e2e `/admin` ≠ 404 + e2e user sans permission Finance.

Mettre à jour `00-PROGRESS.md` (section 13-admin).
```

---

## Task 14 — Features transversales (M-TRA-01..20)

### Prompt copier-coller

```text
Tu es l'agent en charge de la TASK 14 — Features transversales.

Spec : `web/docs/specs/erp-audit-round-2-roadmap/14-transverse.md`.
Findings : M-TRA-01..20.
Sprint cible : S1–S2 (P0) + S7–S10 (P1).

Goal : apporter les fonctionnalités transversales qui transforment l'ERP en outil de productivité fluide.

Priorité absolue (S1–S2) :
1. M-TRA-01 — Command palette Ctrl+K. RÉGRESSION Round 2 : Round 1 3.2 ✅ mais audit constate « toujours non fonctionnelle ». Diagnostiquer :
   - Raccourci capté par navigateur ? Préférer Ctrl+K, Cmd+K, Ctrl+P
   - Composant non monté dans shell global ?
   - Listener keydown mal câblé ?
   Indexer : routes (libellés i18n), entités (chantiers, fournisseurs, employés, BC, DA, factures, marchés, articles), actions (« + Nouveau chantier »…). Fuzzy search (`fuse.js`/`fuzzysort`). Navigation clavier ↑↓ Enter Esc. Section « Récent » 5 derniers. Test e2e multi-OS.

2. M-TRA-02 — Drill-down clic-ligne universel. Audit toutes utilisations `nf-data-table` / `mat-table` / `nf-entity-listing`. Ajouter `rowClickable: true` par défaut sur `nf-entity-listing`. Définir `rowAction` par listing métier → fiche détail. Cursor pointer + hover state visible. `data-no-click="true"` sur boutons enfants. 100 % couverture listings métier. Test e2e itère 5+ listings → clic ligne change URL.

3. M-TRA-03 — Workflow approbation transversal (alias Task 12).

4. M-TRA-08 — Notifications applicatives en français. RÉGRESSION Round 2 : labels EN restants (« No notifications », « View All »). Audit i18n `notification-bell` + complétion FR/AR/EN.

5. M-TRA-09 — Bilingue FR/AR (RTL) + EN. RÉGRESSION Round 2 : Round 1 3.4 ✅ marqué mais audit constate « toggle inopérant ». Diagnostiquer `LocaleService.applyLang` + `TranslateService.use(lang)` + `document.documentElement.lang/dir`. Tester RTL shell + listings + formulaires. Compléter packs AR (`public/assets/i18n/applications/erp/ar.json`). Test e2e `expect(html.dir).toBe('rtl')` après toggle AR.

Livrables P1 (S7–S10) :
6. M-TRA-04 — Exports CSV/XLSX/PDF universels. Étendre Round 1 12.1 (`<nf-export-button>` + `ExportService`). 100% couverture listings. Respect filtres + tri actifs. Audit log. Config colonnes.

7. M-TRA-05 — Impression PDF templates universels. Compléter templates : BC, Devis, Facture vente/situation, Avoir, BL réception, Carnet attachement, Contrat ST, Fiche paie, DGD, OS, Reçu paiement, Mise en demeure, Caution bancaire. Pipeline PDF Round 1 (`pdf-server-demo.md`). Templates configurables via Task 13 M-ADM-07.

8. M-TRA-06 — Filtres avancés + vues sauvegardées. Modèle `VueSauvegardee` (filtres + tri + colonnes + partage). Dropdown « Mes vues » + bouton « Enregistrer vue actuelle » sur chaque listing.

9. M-TRA-07 — Recherche full-text + OCR. Étendre Ctrl+K avec contenu PDF. OCR auto upload BL/factures (Tesseract.js client ou API serveur). Métadonnées indexées (montants, dates, n° factures).

10. M-TRA-10 — Mode sombre. Tokens CSS variables `[data-theme="dark"]`. Toggle shell (icône lune/soleil). Persistance localStorage. Auto via `prefers-color-scheme`. Contraste WCAG AA. Tests Storybook smoke.

11. M-TRA-11 — États vides/loading/erreur unifiés. Round 1 4.2 ✅ `entity-listing`. Étendre pages liste ad hoc + pages détail.

12. M-TRA-12 — Toasts CRUD universels. Round 1 4.3 ✅ `ToastService`. Audit `*.facade.ts`/`*.service.ts` qui CRUD sans toast. Pattern Undo sur suppressions.

13. M-TRA-13 — Aide contextuelle métier. Composant `<help-tooltip key="art-187">`. Glossaire `public/assets/i18n/applications/erp/help-glossary.json` (50+ entrées BTP MA : Art. 187, RG, IGR, BTP18, K, SIMPL-IS, DAMANCOM, ANAPEC, OPPCM, DAT, IJSS, TFP, CIMR, CNSS, AMO, CCAG-T, BPU, PUF, PGF, DPGF, DPU, DGD, RAS, TPCC, MOA, MOE, BET). 3+ tooltips par écran métier.

14. M-TRA-14 — Tour produit / Onboarding. Étendre Round 1 15.7 (4e tour). Bibliothèque `intro.js` ou `driver.js`. 8 étapes globales premier login (sidebar, header, dashboard, chantiers, achats, finance, RH, settings). Bouton « Refaire tour » dans Aide.

Backlog P2/P3 (S11+) :
15. M-TRA-15 — Soft-delete partout + `/admin/corbeille` restauration. Versions précédentes.
16. M-TRA-16 — Commentaires + @mentions sur chantier/BC/NC/facture.
17. M-TRA-17 — Pièces jointes universelles (`<attachments-zone>`).
18. M-TRA-18 — Activity feed timeline par entité.
19. M-TRA-19 — Bulk actions (checkboxes + barre actions).
20. M-TRA-20 — Saved searches → automation.

Fichiers à toucher :
- `app/platform/lib/anatomy/components/organisms/command-palette/`
- `app/platform/lib/anatomy/components/organisms/data-table/`
- `app/platform/lib/anatomy/components/organisms/entity-listing/`
- `app/platform/lib/anatomy/components/atoms/notification-bell/`
- `app/platform/lib/anatomy/components/atoms/help-tooltip/` (nouveau)
- `app/platform/core/i18n/locale.service.ts`
- `public/assets/i18n/applications/erp/help-glossary.json` (nouveau)
- `app/platform/lib/anatomy/services/export.service.ts`

Coordination : Task 12 (alias workflow), Task 13 (audit log + templates docs + multi-tenant), Task 15 (mobile 1-clic), Task 16 (notifications WhatsApp).

Tests : e2e Ctrl+K multi-routes + drill-down 5+ listings + toggle FR/AR RTL.

Mettre à jour `00-PROGRESS.md` (section 14-transverse).
```

---

## Task 15 — Mobile / Terrain (M-MOB-01..08)

### Prompt copier-coller

```text
Tu es l'agent en charge de la TASK 15 — Mobile / Terrain.

Spec : `web/docs/specs/erp-audit-round-2-roadmap/15-mobile.md`.
Findings : M-MOB-01..08.
Sprint cible : S5–S6.

Goal : construire la vraie app terrain. PWA installable, mode offline robuste IndexedDB + sync différée, géolocalisation/géofencing, capture photo géotaggée, scanner QR/code-barres, signature digitale. Un chef chantier doit pouvoir gérer sa journée sans connexion fiable.

Architecture cible : routes `/m/*` (dashboard, chantiers/:id, pointage, avancement, journal, attachement, photo, scan, materiel/pointage, hse/incident, hse/causerie, caisse/:id, approuver/:token) + layers (IndexedDB Dexie.js + Service Worker + Sync Queue + Conflict Resolver).

Priorité absolue (S5–S6) :
1. M-MOB-01 — App PWA terrain installable. Étendre `manifest.webmanifest` (short_name « Nafura Terrain », icônes 192/512, display standalone). Bouton « Installer » sur première visite mobile (event `beforeinstallprompt`). Layout dédié `/m/*` distinct desktop : bottom-nav ou sidebar compacte, gros boutons tactiles ≥ 44×44 px. Routes mobiles curated (focus chef chantier, pas tout l'ERP). Détection mode mobile redirect `/` → `/m/dashboard` si screen ≤ 640px ET app installée. Lighthouse PWA ≥ 90.

2. M-MOB-02 — Mode offline robuste. Lib Dexie.js (wrapper IndexedDB). Tables typées : `pointages`, `avancements`, `journaux`, `photos`, `attachements`, `incidents`, `caisses`, `pendingSync`. Workflow :
   - Lecture : online → API, offline → IndexedDB cache local
   - Écriture : toujours IndexedDB + ligne pendingSync (timestamp)
   - Service Worker : background sync quand connexion revient
   - Conflits : dialog résolution (« Garder local / Serveur / Fusionner »)
   - UI bandeau orange « Offline (3 changements en attente) »
   - 7 jours d'offline supportés
   Test e2e Playwright `context.setOffline(true)`.

Livrables P1 :
3. M-MOB-03 — Géolocalisation + géofencing chantier. Configuration rayon par chantier (Task 02 M-CHA-04). Refus pointage si distance > rayon (message clair « Vous êtes à 850m du chantier »). Override chef avec motif. Refresh régulier 10 min batterie limitée. Mode dégradé si GPS indisponible.

4. M-MOB-04 — Capture photo native. Caméra arrière par défaut mobile. Compression `browser-image-compression` ≤ 200 KB. Préservation EXIF géotag. Watermark optionnel (date + chantier + user). Multi-photos avec preview.

5. M-MOB-05 — Scanner QR/code-barres. Lib `@zxing/ngx-scanner`. Permission caméra. Détection QR + EAN-13 + Code 128. Beep audio + vibration. Contextes : BL réception, article (consultation stock), matériel (pointage heures).

6. M-MOB-06 — Signature digitale canvas. Composant `<signature-canvas>` réutilisable. Embarqué dans PDF (image data URL). Validation force minimum. Mode portrait/paysage. Cas d'usage : carnet attachement (Task 02 M-CHA-06), PV réception (Task 07 M-MAR-08), bon matières chantier (Task 04 M-STK-03), contrat employé (Task 09 M-RH-02), état contradictoire location (Task 05 M-MAT-04).

Backlog P2 :
7. M-MOB-07 — Notifications push FCM (Android+Web) + APNs (iOS). Cas : approbation à valider, incident HSE, situation payée.
8. M-MOB-08 — Mode très basse bande passante (toggle « Économie » : pas photos, polling réduit, cache agressif, sync différée, UI minimale).

Fichiers à toucher :
- `src/manifest.webmanifest` (étendre)
- `src/ngsw-config.json` (étendre cache strategy)
- `app/applications/erp/mobile/` (nouveau périmètre)
- `app/applications/erp/mobile/m.routes.ts`
- `app/applications/erp/mobile/services/offline-storage.service.ts` (Dexie)
- `app/applications/erp/mobile/services/sync-queue.service.ts`
- `app/applications/erp/mobile/services/conflict-resolver.service.ts`
- `app/platform/lib/anatomy/components/atoms/signature-canvas/`
- `app/applications/erp/pages/rh/pointage/` (durcir Round 1 13.1)

Coordination : Task 02 (avancements + photos + signature attachement), Task 04 (scanner réception/sortie/inventaire), Task 05 (pointage heures engin), Task 08 (caisse chantier), Task 09 (pointage équipe robuste — coord prioritaire), Task 10 (déclaration incident mobile), Task 12 (approbation 1-clic), Task 14 (notifications push).

Tests : e2e mobile emulation (iPhone 14, Pixel 7) — installer PWA + pointer offline + sync online.

Mettre à jour `00-PROGRESS.md` (section 15-mobile).
```

---

## Task 16 — Intégrations & Connecteurs (M-INT-01..16)

### Prompt copier-coller

```text
Tu es l'agent en charge de la TASK 16 — Intégrations & Connecteurs.

Spec : `web/docs/specs/erp-audit-round-2-roadmap/16-integrations.md`.
Findings : M-INT-01..16.
Sprint cible : S7–S8.

Goal : brancher les intégrations critiques pour passer du mock à la production. Round 1 = SIMPL-IS et DAMANCOM XML écrans OK, manque les API. Plus banques MA, OMPIC, WhatsApp, indices BTP, etc.

Priorité absolue (S7–S8) :
1. M-INT-01 — DGI SIMPL-IS API (XML mensuel TVA). Adapter `DgiSimplIsAdapter` avec mode mock pour démo + mode prod réelle (endpoint `https://api-dgi.gov.ma/simpl-is/declarations` placeholder). Auth certificat client + token. Génération XML conforme schéma DGI. Audit log chaque déclaration envoyée. Test unitaire XML conforme + mode mock simule succès/échec.

2. M-INT-02 — CNSS DAMANCOM API (XML mensuel BAP). Adapter `CnssDamancomAdapter` similaire. Spec : portail https://damancom.cnss.ma (API REST ou SFTP). Auth compte affilié + matricule. Format XML BAP mensuel.

Livrables P1 :
3. M-INT-03 — CNSS DAT déclaration AT. Workflow incident type AT → génération XML CNSS DAT → envoi API → accusé. Coord Task 09 M-RH-09 + Task 10 M-HSE-11.

4. M-INT-04 — API banques MA virements + relevés. Banques : AWB (Attijariwafa), BMCE BoA, CIH, BP (Banque Populaire), BMCI, SGM, CAM, CFG. Interface `BanqueAdapter` unique avec implémentations par banque :
   - `envoyerVirementBatch(virements)`
   - `recupererReleveBancaire(compte, dateDebut, dateFin)`
   - `recupererSoldes(comptes)`
   AWB Open Banking + CIH OpenAPI sont les plus avancés en MA. SFTP/XML pour les autres.

5. M-INT-05 — e-facture DGI (2026-2027). Connexion API e-facture DGI quand publiée. Coord Task 08 M-FIN-06 (préparation modèle finance).

6. M-INT-06 — Indices BTP01..xx ANP/HCP CSV mensuel. Job (ou import manuel) télécharge CSV, parse indices, alimente table `IndicesBTP` (Round 1 K-formula). Coord Task 07 M-MAR-09.

7. M-INT-07 — OMPIC API ICE/IF/RC. Sur création tiers (client/fournisseur/MOA), bouton « Vérifier OMPIC » avec ICE → autocomplete raison sociale, IF, RC.

8. M-INT-08 — Bureaux qualifications MA. Référentiel public qualif + classif BTP MA (équivalent Qualibat). Coord Task 06 M-ETU-09.

9. M-INT-09 — WhatsApp Business API. Différenciateur fort (Maroc WhatsApp-first). Provider Meta WhatsApp Business API ou Twilio/MessageBird. Templates messages validés Meta. Cas : approbations (Task 12 M-APR-07), alertes HSE (Task 10), relances factures (Task 08 M-FIN-02), livraisons BC.

Backlog P2/P3 (S11+) :
10. M-INT-10 — Drive / OneDrive / Dropbox (synchro docs chantier).
11. M-INT-11 — Outlook / Gmail / Calendar (événements chantier).
12. M-INT-12 — MS Project / Primavera P6 (planning, coord Task 02 M-CHA-10).
13. M-INT-13 — Bentley / AutoCAD / Revit BIM (visionneuse IFC ouvert).
14. M-INT-14 — Météo officielle MA DMN (alt open-meteo Task 02 M-CHA-13).
15. M-INT-15 — PowerBI / Looker / Tableau (cube analytique OData/REST).
16. M-INT-16 — Migration Sage 100/1000 (export FEC import + mapping écritures, coord Task 13 M-ADM-14).

Fichiers à créer :
- `app/platform/core/integrations/` (nouveau dossier)
- `app/platform/core/integrations/dgi-simpl-is.adapter.ts`
- `app/platform/core/integrations/cnss-damancom.adapter.ts`
- `app/platform/core/integrations/cnss-dat.adapter.ts`
- `app/platform/core/integrations/banques/banque.adapter.ts` (interface)
- `app/platform/core/integrations/banques/awb.adapter.ts`
- `app/platform/core/integrations/banques/bmce.adapter.ts`
- `app/platform/core/integrations/banques/cih.adapter.ts`
- `app/platform/core/integrations/banques/bp.adapter.ts`
- `app/platform/core/integrations/efacture-dgi.adapter.ts`
- `app/platform/core/integrations/ompic.adapter.ts`
- `app/platform/core/integrations/whatsapp.adapter.ts`
- `app/applications/erp/integrations/services/indices-btp-import.service.ts`

Pattern adapter testable : interface stable + mode mock + mode prod (env var ou config).

Coordination : Task 08 (DGI, e-facture, banques), Task 09 (DAMANCOM, CNSS DAT), Task 10 (CNSS DAT incident), Task 13 (paramètres certificats + tokens), Task 14 (notifications WhatsApp).

Tests : unitaire XML SIMPL-IS conforme schéma DGI + XML BAP DAMANCOM + adapter banques par format.

Mettre à jour `00-PROGRESS.md` (section 16-integrations).
```

---

## Task 17 — Spécificités Maroc (M-MA-01..14)

### Prompt copier-coller

```text
Tu es l'agent en charge de la TASK 17 — Spécificités Maroc.

Spec : `web/docs/specs/erp-audit-round-2-roadmap/17-maroc.md`.
Findings : M-MA-01..14.
Sprint cible : S3–S4 (P0 transverse).

Goal : compléter la localisation marocaine. Round 1 = atomes ICE/RIB/phone-ma/money-ma 4.6 + TVA autoliquidation 6.7. Étendre à tous les référentiels + RAS 5% + timbre + CIMR + OPPCM + calendrier hijri.

Priorité absolue (S3–S4) :
1. M-MA-01 — ICE/IF/RC/Patente/RIB/CNSS/AMO **partout**. Étendre atomes Round 1 4.6 à TOUS les référentiels :
   - Société (étendre Round 1) : raison sociale, ICE 15, IF 8, RC (n° + tribunal), Patente, CNSS, CNAEM optionnel, RIBs multi-banques
   - Clients (privés et publics) : ICE 15, IF 8, RC (privé), agrément MOA (public)
   - Fournisseurs (Round 1 OK) : étendre AMO + validation périodicité attestations (coord Task 03 M-ACH-07)
   - Sous-traitants : ICE 15, IF 8, RC, attestation Art. 187 CGI (coord Task 03 M-ACH-08)
   - Employés : matricule CNSS, n° AMO, IF salarié si concerné cadres haut revenu
   Validation formats avec algos contrôle :
   - ICE 15 chiffres + algo clé (vérifier/étendre `IceValidator`)
   - RIB 24 chiffres + clé (code banque 3 + agence 5 + compte 14 + clé 2)
   - IF 8 (entreprises) ou variable (salariés)
   - CNSS 7-8 chiffres
   - Téléphone MA `+212` ou `0` + 9 chiffres
   Atomes utilisés sur TOUS les formulaires tiers (audit grep `input type=text` brut pour ces champs = 0).
   Tests unitaires algos clés étendus.

2. M-MA-02 — Retenue à la source 5 % marchés publics (art. 158 CGI). Config niveau Marché `Marche.retenueSourceTaux: 5 | 0`. Calcul auto sur facture vente : `retenueSource = HT × 5%`. Comptabilisation 4453. Page `/finance/declarations/retenue-source` → PDF + XML DGI trimestriel. Test unitaire.

3. M-MA-03 — Timbre fiscal espèces > 100 MAD. Détection auto sur règlement (mode ESPECES + `montant > 100`). Bouton « Apposer timbre fiscal ». Génération numéro timbre + affichage PDF. Test unitaire.

Livrables P1 :
4. M-MA-04 — TVA 20/14/10 % paramétrable. Étendre Round 1 6.7 (`FiscalSettingsService`, `TvaAutoliquidationService`). Taux 20/14/10/7/0. TVA 0% marchés publics exonérés (art. 92 CGI). TVA 14% logements sociaux. Config par article ou client. Override par ligne facture. Page `/admin/parametres-fiscal` étendue (coord Task 13 M-ADM-09).

5. M-MA-05 — Régime TPCC (Promotion Paysage Audiovisuel). Configuration par marché.

6. M-MA-06 — CIMR cadres. Étendre `PaieEngineService` (Round 1) : cotisation salariale 3 % + patronale 6 % (vérifier taux 2026). Plafond convention. Configuration CIMR par employé (cadre vs non). Calcul cotisations bulletin paie. Déclaration CIMR mensuelle (similaire DAMANCOM). Test unitaire.

7. M-MA-07 — OPPCM (Outils Public de Passation des Commandes des MOA). Interface génération dossier numérique soumission + signature électronique + dépôt OPPCM (API publique ou portail).

8. M-MA-08 — CCAG-T terminologie. Round 2 indique « globalement OK ». Audit exhaustif vocabulaire i18n FR.json : MOA/MOE/BET, OS/OST/OSR, PV, DGD, RG, RAS, BPU/PUF/PGF, DPGF/DPU, réception provisoire/définitive, mainlevée caution. Alignement UI.

9. M-MA-09 — Calendrier hijri + jours fériés MA. Lib `moment-hijri` ou `hijri-date`. Toggle date picker (option user, coord Task 13 M-ADM-15). Référentiel jours fériés MA :
   - Fixes : 1/1, 11/1 (Indépendance), 30/7 (Trône), 14/8 (Allégeance), 20/8 (Révolution Roi-Peuple), 21/8 (Anniv Roi), 6/11 (Marche Verte), 18/11 (Indépendance), 1/5 (Travail)
   - Variables hijri : Aïd Al Fitr (1 Chawwal), Aïd Al Adha (10 Dhul-Hijjah), Mouharram, Mawlid (12 Rabi I)
   Seedé 5 prochaines années. Planning Gantt exclut. Calcul jours ouvrés (congés, retards, échéances) exclut fériés.

Backlog P2/P3 :
10. M-MA-10 — Code marchés publics MA (décret 2-22-431) : seuils AO ouvert/restreint/négocié, délais légaux, modalités attribution, recours.
11. M-MA-11 — Banques MA SWIFT + agences + validation RIB. Référentiel codes banques (AWB 007, BMCE 011, CIH 022, BP 014/015/016/019/021, BMCI 013, SGM 022, CAM 225, CFG 130). Validation algorithme clé.
12. M-MA-12 — Régions / Provinces / Communes (12 régions, ~75 provinces, ~1500 communes). Champ adresse structurée.
13. M-MA-13 — Multi-devises (MAD primaire + EUR/USD fournisseurs étrangers acier/équipements). Conversion API BAM ou taux saisi.
14. M-MA-14 — Calendrier prière chantier (option, API Aladhan). Pauses planifiées planning chantier.

Fichiers à toucher :
- `app/platform/lib/anatomy/components/atoms/{ice,rib,phone-ma,money-ma}-input/` (validateurs)
- `app/applications/erp/shared/validators/` (étendre Ice/Rib/If)
- `app/applications/erp/shared/services/fiscal-settings.service.ts` (étendre)
- `app/applications/erp/finance/services/retenue-source.service.ts` (nouveau)
- `app/applications/erp/finance/services/timbre-fiscal.service.ts` (nouveau)
- `app/applications/erp/rh/services/paie-engine.service.ts` (étendre CIMR)
- `app/applications/erp/shared/services/jours-feries-ma.service.ts` (nouveau)
- `app/applications/erp/shared/data/regions-ma.ts` (nouveau)
- `app/applications/erp/shared/data/banques-ma.ts` (nouveau)

Coordination transverse : TOUTES les Tasks tiers (clients, fournisseurs, ST, employés, société). Task 03 (attestations sous-traitants), Task 07 (RAS, indices BTP), Task 08 (TVA, RAS, timbre), Task 09 (CIMR, AMO, CNSS), Task 13 (paramètres fiscaux + référentiels banques/régions).

Tests : `IceValidator`, `RibValidator`, `RetenueSourceService`, `PaieEngineService — CIMR` + e2e écrans tiers ont champs MA.

Mettre à jour `00-PROGRESS.md` (section 17-maroc).
```

---

## Tableau d'orchestration des dépendances

> Ordre suggéré d'exécution pour minimiser les conflits Git et débloquer le plus tôt possible.

| Sprint | Tasks parallélisables | Pré-requis |
|--------|----------------------|------------|
| **S1** | Task 02 (P0) + Task 14 (P0 Ctrl+K + drill) | — |
| **S2** | Task 12 (P0 engine) + Task 14 fin (P0 i18n) | Task 02 partiel |
| **S3** | Task 13 (P0 admin/RBAC) + Task 10 (P0 HSE) + Task 17 (P0 ICE/RAS/timbre) | Task 12 (rôles approbateurs) |
| **S4** | Task 13 (suite) + Task 11 (P0 brancher data) + Task 05 (P0 GMAO/carburant) | Task 13 multi-tenant ouvert |
| **S5** | Task 15 (P0 PWA/offline) + Task 03 (P0 3-way matching) + Task 06 (P0 DPU/DPGF) | Task 02 fiche chantier OK |
| **S6** | Task 15 (suite signature/scanner) + Task 09 M-RH-01 (pointage robuste) | Task 15 layer mobile |
| **S7** | Task 04 (Stock P1) + Task 05 (P1 reste) + Task 16 (P0 API DGI/CNSS) | Task 13 sociétés |
| **S8** | Task 08 (P1 Finance) + Task 09 (P1 RH) + Task 17 (P1 MA suite) | Task 13 fiscal/numérotation |
| **S9** | Task 07 (P1 DGD/OS/situations auto) + Task 03 (P1 fournisseur 360°/Art.187) | Task 02 + Task 17 |
| **S10** | Task 12 (P1 délégation/escalade) + Task 06 (P1 mémoire/soumission AO) | Task 13 délégations |
| **S11–S12** | Task 01 (P1 reste) + Task 14 (P1 polish) + Tasks P2/P3 | Tout le P0+P1 livré |

---

## Anti-patterns à éviter (rappel)

- ❌ Refaire le Round 1 (lire `00-PROGRESS.md` Round 1 AVANT)
- ❌ Toucher 2 plomberies en même temps (ex. Task 12 + Task 13 dans la même PR)
- ❌ Multiplier les mocks (utiliser `SEED_CHANTIERS` partout)
- ❌ i18n hardcoded FR/EN inline
- ❌ `| currency` Angular pipe (utiliser `| mad`)
- ❌ Mobile en after-thought (penser PWA/offline dès la conception)
- ❌ Skip tests (P0/P1 = test e2e + unit si calcul fiscal/social/K)

---

## Mise à jour du fichier

| Date | Auteur | Changement |
|------|--------|------------|
| 2026-05-13 | — | Création — 17 prompts agent (1 par fichier de tâche) basés sur Round 2 audit. |
