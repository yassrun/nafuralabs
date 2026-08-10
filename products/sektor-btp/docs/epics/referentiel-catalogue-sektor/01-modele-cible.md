# Modèle de données cible

> Delta par rapport à l'existant. Ce qui n'est pas mentionné ne change pas.
> Pré-production : les migrations peuvent **recréer** plutôt qu'altérer.

---

## Vue d'ensemble

```
        MODULE catalogue (sans tenant_id, zéro FK sortante vers du tenant)
        ┌──────────────────────────────────────────────┐
        │  catalog_ouvrages ── catalog_composants      │
        │  catalog_articles ── catalog_prix_reference  │
        │  catalog_editions    catalog_candidats       │
        └───────────────────▲──────────────────────────┘
                            │  cle_stable (chaîne, jamais une FK)
                     item_match
                            │
    ────────────────────────┼──────────────────────────── frontière tenant
                            │
  MODULE item          MODULE achats            MODULE etudes
  ┌──────────────┐     ┌───────────────────┐   ┌────────────────────────┐
  │ items        │◄────│ catalogue_        │   │ dpgf_noeuds            │
  │ item_prices  │     │  fournisseur_     │   │   origine_cout         │
  │ unit_of_     │     │  lignes           │   │   cout_unitaire        │
  │  measure     │     │  (typée, avec     │   │      │                 │
  │  + facteur   │     │   conditionnement)│   │      ▼                 │
  └──────┬───────┘     └─────────┬─────────┘   │ prix_dpu               │
         │                       │             │   └ composants_dpu     │
         └───────────────────────┴────────────►│      ref typée + gel   │
                 ResolutionPrixService          │                        │
                                                │ ouvrages               │
                                                │   └ composants_ouvrage │
                                                └────────────────────────┘
```

---

## Phase 1 — Le coût de chaque ligne

### `dpgf_noeuds` (modifié)

| Champ | Action | Détail |
|---|---|---|
| `mode` | **supprimé** | `FOURNI` \| `DECOMPOSE` — faux binaire |
| `prix_fourni_base` | **renommé** `cout_unitaire` | Le champ portait déjà un coût ; son nom disait « prix » |
| `cout_unitaire` | | `NUMERIC(18,4)`. **Toujours renseigné.** Coût pour UNE unité |
| `origine_cout` | **ajouté** | `DECOMPOSE` \| `FORFAIT` \| `ESTIME`. Non nul si `type = ARTICLE` |
| `cout_revient` | **ajouté** | `NUMERIC(18,4)`. `cout_unitaire × (1+FG%)`. Calculé, jamais saisi |
| `estimation_saisie_en` | **ajouté** | `COUT` (défaut) \| `VENTE`. Non nul uniquement si `origine_cout = ESTIME` |
| `cout_deduit` | **ajouté** | `BOOLEAN`. Vrai quand le coût vient d'un prix de vente saisi |
| `forfait_partner_id` | **ajouté** | `UUID`, nullable. Le sous-traitant, si `origine_cout = FORFAIT` |
| `forfait_offre_id` | **ajouté** | `UUID`, nullable. L'offre d'origine |
| `frais_generaux_percent`, `marge_percent` | conservés | Portés par l'article (D14). **Nom métier conservé** |
| `prix_unitaire`, `total` | conservés | Résultat du calcul, plus une saisie libre |

**Règle de calcul, identique pour les trois origines** — ce n'est pas une règle nouvelle, c'est
celle que `prixFourniBase` annonçait et que personne n'a branchée :

```
cout_unitaire                                    46,00     ce que ça coûte à faire
      + frais généraux 8 %
cout_revient                                     49,68     ← plancher : en dessous, perte
      + marge 7 %
prix_unitaire                                    53,16     ce qui est facturé
      × quantité (1 240 m²)
total                                        65 918,40
```

Alimentation de `cout_unitaire` selon l'origine :

| Origine | Source | Coût connu ? |
|---|---|---|
| `DECOMPOSE` | `PrixDpu.deboursSec` (calcul existant, inchangé) | oui |
| `FORFAIT` | Saisi, ou repris d'une offre fournisseur | oui |
| `ESTIME` + `saisie_en = COUT` | Saisi directement | estimé |
| `ESTIME` + `saisie_en = VENTE` | Déduit : `prix_saisi / ((1+FG%) × (1+marge%))` | **non — `cout_deduit = true`** |

Le dernier cas est celui du **marché à prix unitaires imposés**. Le coût déduit ne mesure rien :
il dit seulement « si mes taux habituels s'appliquaient, il faudrait que ça me coûte ça ». Il ne
doit jamais être compté comme un coût établi.

### `prix_dpu` (modifié)

Suppression des constantes `MODE_FOURNI` / `MODE_DECOMPOSE` — doublon avec `DpgfNoeud`, deux
vérités sur la même question. L'origine du coût vit **uniquement** sur le nœud du bordereau.

### Le flux de saisie cible

Le chiffreur **ne perd aucun geste**. Le bouton « prix fourni » ne disparaît pas : il change de
nom et le nombre saisi change de sens.

```
Article 3.2.1 — Enduit extérieur sur façade              1 240 m²

Mon coût, je l'établis :  ( ) je décompose   ( ) forfait   (•) j'estime
                          └ changeable à tout moment, sans perte de saisie

┌─ j'estime ──────────────────────────────────────────────┐
│  je saisis :  (•) un coût   ( ) un prix de vente         │
│  Coût                               [ 46,00 ] DH/m²      │
└──────────────────────────────────────────────────────────┘

┌─ forfait ───────────────────────────────────────────────┐
│  Montant sous-traitant              [ 46,00 ] DH/m²      │
│  Sous-traitant (facultatif)         [ … ]                │
│  Offre liée   (facultatif)          [ … ]                │
└──────────────────────────────────────────────────────────┘

┌─ je décompose ──────────────────────────────────────────┐
│  La grille actuelle, inchangée. Le coût se calcule.      │
│  Repère si une estimation précédait :                    │
│      « Tu visais 46,00 — ta décomposition donne 44,20 »  │
└──────────────────────────────────────────────────────────┘

        ▼  dans les trois cas, le même bloc en dessous

   Coût                                46,00
   + frais généraux    8 %             49,68     coût de revient
   + marge             7 %             53,16     prix de vente HT
   Total ligne (1 240 m²)          65 918,40
```

`ESTIME` → `DECOMPOSE` conserve l'estimation comme repère : le chiffreur pose ses prix vite sur
200 lignes, puis ne décompose que les 20 qui pèsent, en voyant à chaque fois si son intuition
tenait.

### Nouveau modèle de lecture — `SyntheseCoutAffaire`

Pas une table. Une projection calculée à la demande sur un dossier d'étude :

```
montantTotalHt, coutTotal, marge, margePercent
repartitionParOrigine : { DECOMPOSE: %, FORFAIT: %, ESTIME: %, DEDUIT: % }
                        (en montant, pas en nombre de lignes)
```

**La marge n'est calculée que sur les lignes à coût établi.** Les lignes `cout_deduit` sont
sorties du numérateur et affichées à part — sinon leur marge vaut mécaniquement le taux cible,
et la synthèse affiche une perfection qui ne veut rien dire.

```
Marge sur coûts établis        21 %   (sur 63 % du montant)
Coût déduit d'un prix           —     (sur 37 % du montant)
```

Consommée par l'étape 5 et par le dossier de validation.

### Garde-fous (`GatesEtude`)

| Gate | Avant | Après |
|---|---|---|
| Étape 3 | Ignore les articles `FOURNI` | Exige `origine_cout` et `cout_unitaire > 0` sur **tout** article |
| Étape 4 | Ignore les articles `FOURNI` | Couvre aussi les `FORFAIT` (un forfait consultable est consultable) |
| Étape 5 | N'exige pas FG/marge sur `FOURNI` | Exige FG/marge partout. **Non bloquant** : remonte le % de coûts estimés |

Une estimation n'est jamais bloquante. Elle est **comptée**.

---

## Phase 2 — Référence typée et gel du prix

### `composants_dpu` (modifié)

| Champ | Action | Détail |
|---|---|---|
| `article_ou_poste_id` `VARCHAR(100)` | **supprimé** | |
| `reference_type` | **ajouté** | `ITEM` \| `OUVRAGE` \| `LIBRE` |
| `item_id` | **ajouté** | `UUID` FK `items`, nullable |
| `ouvrage_id` | **ajouté** | `UUID` FK `ouvrages`, nullable |
| `libelle` | **ajouté** | Toujours renseigné — l'affichage ne dépend pas de la résolution |
| `prix_source_ref_id` | **ajouté** | La ligne catalogue / l'`ItemPrice` / la facture d'origine |
| `prix_date_source` | **ajouté** | `DATE` |
| `prix_currency_id` | **ajouté** | `UUID` |
| `prix_libelle_source` | **ajouté** | « Catalogue Lafarge — 12/06/2026 » |
| `source_prix`, `prix_unitaire`, `offre_fournisseur_id`, `suggere_par_ia` | conservés | |

**Contrainte** : exactement une des trois formes est valide.

```
reference_type = ITEM     → item_id NOT NULL, ouvrage_id NULL
reference_type = OUVRAGE  → ouvrage_id NOT NULL, item_id NULL
reference_type = LIBRE    → les deux NULL, libelle seul
```

`LIBRE` existe pour ne **jamais** bloquer le chiffreur. Il est visible dans l'interface et
rattrapable après coup — c'est aussi le vivier du rapprochement de la phase 5.

**Les sept champs de gel** (`prix_unitaire`, `source_prix`, `prix_source_ref_id`,
`prix_date_source`, `prix_currency_id`, `prix_libelle_source`, `offre_fournisseur_id`)
correspondent exactement au contenu de
[`PrixResolu`](../../backend/modules/item/src/main/java/ma/nafura/item/service/prix/PrixResolu.java).
Aujourd'hui deux sur sept sont persistés. C'est le seul correctif nécessaire à la décision D.

### `composants_ouvrage` (modifié)

Même traitement : `article_id VARCHAR(100)` → `reference_type` + `item_id` + `ouvrage_id` +
`libelle`.

**Pas de champ de gel** : la bibliothèque porte des rendements, pas des prix figés. Son
`prix_unitaire` reste un indicatif daté (D10).

### Branchement de `ResolutionPrixService`

À la création ou au rafraîchissement d'un composant `reference_type = ITEM`, le prix est
résolu par le service existant (7 sources, `basePrixChiffrage` paramétrable, conversion à la
date de référence) et **intégralement gelé** sur le composant. Aucun changement dans le
service lui-même.

### Indexes

```sql
CREATE INDEX ON composants_dpu (tenant_id, item_id)    WHERE item_id IS NOT NULL;
CREATE INDEX ON composants_dpu (tenant_id, ouvrage_id) WHERE ouvrage_id IS NOT NULL;
CREATE INDEX ON composants_dpu (tenant_id, reference_type) WHERE reference_type = 'LIBRE';
```

Le troisième sert le rattrapage et le rapprochement.

### Que se passe-t-il quand l'article n'existe pas ?

**On ne lui demande jamais de créer un article pendant sa saisie.** C'est ainsi qu'un ERP se
fait abandonner : quinze lignes à décomposer, une fenêtre de création à la troisième, et il
rouvre Excel. Trois autres raisons : il ne sait pas si l'article existe déjà sous un autre nom
(il fabriquerait le doublon qu'on cherche à supprimer) ; le référentiel n'appartient pas
forcément au chiffreur ; et la moitié de ces lignes ne sont pas des articles — « amenée et
repli », « aléas 3 % », « faux frais » n'ont rien à faire dans un référentiel.

**Trois moments, un seul obligatoire — aucun.**

| Moment | Ce qui se passe |
|---|---|
| **Pendant la saisie** | Il tape, on cherche au fil de la frappe. Rien ne correspond : il garde son texte, le composant est `LIBRE`, avec son prix manuel et son rendement. Une affordance discrète « + créer » à côté du champ — proposée, jamais imposée |
| **À la fin du dossier** | Écran de rattrapage : « 12 composants non rattachés », **groupés par libellé similaire**. « Ciment CPJ 45 » apparaît 4 fois → traité une fois. Trois actions : rapprocher, créer, laisser libre |
| **À la validation** | « Verser ces 8 prix saisis dans votre bibliothèque de prix ? » — proposé, jamais fait d'office : un prix d'étude est prospectif, pas un tarif |

**La fiche de création est presque vide** : libellé, unité, nature. La [`Nature`](../../backend/modules/item/src/main/java/ma/nafura/item/domain/Nature.java)
pilote déjà l'unité et le poste budgétaire par défaut — trois champs suffisent. L'article est
marqué « à compléter » ; le responsable du référentiel finit dans son écran à lui.

**Qui a le droit de créer** — paramètre tenant, deux modes : `LIBRE` (le chiffreur crée
directement — bon défaut pour une PME) ou `CONTROLEE` (il demande, le responsable valide). Ne
pas coder un seul comportement en dur.

**L'état « ne sera jamais un article »** — indispensable. Marqueur `hors_referentiel` sur le
composant. Sans lui, la liste de rattrapage grossit à chaque étude et plus personne ne l'ouvre.
*Une liste qu'on peut vider est une liste qu'on utilise.*

Enfin : la création se fait **toujours dans les items du tenant**, jamais dans le catalogue
Sektor. Et un composant resté `LIBRE` demeure candidat au rapprochement automatique — quand le
catalogue s'enrichira, il pourra retrouver des lignes laissées libres six mois plus tôt.

---

## Phase 3 — Ouvrage composite et bibliothèque

### Récursivité

Aucun champ nouveau : `ouvrage_id` sur les deux tables de composants suffit (phase 2). Ce qui
manque est le **calcul**.

```
déboursé(ouvrage) = Σ composants :
    reference_type = ITEM     → rendement × prix_unitaire
    reference_type = OUVRAGE  → rendement × déboursé(sous-ouvrage)   ← récursion
    reference_type = LIBRE    → rendement × prix_unitaire (saisi)
```

On remonte le **déboursé**, jamais le prix de vente : FG et marge ne s'appliquent qu'une fois,
au sommet. Sinon marge sur marge, invisible et non auditable. Seule exception, la
sous-traitance, via `inclure_frais_et_marge` sur le composant.

**Protections** :
- détection de cycle par parcours en profondeur **à l'écriture** (pas au calcul)
- profondeur maximale : 5
- un ouvrage ne peut se contenir lui-même, ni directement ni indirectement

### `ouvrages` (modifié)

| Champ | Action | Détail |
|---|---|---|
| `code_lot`, `code_famille` | **ajoutés** | Codification — à figer **avant** cette phase |
| `origine` | **ajouté** | `SAISIE` \| `ETUDE` \| `CATALOGUE` |
| `source_etude_id` | **ajouté** | `UUID`, nullable — l'étude qui l'a versé |
| `catalog_cle_stable` | **ajouté** | `VARCHAR`, nullable. **Chaîne, jamais une FK** |
| `category` `VARCHAR(30)` | remplacé | Par `code_lot` / `code_famille` |

### Capitalisation

À la validation d'une étude, les articles `origine_cout = DECOMPOSE` sont **proposés** au
versement en bibliothèque. Proposés, pas versés : l'utilisateur choisit. Si un ouvrage de même
code existe déjà, on propose une comparaison de rendements plutôt qu'un écrasement.

---

## Phase 4 — Fournisseurs, unités, conditionnements

### `unit_of_measure` (modifié)

| Champ | Action | Détail |
|---|---|---|
| `facteur_vers_base` | **ajouté** | `NUMERIC(18,8) NOT NULL DEFAULT 1`. Ex. : `L → 1`, `m³ → 1000` |
| `est_base` | **ajouté** | `BOOLEAN`. Une seule unité de base par catégorie |

**Contrainte** : exactement une unité `est_base = true` par `uom_category_id` et par tenant.
La conversion n'est possible **qu'à l'intérieur d'une même catégorie** — convertir des litres
en heures doit échouer explicitement, pas silencieusement.

### `catalogue_fournisseur_lignes` (modifié)

| Champ | Action | Détail |
|---|---|---|
| `fournisseur_id` `VARCHAR(100)` | **typé** | `UUID` FK `partners` (rôle fournisseur) |
| `article_id` `VARCHAR(100)` | **typé** | `UUID` FK `items` |
| `uom` `VARCHAR(30)` | **typé** | `uom_id UUID` FK `unit_of_measure` |
| `conditionnement_quantite` | **ajouté** | `NUMERIC(18,4)`. Ex. : `15` |
| `conditionnement_uom_id` | **ajouté** | `UUID`. Ex. : `L` |
| `prix_unitaire_ht` | conservé | **Le prix commercial**, tel qu'il est facturé. 450 DH le pot |
| `prix_normalise` | **ajouté** | Calculé, jamais saisi. `450 / 15 = 30` |
| `uom_normalise_id` | **ajouté** | L'unité de base de la catégorie. `L` |

Le prix commercial reste la vérité. Le normalisé sert la comparaison, et se recalcule.

### Nouveau — `ComparateurFournisseurService`

Pour un `item_id` et une date : la liste des lignes valides, prix commercial **et** normalisé,
triée par prix normalisé, avec le délai et la quantité minimale. C'est ce qui répond à
« A : 30 DH/L — B : 28 DH/L ».

---

## Chantier V — Validation à quatre yeux et avis d'exécution

Indépendant des phases. Module `etudes` + paramétrage des rôles.

### Ce qui existe déjà et fonctionne

Deux niveaux d'approbation (`validationEtape` N1 → N2), refus que l'auteur valide son étude
(paramètre tenant `etudes.auteurPeutValider`), verrouillage en écriture dès la soumission
(`StatutDossierEtude.estModifiable()` = `BROUILLON` ou `EN_ETUDE` seulement), refus avec motif
obligatoire. **Ne rien réécrire.**

### Les trois trous à corriger

**1. Le joker `etude.*` annule tout.** `BTP_DIRECTEUR_TRAVAUX` **et** `BTP_CONDUCTEUR_TRAVAUX`
le portent, ce qui leur donne `update` **et** `approve`. Les lignes explicites qui suivent
(`etude.approve` au directeur seulement) sont décoratives — le joker a déjà tout donné. Un
directeur peut donc modifier un chiffrage puis l'approuver : le quatre-yeux est vide.
→ Supprimer les jokers, énumérer les permissions par rôle.

**2. Le garde-fou surveille la mauvaise personne.** Il compare l'approbateur à `createdBy`. Or
le dossier porte aussi un `chargeEtudeUserId`, souvent différent. Si l'assistante crée le
dossier et que l'ingénieur chiffre, l'ingénieur peut approuver son propre travail.
→ Comparer à l'ensemble des intervenants ayant modifié.

**3. Aucun seuil de montant.** Deux niveaux systématiquement, pour 80 000 DH comme pour 12 M.
Le module `approbations` a une matrice de pouvoirs faite pour ça, non branchée sur ce critère.

### `dossier_intervenant` (nouveau)

Sert deux besoins d'un coup : inviter des personnes précises sur une étude, et savoir qui a
fait quoi.

| Champ | Détail |
|---|---|
| `dossier_etude_id`, `tenant_id` | |
| `user_id`, `nom` | |
| `role` | `CHARGE_ETUDE` \| `REVISEUR` \| `AVIS` \| `APPROBATEUR` |
| `invite` | `BOOLEAN` — sollicité explicitement, vs intervenu de fait |
| `premiere_action_at`, `derniere_action_at` | |

**Règle d'approbation** : un utilisateur présent avec le rôle `CHARGE_ETUDE` ou `REVISEUR` ne
peut pas approuver ce dossier. Le rôle `AVIS` **ne bloque pas** — peser n'est pas écrire.

### `avis_execution` (nouveau)

| Champ | Détail |
|---|---|
| `id`, `tenant_id` | |
| `dossier_etude_id` | |
| `dpgf_noeud_id` | Le poste visé |
| `composant_dpu_id` | `UUID`, nullable — **second temps**, pas au premier jet |
| `niveau` | `REALISABLE` \| `DIFFICILE` \| `IRREALISABLE` |
| `commentaire` | **Obligatoire** si `niveau ≠ REALISABLE` |
| `ecart_propose` | `NUMERIC(18,4)`, nullable. « + 4,00 DH/m² » |
| `auteur_user_id`, `auteur_nom` | |
| `statut` | `OUVERT` \| `PRIS_EN_COMPTE` \| `ECARTE` |
| `motif_traitement` | **Obligatoire** si `statut = ECARTE` |
| `traite_par`, `traite_le` | |
| `created_at`, `updated_at` | |

```sql
CREATE INDEX ON avis_execution (tenant_id, dossier_etude_id, statut);
CREATE INDEX ON avis_execution (tenant_id, dpgf_noeud_id);
```

### Permissions

| Rôle | Permissions |
|---|---|
| `BTP_INGENIEUR` | `etude.read`, `etude.create`, `etude.update`, `etude.submit` — inchangé |
| `BTP_CONDUCTEUR_TRAVAUX` | `etude.read`, **`etude.avis`** — plus de joker, plus d'`approve` |
| `BTP_CHEF_CHANTIER` | `etude.read`, **`etude.avis`** |
| `BTP_DIRECTEUR_TRAVAUX` | `etude.read`, `etude.update`, `etude.submit`, `etude.approve`, `etude.avis`, `etude.delete` — énumérées, plus de joker |

`etude.avis` = lire l'étude et poser un avis. **Aucun droit d'écriture sur le chiffrage.**

### Garde-fou et paramètres

Le gate de l'étape 5 remonte le nombre d'avis `OUVERT` et `ECARTE` — **non bloquant**, mais
visible dans le dossier de validation.

| Paramètre tenant | Défaut |
|---|---|
| `etudes.auteurPeutValider` | `false` — existant |
| `etudes.revueExecutionObligatoireAuDessusDe` | `null` (désactivé) — une PME de dix personnes ne veut pas d'une étape de plus |
| `etudes.seuilDeuxNiveauxApprobation` | à câbler sur la matrice de pouvoirs d'`approbations` |

---

## Phase 5 — Catalogue Sektor

Nouveau module backend `catalogue`. **Aucune de ses tables ne porte de `tenant_id`, et aucune
ne référence une table tenant.**

### `catalog_articles`

| Champ | Détail |
|---|---|
| `id` | `UUID` |
| `cle_stable` | `VARCHAR(120) UNIQUE` — slug immuable : `peinture-acrylique-interieure` |
| `nature` | Même vocabulaire que [`Nature`](../../backend/modules/item/src/main/java/ma/nafura/item/domain/Nature.java) |
| `libelle`, `description` | |
| `unite_code` | Code d'unité, **pas** une FK vers `unit_of_measure` (qui est tenant) |
| `code_famille` | Codification |
| `statut` | `BROUILLON` \| `PUBLIE` \| `RETIRE` |
| `edition_publication` | L'édition qui l'a introduit |
| `remplace_par` | `UUID`, nullable — dépréciation sans suppression |

### `catalog_ouvrages`

Mêmes principes. Plus : `code_lot`, `code_ouvrage`, `unite_code`, `version`.

### `catalog_composants`

`catalog_ouvrage_id`, `rang`, `nature`, `libelle`, `unite_code`, `rendement`,
`catalog_article_cle` (nullable), `base_rendement` (`PAR_UNITE` \| `PAR_JOUR`).

**Le cœur de la valeur du catalogue est ici** : le rendement, pas le prix.

### `catalog_prix_reference`

`catalog_article_cle`, `prix`, `devise`, `zone` (nullable — Maroc entier par défaut),
`valid_from`, `valid_to`, `source`, `edition`.
Indicatif et daté. Jamais dérivé des prix d'un seul tenant — voir
[`03-catalogue-produit.md`](03-catalogue-produit.md).

### `catalog_editions`

`code` (`2027.1`), `publie_le`, `notes`. Une étude enregistre l'édition qu'elle a utilisée.

### `catalog_candidats`

La file de gouvernance. `libelle_propose`, `nature`, `nb_tenants_confirmants`,
`exemples_libelles` (jsonb, **anonymisés**), `statut` (`PROPOSE` \| `ACCEPTE` \| `REFUSE`),
`propose_par` (`REGLE` \| `IA`), `model_version`, `decide_par`, `decide_le`.

### `item_match` — la table de rapprochement

| Champ | Détail |
|---|---|
| `tenant_id` | Le rapprochement, lui, est une donnée tenant |
| `source_type` | `TENANT_ITEM` \| `TENANT_OUVRAGE` \| `SUPPLIER_LINE` \| `COMPOSANT_LIBRE` |
| `source_id` | `UUID` |
| `catalog_cle` | La clé stable visée — **chaîne, pas une FK** |
| `methode` | `EXACT` \| `REGLE` \| `TRIGRAM` \| `VECTEUR` \| `LLM` \| `MANUEL` |
| `confiance` | `NUMERIC(5,4)` |
| `statut` | `SUGGERE` \| `VALIDE` \| `REJETE` |
| `valide_par`, `valide_le`, `model_version`, `created_at` | Auditabilité |

**Une seule table, pas quatre relations spécialisées** : la sémantique est identique dans tous
les sens (une proposition, une confiance, un statut, une traçabilité). Contrepartie assumée :
la FK sur `source_id` n'est pas contraignable — compensée par des index partiels par
`source_type`.

```sql
CREATE INDEX ON item_match (tenant_id, source_type, source_id, statut);
CREATE INDEX ON item_match (catalog_cle, statut);
```

### Recherche

`pg_trgm` (index GIN) sur `catalog_articles.libelle` et `catalog_ouvrages.libelle`, plus
`tsvector` français. Natif Postgres, cohérent avec le choix déjà fait pour la recherche CPS.
**Le vectoriel n'est pas au programme** : il ne sera envisagé que si le trigram plafonne, mesures
à l'appui.

---

## Ce qui ne change pas

| Élément | Pourquoi |
|---|---|
| `items`, `item_prices` | Le référentiel tenant est sain. `ItemPrice` est daté, multi-devise, indexé |
| `ResolutionPrixService` | 7 sources, `basePrixChiffrage`, conversion à la date de référence. Rien à refaire |
| `Nature` (9 valeurs) | Pilote stockabilité, valorisation, unité et poste budget par défaut. Meilleur qu'un `type` plat |
| Historisation catalogue fournisseur | Un nouveau prix ferme le précédent, jamais d'écrasement |
| `DpuCalculator` | Le calcul est prouvé sur 84 ouvrages réels. La phase 3 l'étend, ne le réécrit pas |
| `dpu_versions.snapshot_json` | Reste l'archive de version. La vérité ligne à ligne passe sur `composants_dpu` |
| Machine à états, wizard 5 étapes | Valides. Seul le nom de l'étape 3 change |

## Ce qu'on ne crée pas, malgré la proposition initiale

| Proposition | Décision | Raison |
|---|---|---|
| Table `Item` unique catalogue + tenant, avec `scope` | **Non** | `tenant_id` est `NOT NULL` et toute requête passe par `findByTenantId`. Pas de RLS pour rattraper un oubli. Un `WHERE` manquant = fuite. Et une table physique partagée contrarie exactement l'objectif d'extraction |
| `ItemComposition` générique et unique | **Non** | `composants_ouvrage` (rendements capitalisés) et `composants_dpu` (instance figée) ne sont pas un doublon. Les fusionner détruirait la propriété de gel |
| Ouvrage devenant un `Item` | **Non** | Prix d'article = donnée ; prix d'ouvrage = résultat. Une table où la moitié des lignes ne doit jamais porter de prix |
| 7 types de prix | **Non** | `AVERAGE_PURCHASE_PRICE` = `Item.pmp`, `LAST_PURCHASE_PRICE` = source `HISTORIQUE`, `CALCULATED_COST` = `PrixDpu.deboursSec`. Les stocker créerait trois vérités divergentes |
| Table d'audit des prix | **Non** | L'historisation par intervalles `valid_from`/`valid_to` la rend inutile |
| `supplier_id` sur `ItemPrice` | **Non** | Le prix fournisseur vit dans `catalogue_fournisseur_lignes`, avec son cycle propre. Les deux sont réconciliés par `ResolutionPrixService` |
