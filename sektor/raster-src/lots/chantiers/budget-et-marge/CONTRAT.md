# Contrat — Budget par nœud, décomposé du DPU

> Ce sous-lot est autonome. Ce fichier est le **seul ancrage QA** (`AC-n` gelés).
> Journal produit : [`DECISIONS-PRODUIT-CHANTIER.md`](../../../DECISIONS-PRODUIT-CHANTIER.md) — § Simplicité, § Le budget vit sur l'arbre, § Le réel s'impute à l'activité (**et son amendement palier 1**).
> Plan du sous-lot : [`00-PLAN.md`](00-PLAN.md).
> Contrat voisin, à ne pas contredire : [`../arbre-et-conversion/CONTRAT.md`](../arbre-et-conversion/CONTRAT.md) — il livre la nature `VENDU` / `INTERNE` et `dpgfNoeudId` sur l'arbre, et **nomme ce budget en hors périmètre**. Ce contrat le reprend.
> Les preuves attendues vivent ici. Pas de canvas : l'écran budget existe déjà.

**Qualification : EVOL.** Le budget existe (`BudgetChantier` / `BudgetLigne`, ventilé par `BudgetVentilationService` à la conversion) mais il est **agrégé au chantier**. Ce qui n'existe pas : le déboursé **sur le nœud**, la marge par poste et par lot, la valeur acquise, et l'imputation du réel.

Gelé le **23/08/2026**. Les tasks exec **référencent** `AC-n` ; elles ne les recopient pas.

---

## Intention

Le DPU de l'étude décompose déjà chaque poste en **matière / main d'œuvre / matériel / sous-traitance**. À la conversion, cette décomposition **descend sur le nœud du chantier** au lieu d'être écrasée en un total par rubrique au niveau chantier.

Ce que ça change, en une phrase : **on sait quel poste coûte trop cher**, pas seulement que le chantier coûte trop cher.

Trois conséquences, et rien de plus :

| | Avant | Après |
|--|-------|-------|
| Le déboursé prévu | 5 lignes par rubrique, au chantier | 4 rubriques **par nœud**, copiées du DPU |
| L'agrégat par rubrique | **stocké** (`budget_lignes`) | **dérivé** de l'arbre |
| La marge | au chantier | par **poste**, par **lot**, par chantier |

La copie est un **instantané daté**. Une fois faite, l'étude et le chantier ne se parlent plus : l'étude ne rétro-alimente pas le budget, le chantier n'écrit rien dans l'étude.

**Palier 1, et rien de plus.** Budget, marge et valeur acquise doivent être **justes sur un chantier qui n'a aucun planning**. Aucun `AC-n` de ce contrat n'exige une activité, une zone ou une quotité — ni pour saisir, ni pour calculer, ni pour afficher.

---

## Critères gelés

### Le déboursé prévu vit sur le nœud

**AC-1 — Quatre rubriques sur chaque nœud.** Tout poste de l'arbre du chantier porte un **déboursé prévu** décomposé en exactement quatre rubriques : **`MATIERE`**, **`MAIN_DOEUVRE`**, **`MATERIEL`**, **`SOUS_TRAITANCE`** — les quatre types de `ComposantDpu`, sous leurs noms d'origine. S'y ajoute une part **non ventilée** quand le coût n'est pas décomposable (AC-3). Le déboursé prévu du poste est la **somme** de ses rubriques et de sa part non ventilée ; il n'est jamais saisi à côté d'elles. Le déboursé d'un **lot** ou d'un **sous-lot** est la somme de ses enfants — il ne se saisit pas.

**AC-2 — Un vendu copie son déboursé du DPU.** À la conversion, le déboursé de chaque poste `VENDU` dont l'origine de coût est `DECOMPOSE` est **copié** du `PrixDpu` du nœud DPGF d'origine : chaque `ComposantDpu` contribue à la rubrique de son type, pour `rendement × prixUnitaire × quantité du poste`, la base `PAR_JOUR` étant ramenée à l'unité par le `rendementJournalier` de l'ouvrage comme le fait déjà l'étude. C'est un **déboursé**, jamais un prix de vente ni un coût de revient : frais généraux et marge n'entrent pas dans le budget.

**AC-3 — Un poste sans DPU a quand même un déboursé.** L'absence de décomposition ne bloque **jamais** la conversion et ne laisse **jamais** un poste à zéro :

| Origine du coût | Ce que reçoit le nœud |
|-----------------|-----------------------|
| `DECOMPOSE` avec composants | les quatre rubriques (AC-2) |
| `FORFAIT` | tout le déboursé en **`SOUS_TRAITANCE`** |
| `DECOMPOSE` sans composants, `ESTIME` | tout le déboursé en **non ventilé** |

Le nœud porte l'**origine** de son déboursé et un drapeau **non fiable** quand le coût vient d'une déduction (`coutDeduit`). Un déboursé non fiable est **signalé à l'écran**, il n'est ni corrigé ni caché.

**AC-4 — La copie ne perd rien.** Pour une conversion donnée, la somme des déboursés prévus de tous les postes du chantier est **égale** à la somme `coût unitaire × quantité` des articles du devis converti, au centime près. Aucun poste vendu sans déboursé, aucun montant compté deux fois.

**AC-5 — Instantané daté : l'étude ne rétro-alimente plus.** Chaque déboursé copié porte sa **date de copie** et la référence de ce dont il vient (nœud DPGF, `PrixDpu` et sa version). Après la conversion :

- modifier le DPU, le bordereau ou les prix de l'étude **ne change rien** au budget du chantier ;
- le chantier n'écrit **rien** dans l'étude ;
- aucune resynchronisation n'est offerte, ni automatique, ni à la demande.

**AC-6 — Un interne a un budget saisi.** Un nœud `INTERNE` (installation, repli, base vie, régie, aléas) n'a aucun DPU derrière : ses quatre rubriques se **saisissent**, et son origine vaut `SAISI`. Il n'a pas de vendu (contrat voisin, AC-4) mais il a un déboursé, donc il pèse sur le budget, la marge et l'écart de son lot et du chantier.

**AC-7 — Corriger ne réécrit pas la copie.** Le déboursé **prévu** copié n'est jamais modifié après la conversion — c'est ce qui rend AC-5 vérifiable. Une correction se saisit à côté, sur le même nœud et par rubrique : le déboursé **révisé**, initialisé à la valeur du prévu. Les deux restent lisibles côte à côte, et l'écart entre eux est visible. La révision par rubrique **au niveau chantier** disparaît avec l'agrégat (AC-8) ; réviser est désormais un geste sur un nœud.

### L'agrégat par rubrique cesse d'être stocké

**AC-8 — Plus de budget par rubrique stocké au chantier.** Le budget par rubrique au niveau chantier (`budget_chantiers` / `budget_lignes`, et l'écriture `POST /api/v1/chantiers/{id}/budget`) **n'existe plus comme stockage** : aucune ligne de budget par rubrique n'est écrite, ni à la conversion, ni par une API, ni par un seed. Toute tentative d'écrire un budget par rubrique au chantier est **refusée**. La lecture par rubrique reste offerte — elle est **calculée** à la demande depuis l'arbre.

**AC-9 — Une seule somme, à tous les niveaux.** Le déboursé — prévu, révisé, réel — se lit au **poste**, au **lot** et au **chantier**, par la même règle de remontée : un parent vaut la somme de ses enfants. Modifier le déboursé d'un seul poste change immédiatement le lot et le chantier, **sans aucune autre écriture**. Aucun total ne peut diverger de ses composantes : il n'y a plus de second endroit où le stocker.

### Le réel tombe sur le nœud

**AC-10 — L'imputation, c'est un nœud et une rubrique. Jamais une activité.** Tout coût réel enregistré sur un chantier porte un **nœud** de l'arbre (vendu ou interne), une des quatre **rubriques**, un **montant** et une **date**. Aucune activité, aucune zone, aucune quotité n'est requise, demandée ni proposée à la saisie. Le déboursé **réel** d'un nœud est la somme des coûts qui lui sont imputés, et il remonte au lot et au chantier par AC-9.

**AC-11 — Un coût non imputé ne se perd pas et ne tombe pas en vrac.** Un coût réel qui arrive sans nœud est imputé au nœud interne **« Frais de chantier »** du chantier concerné, créé **à la première imputation de ce type** — pas à la conversion, qui reste inchangée. Il est visible comme n'importe quel autre nœud, et l'utilisateur peut ré-imputer la dépense sur le bon nœud après coup. Aucun coût réel ne reste attaché au chantier sans nœud.

### Marge et valeur acquise

**AC-12 — Marge par poste et par lot.** La marge d'un nœud vaut **montant vendu − déboursé**, lisible en valeur et en pourcentage, au **poste**, au **lot** et au chantier. Elle se lit en deux versions : sur le **prévu** (ce qu'on pensait gagner) et sur le **réel** (ce qu'on gagne). Un nœud `INTERNE` a un vendu nul : sa marge vaut l'opposé de son déboursé, et elle pèse dans celle de son lot et du chantier — un chantier rentable poste par poste mais mangé par l'installation le montre.

**AC-13 — Valeur acquise : ce qui est fait, valorisé au prévu.** Pour chaque nœud, trois nombres et leur écart :

| Ce qu'on montre | Ce que c'est |
|-----------------|--------------|
| déboursé prévu **de ce qui est fait** | avancement du nœud × déboursé prévu |
| déboursé **réel** | ce qui a été imputé (AC-10) |
| **écart** | le premier moins le second — négatif = on dépense plus que ce qu'on a produit |

L'avancement utilisé est celui du nœud, en **quantité** (`quantité faite / quantité prévue`) — ce que pose le sous-lot `avancement-et-attachement`. Tant qu'aucun avancement n'est saisi, la valeur acquise vaut zéro et l'écart reste lisible : rien n'est masqué, rien n'échoue.

**AC-14 — Tout est juste sans planning.** Sur un chantier issu d'une conversion et ne portant **aucune activité, aucune zone, aucune quotité**, tous les critères ci-dessus sont vérifiables de bout en bout : déboursé prévu par nœud, imputation du réel, marge par poste et par lot, valeur acquise et écart. Aucun écran, aucun endpoint, aucun calcul de ce contrat n'exige, ne suppose ni ne réclame un planning — et aucun n'affiche un champ vide en attendant qu'il existe.

**AC-15 — Le vocabulaire du chantier, pas celui de l'ERP.** À l'écran : **déboursé** (prévu / révisé / réel), **marge**, **écart**, **avancement**, et les quatre rubriques dites en clair — *matière*, *main d'œuvre*, *matériel*, *sous-traitance*. N'apparaissent **jamais** : « valeur acquise », « earned value », « EVM », « CV / SV », « valeur planifiée », « WBS », « quotité », « ventilation analytique ». Le nom interne d'un calcul n'est pas son libellé.

---

## Hors périmètre (dette nommée, pas AC)

- **Planning et imputation à l'activité** — palier 2. Ni les activités, ni les quotités, ni la ventilation calculée du réel vers les nœuds. Ce contrat ne les prépare pas et ne leur laisse aucun champ obligatoire.
- **Les émetteurs de coût réel.** Ce contrat définit **où le réel tombe** (AC-10, AC-11), pas comment chaque pièce l'y met : le pointage RH (`Pointage` porte déjà un `posteBudgetaireId` optionnel — sous-lot `pointage-impute`, vague 2), la facture fournisseur et la réception (Achats), la sortie de magasin chantier (`catalogue/` — sous-lot `matiere-et-magasin`, vague 2). Aucun de ces modules n'est retouché ici.
- **L'engagé.** Le montant engagé vient des commandes et contrats d'Achats. Il n'est pas alimenté par ce sous-lot ; s'il reste affiché, il est à zéro et dit qu'il n'est pas tenu.
- **Situations et attachements** — autre sous-lot. Ce contrat ne touche ni au décompte cumulatif, ni aux retenues, ni à la valorisation au client.
- **Avenants.** Ils modifieront le vendu **et** le déboursé prévu d'un nœud après la copie. C'est la seule porte future qui aura le droit de rouvrir AC-5 et AC-7. Pas dans ce sous-lot.
- **Consolidation multi-chantiers** (marge du portefeuille, cash-flow global) : elle remonte au socle — sous-lot `frontieres-bc`.
- **Refonte visuelle de l'écran budget.** Aucun canvas ici : les `AC-n` disent quels chiffres existent et comment on les nomme, pas la maquette. Si l'exec constate que la page actuelle ne peut pas les porter, il le remonte au lieu d'inventer un écran.
- **Migration de données.** Lab métier : schéma clean + re-seed. Les budgets par rubrique existants ne sont pas repris.

---

## Scénarios e2e (noms) + état initial

L'exec implémente ; le QA joue. Ne pas choisir des valeurs qui passent toutes seules.

| Scénario | Couvre |
|----------|--------|
| `budget-conversion-debourse-copie-du-dpu` | AC-1, AC-2, AC-4 |
| `budget-conversion-poste-forfait-et-estime` | AC-3 |
| `budget-instantane-etude-modifiee-apres-coup` | AC-5 |
| `budget-noeud-interne-saisi` | AC-6, AC-12 |
| `budget-revision-sur-le-noeud` | AC-7 |
| `budget-aucun-agregat-stocke-au-chantier` | AC-8 |
| `budget-rollup-poste-lot-chantier` | AC-9 |
| `budget-imputation-reel-sur-le-noeud` | AC-10 |
| `budget-cout-non-impute-frais-de-chantier` | AC-11 |
| `budget-marge-par-poste-et-par-lot` | AC-12 |
| `budget-valeur-acquise-et-ecart` | AC-13 |
| `budget-sans-aucun-planning` | AC-14 |
| `budget-vocabulaire-chantier` | AC-15 |

**État initial requis :**

- Tenant `qa-local`.
- **Une étude `GAGNE`** avec un devis validé portant **≥ 2 lots**, **1 sous-lot**, **≥ 6 postes**, dont :
  - au moins **2 postes `DECOMPOSE`** avec un DPU réellement rempli, l'un avec des composants des **quatre** types, l'autre avec au moins un composant en base **`PAR_JOUR`** et un `rendementJournalier` sur son `PrixDpu` — sinon AC-2 passe sans être testé ;
  - **1 poste `FORFAIT`** et **1 poste `ESTIME`**, dont un avec `coutDeduit = true` — pour AC-3 ;
  - des quantités et des prix unitaires **distincts** entre postes, pour qu'une erreur de multiplication se voie.
- Après conversion : **1 nœud `INTERNE`** ajouté à la main avec un déboursé saisi non nul (AC-6), et **au moins un lot mixant vendu et interne** (AC-12).
- Des **coûts réels imputés** sur au moins trois nœuds, sur les quatre rubriques, dont un montant sur le nœud interne — et **un coût arrivant sans nœud** pour AC-11.
- Un **avancement partiel** (ni 0 %, ni 100 %) sur au moins deux nœuds, dont un où le réel **dépasse** la valeur acquise et un où il reste en dessous : sans ça, AC-13 ne prouve pas le signe de l'écart.
- **Aucune activité, aucune zone, aucune quotité** nulle part. Tous les scénarios doivent passer sans.
