# Journal d'implémentation — référentiel-catalogue-sektor

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
- Vague 2 : L5 gel, L6 polish UI, L7…

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

### Suite L2

- L5 gel prix (dépend de L2)
- Phase 2 UI : rattrapage LIBRE (L9)

## L3 — Unités : facteur, base, conversion (2026-08-10)

**Statut** : livré (back + front). Gradle local indisponible (wrapper download / loopback) — tests écrits, non exécutés ici.

### Livré

- Changelog [`item/.../v1.1/005_uom_facteur_et_base.sql`](../../backend/modules/item/src/main/resources/db/changelog/schema/v1.1/005_uom_facteur_et_base.sql)
- `facteurVersBase`, `estBase` sur `UnitOfMeasure` + validations service
- `UomConversionService` + `POST /api/v1/units-of-measure/convert`
- Seed : catégorie `SURFACE`, M2 déplacé, facteurs/bases (J = 8 h ouvrées)
- Front : fiche `/inventory/configuration/uom` + listing colonnes + test conversion
- Wireframe : [`docs/ux/wireframes/uom-conversion-wireframe.canvas.tsx`](../ux/wireframes/uom-conversion-wireframe.canvas.tsx)

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
- Progress : [`00-PROGRESS.md`](00-PROGRESS.md)
