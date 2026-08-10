# Phases et critères d'acceptation

> Chaque phase est livrable seule et a une valeur métier vérifiable seule.
> Pré-production : pas de reprise de données, les migrations peuvent recréer.
> Vérification sur staging, base vierge, `ddl-auto=validate`.

| # | Phase | Poids | Bloqué par |
|---|---|---|---|
| 1 | Le coût de chaque ligne | S | — |
| 2 | Référentiel branché + gel du prix | **L** | 1 |
| 3 | Ouvrage composite + bibliothèque | M | 2, **codification** |
| 4 | Fournisseurs, unités, conditionnements | M | 2 |
| 5 | Catalogue Sektor + rapprochement | **L** | 3, 4, **clause CGU** |
| 6 | Intelligence | M | 5 |
| 7 | Chaînage aval | **L** | 2 seulement — avançable |
| V | Validation à quatre yeux + avis d'exécution | M | rien — indépendant |

---

## Préalable — hors code

### PR1 — Clause d'usage des données

Ajouter aux CGU le droit d'exploiter des données **anonymisées et agrégées** pour construire un
référentiel métier. **Avant le premier client réel.** Non rétroactif.

### PR2 — Codification

Figer le schéma de codes lot / famille / ouvrage. **Avant la phase 3.**

Point de départ disponible : la taxonomie de 60 catégories déjà semée
(`item/…/v1.1/003_seed_item_categories_taxonomy.sql`) et les 16 familles du corpus réel
(`etudes/src/test/resources/corpus/sous-details-gros-oeuvre.json`). À arbitrer avec l'expert
métier — ce n'est pas une décision technique.

Un code doit être **stable, lisible, et survivre aux versions**. Il sera la clé de promotion
vers le catalogue.

---

## Phase 1 — Le coût de chaque ligne

**Valeur** : le patron voit la marge réelle de l'affaire avant de signer.

### Périmètre

Module `etudes` uniquement. Ne touche ni `item`, ni `achats`.

- `DpgfNoeud` : `mode` supprimé ; `prix_fourni_base` **renommé** `cout_unitaire` ;
  `origine_cout`, `cout_revient`, `estimation_saisie_en`, `cout_deduit`, `forfait_partner_id`,
  `forfait_offre_id` ajoutés
- `PrixDpu` : constantes `MODE_*` supprimées (doublon)
- Calcul du prix de vente unifié pour les trois origines — **branchement de la règle déjà
  annoncée par `prixFourniBase`**, pas une règle nouvelle
- `GatesEtude` : étapes 3, 4 et 5 revues
- Projection `SyntheseCoutAffaire`
- Front : l'étape 3 s'appelle « Coût » ; sélecteur d'origine à trois choix ; les trois lignes
  coût / coût de revient / prix de vente ; bandeau de synthèse à l'étape 5

> ⚠️ Front — écrire dans `web/app/applications/erp/` (seul arbre compilé) tant que la phase 3
> du chantier `front-ownership` n'est pas terminée.

### Critères d'acceptation

- [ ] Aucune occurrence de `MODE_FOURNI` / `MODE_DECOMPOSE` ni de `prixFourniBase` dans le dépôt
- [ ] `cout_unitaire` est non nul et > 0 sur tout article franchissant l'étape 3
- [ ] Les **trois lignes** sont affichées et stockées : coût, coût de revient, prix de vente.
      Cas de référence : `46,00 → 49,68 → 53,16` avec FG 8 % et marge 7 %
- [ ] Un forfait de sous-traitance conserve son coût, son fournisseur et son offre d'origine
- [ ] Une estimation saisie en prix de vente redonne le coût attendu :
      `1 000 DH` avec FG 8 % et marge 7 % → coût `865,33 DH`, et le prix de vente recalculé
      revient à `1 000 DH` à l'arrondi près. Le nœud porte `cout_deduit = true`
- [ ] La marge de `SyntheseCoutAffaire` **exclut** les lignes `cout_deduit` ; elles sont
      affichées à part avec leur part du montant
- [ ] Une étude 100 % estimée **franchit** les étapes — mais le dossier de validation affiche
      « 100 % du montant repose sur des coûts estimés »
- [ ] `SyntheseCoutAffaire` : la répartition est en **montant**, pas en nombre de lignes
- [ ] **Aucune nature de composant n'est imposée.** Un ouvrage décomposé en une seule ligne
      franchit l'étape 3
- [ ] Basculer `ESTIME` → `DECOMPOSE` conserve l'estimation comme repère et affiche l'écart
- [ ] Les 84 ouvrages du corpus réel retrouvent leurs totaux (non-régression du calcul)

---

## Phase 2 — Référentiel branché et gel du prix

**Valeur** : le chiffreur arrête de retaper ses prix. L'étude devient auditable.

C'est la phase la plus lourde et la plus rentable de l'epic.

### Périmètre

- `composants_dpu` et `composants_ouvrage` : `VARCHAR(100)` → référence typée
- `composants_dpu` : les cinq champs de gel manquants
- Branchement de `ResolutionPrixService` à la création/rafraîchissement d'un composant `ITEM`
- Recherche d'article à la saisie (remplace le `LIKE` de `ItemCatalogResolver`)
- Bouton « rafraîchir les prix » sur une étude non validée — et **impossible** sur une étude validée
- Écran de rattrapage : composants `LIBRE` d'un dossier, **groupés par libellé similaire**
- Création d'article allégée (libellé, unité, nature) + marqueur `hors_referentiel`
- Paramètre tenant : création `LIBRE` ou `CONTROLEE`
- À la validation : proposer le versement des prix saisis en bibliothèque de prix

### Critères d'acceptation

- [ ] Aucune référence article en `VARCHAR` dans `etudes`
- [ ] La contrainte d'exclusivité `ITEM` / `OUVRAGE` / `LIBRE` est vérifiée en base, pas
      seulement en Java
- [ ] Un composant `ITEM` reçoit son prix automatiquement, avec sa source affichée :
      « 1,20 DH — catalogue Lafarge, 12/06/2026 »
- [ ] Les **sept** informations de `PrixResolu` sont persistées sur le composant
- [ ] Test de gel : un prix change dans le référentiel → l'étude validée est **inchangée**,
      montant et libellé de source compris
- [ ] Test de gel dur : la ligne catalogue d'origine est **supprimée** → l'étude reste lisible
      et cohérente
- [ ] Saisir un libellé inconnu ne bloque jamais : le composant est créé en `LIBRE`, **sans
      aucune fenêtre de création**
- [ ] L'écran de rattrapage **groupe** les libellés similaires : « ciment CPJ 45 » présent
      4 fois dans le dossier apparaît une fois et se traite une fois
- [ ] Un composant marqué `hors_referentiel` (« aléas », « faux frais ») ne réapparaît **plus
      jamais** dans la liste de rattrapage
- [ ] La fiche de création n'exige que libellé, unité et nature ; l'unité et le poste budget
      sont pré-remplis depuis la `Nature`
- [ ] En mode `CONTROLEE`, un chiffreur sans droit sur le référentiel ne peut pas créer — il
      dépose une demande, et sa saisie n'est pas perdue

---

## Phase 3 — Ouvrage composite et bibliothèque

**Valeur** : la 2ᵉ affaire se chiffre bien plus vite que la 1ʳᵉ. C'est l'argument de vente n° 1.

**Bloquée par PR2 (codification).**

### Périmètre

- Récursion dans `DpuCalculator` : un composant `OUVRAGE` remonte son **déboursé**
- Détection de cycle à l'écriture, profondeur max 5
- `inclure_frais_et_marge` sur le composant — seule exception, la sous-traitance
- `ouvrages` : `code_lot`, `code_famille`, `origine`, `source_etude_id`, `catalog_cle_stable`
- Capitalisation : à la validation d'une étude, proposer le versement des articles décomposés
- Chargement du corpus réel (84 ouvrages) en bibliothèque sur un tenant de démonstration

### Critères d'acceptation

- [ ] Cas réel « cloison → mortier » : le déboursé du sous-ouvrage remonte, FG et marge ne
      s'appliquent qu'**une fois** au sommet
- [ ] Test anti-marge-sur-marge : ouvrage A contenant B — le résultat est identique à celui
      d'un A dont les composants de B seraient recopiés à plat
- [ ] `inclure_frais_et_marge` sur un composant de sous-traitance : les frais du sous-traitant
      sont bien inclus, et le cas est tracé
- [ ] Un cycle A → B → A est **refusé à l'écriture**, avec un message nommant les ouvrages en cause
- [ ] Profondeur 6 refusée ; profondeur 5 acceptée
- [ ] La validation d'une étude **propose** le versement, ne verse jamais d'office
- [ ] Versement sur un code existant : comparaison de rendements proposée, jamais d'écrasement silencieux
- [ ] Les 84 ouvrages du corpus se chargent et retrouvent leurs totaux

---

## Phase 4 — Fournisseurs, unités, conditionnements

**Valeur** : « Fournisseur A : 30 DH/L — Fournisseur B : 28 DH/L. »

### Périmètre

- `unit_of_measure` : `facteur_vers_base`, `est_base`, contrainte d'unicité par catégorie
- Service de conversion — **strictement intra-catégorie**
- `catalogue_fournisseur_lignes` : trois références typées, conditionnement, prix normalisé
- `ComparateurFournisseurService`
- Écran de comparaison fournisseurs sur un article

### Critères d'acceptation

- [ ] Le scénario de référence passe :
      `pot 15 L à 450 MAD → 30,00 MAD/L` et `pot 20 L à 560 MAD → 28,00 MAD/L`,
      B classé devant A
- [ ] Le prix commercial (450 MAD le pot) reste stocké **tel quel** et affiché tel quel
- [ ] Le prix normalisé est **recalculé**, jamais saisi
- [ ] Convertir litres → heures **échoue explicitement**
- [ ] Une catégorie sans unité de base est refusée à la création
- [ ] Aucune référence en `VARCHAR` dans `catalogue_fournisseur_lignes`
- [ ] L'historisation existante continue de fonctionner : un nouveau prix ferme le précédent

---

## Phase 5 — Catalogue Sektor et rapprochement

**Valeur** : un nouveau client ne démarre plus sur une page blanche.

**Bloquée par PR1 (clause CGU).** Détail de gouvernance dans
[`03-catalogue-produit.md`](03-catalogue-produit.md).

### Périmètre

- Module backend `catalogue`, indépendant
- `catalog_articles`, `catalog_ouvrages`, `catalog_composants`, `catalog_prix_reference`,
  `catalog_editions`, `catalog_candidats`
- `item_match` + index
- Pipeline de rapprochement **déterministe** : normalisation → exact → règles → trigram → liste courte
- Amorçage du catalogue depuis le corpus réel, après anonymisation
- Console éditoriale (hors application client)
- Import depuis le catalogue vers un tenant

### Critères d'acceptation

- [ ] **Test automatisé** : aucune clé étrangère ne part d'une table `catalog_*` vers une
      table portant `tenant_id`. Ce test échoue le build s'il est violé
- [ ] Aucune table `catalog_*` ne porte de colonne `tenant_id`
- [ ] Le scénario de référence passe : « Peinture blanche mur intérieur » (tenant) est
      rapproché de « Peinture acrylique intérieure » (catalogue) avec une confiance affichée
- [ ] Le rapprochement est **persisté** avec sa méthode, sa confiance, son statut et son auteur
- [ ] Un rapprochement rejeté n'est pas re-proposé à l'identique
- [ ] Aucun appel LLM dans ce pipeline
- [ ] Temps de réponse : liste courte de 10 candidats sur un catalogue de 10 000 entrées,
      **sous 200 ms**, mesuré et consigné
- [ ] Un candidat confirmé par un seul tenant **ne peut pas** être promu — règle vérifiée par test
- [ ] Une étude enregistre l'édition du catalogue qu'elle a utilisée
- [ ] Un article catalogue déprécié reste lisible dans les études qui l'ont utilisé

---

## Phase 6 — Intelligence

**Valeur** : l'assistance. Elle n'a de sens qu'une fois les phases 2, 3 et 5 faites — sans
données propres, elle invente.

### Périmètre

Les points d'ancrage existent déjà, en `NoOp` :
`DecompositionSuggestionPort`, `CatalogResolverPort`, `BordereauExtractionPort`,
`CpsDescriptifExtractionPort`.

- Implémentations réelles derrière les ports
- LLM en **dernier recours** : uniquement quand la liste courte déterministe ne tranche pas
- Job d'enrichissement du catalogue : regroupement des composants `LIBRE` et des items non
  rapprochés en candidats
- Détection de prix anormaux : « 18 % au-dessus de votre moyenne des 6 derniers mois »

### Critères d'acceptation

- [ ] **Aucune suggestion n'est persistée sans validation humaine.** Toute validation est
      tracée (`suggere_par_ia`, `model_version`, auteur, date)
- [ ] Le LLM n'est **pas** appelé quand le pipeline déterministe tranche — mesuré : taux
      d'appel LLM consigné
- [ ] Le job d'enrichissement ne crée que des `catalog_candidats`, jamais un article catalogue
- [ ] Un candidat sous le seuil de tenants confirmants n'atteint pas la console éditoriale
- [ ] Les libellés d'exemple attachés à un candidat sont anonymisés — aucun nom de tenant,
      aucun identifiant remontant à un client

---

## Phase 7 — Chaînage aval

**Valeur** : l'étude cesse de mourir avec le devis. Elle devient le budget du chantier, puis
l'écart prévu / réalisé. C'est le moment où tout l'effort des phases précédentes se transforme
en argent.

**Ne dépend que de la phase 2.** Peut être avancée si la priorité commerciale l'exige.

### Base

La spécification reste [`07-chainage-aval.md`](../etude-prix-unifiee/07-chainage-aval.md) de
l'ancien epic : devis → issue commerciale → conversion atomique marché + chantier → projection
du bordereau en arborescence chantier → ventilation du déboursé en budget prévisionnel →
traçabilité bidirectionnelle. Elle est bonne et complète. Ne pas la réécrire.

### Ce que les décisions de cet epic y changent

**La ventilation du budget ne fonctionne aujourd'hui que sur les lignes décomposées.** La
formule prévue —
`previsionnel(rubrique) = Σ (composant.rendement × composant.prixUnitaire) × article.quantite` —
suppose des composants. Une ligne `FORFAIT` ou `ESTIME` n'en a aucun : elle produirait un budget
à zéro, silencieusement.

Règle de ventilation complète, à ajouter :

| Origine du coût | Ventilation du budget prévisionnel |
|---|---|
| `DECOMPOSE` | Par nature de composant, formule existante |
| `FORFAIT` | Montant entier en rubrique `SOUS_TRAITANCE`, avec le partenaire s'il est connu |
| `ESTIME` (coût saisi) | Rubrique `NON_VENTILE`, montant = `cout_unitaire × quantité` |
| `ESTIME` (`cout_deduit`) | Rubrique `NON_VENTILE`, **signalé comme non fiable** |

Un budget partiellement non ventilé est une information utile pour le conducteur de travaux.
Un budget à zéro est un piège.

**Q4 devient facile à trancher.** Le budget de chantier est un budget de **déboursé** : il
consomme `cout_unitaire`, jamais `cout_revient` ni le prix de vente. Les frais généraux sont un
coût de structure, pas une dépense de chantier ; la marge est un résultat. Le champ
`cout_revient` créé en phase 1 rend la distinction explicite au lieu d'implicite.

**La traçabilité gagne un niveau.** Grâce au gel de la phase 2, le conducteur de travaux ne
remonte plus seulement à l'étude : il remonte au **prix source** — quelle offre, quelle date,
quel fournisseur. « Le budget disait 30 DH/L, sur devis Untel du 12/06. »

### Critères d'acceptation

Ceux de [`07-chainage-aval.md`](../etude-prix-unifiee/07-chainage-aval.md), plus :

- [ ] Une étude comportant des lignes `FORFAIT` et `ESTIME` produit un budget **non nul**, avec
      la part non ventilée affichée explicitement
- [ ] Une ligne `FORFAIT` alimente la rubrique `SOUS_TRAITANCE` avec son partenaire
- [ ] Le budget consomme `cout_unitaire`, jamais `cout_revient` ni `prix_unitaire` — vérifié
      par un contrôle croisé : `Σ budget = Σ (cout_unitaire × quantité)`
- [ ] Depuis une ligne de budget de chantier, on remonte au prix source figé de l'étude
- [ ] **Corrélation avis / écart** : l'écart moyen des postes ayant reçu un avis `DIFFICILE`
      ou `IRREALISABLE` est calculé et comparé à celui des autres postes

---

## Chantier V — Validation à quatre yeux et avis d'exécution

**Valeur** : un devis engage l'entreprise. Et celui qui exécutera doit pouvoir dire si c'est
tenable **avant** qu'on s'engage — aujourd'hui il décroche son téléphone, et il n'en reste rien.

**Indépendant.** Ne bloque rien, n'est bloqué par rien. Porte la décision G.

### Périmètre

- Suppression des jokers `etude.*` ; permissions énumérées par rôle ; nouvelle `etude.avis`
- Table `dossier_intervenant` — invitations et trace de qui a fait quoi
- Règle d'approbation : un `CHARGE_ETUDE` ou un `REVISEUR` du dossier ne peut pas l'approuver
- Table `avis_execution` + traitement obligatoire avant soumission
- Câblage de la matrice de pouvoirs d'`approbations` sur le montant
- Front : bloc d'avis sur le poste, compteur dans le dossier de validation

> Le circuit existant (deux niveaux, auteur exclu, verrouillage à la soumission) **fonctionne**.
> Ce chantier le corrige, il ne le réécrit pas.

### Critères d'acceptation

- [ ] Aucune permission `etude.*` dans le dépôt ; chaque rôle a sa liste énumérée
- [ ] Un conducteur de travaux **ne peut plus** approuver une étude
- [ ] Un directeur de travaux qui a modifié le chiffrage **ne peut pas** approuver ce dossier —
      c'est le niveau au-dessus qui signe
- [ ] Le cas « l'assistante crée, l'ingénieur chiffre » est couvert : l'ingénieur ne peut pas
      approuver, alors que `createdBy` ne le désigne pas
- [ ] Un utilisateur intervenu **uniquement** par un avis conserve son droit d'approbation
- [ ] Un avis `DIFFICILE` ou `IRREALISABLE` **sans commentaire** est refusé
- [ ] Un avis écarté **sans motif** est refusé
- [ ] Une étude comportant des avis ouverts ou écartés **peut être soumise** — le dossier de
      validation les affiche, sans blocage
- [ ] `etude.avis` ne donne **aucun** droit d'écriture sur le chiffrage — vérifié par test
- [ ] Sous le seuil configuré, un seul niveau d'approbation est demandé
- [ ] Un avis reste attaché à son poste après validation de l'étude et reste lisible depuis le
      chantier (prérequis de la corrélation en phase 7)

---

## Suivi

| Phase | Statut | Notes |
|---|---|---|
| PR1 — clause CGU | ⬜ | Hors code |
| PR2 — codification | ⬜ | Arbitrage métier requis |
| 1 — Coût de chaque ligne | ⬜ | Absorbe le chiffrage du lot 6 |
| 2 — Référentiel branché | ⬜ | Absorbe la part « prix » du lot 5 |
| 3 — Ouvrage composite | ⬜ | Absorbe le lot 4 |
| 4 — Fournisseurs et unités | ⬜ | Absorbe la part « comparaison » du lot 5 |
| 5 — Catalogue | ⬜ | |
| 6 — Intelligence | ⬜ | |
| 7 — Chaînage aval | ⬜ | Reprend le lot 7, avec la ventilation des lignes non décomposées |
| V — Validation + avis d'exécution | ⬜ | Reprend le circuit du lot 6. Indépendant |

**Hors epic, à ne pas oublier** : lot 3 (import non destructif), chantier `front-ownership`.

Légende : ⬜ à faire · 🟡 en cours · ✅ terminé · 🔴 bloqué
