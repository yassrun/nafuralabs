# Questions ouvertes — à trancher avec l'expert métier

Ces questions relèvent du métier, pas de la technique. Elles doivent être tranchées par l'ingénieur
génie civil / chef de projet, pas par l'agent d'implémentation.

**Format** : chaque décision prise est reportée dans `00-ARCHITECTURE.md` §5, avec sa date.

---

## Q1 — À quel niveau se posent les FG et la marge ? ✅ tranchée 2026-07-19

**Décision** : **par article** — l'article tel que défini dans le bordereau du marché.
`PrixDpu` porte donc `fraisGenerauxPercent` et `margePercent`, comme aujourd'hui. Pas de niveau lot.

**Ergonomie obligatoire** — sur 800 articles, une saisie unitaire est impraticable :
- valeur par défaut au niveau tenant, appliquée à la création de chaque `PrixDpu`
- surcharge au niveau dossier d'étude (`fraisGenerauxPercentDefaut`, `margePercentDefaut`)
- **application en masse** : sur tout, sur un lot, ou sur une sélection d'articles
- l'UI signale les articles dont le taux diffère du défaut de l'étude

Le stockage reste par article ; l'héritage n'est qu'une commodité de saisie. Un article modifié
individuellement conserve sa valeur.

**⚠️ Correction 2026-07-19 — les taux « 8 % / 7 % » n'ont aucune autorité métier.**

Ils viennent du socle généré (codés en dur dans `PrixDpu` et `ConsultationNoeud`), pas de
l'expert métier, qui ne les a jamais prononcés. Indice qu'ils ne veulent rien dire : le socle
portait **7 % dans `etudes` et 0 % dans `consultation`** pour la même notion.

Ils survivent dans le code uniquement comme repli technique, explicitement marqué tel dans
`ParametresEtudeService`, pour qu'un tenant non configuré ne casse pas. **Aucun tenant réel ne
doit s'en servir.**

Reste donc ouvert : **quelles sont les valeurs réelles, et à quel point varient-elles ?**
L'expert métier indique qu'elles sont vraisemblablement variables — ce qui, combiné à la
décision « par article », plaide pour une saisie assistée (défaut d'étude + application en
masse, cf. T6.2) plutôt que pour une constante d'entreprise.

---

## Q14 — Sur quelle base la marge varie-t-elle d'un article à l'autre ? 🟠 lot 6

**Acquis** : l'expert métier confirme une marge **par article**, **variable** (2026-07-19).
Q1 est donc close, et il n'existe pas de « taux d'entreprise ».

**Ce qui reste à savoir** : ce qui *fait* varier ce taux. Ce n'est pas une curiosité — la
réponse détermine ce que l'écran de chiffrage doit afficher **à côté** de la colonne marge pour
que le chiffreur décide en connaissance de cause.

Hypothèses courantes en BTP, à confirmer ou infirmer :

| Motif de variation | Ce que l'écran devrait alors montrer |
|---|---|
| Positionnement concurrentiel sur les articles que le client compare | un repère de prix connu / historique sur la ligne |
| Incertitude sur la quantité au bordereau | un indicateur de fiabilité de la quantité |
| Effet de volume (marge plus faible sur les grosses lignes) | le **poids de la ligne** dans le total de l'affaire |
| **Déséquilibrage** : charger les articles dont les quantités augmenteront à l'exécution | l'écart quantité bordereau ↔ quantité attendue, et la marge globale en permanence |
| Risque technique propre à l'ouvrage | rien de plus — jugement du chiffreur |

Plusieurs peuvent coexister. Dans tous les cas, la **marge globale en temps réel** est requise
(cf. `06-chiffrage-validation.md` T6.2) — c'est le seul garde-fou quand on module ligne à ligne.

**Réponse** : _(à compléter)_

---

## Q2 — Marge sur coût ou sur prix de vente ? ✅ tranchée 2026-07-19

**Décision** : **marge sur le coût de revient**, le coût de revient étant le déboursé sec **après
application des frais généraux**.

```
coût de revient = déboursé sec × (1 + FG%)
prix de vente HT = coût de revient × (1 + marge%)
                 = déboursé sec × (1 + FG%) × (1 + marge%)
```

**C'est exactement la formule déjà implémentée** dans `DpuCalculator.computePrixVenteHt()`.
Aucun changement de calcul n'est requis. Voir `06-chiffrage-validation.md` T6.3.

Sur un déboursé de 1 000 DH, FG 8 %, marge 7 % :
| Étape | Valeur |
|---|---|
| Déboursé sec | 1 000,00 |
| Coût de revient (× 1,08) | 1 080,00 |
| Prix de vente HT (× 1,07) | **1 155,60** |
| Marge en valeur | 75,60 |
| Marge rapportée au PV | 6,54 % |

> Nuance à connaître : une « marge de 7 % » ainsi calculée représente 6,54 % du prix de vente.
> C'est cohérent et volontaire, mais l'interface doit intituler la colonne
> **« Marge % (sur coût de revient) »** pour lever toute ambiguïté, et afficher à côté la marge
> rapportée au chiffre d'affaires.

Persister malgré tout `TypeMarge = SUR_COUT` sur l'étude, pour que le calcul reste reproductible si
la convention évolue un jour.

**À valider par l'expert métier** : le tableau ci-dessus, avec ses chiffres.

---

## Q3 — Ordre de création chantier / marché ? ✅ tranchée 2026-07-19

**Décision** : **le marché d'abord, le chantier en découle** — création **atomique** des deux dans
une seule transaction, depuis un seul écran.

Justification métier : le marché est le contrat qui justifie l'existence du chantier. Et certains
marchés déjà attribués ne passent pas par une étude — ils doivent néanmoins **transiter par la phase
finale du dossier d'étude** avant de devenir un chantier. Le dossier d'étude reste donc le
**guichet unique** vers le chantier.

**Mise en œuvre** : `ContratMarche.chantierId` reste `NOT NULL` — **aucune migration de schéma**.
L'ordre d'insertion en base (chantier puis marché, pour satisfaire la clé étrangère) est un détail
technique invisible de l'utilisateur, qui voit « Créer le marché et son chantier ».

Ce choix respecte la règle du lot 10 : pas de migration de données pour un besoin qu'on peut couvrir
par du code.

---

## Q4 — Les FG descendent-ils dans le budget de chantier ? 🟡 lot 7

Le budget prévisionnel est-il en **déboursé sec** (matériaux + MO + matériel + ST) ou en **déboursé
+ FG** ?

Enjeu réel : le conducteur de travaux est-il tenu de couvrir une quote-part de frais de siège dans
son budget, ou uniquement ses coûts directs ?

**Recommandation** : déboursé sec seul. Les FG sont une charge de structure, pas une dépense de
chantier. Mais les pratiques varient selon les entreprises.

**Réponse** : _(à compléter)_

---

## Q5 — Que fait-on du doublon `web/app/applications/erp/` ? 🔴 investiguée — décision requise

**Investigation menée le 2026-07-19. Le résultat contredit la documentation.**

### Ce qui est réellement compilé

```
web/angular.json      → browser: "src/main.ts", tsConfig: "tsconfig.app.json"
web/tsconfig.app.json → include: ["src/**/*.d.ts", "app/**/*.ts"]     → donc web/app/**
web/tsconfig.json     → "@applications/*": ["./app/applications/erp/*"]
```

**`products/sektor-btp/web/app/` n'apparaît dans aucun glob de compilation.** C'est du code mort.
Le front vivant est `web/app/applications/erp/`.

Or `docs/AGENTS.md:96` affirme *« `@applications/*` → `products/sektor-btp/web/app` »* et la
ligne 183 pose *« Source = `products/sektor-btp/web/app/` »*. La documentation énonce l'intention,
la configuration fait l'inverse.

### Les deux arbres ont divergé

1 811 fichiers dans `web/app/applications/erp`, 1 786 dans `products/`. Des dizaines de fichiers
diffèrent, et **chaque arbre a du contenu unique** :

| Seulement dans `web/app/applications/erp` (vivant) | Seulement dans `products/` (mort) |
|---|---|
| `invitations/` | `pages/chantiers/utils/bpde-lot-import.util.ts` |
| `pages/chantiers/components/chantier-equipe-tab/` | |
| `pages/chantiers/services/chantier-affectation-api.service.ts` | |
| `pages/chantiers/documents/utils/` | |

Aucun des deux ne peut être supprimé sans perte.

### Options

| Option | Description | Coût |
|---|---|---|
| **A** | Aligner la réalité sur le doc : fusionner les divergences vers `products/sektor-btp/web/app/`, corriger `tsconfig.json` et `tsconfig.app.json` | Moyen — fusion manuelle, mais conforme à la règle 5 d'`AGENTS.md` (métier sous `products/`) |
| B | Aligner le doc sur la réalité : acter `web/app/applications/erp` comme source, corriger `AGENTS.md` | Faible — mais viole la règle 5 et laisse le métier hors de `products/` |
| C | Statu quo | Le pire : deux arbres qui divergent encore |

**Recommandation** : **A**, en chantier **préalable** au lot 2 — pas comme une tâche du lot 2.
C'est une opération de réorganisation qui ne doit pas se mélanger à du développement fonctionnel.

**Conséquence immédiate sur cet epic** : tant que A n'est pas fait, tout travail front doit se faire
dans **`web/app/applications/erp/`**, sinon il ne sera jamais compilé. Les specs ont été corrigées
en ce sens.

**Réponse** : _(à compléter — choix de l'option)_

---

## Q6 — Les études `consultation` existantes ont-elles une valeur ? ✅ tranchée 2026-07-19

**Décision** : **non.** Le produit n'est pas en production et les données en base ne sont pas
importantes.

**Conséquence** : aucune migration de données. Les tables `consultations`,
`consultation_noeuds`, `consultation_composants` sont **supprimées** purement et simplement.

Le lot 8 passe de « migration idempotente avec vérifications et retour arrière » à un simple
changelog de suppression. Le problème des rendements non récupérables (`quantite` ambigu) disparaît
avec lui — c'était le point le plus risqué de l'epic.

---

## Q7 — Correspondance du type de composant `SERVICE` ? 🟡 lot 8

`ConsultationComposant.SERVICE` n'a pas d'équivalent direct dans `ComposantDpu`
(`MATIERE` / `MAIN_DOEUVRE` / `MATERIEL` / `SOUS_TRAITANCE`).

Proposition : `SERVICE` → `SOUS_TRAITANCE` si prestation externe, `MATERIEL` si location de moyens.
À vérifier sur les données réelles.

**Réponse** : _(à compléter)_

---

## Q10 — Base de prix du chiffrage : marché ou PMP ? ✅ tranchée 2026-07-19

**Décision** : **prix du marché** par défaut (hiérarchie du lot 9 T9.5, PMP en avant-dernier
recours). Paramètre tenant `basePrixChiffrage` ∈ `MARCHE` | `PMP` | `MAX` pour inverser.

**Justification** : une étude est prospective — on achètera aux prix à venir, pas à ceux payés il y a
huit mois. Le PMP est rétrospectif, sa place est la valorisation du stock et le contrôle de gestion.
L'UI affiche les deux quand l'écart dépasse un seuil paramétrable (défaut 10 %).

---

## Q11 — Un ouvrage peut-il contenir un autre ouvrage ? ✅ tranchée 2026-07-19

**Décision** : **oui** (D9). Cas réel : m² de cloison → m³ de mortier → ciment / sable / MO.

On remonte le **déboursé** du sous-ouvrage, pas son prix de vente — FG et marge s'appliquent une
seule fois au sommet, sinon marge sur marge. Exception via `inclureFraisEtMarge` pour la
sous-traitance. Détection de cycle obligatoire, profondeur limitée à 5.

Détail : `04-decomposition-bibliotheque.md` §T4.2bis.

---

## Q12 — Vend-on des articles seuls, hors ouvrage ? ✅ tranchée 2026-07-19

**Décision** : pas dans l'usage principal (entreprise de travaux), mais **la capacité est
conservée** — `ItemPrice.priceType = VENTE`, activée par le paramètre tenant `venteArticlesActivee`.

**Justification** : Sektor-BTP est un SaaS multi-tenant visant le marché marocain puis
l'international. Un tenant négociant en matériaux en aura besoin. Principe général : une capacité
non utilisée est **masquée dans l'UI**, jamais retirée du modèle — l'activer plus tard ne doit
déclencher aucune migration.

Voir `10-genericite-multitenant.md`.

---

## Q13 — Quel modèle d'internationalisation viser ? ✅ tranchée 2026-07-19

**Décision** : **le Maroc uniquement.** Aucune fonctionnalité internationale n'est développée.

L'exigence porte uniquement sur l'architecture : ne pas prendre de décision qui imposerait une
**migration de données** le jour où le besoin apparaîtrait. Une modification de code future est
acceptable.

Conséquence : le lot 10 est réduit à six règles transverses (devise sur les montants, paramètres en
table, messages à clé, réglementaire isolé dans `marches`, clés i18n neutres, capacités masquées
plutôt que supprimées). Ni profils pays, ni traductions, ni conversion de devises, ni multi-société.

Les sous-questions restées ouvertes (pays visés, multi-devise sur une même étude, multi-société par
tenant) sont **sans objet** tant que le périmètre est marocain — à rouvrir si le besoin se présente.

---

## Q8 — Faut-il gérer les aléas et le coefficient de vente K ? 🟢 hors périmètre actuel

Le modèle actuel ne connaît que FG et marge. Beaucoup d'entreprises BTP ajoutent :
- un **taux d'aléas** (risque technique, intempéries)
- un **coefficient K** global de passage déboursé → prix de vente
- une **révision de prix** indexée (le module `marches` a déjà `IndiceBtp` et `RevisionPrix`)

Non traité dans cet epic. À évaluer après J2 — si c'est nécessaire, le poser tôt évite une
refonte du calcul.

**Réponse** : _(à compléter)_

---

## Q9 — Le déboursé doit-il distinguer FG chantier et FG siège ? 🟢 hors périmètre actuel

Certaines entreprises séparent les frais de chantier (installation, encadrement, gardiennage) des
frais de siège. Aujourd'hui un seul taux FG.

Lié à Q4. Non traité dans cet epic.

**Réponse** : _(à compléter)_
