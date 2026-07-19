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

Détail estimatif + sous-détails de prix par famille d'ouvrage.

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

Lire une source réelle sert aussi à voir ce qu'elle fait mal. Trois points, qui sont autant de
raisons d'être de l'outil :

| Défaut du classeur | Ce que l'ERP doit faire à la place |
|---|---|
| Rendement journalier **en dur dans la formule** (`=SUM(...)/30`) — le changer impose d'éditer chaque formule | champ `rendementJournalier`, saisi une fois, visible |
| Étiquette `Q éxé = 1M3/jour` **contredit** la formule qui divise par 30 — personne ne peut le voir | une seule valeur, pas d'étiquette parallèle |
| Code `B25C` pour « Béton dosé 350 » — B25 suggère un dosage à 250 ou une classe C25 | code catalogue contrôlé, cohérence code ↔ désignation |

Copier la structure du classeur aurait fait hériter de ses angles morts.

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
