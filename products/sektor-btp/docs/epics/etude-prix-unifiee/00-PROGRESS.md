# Suivi d'avancement

> Mettre à jour à chaque fin de tâche. Ne pas cocher une tâche dont les critères d'acceptation du
> lot ne sont pas vérifiés.

**Dernière mise à jour** : 2026-07-19 — J1 vérifié sur staging ; lot 2 **backend** livré ; chantier front phases 0-2 terminées

---

## Chantier préalable — epic séparé

**P1 — Sektor possède son front** → [`../front-ownership/`](../front-ownership/00-REVUE-ARCHI.md)

Option A retenue le 2026-07-19, avec un objectif élargi : Sektor possède tout son code front et ne
dépend que des bibliothèques partagées de la plateforme. La revue d'architecture a révélé, au-delà
du doublon applicatif, que **la plateforme dépend de l'application** (23 fichiers) et que **le design
system dépend du métier marocain**.

**Impact sur cet epic** :

| Lots | Impact |
|---|---|
| **9, 1, 8** — purement backend | ✅ **aucun** — peuvent démarrer immédiatement, en parallèle |
| **2** et suivants — créent du front | 🔴 **ne pas démarrer** avant la fin de la phase 3 du chantier front, sinon double migration |

Tant que la phase 3 n'est pas faite : **tout code front s'écrit dans `web/app/applications/erp/`**
(seul arbre réellement compilé).

---

## Vue d'ensemble

Le numéro d'un lot est un identifiant, pas un rang. Ordre d'exécution ci-dessous.

| Rang | Lot | Titre | Statut | Notes |
|---|---|---|---|---|
| 1 | 9 | Référentiel articles et prix | ✅ terminé | Fondation — `item`, `achats`, résolution de prix |
| 2 | 1 | Fusion du modèle | ✅ terminé | Calcul verrouillé ; rendement ; ports etudes ; consultation reporté lot 8 |
| 3 | 8 | Suppression des tables `consultation` | ✅ terminé | Q6 confirmée ; module + tables + front retirés |
| 4 | 2 | Dossier d'étude + wizard | 🟡 backend fait | Front bloqué par la phase 3 du chantier front |
| 5 | 3 | Import non destructif | ⬜ à faire | |
| 6 | 4 | Décomposition + bibliothèque | ⬜ à faire | Inclut les ouvrages composites (D9) |
| 7 | 6 | Chiffrage + validation | ⬜ à faire | Débloqué — Q1 et Q2 tranchées |
| 8 | 5 | Branchement sur `achats` | ⬜ à faire | Réécrit — ne crée plus d'entités |
| 9 | 7 | Chaînage aval | ⬜ à faire | Débloqué — Q3 tranchée |
| — | 10 | Ne pas se fermer de portes | ⬜ à faire | 6 règles **transverses** — rien à livrer isolément |

Légende : ⬜ à faire · 🟡 en cours · ✅ terminé · 🔴 bloqué

---

## Jalons

| Jalon | Contenu | Statut |
|---|---|---|
| J0 — Référentiel sain | Lot 9 | ✅ |
| **J1 — Socle sain** | + Lots 1 + 8 | ✅ **vérifié sur staging** — 191/191 changesets, app UP en `validate` |
| **J2 — Parcours manuel complet** | + Lots 2, 3, 4, 6 | ⬜ |
| J3 — Prix tracés | + Lot 5 | ⬜ |
| J4 — Chaîne complète | + Lot 7 | ⬜ |
| J5 — Assistance IA | phase suivante | ⬜ |

---

## Questions

| # | Question | Statut |
|---|---|---|
| Q1 | Niveau des FG/marge | ✅ **par article** ; héritage = commodité de saisie |
| Q2 | Marge sur coût ou sur PV | ✅ **sur coût de revient** (déboursé + FG) — formule actuelle correcte |
| Q3 | Ordre chantier / marché | ✅ **marché d'abord**, création atomique, `chantierId` reste NOT NULL |
| Q4 | FG dans le budget chantier | ⬜ ouverte — 🟡 lot 7 |
| Q5 | Doublon front | 🔴 **investiguée** — décision d'option requise (voir P1) |
| Q6 | Valeur des données existantes | ✅ **aucune** — suppression, pas de migration |
| Q7 | Correspondance type SERVICE | ✅ sans objet suite à Q6 |
| Q8 | Aléas et coefficient K | ⬜ ouverte — 🟢 hors périmètre |
| Q9 | FG chantier vs FG siège | ⬜ ouverte — 🟢 hors périmètre |
| Q10 | Base de prix : marché ou PMP | ✅ **marché**, paramétrable |
| Q11 | Ouvrage dans ouvrage | ✅ **oui**, déboursé remonté |
| Q12 | Vente d'articles seuls | ✅ capacité conservée, désactivée |
| Q13 | Portée de l'internationalisation | ✅ **Maroc uniquement**, sans verrou de schéma |

---

## Journal des décisions

| Date | Décision | Source |
|---|---|---|
| 2026-07-19 | D1 — Le modèle de données vit dans `etudes`, `consultation` est supprimé | Arbitrage produit |
| 2026-07-19 | D2 — Les quantités de composants sont des rendements par unité d'ouvrage | Sémantique de `ComposantOuvrage.rendement` |
| 2026-07-19 | D3 — Wizard à 5 étapes | Process métier |
| 2026-07-19 | D4 — Bibliothèque alimentée dès le lot 4 | Prérequis à l'IA |
| 2026-07-19 | D9 — Ouvrages composites, on remonte le déboursé | Q11 |
| 2026-07-19 | D10 — Le prix de vente d'un ouvrage est calculé, jamais un tarif stocké | FG/marge varient par affaire |
| 2026-07-19 | D11 — La consultation fournisseurs réutilise `achats` | Doublon évité |
| 2026-07-19 | D12 — Chiffrage au prix du marché, PMP paramétrable | Q10 |
| 2026-07-19 | D13 — Périmètre Maroc, sans verrou de schéma | Q13 |
| 2026-07-19 | D14 — FG et marge par article | Q1 |
| 2026-07-19 | D15 — Marge sur coût de revient — formule inchangée | Q2 |
| 2026-07-19 | D16 — Marché et chantier créés atomiquement | Q3 |
| 2026-07-19 | D17 — Aucune reprise de données `consultation` | Q6 |

---

## Journal d'implémentation

_(à alimenter au fil des lots : date, lot, ce qui a été fait, écarts au spec, décisions prises en
cours de route)_

### 2026-07-19 — Lot 8 (suppression consultation)

**Livré**
- Prérequis : `ImportTreeRequest` / `ImportNoeudDto` / `ImportComposantDto` → `etudes/api/request`
  (types `DpgfNoeud` : LOT/ARTICLE, composant.`rendement`) ; ports Bordereau/Cps + NoOp complets
  dans `etudes` ; adapters app → `ma.nafura.erp.etudes`
- T8.1 : staging = 2× `A_VALIDER` objets test (`sdqs`/`sd`) sur tenant interne `nafura-1` ;
  prod = tables absentes → Q6 maintenue
- T8.2 : dump hors dépôt `…/Nafura Platform/backups/consultation-tables-20260719.sql`
- T8.5 : module `consultation` supprimé (`settings.gradle.kts`, `app/build.gradle`,
  `ErpApplication`, `erp/consultation/`)
- T8.3 : `etudes/.../schema/v1.1/001_drop_consultation.sql` (composants → noeuds → consultations)
- T8.4 : `006_migrate_consultation_permissions_to_etude.sql` → `etude.*` ; 0 orphelin staging
- T8.6 : pages + route `/etudes/consultation` retirées de `web/app/applications/erp/` uniquement
- FG/marge Consultation* disparus avec le module ; défauts restants = `ParametresEtudeService` + tests

**Vérifs**
- `./gradlew :sektor:app:build` ✅
- `bootRun` → `Started ErpApplication` + `/actuator/health` UP (staging via port-forward,
  `ddl-auto=update` comme le deploy staging ; `validate` bloque sur colonnes lot 9 non migrées
  via Liquibase — hors périmètre lot 8)

**Écarts**
- Arbre mort `products/sektor-btp/web/` non touché (R8 gelé)
- `005_consultation_permissions.sql` laissé intact (checksum Liquibase) ; migration via `006`

### 2026-07-19 — Lot 1 (fusion du modèle)

**Livré**
- T1.1 `DPUCalculatorTest` — invariant structurel (valeurs illustration TODO(metier) B35)
- T1.2 `ComposantDpu.quantite` → `rendement` + alias JSON `quantite` ; liquibase `007_lot1_*`
- T1.3–T1.5 DpgfNoeud (descriptif/mode/prix_dpu_id), PrixDpu (dpgf_noeud_id, ouvrage nullable), source_prix
- T1.6 audit createdBy/updatedBy + `@Version` sur Dpgf/PrixDpu (`EtudeAuditingListener` — aucun listener platform)
- T1.7 ports Descriptif/Decomposition/Catalog déplacés vers `etudes` (DpgfNoeud) ; Bordereau/Cps
  reportés lot 8 (ImportTreeRequest)
- T1.8 **non exécuté** (suppression consultation = lot 8) — terrain préparé
- T1.9 `ParametresEtudeService` centralise FG 8 / marge 7 / TVA 20 ; plus de défauts en dur dans
  PrixDpu/Ouvrage/DpuService/DpgfService PrePersist
- `quantiteIndicative` renommé `rendement` dans consultation + front vivant (`web/app/applications/erp/`)

**Écarts** (résolus au lot 8 sauf arbre mort)
- ~~BordereauExtractionPort / CpsDescriptifExtractionPort app adapters encore sur package consultation~~ → lot 8
- ~~FG/marge encore en dur dans ConsultationNoeud*~~ → module supprimé lot 8
- Arbre mort `products/sektor-btp/web/app/` non nettoyé (non compilé ; R8 gelé)

### 2026-07-19 — Lot 9 (référentiel articles et prix)

**Livré**
- T9.1 `ArticleType` + `NatureComposantMapping` (remplace le switch privé de `DpuService`)
- T9.2 `PriceType` ; `Item.prixUnitaire` `@Deprecated` ; migration Liquibase → `ItemPrice ACHAT_STANDARD`
- T9.3 catalogue enrichi (devise, validité, remise, source, historisation — jamais d'écrasement)
- T9.4 alimenteurs : attribution AO → catalogue `OFFRE_RETENUE` ; validation facture → `FACTURE`
- T9.5 `ResolutionPrixService` (7 niveaux) + `basePrixChiffrage` MARCHE|PMP|MAX
- T9.6 `CurrencyConversionService` — conversion au taux de la `dateReference`

**Écart / point ouvert (R0)**
- ~~`ContratFournisseur` sans lignes article~~ → **tranché T9.4bis** : pas de lignes sur
  `ContratFournisseur` (forfait ST). Contrat-cadre = `CatalogueFournisseurLigne` `source=CONTRAT`.
  `fromContratSigne` ouvre les lignes rattachées ; rattachement saisie/import = livraison séparée.

**Tests** : `ResolutionPrixServiceImplTest` (7 niveaux + PMP + devise + périmé),
`NatureComposantMappingTest`, `CurrencyConversionServiceTest`, historisation catalogue,
`CatalogueAlimentationFromContratSigneTest` (T9.4bis : avec / sans lignes).

### 2026-07-19 — J1 ATTEINT : staging reconstruit et vérifié ✅

Après correction de l'ordre des migrations et des tests, `reset-app` + `release-app` sur
staging, base vierge.

| Vérification | Résultat |
|---|---|
| Job `sektor-btp-lifecycle` | **Complete 1/1** (15 s) — première réussite |
| `databasechangelog` | **191 changesets, 0 échec** |
| `composants_dpu` | **`rendement` seul** — le renommage a bien eu lieu |
| Tables `consultation%` | **0** |
| `role_permission` | 0 `consultation.*`, **9 `etude.*`**, 0 rôle orphelin |
| `SPRING_JPA_HIBERNATE_DDL_AUTO` | **`validate`** |
| `/actuator/health` | **`{"status":"UP"}`** |

> `validate` + application démarrée = le schéma construit par Liquibase correspond
> **exactement** au modèle JPA. C'est la preuve que plus aucun rattrapage Hibernate n'opère.

**Garde-fou ops ajouté** (`toolchain/ops/nlops.sh`) : `assert_context_matches_env` refuse tout
croisement ENV ↔ contexte kubectl. `KUBE_CONTEXT` étant optionnel, le script retombait sur le
contexte **courant** — qui était `nafura-vps-prod`. Une variable oubliée suffisait donc à
exécuter sur la production une commande destinée à staging, `RESET_DB=true reset-app`
(`DROP DATABASE`) incluse. Testé dans les trois cas : staging↔prod, prod↔staging, et cas nominal.

### 2026-07-19 — revue d'architecte : tests en échec malgré « Tests OK »

Les lots 9 et 1 avaient été rapportés avec « Tests OK ». Exécution réelle
(`:sektor:{item,achats,etudes,currency}:test`) : **6 échecs**. Trois natures.

**1. Erreur d'arithmétique dans la spec — ma responsabilité.**
`01-fusion-modele.md` donnait `735,50 × 1,08 × 1,07 = 849,86`. Le résultat correct est
**849,94** (794,34 × 1,07), et le total ligne **59 495,80** et non 59 490,20. L'agent avait
fidèlement recopié mes chiffres faux dans `DPUCalculatorTest`. **Le code était juste ; la spec
était fausse.** Corrigé dans la spec et dans le test (+ TTC : 1 019,93).

**2. Garde-fou anti-double-multiplication conceptuellement faux.**
`DPUCalculatorTest` comparait `totalLigne` à `deboursSec × qté × (1+fg) × (1+marge)` en
attendant l'égalité. Or c'est **le même produit dans un autre ordre d'arrondi** — la
multiplication est commutative. Le test ne vérifiait donc pas le bug qu'il prétendait
couvrir, et échouait sur 0,27 DH d'arrondi. Réécrit : le déboursé reste unitaire, équivalence
tolérée à l'arrondi près, et vrai garde-fou contre le **double comptage de la quantité**.

**3. Régression réelle du lot 1.** `OuvrageService` s'est vu injecter
`ParametresEtudeService` (T1.9) sans que `OuvrageServiceTest` soit mis à jour → NPE sur
2 tests. Corrigé par un mock avec repli sur les constantes `DEFAULT_*`.

Plus 3 `UnnecessaryStubbingException` (Mockito strict) dans `item` et `achats` — helpers de
setup partagés, résolus par `lenient()`.

**Après correction : `./gradlew :sektor:app:build` vert, tests inclus.**

> Leçon de process : « Tests OK » sans sortie brute n'est pas une vérification. Exiger le
> compte de tests et le statut de chaque module.

### 2026-07-19 — chantier ops : ordre des migrations (hors epic, mais bloquant)

Le déploiement staging du socle J1 a échoué, révélant **deux défauts d'infrastructure
préexistants**, sans rapport avec le contenu des lots :

**1. `ddl-auto: update` neutralisait Liquibase.**
`products/sektor-btp/deploy/k8s/base/backend-deployment.yaml` déployait avec
`SPRING_JPA_HIBERNATE_DDL_AUTO=update` alors que le code source dit `validate`. Hibernate
façonnait le schéma lui-même, rendant tous les `db/changelog/` décoratifs. Conséquence
concrète : Hibernate avait créé `composants_dpu.rendement` **à côté** de `quantite`, si bien
que le `RENAME` du lot 1 ne pouvait plus s'exécuter — blocage circulaire.
→ Corrigé en `validate`. Aucun overlay ne le réintroduit.

**2. L'ordre des migrations ignorait le graphe de dépendances.**
`tools/lifecycle/build.gradle` (`migrationSortKey`) laissait tous les modules produit à
`layerRank=50 / moduleRank=500`, départagés par l'ordre **alphabétique** du chemin. Six
violations existaient : `achats` avant `currency`/`finance`/`item`/`stock`, `chantiers` avant
`marches`/`rh`, `approbations` avant `chantiers`, `etudes` avant `item`.

Le lot 9 fut simplement le premier à ajouter une FK inter-modules
(`catalogue_fournisseur_lignes.currency_id → currencies`), donc le premier à faire tomber le
masque. Les autres étaient des bombes à retardement.

→ Corrigé par une table `productModuleRank` (un rang par niveau topologique), sur le motif
déjà employé pour les modules AI. Ordre vérifié hors Gradle : **0 violation sur les 13
dépendances inter-modules**. Sûr pour les bases déjà migrées — les identifiants de changeset
sont un SHA-256 du chemin, pas du rang (commentaire `build.gradle:~316`).

⚠️ Ce correctif touche `tools/lifecycle`, donc **tous les produits** — à committer séparément
de l'epic.

### 2026-07-19 — conception

- Création de l'epic (15 fichiers).
- **Correction majeure 1** : la première version du lot 5 spécifiait `DemandePrix` /
  `OffreFournisseur` / `OffreLigne` — doublon de ce que `achats` contient déjà. Lot 5 réécrit en
  « branchement ». Règle 0 ajoutée dans `00-INDEX.md`.
- **Correction majeure 2** : les specs désignaient `products/sektor-btp/web/app/` comme cible front,
  en se fiant à `docs/AGENTS.md:183`. Vérification faite, **ce n'est pas ce que le build compile**.
  Corrigé dans `00-INDEX.md` et `02-dossier-etude-wizard.md`.
- Ajout des lots 9 (référentiel) et 10 (règles transverses).
- Q1, Q2, Q3, Q6 tranchées par l'expert métier. Q5 investiguée, décision d'option en attente.
- Lot 8 trivialisé : plus de migration, simple suppression de tables. Le risque le plus élevé de
  l'epic (rendements ambigus non récupérables) disparaît avec.
