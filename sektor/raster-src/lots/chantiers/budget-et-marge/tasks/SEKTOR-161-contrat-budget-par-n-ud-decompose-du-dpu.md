---
id: SEKTOR-161
status: done-me
context: nafura
type: spec
agent_type: spec
priority: P1
assignee: agent
gate: me
blocked_by: [SEKTOR-147]
---

# CONTRAT — budget par nœud, décomposé du DPU

> Geler les AC : le déboursé prévu d'un nœud vendu est copié du DPU avec ses quatre rubriques. Nœud interne = budget saisi. L'agrégat par rubrique se dérive.

## Étapes

- [x] Relire les gels (§ Simplicité, § budget sur l'arbre, § réel imputé + amendement palier 1)
- [x] Relire le contrat voisin `arbre-et-conversion/CONTRAT.md` et son encart d'amendement
- [x] Vérifier chaque constat dans le code avant de l'écrire en AC
- [x] Écrire `CONTRAT.md` — AC-1 → AC-15, hors périmètre, scénarios e2e + état initial
- [x] Poser la question de gate

## Journal

```
23/08 18:22  posée
23/08 20:10  status → doing
23/08 20:52  CONTRAT.md écrit — 15 AC. Constats revérifiés dans le code.
23/08 21:02  status → done-agent
23/08 21:11  toi · approuvée → done-me
```

## Rapport de livraison

**ce qui a changé** — Un fichier créé : `sektor/raster-src/lots/chantiers/budget-et-marge/CONTRAT.md`. Un fichier retouché : `00-PLAN.md` § Décisions ouvertes (une décision s'ouvre, voir § Question). Aucun fichier sous `sources/` touché. Pas de canvas UX : l'écran budget existe déjà, les AC disent son contenu, pas sa maquette.

**critères prouvés** — AC-1 → AC-15 gelés, chacun adossé à un gel du 23/08 et vérifié contre le code :

| Vérifié | Constat |
|---------|---------|
| `etudes/domain/dpu/ComposantDpu` | les quatre types existent en constantes (`TYPE_MATIERE`, `TYPE_MAIN_DOEUVRE`, `TYPE_MATERIEL`, `TYPE_SOUS_TRAITANCE`) · `rendement` est **par unité d'ouvrage**, jamais absolu · `baseRendement` `PAR_UNITE` / `PAR_JOUR` (→ AC-1, AC-2) |
| `etudes/domain/dpu/PrixDpu` | `dpgfNoeudId`, `rendementJournalier`, `deboursSec`, `@Version` — de quoi référencer l'instantané (→ AC-2, AC-5) · `DpuVersion` porte déjà un `snapshotJson` daté |
| `etudes/domain/dpu/OrigineCout` | `DECOMPOSE` / `FORFAIT` / `ESTIME` — trois cas, deux sans décomposition (→ AC-3) |
| `etudes/service/BudgetVentilationService` | fait **déjà** la copie du DPU, mais **agrégée par rubrique au chantier**, sous d'autres noms (`MATERIAUX` / `MO` / `MATERIEL` / `SOUS_TRAITANCE` / `NON_VENTILE`) · `FORFAIT → SOUS_TRAITANCE`, `ESTIME → NON_VENTILE`, `nonFiable` sur `coutDeduit` · `sommeDebourseArticles` est déjà le contrôle croisé d'AC-4 |
| `chantiers/domain/budget/BudgetChantier`, `BudgetLigne` | budget par rubrique **au chantier** : `previsionnel` / `revise` / `engage` / `realise` / `nonFiable` / `sourceOrigine`, `posteBudgetaireId` optionnel et jamais posé à la conversion (→ AC-8) |
| `chantiers/domain/budget/PosteBudgetaire` | porte désormais `nature` et `dpgfNoeudId` (SEKTOR-147) mais **aucun déboursé** — ni total, ni rubrique (→ AC-1) |
| `chantiers/domain/chantier/ChantierLot` | même constat, plus un `avancementPercent` stocké que le sous-lot voisin va supprimer (→ AC-13 s'adosse à la quantité, pas à ce champ) |
| `chantiers/service/BudgetChantierService` | `DEFAULT_RUBRIQUES` = 7 rubriques forgées (`MATERIAUX`, `MO`, `SOUS_TRAITANCE`, `LOCATION_MATERIEL`, `CARBURANT`, `FRAIS_GENERAUX`, `IMPREVUS`) sans rapport avec le DPU · `upsert` est le **seul** producteur de budget (→ AC-8) |
| `etudes/adapters/bc/ChainageAvalAdapter` | copie l'arbre nœud par nœud **puis** écrase le budget en un `upsert` par rubrique, via `ChainageAvalPort.BudgetRubrique` — le déboursé est décomposé, puis re-agrégé et perdu au niveau du poste. C'est exactement ce qu'AC-1/AC-2 renversent |
| `realiseHt` | écrit **uniquement** par le seed et par `upsert`. Rien dans le code ne fait tomber un coût réel sur un chantier aujourd'hui (→ AC-10 crée l'entrée, il n'en remplace pas une) |
| `rh/domain/temps/Pointage` | seul porteur d'imputation existant : `chantierId` obligatoire, `posteBudgetaireId` optionnel — c'est **déjà** la forme d'AC-10 (nœud, pas activité), inutilisée |
| `web/app/chantiers/budget/` | l'écran existe (listing + détail + `reviser-budget-dialog` qui édite rubrique par rubrique au chantier) et écrit par `upsert`. AC-8 lui retire son geste d'écriture, AC-7 le redescend sur le nœud |

**décidé seul** —
1. **Les rubriques prennent les noms du DPU** (`MATIERE` / `MAIN_DOEUVRE` / `MATERIEL` / `SOUS_TRAITANCE`) et non ceux du chantier (`MATERIAUX` / `MO`). Le gel dit « les quatre natures » ; deux jeux de noms pour une même chose est précisément ce qui a fait perdre la décomposition en route.
2. **Une cinquième part « non ventilée »**, non nommée par le gel. Sans elle, un poste `ESTIME` n'a nulle part où poser son déboursé et AC-4 (la copie ne perd rien) devient infaisable. `FORFAIT → SOUS_TRAITANCE` reprend le comportement déjà écrit dans `BudgetVentilationService` — ce n'est pas une invention.
3. **Prévu figé + révisé saisi** (AC-7). Le gel exige un instantané non rétro-alimenté, mais l'écran actuel sait réviser un budget. Écraser le prévu tuerait AC-5 ; supprimer la révision serait une régression muette. Deux valeurs, la copie intouchable.
4. **La valeur acquise se calcule sur le prévu**, pas sur le révisé — mot pour mot le gel (« avancement × déboursé prévu »).
5. **AC-11 crée le nœud « Frais de chantier » à la première imputation**, pas à la conversion : créer un nœud d'office à la conversion aurait heurté l'AC-11 du contrat voisin (« exactement une ligne par nœud du devis ») et son scénario `chantier-conversion-copie-fidele`. C'est l'objet de la question de gate.
6. **AC-15 interdit « valeur acquise » à l'écran** alors que le gel emploie le terme. Le gel nomme un calcul ; § Simplicité interdit ce vocabulaire au palier 1. Le libellé retenu est « déboursé prévu de ce qui est fait ».
7. **Aucun canvas UX.** L'écran budget existe ; ce contrat change les chiffres qu'il porte et le niveau où on les saisit, pas sa forme. Si l'exec constate que la page ne peut pas les porter, il remonte — il n'invente pas un écran.

**écarts / dette** —
- **Le port `ChainageAvalPort` doit changer de forme** : `BudgetRubrique` (agrégat chantier) n'a plus de destinataire ; le déboursé décomposé doit voyager **avec** `LotProjection`. C'est une modification du contrat `etudes → chantiers`, pas seulement de `chantiers/`. À porter par SEKTOR-162.
- **`BudgetVentilationService` perd son objet** sous sa forme actuelle (agrégation) mais garde toute sa logique de calcul (base `PAR_JOUR`, repli sans DPU, `nonFiable`). À déplacer, pas à réécrire.
- **`BudgetChantierSeedService` et `DEFAULT_RUBRIQUES`** produisent des budgets par rubrique au chantier : ils tombent avec AC-8. Le seed devra poser des déboursés **sur les nœuds** sinon l'écran budget est vide en lab.
- **AC-8 casse le geste d'écriture du web** (`reviser-budget-dialog`, `budget.facade.saveRevision`). AC-7 dit où il repart ; l'écran reste à recâbler — c'est de l'exec, non tranché ici.
- **Aucun AC de performance** : le rollup d'AC-9 est calculé à chaque lecture, sans volumétrie connue en lab. Si un bordereau de 400 postes le rend lent, c'est une dette à ouvrir, pas un cache à décider ici.
- **L'engagé reste non alimenté** (Achats). Affiché à zéro, il ment poliment. Nommé hors périmètre, pas résolu.
- **AC-13 dépend du sous-lot `avancement-et-attachement`** pour l'avancement en quantité. Aucune dépendance de task posée : SEKTOR-159 sait lire l'avancement existant, mais les preuves d'AC-13 seront plus propres après SEKTOR-152.

## Question

**AC-11 — un coût réel qui arrive sans nœud : où tombe-t-il ?** Le gel interdit « un coût réel sans imputation » et prévoit un repli sur « un nœud interne dédié », sans dire qui le crée ni quand. Au palier 1 le cas est courant : le pointage porte un `posteBudgetaireId` optionnel laissé vide en pratique.

- **A** — **Refus dur** : pas de nœud, pas de coût. Conséquence : conforme au gel à la lettre, mais tout pointage saisi sans poste devient impossible — une régression côté RH, décidée depuis `chantiers/`, dans un module qu'aucune task de ce sous-lot ne touche.
- **B** — **Nœud interne « Frais de chantier », créé à la première imputation non rattachée** (ce que le contrat gèle). Conséquence : rien ne casse, le non imputé est visible et ré-imputable, et la conversion reste intouchée — donc le contrat voisin aussi.
- **C** — **Créer ce nœud d'office à la conversion**, pour tous les chantiers. Conséquence : plus prévisible, mais ajoute une ligne que le devis n'a pas produite, et heurte l'AC-11 du contrat voisin (« exactement une ligne par nœud du devis ») et son scénario `chantier-conversion-copie-fidele`.

Recommandé : **B** — c'est le repli littéral du gel, il tient au palier 1 sans planning, il ne fait de régression nulle part, et il rend visible ce que A ferait disparaître et C encombrerait.
