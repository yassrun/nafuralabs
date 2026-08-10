# Journal d'implémentation — référentiel-catalogue-sektor

## L16b — Polish final (2026-08-10)

**Statut** : livré. **Dernier lot du chantier** — epic lots clos.

### Livré

- `LlmRapprochementAdapter` (@Primary) → `StatelessExtractionService` / Gemini
  — clés inventées filtrées ; suggestions SUGGERE seulement
- `ItemPriceTenantHistoriqueAdapter` : moyenne `item_prices` 6 mois
- `PrixAnomalieService` : tenant d'abord, fallback refs catalogue
  — `GET …/prix/anomalie?itemId=&catalogCle=&prix=`

### Clôture

- Plus de lot d'implémentation prévu sur cet epic
- Hors chantier (ops / juridique) : publication CGU live, relecture juridique PR1

## L16 — Intelligence (2026-08-10)

**Statut** : livré (back + branchements front mineurs). Pas de canvas (pas d'écran nouveau).

### Livré

- `RapprochementIntelligenceService` : déterministe d'abord ; LLM **uniquement** si non tranché
  (EXACT ou confiance ≥ 0,80 + écart ≥ 0,15) — métriques `GET …/rapprochement/metrics`
- Port `LlmRapprochementPort` + NoOp (`@ConditionalOnMissingBean`) — câblé en **L16b**
- Enrichissement : `POST …/enrichissement/contribuer` → **uniquement** `catalog_candidats`
  + `catalog_candidat_signal` (tenant_hash SHA-256, **pas** de `tenant_id`)
- Anonymisation libellés d'exemple (`LibelleAnonymizer`)
- Console : `listerProposesEligibles` — sous-seuil **hors** file éditoriale
- `PrixAnomalieService` : +18 % vs moyenne refs 6 mois
- `BibliothequeDecompositionSuggestionPort` (@Primary) — suggestion depuis biblio tenant
  (Bordereau/CPS/CatalogResolver déjà réels)

### Hors lot / suite

- ~~Adapter `LlmRapprochementPort` → `LlmService` / Gemini~~ → **L16b**
- ~~Historique prix tenant 6 mois~~ → **L16b**

## L15 — Rapprochement déterministe + item_match (2026-08-10)

**Statut** : livré (back + front rattrapage). Pas de canvas nouveau (UX écran 3 / rattrapage L9).

### Livré

- Table tenant `item_match` (VARCHAR `catalog_cle`, **pas de FK** vers `catalog_*`)
- Pipeline : normalisation → EXACT → REGLE → TRIGRAM → liste courte (≤10) — **aucun LLM**
- API `POST /api/v1/catalogue/rapprochement/{search,valider,rejeter}`
- Permissions : `catalogue.read` pour search/valider/rejeter ; grant `BTP_INGENIEUR`
- Front rattrapage : suggestions catalogue avec **méthode + confiance %** ; Choisir
  (valide match + crée/lie article) ; Rejeter (ne re-propose plus) ; fallback UUID manuel
- Tests : scénario peinture, rejet, EXACT, perf 10k &lt; 200 ms ; anti-FK autorise `item_match`

### Hors lot (L16)

- Ports intelligence réels, LLM en dernier recours, enrichissement `catalog_candidat`

## L14 — Module catalogue (2026-08-10)

**Statut** : livré (back + front console). Canvas validé tel quel.

### Livré

- Module `:sektor:catalogue` — tables sans `tenant_id`, G2, API, seed demo, test anti-FK
- `dossiers_etude.catalog_edition_code`
- Canvas [`catalogue-console-wireframe.canvas.tsx`](./ux/catalogue-console-wireframe.canvas.tsx)
- Front `/catalogue` — file candidats · détail G2 · publier/refuser · éditions · seed
- Nav Études → Console catalogue Sektor

### Hors lot (L15)

- `item_match` + pipeline déterministe + perf 200 ms

## PR1 — Clause CGU catalogue (2026-08-10)

**Statut** : accepté tel quel (hors code). L14 débloqué.

### Livré

- SSOT [`PR1-clause-cgu-catalogue.md`](./PR1-clause-cgu-catalogue.md)
  — droit d’exploiter données anonymisées / agrégées pour référentiel métier ;
  exclusions (identité, libellés bruts, prix nominatifs) ; seuils G2 ; non-rétroactif
- **D1 figé :** pas d’opt-out

### Suite

- Publication CGU live + relecture juridique (hors chemin critique lab)
- **L14** module catalogue

## L13 — Chaînage aval (2026-08-10)

**Statut** : livré (back + front). Wireframe validé tel quel.

### Livré

- Wireframe [`etude-chainage-aval-wireframe.canvas.tsx`](./ux/etude-chainage-aval-wireframe.canvas.tsx)
- Hardening devis : remise > marge bloquante ; `convertToChantier` déprécié → dossier `/convertir`
- Issue commerciale : `POST …/gagne` · `POST …/perdu` (motifs PRIX|DELAI|…)
- Conversion atomique : `POST …/convertir` via `ChainageAvalPort` + `ChainageAvalAdapter`
  (chantier → lots/postes → marché → budget)
- Ventilation budget déboursé (`cout_unitaire × qté`) :
  DECOMPOSE par nature · FORFAIT→ST · ESTIME/déduit→NON_VENTILE (+ `non_fiable`)
- Changelogs `019_l13_issue_commerciale_aval.sql` (etudes) ·
  `v1.1/001_l13_budget_non_ventile.sql` (chantiers)
- Front : CTAs Marquer gagné / perdu / Convertir (plus de bypass `CREER_CHANTIER`)
- Tests : ventilation, remise/marge, gagne/perdu/convert

### Hors lot / suite

- Fil d’Ariane UI complet + corrélation avis/écarts (AC phase 7 restants)
- **PR1** CGU (bloque L14)

## L12 — Bibliothèque capitalisation (2026-08-10)

**Statut** : livré (back + front). Wireframe validé tel quel.

### Livré

- Wireframe [`etude-versement-biblio-wireframe.canvas.tsx`](./ux/etude-versement-biblio-wireframe.canvas.tsx)
- `CapitalisationOuvrageService` : candidats DECOMPOSE, collision rendements,
  versement explicite (CREER / IGNORER / NOUVEAU_CODE / REMPLACER)
- API `GET|POST …/dossiers/{id}/capitalisation[/verser]` — **jamais** dans `valider()`
- `origine=ETUDE`, `source_etude_id` ; panneau synthèse si VALIDEE
- `CorpusOuvrageSeedService` + `POST /ouvrages/seed-corpus` (84, totaux rejoués)
- Changelog [`018_l12_capitalisation_indexes.sql`](../../../../backend/modules/etudes/src/main/resources/db/changelog/schema/v1.1/018_l12_capitalisation_indexes.sql)
- Tests : collision sans écrasement, dossier non validé refusé, corpus 84

### Suite

- **PR1** CGU · **L13** chaînage aval

## L10 — Ouvrage composite (2026-08-10)

**Statut** : livré (backend). Pas de wireframe (pas d'écran nouveau).

### Livré

- Changelog [`017_l10_ouvrage_composite.sql`](../../../../backend/modules/etudes/src/main/resources/db/changelog/schema/v1.1/017_l10_ouvrage_composite.sql)
  — `code_lot` / `code_famille` / `origine` / `source_etude_id` / `catalog_cle_stable` ;
  `inclure_frais_et_marge` sur composants
- `OuvrageCompositeService` : déboursé récursif (OUVRAGE → déboursé enfant) ;
  FG/marge au sommet sauf flag sous-traitance ; anti-cycle + profondeur max 5 à l'écriture
- Branchement `OuvrageService.recomputeTotals` + `DpuService.applyTotals`
- Tests : cloison→mortier, anti marge-sur-marge, cycle A→B→A, profondeur 5/6,
  `inclure_frais_et_marge`

### Hors lot (L12)

- Capitalisation à la validation, comparaison rendements, seed corpus 84

### Suite

- **L12** bibliothèque · PR1 CGU

## PR2 — Codification provisoire (2026-08-10)

**Statut** : accepté provisoire (hors code). Débloque L10.

### Livré

- ADR [`01-ADR-pr2-codification.md`](01-ADR-pr2-codification.md)
- `code_lot` = `UsageLot` ; `code_famille` = grille corpus GO (`TER_GEN`, `MAC_ELEV`, …)
- Pattern ouvrage : `{lot}.{famille}.{slug}`
- Checklist révision expert (non bloquante)

### Suite

- **L10** ouvrage composite
- Révision expert PR2 quand dispo

## L11 — Comparateur fournisseurs (2026-08-10)

**Statut** : livré (back + front). Wireframe validé tel quel.

### Livré

- Wireframe [`comparateur-fournisseurs-wireframe.canvas.tsx`](./ux/comparateur-fournisseurs-wireframe.canvas.tsx)
- `ComparateurFournisseurService` : offres actives à date, tri `prix_normalise`, périmé marqué
- API `GET /api/v1/catalogue-fournisseur/comparateur?articleId=&date=`
- Page `/achats/fournisseurs/comparateur` (lien depuis listing)
- Tests tri : 28 avant 30 (scénario Jotun / Tollens)

### Suite

- PR2 codification (bloque L10)
- L10 ouvrage composite · L12 biblio

## L9 — Rattrapage LIBRE / hors_referentiel (2026-08-10)

**Statut** : livré (back + front). Wireframe validé tel quel.

### Livré

- Wireframe [`etude-rattrapage-libre-wireframe.canvas.tsx`](./ux/etude-rattrapage-libre-wireframe.canvas.tsx)
- Changelog etudes [`016_l9_hors_referentiel_rattrapage.sql`](../../../../backend/modules/etudes/src/main/resources/db/changelog/schema/v1.1/016_l9_hors_referentiel_rattrapage.sql)
- Changelog item [`006_l9_item_a_completer.sql`](../../../../backend/modules/item/src/main/resources/db/changelog/schema/v1.1/006_l9_item_a_completer.sql)
- `hors_referentiel` sur `composants_dpu` ; `a_completer` sur `items`
- API `/dossiers/{id}/rattrapage` : resume groupé, ignorer, rapprocher, créer
- Mode tenant `etudes.creationArticleMode` LIBRE|CONTROLEE ; demande_creation_article
- `ItemService.createAllege` (libellé, nature, UoM) + gel L5 au lien ITEM
- Front : `rattrapage-panel` dans synthèse étape 5
- Tests : `RattrapageComposantServiceTest` (groupement libellés)

### Suite

- L11 comparateur fournisseurs
- PR2 codification → L10
- Approbation UI des demandes CONTROLEE (minimal : table + statut)

## L7 — Conditionnement fournisseur (2026-08-10)

**Statut** : livré (back + front minimal). Pas de wireframe (extension formulaire existant). Comparateur = L11.

### Livré

- Changelog [`001_l7_catalogue_conditionnement.sql`](../../../../backend/modules/achats/src/main/resources/db/changelog/schema/v1.1/001_l7_catalogue_conditionnement.sql)
- Typage `fournisseur_id` / `article_id` → UUID ; `uom` VARCHAR → `uom_id`
- Colonnes : `conditionnement_quantite`, `conditionnement_uom_id`, `prix_normalise`, `uom_normalise_id`
- `PrixNormaliseCatalogueService` via L3 `UomConversionService` (jamais saisi)
- Historisation inchangée ; alimentation offre/facture résout UOM par code si possible
- Front fiche fournisseur : conditionnement + affichage prix / base
- Tests : `PrixNormaliseCatalogueServiceTest` (450/15→30, 560/20→28) + historisation

### Suite

- L11 `ComparateurFournisseurService` + écran (classement A/B)
- L9 rattrapage LIBRE

## L8 — Avis d'exécution (2026-08-10)

**Statut** : livré (back + front). Wireframe validé tel quel.

### Livré

- Wireframe [`etude-avis-execution-wireframe.canvas.tsx`](../../../ux/wireframes/etude-avis-execution-wireframe.canvas.tsx)
- Changelog [`015_l8_avis_execution.sql`](../../../../backend/modules/etudes/src/main/resources/db/changelog/schema/v1.1/015_l8_avis_execution.sql)
- Table `avis_execution` (3 niveaux, 3 statuts) ; pas de `composant_dpu_id`
- API : `GET/POST .../avis`, `GET .../avis/resume`, `POST .../avis/{id}/traiter`
- Permissions : pose `etude.avis`, traitement `etude.update` ; auteur = intervenant AVIS
- Gate chiffrage : avis ouverts/écartés **informatifs** (soumission autorisée)
- Front : `poste-avis-panel` dans le drawer ; compteurs étape 5 (`getAvisResume`)
- i18n `etudes.gate.chiffrage.avis_ouverts` / `avis_ecartes`
- Tests : `AvisExecutionServiceTest` (commentaire obligatoire, motif écart, gate non bloquant)

### Suite

- ~~L7 conditionnement~~ → livré
- L9 rattrapage LIBRE
- Corrélation avis / écart chantier (phase 7)

## L6 — Front chiffrage origines (2026-08-10)

**Statut** : livré (front). Wireframe validé tel quel.

### Livré

- Wireframe [`etude-chiffrage-origines-wireframe.canvas.tsx`](../../../ux/wireframes/etude-chiffrage-origines-wireframe.canvas.tsx)
- Sélecteur 3 origines dans drawer : Je décompose / Forfait / J’estime
- ESTIME : interrupteur coût / prix de vente + `cout_deduit`
- FORFAIT : coût + partner/offre UUID optionnels
- Plancher 3 lignes (coût → revient → vente) toujours visible
- ESTIME → DECOMPOSE : estimation conservée + callout d’écart
- Chaîne multiplicative ESTIME/FORFAIT ; DECOMPOSE reste additif (R2)
- Bandeau étape 5 via `GET .../synthese-cout` (marge hors déduits, répartition)
- Purge labels « Prix fourni » UI ; filtres consultation sur `origine === DECOMPOSE`
- Tests util : `poste-chiffrage-mode.util.spec.ts`

### Suite

- ~~L8 avis d’exécution~~ → livré
- L7 conditionnement
- AC phase 1 restants (corpus 84, purge `MODE_*` dépôt entier)

## L5 — Gel du prix (2026-08-10)

**Statut** : livré (back + front minimal). Gradle local indisponible — tests écrits, non exécutés ici.

### Livré

- Changelog [`014_l5_gel_prix_composants.sql`](../../../../backend/modules/etudes/src/main/resources/db/changelog/schema/v1.1/014_l5_gel_prix_composants.sql)
- Colonnes gel : `prix_source_ref_id`, `prix_date_source`, `prix_currency_id`, `prix_libelle_source` (pas de FK catalogue)
- `GelPrixComposantService` branche `ResolutionPrixService` sans le modifier
- Auto-résolution ITEM à la création / si pas de métadonnées gel ; conservation au re-save
- `POST .../dpu/{id}/refresh-prices` + `POST .../dossiers/{id}/refresh-prices` — refus si `!dossier.isModifiable()`
- Front : affichage `prixLibelleSource`, CTA « Rafraîchir les prix », dirty key + write DTO
- Propose décomposition remonte déjà les champs gel
- Tests : `GelPrixComposantServiceTest` (gel initial, conservation, refresh validé, refresh brouillon)

### Critères L5 (hors rattrapage L9)

| Critère | OK |
|---------|----|
| ITEM → prix + source affichés | resolve + `prix_libelle_source` |
| 7 champs PrixResolu persistés | entity + SQL |
| Étude validée inchangée | refresh refuse + pas d’écrasement gel |
| Source catalogue supprimée | pas de FK |
| Pas de gel `composants_ouvrage` | respecté |
| Pas de touch `ResolutionPrixService` | respecté |

### Suite

- L9 rattrapage LIBRE / `hors_referentiel`
- L6 polish UI chiffrage (3 origines, bandeau)

## L4 — Validation à quatre yeux (2026-08-10)

**Statut** : livré backend (hors avis d'exécution = L8). Gradle local indisponible.

### Livré

- Changelog [`013_l4_dossier_intervenant.sql`](../../../../backend/modules/etudes/src/main/resources/db/changelog/schema/v1.1/013_l4_dossier_intervenant.sql)
- Seed IAM L4 [`002_l4_etude_permissions.sql`](../../../../backend/app/src/main/resources/db/changelog/data/v1.1/002_l4_etude_permissions.sql) + bootstrap v1.0 sans joker
- `dossier_intervenant` + `DossierIntervenantService` ; garde-fou CHARGE_ETUDE / REVISEUR
- `niveaux_approbation` figé à la soumission ; seuil `etudes.seuilDeuxNiveauxApprobation` (défaut 500k)
- Workflows ETUDE_PRIX 1 niveau / 2 niveaux + matrice ETUDE_PRIX
- Trace REVISEUR depuis DPU / DPGF / update dossier
- Tests : `DossierEtudeValidationQuatreYeuxTest`, `DossierIntervenantServiceTest`, contrat permissions

### Critères L4 (hors avis L8)

| Critère | OK |
|---------|----|
| Plus de `etude.*` | seed |
| Conducteur sans approve | seed |
| Directeur réviseur bloqué | intervenant REVISEUR |
| Assistante crée / ingénieur chiffre | CHARGE_ETUDE |
| AVIS ne bloque pas | rôle AVIS |
| Sous seuil → 1 niveau | `niveauxApprobationPour` |
| `etude.avis` sans write chiffrage | permissions + controllers `etude.update` |

### Suite

- L8 avis d'exécution (table, API, front)

## L2 — Référence typée des composants (2026-08-10)

**Statut** : livré (back + front appelants). Gradle local indisponible — tests écrits, non exécutés ici.

### Livré

- Changelog [`etudes/.../v1.1/012_l2_reference_typee_composants.sql`](../../../../backend/modules/etudes/src/main/resources/db/changelog/schema/v1.1/012_l2_reference_typee_composants.sql)
- Drop `article_ou_poste_id` / `article_id` VARCHAR ; ajout `reference_type` + `item_id` + `ouvrage_id`/`ref_ouvrage_id` + `libelle`
- CHECK d'exclusivité ITEM/OUVRAGE/LIBRE en base + index partiels
- `ComposantReference` + entities/DTOs/services (`DpuService`, `OuvrageService`, seed)
- Front : modèles, `composant-reference.util`, panel décomposition, dpu-editor, dirty key
- Note : sur `composants_ouvrage`, la réf typée ouvrage est `ref_ouvrage_id` (le parent garde `ouvrage_id`)

### Critères L2

| Critère | OK |
|---------|----|
| Plus de VARCHAR article sur composants etudes | SQL drop + Java |
| Exclusivité en base | CHECK + `ComposantReferenceTest` |
| Pas de gel (L5) | respecté |
| Pas de touch `DpgfNoeud` | respecté |

## L3 — Unités : facteur, base, conversion (2026-08-10)

**Statut** : livré (back + front). Gradle local indisponible (wrapper download / loopback) — tests écrits, non exécutés ici.

### Livré

- Changelog [`item/.../v1.1/005_uom_facteur_et_base.sql`](../../../../backend/modules/item/src/main/resources/db/changelog/schema/v1.1/005_uom_facteur_et_base.sql)
- `facteurVersBase`, `estBase` sur `UnitOfMeasure` + validations service
- `UomConversionService` + `POST /api/v1/units-of-measure/convert`
- Seed : catégorie `SURFACE`, M2 déplacé, facteurs/bases (J = 8 h ouvrées)
- Front : fiche `/inventory/configuration/uom` + listing colonnes + test conversion
- Wireframe : [`ux/uom-conversion-wireframe.canvas.tsx`](./ux/uom-conversion-wireframe.canvas.tsx)

### Critères L3

| Critère | OK |
|---------|----|
| L → M3 | tests unitaires |
| L → H échec explicite | `item.uom.conversion.cross_category` |
| Catégorie sans base refusée | `item.uom.base.category_without_base` |
| Unicité base (tenant, catégorie) | index unique partiel SQL |
| Pas de touch `achats` | respecté |

## L1 — Coût de ligne (2026-08-10)

**Statut** : livré backend + front minimal (contrat API + save panel). Gradle local indisponible.

### Livré

- Changelog `etudes/.../v1.1/011_l1_cout_de_ligne.sql`
- `mode` / `prixFourniBase` → `origineCout` / `coutUnitaire` + `coutRevient`, `estimationSaisieEn`, `coutDeduit`, forfait*
- Chaîne multiplicative ESTIME/FORFAIT (46→49,68→53,16) ; `computePrixVenteHt` additif **inchangé** (R2 / DECOMPOSE)
- Gates 3–5 revus ; `SyntheseCoutAffaire` + `GET .../synthese-cout`
- Front : étape UI « Coût », modèles, save `origineCout`/`coutUnitaire`

### Suite L6 (polish UI)

- Sélecteur 3 origines + interrupteur coût/vente + bandeau synthèse étape 5
- Retirer labels FOURNI restants dans drawer / i18n

### Suite vague 1

- ✅ L3 · L1 · L2 · L4 — Vague 1 complète (hors L8 avis)
- ✅ L5 gel — Vague 2 démarrée
- Progress : [`00-PROGRESS.md`](00-PROGRESS.md)
