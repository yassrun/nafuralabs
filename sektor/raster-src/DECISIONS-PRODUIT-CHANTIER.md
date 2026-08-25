# Décisions produit — Sektor Chantier

> Journal vivant des décisions produit Sektor.
> Pas du code. Produit études : [`DECISIONS-PRODUIT.md`](DECISIONS-PRODUIT.md) · arbre des dossiers : [`DECISIONS.md`](DECISIONS.md).
>
> Comment continuer : ajouter une entrée datée sous **Gelé** ou **Ouvert**. Une fois gelé, on ne rejoue pas le débat dans le chat — on amende ce fichier.

Dernière passe : 23/08/2026 (**simplicité — trois paliers** · arbre du chantier vendu / interne · planning = couche d'activités · WBS libre + zone · capacité vs engagement · avancement en quantité · déclencheur GAGNE · marché à la notification · budget sur l'arbre · réel imputé à l'activité · frontière RH · frontière ST · baseline · les cinq derniers points).

---

## Gelé (23/08/2026) — Simplicité : le chantier marche sans planning

> **Contrainte de conception, posée par le métier.** Elle prime sur les gels suivants : quand l'un d'eux exige plus que ce palier, c'est le gel qui plie.

### L'utilisateur réel

Une PME BTP marocaine n'a pas de planificateur. Elle a un **conducteur** et un **chef de chantier**. Ce qu'elle fait tous les mois, sans exception, c'est l'**attachement** contradictoire et la **situation**. MS Project est chez le bureau d'études du maître d'ouvrage, pas chez elle.

### Trois paliers

| Palier | Ce qui marche | Ce qu'il faut saisir |
|--------|---------------|----------------------|
| **1 — défaut** | arbre, avancement, attachement, situation, facture | des **quantités** et des dates |
| **2 — planning** | activités, charge, besoins datés, imputation fine, valeur acquise | + un planning tenu |
| **3 — planificateur** | baseline, nivellement, ligne d'équilibre, chemin critique | + la discipline qui va avec |

**Le palier 1 est complet, pas dégradé.** Un chantier créé depuis une étude est facturable le jour même, sans qu'une seule activité existe.

### Ce que ça impose

- **Zéro paramétrage** pour démarrer. Le zonage, les activités, les rubriques fines sont tous facultatifs.
- **Le vocabulaire du chantier marocain, pas celui de l'ERP** : attachement, situation, décompte, OS, CPS, MOE / BET, retenue de garantie, avance, RAS, réception provisoire / définitive. WBS, quotité, valeur acquise, nivellement ne s'affichent **jamais** au palier 1.
- **Une saisie terrain = une quantité, une date.** Peu de champs, utilisable au téléphone, sur un chantier sans réseau correct.
- Chaque palier s'active **sur décision**, jamais par défaut, et n'ajoute aucun champ obligatoire aux paliers inférieurs.

### Interdit

- Exiger un planning pour facturer.
- Rendre obligatoire au palier 1 un champ qui n'existe que pour le palier 2 ou 3.
- Un écran qui suppose un planificateur pour être lisible.

---

## Gelé (23/08/2026) — L'arbre du chantier

### Le principe

**Le chantier a son arbre.** Il n'est pas une vue du devis, il est **initialisé** par lui puis vit sa vie.

À la création depuis une étude en **devis validé par le client**, l'arbre est une **copie** des lots / sous-lots / postes du devis. Chaque nœud copié garde un **lien vers le poste vendu** dont il vient.

Ensuite l'arbre est **libre** : on ajoute des nœuds, on subdivise, on réordonne, sans rien casser côté devis.

### Deux natures de nœud

| Nature | D'où | Facturation | Coût |
|--------|------|-------------|------|
| **Vendu** | copié du devis validé, garde le lien vers le poste | entre dans une **situation** de travaux | oui |
| **Interne** | ajouté au chantier — installation, repli, régie, aléas | **jamais** dans une situation | oui |

Un nœud interne n'a pas de prix de vente. Il porte du **coût seul** : il pèse sur le budget et la marge, il ne se facture pas au client.

### Pourquoi ce couple

C'est lui qui rend le **planning** possible sans casser la facturation. Une installation de chantier est une activité réelle, planifiée, consommant ressources / matière / sous-traitance — et elle n'a aucun poste vendu en face. Sans la nature *interne*, elle n'a nulle part où exister ; sans le lien *vendu*, plus personne ne relie un avancement à un attachement.

### Conséquences

- La **situation de travaux** ne balaie que les nœuds **vendus**.
- Le **budget** et le **réel** tombent sur les deux natures.
- Un écart devis ↔ chantier devient **lisible** : ce qui a été subdivisé, ajouté, ou n'a jamais été vendu.
- Le **planning** s'accroche à cet arbre — pas au devis. *(Suite : § Ouvert.)*

### Interdit

- Faire du chantier une **projection** du devis (arbre recalculé, non éditable).
- Facturer un nœud **interne**.
- Ajouter un nœud vendu **sans** poste de devis en face — un vendu naît de la copie, pas de la saisie.

### Aujourd'hui dans le code (constat, pas une spec)

Le chaînage aval existe : [`ChainageAvalAdapter`](../sources/backend/etudes/src/main/java/ma/nafura/etudes/adapters/bc/ChainageAvalAdapter.java) (L13) crée en une transaction chantier → marché → lots / postes → budget, depuis les nœuds DPGF (`LOT` / `SOUS_LOT` → `ChantierLot`, `ARTICLE` → `PosteBudgetaire`).

Ce qui manque pour tenir le gel :

| Trou | Où |
|------|-----|
| Aucun **lien retour** vers le nœud DPGF vendu | `ChantierLot`, `PosteBudgetaire` — pas de champ d'origine |
| Aucune **nature** vendu / interne | idem |
| Déclencheur = **conversion du dossier**, pas le statut devis validé | `DossierConvertirDto` |
| Fallback douteux : article sans parent → **premier lot trouvé**, sinon « Lot principal » forgé | `ChainageAvalAdapter` |

---

## Gelé (23/08/2026) — Le planning est une couche d'activités

### L'activité n'est pas le nœud de l'arbre

Le planning **n'est pas** le Gantt de l'arbre du chantier. Il porte ses propres objets : des **activités**, avec durée, calendrier, liens de précédence (FD / DD / FF / DF) et ressources.

Un conducteur planifie par **zone, niveau, phase** — pas par ligne de bordereau. « Coffrage R+1 » et « Coulage dalle N3 » sont deux activités qui consomment le **même** poste vendu *béton B25*.

### Le rattachement

Une activité se rattache à **0..n nœuds** de l'arbre chantier, chacun avec une **quotité** (la part du nœud que cette activité réalise).

| Cas | Rattachement |
|-----|--------------|
| Activité qui exécute une part d'un poste vendu | 1 nœud vendu, quotité < 100 % |
| Activité qui couvre plusieurs postes | n nœuds |
| Installation de chantier, repli | 1 nœud **interne**, ou aucun |
| Attente, séchage, jalon | aucun |

**L'avancement remonte, il ne descend pas.** L'avancement d'une activité, pondéré par sa quotité, alimente l'avancement du nœud → attachement → situation. C'est ce chemin qui fait que « avancement planning » et « avancement facturable » restent le même chiffre.

### Pourquoi pas 1 activité = 1 nœud

Gratuit à construire, mais on ne peut plus planifier par zone / niveau / phase — donc plus personne ne planifie dedans, et l'outil redevient un Gantt décoratif à côté de MS Project. Sektor doit **offrir la planif**, pas l'illustrer.

### Interdit

- Dériver le planning de l'arbre (activités générées, non éditables).
- Facturer depuis le planning — la situation part de l'arbre, jamais des activités.
- Une quotité qui fait dépasser 100 % d'un nœud.

### Aujourd'hui dans le code (constat, pas une spec)

`sources/web/app/chantiers/planning/` existe **sans aucun backend** — pas d'entité, pas de controller, rien côté `chantiers/`. Le planning est à écrire, pas à reprendre.

---

## Gelé (23/08/2026) — Structure du planning : WBS libre + zone

### Deux lectures, une seule structure

La **hiérarchie** des activités est **libre** — l'utilisateur crée ses dossiers d'activités, comme dans MS Project. Rien n'est imposé ni généré.

En plus de sa place dans la WBS, une activité porte une **zone**, prise dans un **référentiel de zones du chantier** (arborescent : bâtiment › niveau › zone). Facultative.

| | Porte la structure | Sert à |
|--|--------------------|--------|
| **WBS** | oui | la lecture du planificateur — son découpage |
| **Zone** | non | filtrer, regrouper, alimenter la vue **ligne d'équilibre** / chemin de fer |

### Pourquoi pas la zone en structure

Un VRD, un linéaire, un terrassement ne se découpent pas en bâtiment / niveau. Imposer l'axe zone exclut des métiers entiers. À l'inverse, une WBS seule ne donne aucun regroupement comparable d'un chantier à l'autre et interdit la ligne d'équilibre — d'où l'attribut.

### Interdit

- Générer la WBS depuis l'arbre des lots ou depuis les zones.
- Rendre la zone obligatoire.
- Un deuxième référentiel de zones ailleurs dans le produit — le zonage est **du chantier**, une seule fois.

---

## Gelé (23/08/2026) — Ce qu'une activité consomme : capacité vs engagement

Deux familles, pas une notion typée. La ligne de fracture : **est-ce que je nivelle, ou est-ce que je déclenche quelque chose en aval ?**

### Capacité — main d'œuvre, matériel

Ont un **calendrier** et une **disponibilité** chez nous. Affectées à une activité, elles produisent une **charge** : plan de charge, conflits (deux chantiers sur la même grue), nivellement.

Le réel vient du **pointage** (MO) et du pointage / location (matériel).

### Engagement — sous-traitance, matière

N'ont **aucune capacité** chez nous. Affectées à une activité, elles produisent une **échéance datée** que l'activité pousse **en aval**, dans un autre BC :

| | Ce que l'activité produit | Aval |
|--|---------------------------|------|
| **Sous-traitance** | un lot confié, daté | contrat ST (**Achats**) → situation ST → facture fournisseur |
| **Matière** | un besoin daté + quantité | demande d'achat (**Achats**) → livraison → magasin chantier (**Catalogue**) |

Ni l'une ni l'autre n'entre dans le nivellement.

### Ce que ça coûte

ST et matière partagent un modèle alors qu'elles atterrissent dans deux BC différents. Assumé : ce qu'elles ont en commun — produire une échéance datée depuis le planning — est ce que le planning doit calculer ; leur aval diverge **après**, chez le BC qui reçoit.

### Interdit

- Niveler une ST ou une matière.
- Créer la DA / le contrat ST **depuis** le planning en direct — le planning produit un **besoin**, Achats décide de l'acte.
- Un stock chantier tenu ailleurs que dans le magasin chantier (`catalogue/`).

---

## Gelé (23/08/2026) — L'avancement se saisit en quantité

### Une seule vérité

La **quotité** d'une activité sur un nœud n'est pas un pourcentage : c'est une **quantité prévue** (280 m³ des 1 200 m³ du poste béton). On saisit des **quantités faites**.

Le **pourcentage est dérivé**, jamais saisi ni stocké comme un fait : `fait / prévu`, à l'activité comme au nœud.

### La chaîne

```
saisie quantité sur activité
  → cumul par nœud (somme des activités rattachées)
    → attachement : les quantités de la période, lues, pas ressaisies
      → situation : les quantités attachées, valorisées au prix vendu
```

L'attachement devient une **conséquence** du planning, pas une saisie parallèle.

### Les activités sans nœud

Installation, séchage, études d'exécution, jalons : aucune quantité, donc avancement **en %**, saisi. Elles ne se facturent jamais (§ arbre du chantier — nature interne), donc aucun écart ne peut naître entre planning et facture.

### Interdit

- Stocker un pourcentage comme fait saisi sur un nœud ou une activité rattachée.
- Ressaisir des quantités dans l'attachement — il lit ce qui a été déclaré sur la période.
- Une quantité faite qui dépasse la quantité prévue du nœud sans passer par un avenant / un travaux supplémentaire.

### Aujourd'hui dans le code (constat, pas une spec)

| Trou | Où |
|------|-----|
| `quantiteRealisee` **et** `pourcentage` coexistent — deux vérités, aucune ne prime | `AvancementPhysique` |
| L'avancement est saisi sur `lotId` / `posteId` — **aucune activité**, le planning n'existe pas dans la chaîne | idem |
| `zone` en **texte libre**, sans référentiel | `AttachementLigne` |

---

## Gelé (23/08/2026) — Le déclencheur : `GAGNE` arme, un humain crée

### Le chemin normal

Le cycle de l'étude existe déjà et suffit : `… → DEVIS_GENERE → GAGNE → CONVERTIE`.

**`GAGNE` (devis validé par le client) rend la création possible, pas faite.** Quelqu'un ouvre la conversion, complète ce que l'étude ne sait pas, et crée. L'étude passe `CONVERTIE` — état terminal, on ne convertit pas deux fois.

Ce que l'humain complète à la conversion : code chantier, date de démarrage réelle, durée, **zonage** (le référentiel de zones du chantier, § WBS libre + zone).

### Le chantier naît `EN_PREPARATION`

Un chantier gagné n'est pas un chantier démarré. Il naît **`EN_PREPARATION`** ; c'est l'**ordre de service** qui le passe `EN_COURS`.

### La porte de service

Un chantier peut naître **sans étude** — gré à gré, régie, petits travaux. L'arbre est alors saisi à la main, tous ses nœuds sont **internes** tant qu'aucun devis ne les vend.

Ce n'est pas le chemin principal : la copie de l'arbre depuis le devis reste la voie normale, sinon personne ne s'en sert.

### Interdit

- Créer un chantier depuis une étude qui n'est pas `GAGNE`.
- Convertir deux fois la même étude.
- Un chantier qui naît `EN_COURS`.

### Aujourd'hui dans le code (constat, pas une spec)

`ChainageAvalAdapter` force `chantierDto.setStatus("EN_COURS")` à la conversion — à corriger. Le reste du geste (écran de conversion, `DossierConvertirDto`, transition `CONVERTIE`) est déjà en place.

---

## Gelé (23/08/2026) — Le marché naît à la notification, pas à la conversion

### Le chantier d'abord, le contrat quand il existe

Le chantier naît seul. Le **marché** se crée à la **notification**, avec ce qui fait un marché : référence, CPS, cautions, délais, révision de prix, CCAG-T.

Un chantier en **régie** ou sur **bon de commande** n'a jamais de marché. Ce n'est pas un cas dégradé.

### Ce qui fait foi pour la vente

| Situation | La référence de vente |
|-----------|----------------------|
| Pas de marché | le **devis** validé |
| Marché notifié | le **marché**, et lui seul |

### Les avenants retombent sur l'arbre

Un **avenant** crée ou modifie des nœuds **vendus** du chantier — nouveaux postes, quantités révisées, prix révisés. Sinon on facturerait des travaux qui n'existent dans aucun arbre.

C'est aussi la sortie propre pour le cas interdit du § avancement : une quantité faite qui dépasse le prévu **passe par un avenant**, elle ne déborde pas en silence.

### Interdit

- Fabriquer un `ContratMarche` à la conversion, avant qu'un contrat existe.
- Facturer au-delà du devis quand il n'y a pas de marché.
- Un travaux supplémentaire vendu sans nœud dans l'arbre.

### Aujourd'hui dans le code (constat, pas une spec)

`ChainageAvalAdapter` crée chantier **+ `ContratMarche` + budget** dans la même transaction. Le marché sort de cette transaction.

---

## Gelé (23/08/2026) — Le budget vit sur l'arbre, décomposé en rubriques

### Le prévisionnel est copié du DPU

Le DPU de l'étude décompose déjà chaque poste en `MATIERE` / `MAIN_DOEUVRE` / `MATERIEL` / `SOUS_TRAITANCE` — les quatre natures du § capacité vs engagement.

À la conversion, le **déboursé prévu d'un nœud vendu est copié du DPU** avec ses quatre rubriques, en même temps que le nœud. Un nœud **interne** (installation, repli) a un budget **saisi** : aucun DPU derrière.

### Ce que ça donne

- **Marge par poste et par lot**, pas seulement par chantier.
- **Valeur acquise** : avancement × déboursé prévu, comparé au réel. C'est ce qui distingue « j'ai dépensé » de « j'ai trop dépensé pour ce que j'ai fait ».
- L'agrégat **par rubrique** reste calculable — le compte d'exploitation global se dérive, il ne se stocke pas.

### Amendements (23/08/2026) — remontés depuis le contrat `budget-et-marge`

**Une cinquième part : le non ventilé.** Les quatre rubriques du DPU ne couvrent pas tout. Un poste chiffré au forfait (`ESTIME`), ou décomposé sans composants, n'a **aucune** rubrique où poser son déboursé. Il tombe dans une part **non ventilée**, explicite. Sans elle, ces postes seraient soit perdus, soit rangés de force dans une rubrique fausse.

**« Valeur acquise » est un nom de calcul, pas un libellé.** Le terme reste dans ce journal — il dit précisément de quoi on parle. Il **ne s'affiche jamais** : à l'écran on lit *déboursé*, *marge*, *écart*, *avancement*. § Simplicité l'emporte sur le vocabulaire du gel.

**Un coût qui arrive sans nœud** tombe sur un nœud interne « Frais de chantier », créé **à la première imputation de ce type** — pas d'office à la conversion, qui doit rester une copie fidèle du devis.

### Le prix à payer

Le réel doit savoir **sur quel nœud** il tombe : un pointage, une facture fournisseur, une sortie de magasin portent une imputation. C'est le vrai coût de la décision — et l'endroit où la plupart des ERP BTP lâchent. *(Comment : § suivant.)*

### Interdit

- Un budget par rubrique **stocké** au niveau chantier — il se dérive de l'arbre.
- Un coût réel sans imputation.
- Recopier le déboursé du DPU dans le budget **et** le laisser vivre séparément côté étude : la copie est un instantané daté, l'étude ne le rétro-alimente plus.

### Aujourd'hui dans le code (constat, pas une spec)

`BudgetChantier` / `BudgetLigne` tiennent le budget **par rubrique, au chantier** (`previsionnel`, `revise`, `engage`, `realise`, `nonFiable`, `sourceOrigine`). `PosteBudgetaire` existe sous le lot mais ne porte pas de déboursé décomposé. Le lien budget ↔ arbre est à créer.

---

## Gelé (23/08/2026) — Le réel s'impute à l'activité

### On impute ce qu'on a sous les yeux

Le chef pointe sur **son activité du planning**, pas sur une ligne d'un bordereau de 400 postes. L'activité porte déjà ses nœuds et ses **quotités** : la ventilation vers l'arbre est **calculée**, jamais saisie.

En aval, l'imputation **voyage avec la pièce** au lieu d'être ressaisie :

```
besoin sur activité → DA → commande → facture fournisseur     (imputation portée)
besoin sur activité → sortie magasin chantier                  (imputation portée)
pointage sur activité → heures × coût                          (imputation directe)
```

### Le repli

Ce qui n'a **aucune activité** — base vie, gardiennage, frais généraux de chantier — tombe sur un **nœud interne** dédié. Pas sur le chantier en vrac.

### Amendement (23/08/2026) — ce gel vaut au **palier 2**

La première rédaction disait « sans planning tenu, pas d'imputation ». **Trop exigeant** : elle interdisait le palier 1 (§ Simplicité). Corrigé :

| Palier | Où se saisit l'avancement | Où tombe le coût |
|--------|---------------------------|------------------|
| **1** | directement sur le **nœud**, en quantité | sur le **nœud**, ou un nœud interne pour les frais de chantier |
| **2** | sur l'**activité** | sur l'**activité**, ventilé aux nœuds par les quotités |

**La règle qui empêche les deux vérités : un nœud couvert par au moins une activité ne se saisit plus en direct.** Tant qu'aucune activité ne le couvre, il se saisit au nœud. Il n'y a jamais deux portes ouvertes sur le même nœud.

Ce que le palier 2 apporte reste entier : charge, besoins datés, valeur acquise, marge par activité. Ce qu'il n'est plus : **un péage pour facturer**.

### Interdit

- Demander une imputation au **poste** sur une pièce de terrain.
- Ventiler le réel du chantier par une **clé** en fin de mois.
- Un coût sur le chantier sans activité **ni** nœud interne.

### Aujourd'hui dans le code (constat, pas une spec)

| Fait | Où |
|------|-----|
| `Pointage` porte `chantierId` **obligatoire** et `posteBudgetaireId` **optionnel** — exactement l'imputation au poste, donc laissée à `null` en pratique | `rh/domain/temps/Pointage` |
| Le pointage vit dans **`rh/`**, avec `PointageBatch` et une synthèse par chantier | `rh/` |
| **`rh/` a déjà son propre `PlanningController`** — un second planning (affectation des employés) à côté de celui qu'on conçoit | `rh/api/controller/PlanningController` |

---

## Gelé (23/08/2026) — Frontière RH : la personne à RH, l'affectation au chantier

### Le partage

| | Possède |
|---|---|
| **`rh/`** | la **personne** : contrat, coût horaire, habilitations, congés / absences, paie — et le **pointage**, fait de temps, **une seule vérité** |
| **`chantiers/`** | l'**activité** et l'**affectation** : quelle capacité est prévue sur quelle activité, quand |

### Ce qui change côté RH

- Le pointage troque `posteBudgetaireId` contre une **imputation activité** (§ le réel s'impute à l'activité).
- Le `PlanningController` de `rh/` **cesse d'être un second planning**. Ce qu'il affiche devient une **lecture** des affectations chantier, croisée avec les absences.

### La dépendance assumée

Chantiers lit le **calendrier individuel** de RH — congés, absences, habilitations — pour affecter sans mentir. Une **lecture**, jamais une copie.

### Pourquoi pas tout côté chantier

Un ouvrier qui tourne sur trois chantiers dans le mois n'aurait plus de feuille de temps unique, et les absences ne seraient plus opposables à la paie.

### Interdit

- Un second pointage côté `chantiers/`.
- Deux plannings de ressources.
- Copier le calendrier RH dans le chantier.

---

## Gelé (23/08/2026) — Frontière ST : le contrat à Achats, l'exécution au chantier

### Le partage

| | Possède |
|---|---|
| **`achats/`** | le **contrat ST** — objet **typé**, pas un `ContratFournisseur` avec des notes encodées : fournisseur, montant, BPU, cautions, retenue de garantie, factures |
| **`chantiers/`** | l'**exécution** — quelles **activités** lui sont confiées, son avancement, son **attachement ST** |

### La symétrie

Le sous-traitant a **sa** situation de travaux, miroir de la tienne :

```
attachement ST (ce qu'il a fait) → valorisé à son BPU → facture fournisseur
```

Même chaîne que la situation client, sens inverse. C'est ce qui permet de comparer, sur un même nœud, ce qui est vendu et ce qui est sous-traité.

### Ce que ça coûte

Deux objets à tenir synchronisés, et la question « qui valide l'attachement ST » traverse la frontière : le **conducteur attache**, **Achats paie**. Assumé.

### Interdit

- Empaqueter des champs métier ST dans un champ `notes` (codec actuel).
- Dupliquer la relation fournisseur, les attestations ou les factures côté `chantiers/`.
- Une ST affectée à un chantier sans activité — elle est un **engagement** porté par le planning (§ capacité vs engagement).

### Aujourd'hui dans le code (constat, pas une spec)

`ChantierSousTraitanceService` (dans `achats/`) lit des `ContratFournisseur` filtrés sur `TYPE_SOUS_TRAITANCE` + `chantierId`, avec `ContratSousTraitanceNotes` qui **encode les champs ST dans `notes`**. Le web vit dans `chantiers/sous-traitance/`.

---

## Gelé (23/08/2026) — Baseline figée + planning courant

### Deux plannings, un seul vivant

La **baseline** se fige à l'**ordre de service** — le même acte qui fait passer le chantier `EN_PREPARATION → EN_COURS` (§ déclencheur).

Le **planning courant** évolue librement. L'écart entre les deux **est** le retard : par activité, et sur la date de fin.

### Re-baseliner est un acte contractuel

On ne re-baseline que par **avenant** ou **OS de prolongation**. Chaque version reste tracée, avec l'acte qui l'a justifiée.

Les **intempéries** entrent par là : jours d'arrêt constatés → prolongation → nouvelle baseline. Jamais un décalage silencieux du planning courant.

### Pourquoi

Un planning qu'on réécrit à chaque glissement ne montre aucun retard, et une réclamation de délai n'a plus aucun appui face au maître d'ouvrage.

### Interdit

- Modifier la baseline sans acte contractuel.
- Plusieurs baselines actives — une seule fait référence à un instant donné.
- Absorber un retard en décalant le planning courant sans le tracer.

---

## Gelé (23/08/2026) — Les cinq derniers points

> **Arbitrés seul**, sur délégation. À casser d'un mot si l'un d'eux ne va pas.

### Matière et magasin

Le **besoin** naît sur l'activité (palier 2) ou directement sur le chantier (palier 1). Il devient une **demande d'achat** — Achats décide de l'acte, le planning ne commande jamais.

Le **magasin chantier est facultatif**. Deux chemins, les deux normaux :

| Chemin | Quand | Imputation |
|--------|-------|------------|
| Livraison **directe chantier** | le cas courant en PME | à la réception, sur l'activité ou le nœud |
| Entrée en **magasin chantier** | l'entreprise tient un stock | à la **sortie** de magasin |

Le stock chantier reste tenu par **`catalogue/`** (`MagasinChantier` existe déjà). `chantiers/` n'a jamais de stock.

### Situation et attachement

**Le modèle en place est juste, on le garde.** `SituationTravaux` porte déjà le décompte **cumulatif** marocain — `cumulPrecedent` / `cumulCourant` / `travauxPeriode` — les retenues RG et avance, et le workflow `BROUILLON → SOUMISE → VALIDEE_MOA → FACTUREE → PAYEE` (+ `REJETEE`).

Ce qui manque :

- La situation doit **lire les attachements** de la période, pas des quantités ressaisies (§ avancement en quantité).
- **Pénalités de retard** et **RAS** absentes des retenues — le chantier porte pourtant déjà `tauxRas`.
- L'**attachement signé** par le MOE existe (`SignaturePublicController`, lien public) : c'est lui qui fait foi, pas la situation.

**Décompte cumulatif, jamais périodique.** Une situation dit *où on en est*, et retranche ce qui a déjà été payé.

### Pilotage et KPI

| Reste dans `chantiers/` | Part au **socle** |
|-------------------------|-------------------|
| la lecture **d'un** chantier : avancement, marge, KPI, courbe | le **portefeuille** : consolidation multi-chantiers, cash-flow global, analytics |

Conforme à [`DECISIONS.md`](DECISIONS.md) — « Socle = tableau de bord + pilotage / analytics ». `PilotageController` et `ChantiersAnalyticsController` sont à couper sur cette ligne.

### Journal, photos, documents

**Gardés, rattachés au chantier.** Rattachement à une **activité** ou une **zone** possible, jamais obligatoire — une photo se prend avec deux champs, pas six.

Le **journal de chantier** garde son rôle de fait quotidien (météo, effectif, incidents) — et devient la **source des jours d'intempéries** qui justifient une prolongation → OS → nouvelle baseline (§ baseline). Il cesse d'être un bloc-notes : il alimente une décision contractuelle.

### Doublons web

`chantiers/chantier-detail/` (la vraie page) reste ; `chantiers/detail/` (placeholder) meurt. **Un seul écran chantier**, à onglets.

---

## Ouvert (prochain tour)

Rien de bloquant. Ce qui reste se décide **au découpage**, pas ici :

- Le grain exact des activités livrées au palier 2 (durée minimale, jalons, liens FD/DD seuls ou les quatre types).
- La reprise ou non de l'existant `chantiers/planning/` côté web (aucun backend derrière).
- HSE et réception (PV, réserves) — un autre chapitre, pas celui-ci.

---

## Découpage

Lot **`chantiers`** — voir [`lots/chantiers/LOT.md`](lots/chantiers/LOT.md). Ordre et borne : [`../ROADMAP.md`](../ROADMAP.md).
