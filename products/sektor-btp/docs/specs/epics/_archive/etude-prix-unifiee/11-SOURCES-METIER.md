# Sources métier — s'en inspirer sans les copier

**Règle** : Sektor est un ERP **multi-tenant**. Une pratique observée chez un tenant est une
**source d'inspiration**, jamais une norme à graver.

Ce document sépare, pour chaque source, ce qui a été retenu comme **structure** de ce qui reste
**propre à l'entreprise**. Un agent qui reprend l'epic doit pouvoir faire la différence sans
relire l'historique.

---

## Le test à appliquer

Avant d'intégrer quoi que ce soit observé chez un tenant, deux questions :

1. **Est-ce une capacité ou une contrainte ?** Une capacité s'ajoute sans gêner ceux qui ne
   s'en servent pas. Une contrainte impose une façon de travailler.
2. **Un autre tenant qui fait autrement reste-t-il servi ?** Si non, c'est une copie, pas une
   inspiration.

Concrètement : tout champ issu d'une pratique observée doit être **nullable, avec un défaut qui
préserve le comportement antérieur**.

---

## Source 1 — Classeur « LOT N°2 GROS-ŒUVRE » *(2026-07-19)*

Détail estimatif + sous-détails de prix par famille d'ouvrage. **Extrait le 2026-07-19** :
84 ouvrages, voir plus bas.

### Retenu comme structure — générique

| Constat | Pourquoi généralisable | Implémentation |
|---|---|---|
| Un ouvrage peut en contenir d'autres | Pratique BTP courante, pas propre à ce bureau | D9, `natureComposant` |
| Coûts journaliers ramenés par la production du jour | Manière standard de chiffrer une équipe | `ComposantDpu.baseRendement`, `PrixDpu.rendementJournalier` — **tous deux nullables** |
| Les deux bases coexistent dans un ouvrage | Observé, et sans raison d'être exclusif ailleurs | base portée par le **composant**, pas par l'ouvrage |
| Aléas en ligne de composant | Toute entreprise en a, sous un nom ou un autre | aucun champ ajouté — ce sont des `ComposantDpu` |

**Garantie de neutralité** : un tenant qui ne raisonne qu'en rendements unitaires ne renseigne
jamais ces champs et ne voit aucune différence. La capacité est ajoutée, la méthode n'est pas
imposée.

### Non retenu — propre à l'entreprise

Ces valeurs vivent **uniquement** dans `DpuCalculatorSousDetailReelTest`, jamais dans
`ParametresEtudeService`, jamais dans un seed, jamais dans un défaut :

- dosage béton 350 kg/m³ · granulats en tonnes · ciment 1,20 DH/kg
- MO 150 DH/jour · coffreur 160 · ouvrier 130
- production 30 m³/jour · 100 m³/jour en terrassement
- déboursés 596 / 75 / 245 / 966 DH/m³

Leur rôle est d'être un **cas de référence vérifiable** : le calcul est prouvé juste parce qu'il
reproduit un classeur qui existe. Ce n'est la valeur par défaut de personne.

### Défauts relevés dans la source — à ne surtout pas reproduire

Lire une source réelle sert aussi à voir ce qu'elle fait mal. Ces points sont autant de
raisons d'être de l'outil :

| Défaut du classeur | Ce que l'ERP doit faire à la place |
|---|---|
| Rendement journalier **en dur dans la formule** (`=SUM(...)/30`) — le changer impose d'éditer chaque formule | champ `rendementJournalier`, saisi une fois, visible |
| Étiquette `Q éxé` **contredit** la formule dans **2 ouvrages sur 11** : « Production » annonce `1M3/jour` et divise par 30 ; « Fouilles en rocher » annonce `33M3/jour` et divise par 100 | une seule valeur, pas d'étiquette parallèle |
| Code `B25C` pour « Béton dosé 350 » — B25 suggère un dosage à 250 ou une classe C25 | code catalogue contrôlé, cohérence code ↔ désignation |
| La convention de calcul **change d'une ligne à l'autre** : `=H22*G22/100` met le diviseur dans le montant, `=G39/H39` *divise* par la quantité au lieu de multiplier | une seule sémantique : `rendement × prixUnitaire`, la base journalière étant portée par un champ |
| Le bloc `j1f` « Poteaux charpente » est vide (`#DIV/0!`) et un composant est à prix nul — invisibles dans un tableur | gate de l'étape 3 : un article décomposé exige ≥ 1 composant à rendement > 0 |

Copier la structure du classeur aurait fait hériter de ses angles morts.

### Le corpus extrait — 84 ouvrages *(2026-07-19)*

Les sous-détails ont été extraits mécaniquement par
[`tools/corpus-ouvrages/`](../../../tools/corpus-ouvrages/README.md) vers
`etudes/src/test/resources/corpus/sous-details-gros-oeuvre.json`.

| | |
|---|---|
| Ouvrages | **84** (16 familles, 290 composants) |
| Dont chiffrés à la journée | 11 — `rendementJournalier` de 30 à 100 |
| Écart au recalcul | **0** au-dessus du centime |

`DpuCalculatorCorpusReelTest` rejoue les 84 : chacun doit retrouver le total du classeur.
L'écart maximal est de 0,008 DH, dû à l'arrondi au centime que le tableur ne fait pas.
`DpuCalculatorSousDetailReelTest` garde ses 7 cas écrits à la main, plus lisibles comme
documentation du calcul ; le corpus, lui, garantit qu'aucun cas du classeur n'est oublié.

> Le décompte de **182** annoncé dans une note de passation antérieure était erroné — il comptait
> des lignes, pas des ouvrages. Le classeur contient 84 ouvrages sous-détaillés, chacun délimité
> par un en-tête `Code Elem` et un `Total HT`.

Ce corpus reste une donnée de tenant : **ressources de test uniquement**, jamais un seed.

### Arbitrage de l'expert *(2026-07-19)* — la forme fait foi, pas les chiffres

Interrogé sur les contradictions relevées, l'expert répond :

> « Khallih yakhod gha la forme et les formule des tableau, les chiffres devrons être actualisé »
> — *qu'il prenne seulement la forme et les formules du tableau, les chiffres devront être
> actualisés.* Et : « La première feuille est une feuille d'article vide sans prix. »

Trois conséquences :

| Point | Effet |
|---|---|
| **La formule fait foi, pas l'étiquette** | Confirme l'arbitrage déjà retenu à l'extraction. Les 2 contradictions `Q éxé` sont closes : c'est le diviseur de la formule qui compte. Les 84 rendements extraits sont sur la bonne base. |
| **Les prix du classeur sont périmés** | Ils ne peuvent servir ni de tarif, ni de valeur indicative courante. Leur seul rôle reste d'être le cas de référence qui prouve le calcul. |
| **Le `D.E.` est un bordereau modèle vide** | Feuille d'articles sans prix — utile comme structure de bordereau, pas comme source de chiffrage. |

> **Effet sur le lot 4** : la bibliothèque capitalise **les rendements**, pas les prix. C'est
> exactement ce qu'énonce D10 (« ce qui se capitalise, ce sont les rendements — stables dans le
> temps — et un prix indicatif daté »), ici confirmé par la pratique. Les prix unitaires doivent
> venir de `ResolutionPrixService` (lot 9), jamais d'une reprise du classeur.

### Le détail estimatif — ce qu'il a appris sur la hiérarchie

Feuille `D.E.`, 963 lignes : **6 chapitres, 19 sous-chapitres, 84 articles, 38 variantes,
108 lignes chiffrables.**

```
I/ - AMÉNAGEMENT EXTÉRIEUR
  a/ - TERRASSEMENTS GÉNÉRAUX
    a/1 - Déblais en masse          → M3 · 4310   (chiffré ici)
  b/ - RÉSEAU D'ÉVACUATION
    b/1 - Canalisations PVC         → ni unité ni quantité
      a - Ø 200                     → ML · 120    (chiffré ici)
      b - Ø 250                     → ML · 10
```

**Quatre niveaux, et la profondeur varie d'une branche à l'autre.** Certains articles portent
leur quantité, d'autres délèguent à des variantes.

**Conséquence retenue — générique** : `TYPE_ARTICLE` désigne un **rôle**, pas un niveau — celui
de ligne chiffrable. Un nœud qui regroupe est LOT ou SOUS_LOT quelle que soit sa profondeur. Le
modèle l'admettait déjà (`parentId` libre) ; ce qui manquait, c'était de l'écrire. Sans ça,
quelqu'un type par profondeur et casse les gates.
`GateBordereauStructureReelleTest` verrouille ce comportement.

**Deux pièges d'import relevés** — pour le lot 3, non encore traités :

| Piège | Conséquence si ignoré |
|---|---|
| Unité et quantité sur une **autre ligne** que la désignation (`Le mètre cube : \| M3 \| 4310`) | articles importés sans unité, gate bloqué sur 108 lignes |
| Lignes de sous-total (`a/ - TOTAL TERRASSEMENTS…`) sans unité ni quantité | importées comme articles, elles bloquent un parcours sur des lignes qui ne sont pas des ouvrages |

---

## Source 2 — CPS réel `cps_exemple.md` *(2026-07-19)*

### Retenu comme structure

- Motifs de titres observés : `ARTICLE - 1 -`, `CHAPITRE-I-`, `1.1.3` — **ajoutés aux motifs
  existants**, aucun n'a été retiré. Un CPS écrit autrement reste découpé.
- Exclusion des tables des matières : générique, tout document paginé en a une.
- Repli par blocs à recouvrement quand aucune structure n'est reconnue : c'est ce qui garantit
  qu'un CPS d'une autre forme reste exploitable.

### Non retenu

La numérotation `1.1.x` de ce CPS correspond aux codes du bordereau. **On ne s'en remet pas à
cette correspondance** : elle est exploitée comme un signal de pertinence (pondération `A`),
pas comme une clé d'appariement. Un CPS dont la numérotation diverge fonctionne quand même —
c'était précisément la fragilité de l'ancienne passe par code.

---

## À faire à chaque nouvelle source

1. Ajouter une section ici : retenu / non retenu / défauts relevés
2. Vérifier qu'aucune valeur du tenant n'a fui hors des tests :
   ```bash
   grep -rn "596\|966\|350 kg" products/sektor-btp/backend --include=*.java | grep -v "/test/"
   ```
3. Vérifier que tout champ ajouté est nullable avec un défaut neutre
