# Epic — Référentiel, coût réel et catalogue Sektor

**Créé** : 2026-08-09
**Statut** : doing — Vague 1 (L1–L4) livrée ; Vague 2 ouverte
**Progress** : [`00-PROGRESS.md`](00-PROGRESS.md)
**Contexte** : pré-production. Aucune donnée client. **Aucune reprise de données à prévoir.**

---

## Pourquoi cet epic

L'epic [`etude-prix-unifiee`](../etude-prix-unifiee/00-INDEX.md) a livré un moteur de calcul
juste et prouvé : 84 ouvrages du classeur gros-œuvre réel recalculés, écart maximum 0,008 DH.
Ce qui lui manque n'est pas du calcul — c'est du **branchement**.

Trois constats, tirés d'une revue du code :

1. **Une étude peut être chiffrée sans qu'aucun coût ne soit connu.** Et c'est un **travail non
   terminé, pas un choix de conception** — le champ le dit lui-même :
   *« Coût unitaire saisi en mode `FOURNI`, **avant frais généraux et marge** »*
   ([`DpgfNoeud.prixFourniBase`](../../backend/modules/etudes/src/main/java/ma/nafura/etudes/domain/model/DpgfNoeud.java)).
   L'intention était donc bien : le chiffreur saisit un **coût**, le système applique FG et
   marge comme partout ailleurs. Le champ n'est lu par aucun calcul, et le garde-fou de
   l'étape 5 a entériné l'inachèvement en traitant les taux comme « optionnels » en mode
   `FOURNI`. Résultat : une étude 100 % `FOURNI` franchit toutes les étapes sans qu'aucun coût
   n'existe.
2. **Le sous-détail n'est relié à rien.** `composants_dpu.article_ou_poste_id` est un
   `VARCHAR(100)`. Idem pour `composants_ouvrage.article_id` et les deux références de
   `catalogue_fournisseur_lignes`. Aucun prix ne remonte automatiquement, aucun historique
   n'existe, rien ne descend au chantier.
3. **Il n'y a pas de catalogue.** Le seul « resolver » existant
   ([`ItemCatalogResolver`](../../backend/modules/etudes/src/main/java/ma/nafura/etudes/service/port/ItemCatalogResolver.java))
   fait un `LIKE %terme%` intra-tenant avec un score en dur. Le « catalogue Sektor »
   d'aujourd'hui se résume à `onboarding/reference-data.json` — 14 unités, 60 catégories,
   3 devises — recopié dans chaque tenant.

Cet epic corrige les deux premiers points, puis construit le troisième.

---

## Le processus raffiné

Le wizard actuel nomme l'étape 3 « décomposition ». Le mot est le piège : il suppose que
décomposer est la norme, alors que c'est **une** façon parmi d'autres de connaître son coût.

```
1. DOSSIER        L'appel d'offres. CPS, bordereau, délais.

2. BORDEREAU      La liste des lignes à chiffrer. Quantités, unités.

3. COÛT           Pour chaque ligne, ce que ça coûte à l'entreprise.
                  Trois origines, toutes légitimes :
                    · décomposé  → matériaux + main-d'œuvre + matériel
                    · forfait    → devis sous-traitant, offre ferme
                    · estimé     → de mémoire, ou d'une affaire passée
                  ← LE CHIFFREUR TRAVAILLE ICI

4. FOURNISSEURS   Consultation sur ce qui pèse. Les prix consultés
                  remplacent les prix estimés.

5. PRIX DE VENTE  Frais généraux, marge, arbitrage.
                  ← LE PATRON TRAVAILLE ICI
```

**Le changement de fond** : les étapes 3 et 5 ne sont ni le même métier, ni la même personne.
Le chiffreur établit le **coût**. Le patron décide le **prix**. Le modèle actuel les mélange.

Ce que l'étape 5 doit afficher, et qui n'existe nulle part aujourd'hui :

```
Affaire : Résidence Al Manar          4 210 000 DH
Coût total estimé                     3 480 000 DH
Marge                                   730 000 DH   (17,3 %)

Dont coûts décomposés     41 %  ████
Dont forfaits fournisseur 22 %  ██
Dont coûts estimés        37 %  ███       ← ce qui est signé à l'aveugle
```

---

## Les six décisions

### A — Toute ligne porte un coût. Le mode `FOURNI` disparaît.

Une fois compris que `FOURNI` signifiait « je saisis mon coût sans le décomposer », le mot ne
veut plus rien dire : ce n'est ni un prix, ni quelque chose de fourni. Le **mode** disparaît,
remplacé par une **origine du coût** : `DECOMPOSE` | `FORFAIT` | `ESTIME`.

Le calcul est **identique dans les trois cas** : coût → + frais généraux → coût de revient →
+ marge → prix de vente. Ce n'est pas un changement de règle, c'est l'achèvement de celle qui
était prévue.

Un forfait de sous-traitant est un coût connu, chiffré, sourcé — il ne doit plus être écrasé
dans un prix de vente. Un coût estimé reste autorisé ; il est simplement affiché et compté
comme tel.

*Pourquoi* : sans coût, pas de marge d'affaire, pas de budget de chantier, pas d'écart
prévu/réalisé, rien à capitaliser.

**Nommage** — `prixFourniBase` dit « prix » et contient un coût. C'est la maladie déjà soignée
une fois par cet epic, quand `quantite` contenait un rendement (calcul faux d'un facteur 70).
Le champ s'appelle **`coutUnitaire`**.

En revanche **« frais généraux » est conservé** : c'est le vocabulaire du métier, celui de tout
sous-détail de prix du bâtiment et de Batiprix. Le renommer nous couperait de la profession.
Il manque en revanche un mot au milieu — le **coût de revient** (`coût × (1+FG%)`), calculé
aujourd'hui au passage, nommé et affiché nulle part, alors que c'est le plancher sur lequel un
patron décide de baisser un prix ou de refuser une affaire.

### B — Un composant désigne un vrai article, plus du texte.

`VARCHAR(100)` → référence typée (`ITEM` | `OUVRAGE` | `LIBRE` + identifiant).
Le mode `LIBRE` reste possible pour ne jamais bloquer le chiffreur — mais il est visible et
rattrapable a posteriori.

*Pourquoi* : c'est le verrou. Tout le reste en dépend.

### C — Un ouvrage n'est pas un article, et c'est volontaire.

Le prix d'un article est une **donnée** (elle vient des fournisseurs). Le prix d'un ouvrage
est un **résultat** (il se calcule). Deux natures, deux tables. Mais un composant doit pouvoir
désigner l'un **ou** l'autre — c'est ainsi qu'une cloison contient son mortier.

*Confirme* D9 et D10 de `etude-prix-unifiee`, décidés et jamais implémentés.

### D — Une étude validée ne bouge plus jamais.

Chaque prix retenu est figé avec sa provenance complète : montant, source, date, fournisseur,
devise, référence d'origine. Même si le tarif change ou que la ligne fournisseur disparaît,
l'étude de janvier reste l'étude de janvier.

*Constat* : `PrixResolu` transporte déjà les sept informations. `ComposantDpu` n'en persiste
que deux. Les cinq autres sont jetées à l'écriture.

### E — Le catalogue Sektor est un module séparé, sans aucune dépendance tenant.

Table à part, module à part, identifiants stables, **zéro clé étrangère vers une table
tenant** — vérifié par un test automatisé, pas par une intention. Le rapprochement se fait
d'abord par des règles déterministes ; l'IA n'intervient que sur ce que les règles n'ont pas
su trancher.

*Voir* [`03-catalogue-produit.md`](03-catalogue-produit.md).

### F — On garde le prix commercial, on calcule le prix comparable.

Le pot de 15 L à 450 DH reste écrit tel quel — c'est ce que dit la facture. Le 30 DH/L est
calculé pour permettre la comparaison. Jamais l'inverse.

*Constat* : `unit_of_measure` n'a **ni facteur de conversion, ni unité de base**. La
comparaison 30 vs 28 MAD/L est aujourd'hui impossible.

### G — Réviser et approuver sont deux actes distincts. Celui qui exécute pèse, il n'écrit pas.

**Qui a touché au chiffrage ne peut pas l'approuver** — pas seulement l'auteur, toute personne
qui a modifié.

Et celui qui exécutera l'ouvrage — conducteur de travaux, chef de chantier — doit pouvoir dire
si c'est tenable **avant** qu'on s'engage. Aujourd'hui il le fait déjà : il décroche son
téléphone. Il n'en reste rien, et six mois plus tard, quand le chantier dérape sur ce poste,
personne ne sait que quelqu'un avait prévenu.

D'où l'**avis d'exécution** : trois niveaux (`REALISABLE` / `DIFFICILE` / `IRREALISABLE`), posé
sur un poste, avec commentaire obligatoire dès qu'il y a une réserve, et une valeur proposée
facultative. **Il propose, il n'écrit jamais.** Le chiffreur doit traiter chaque avis avant de
soumettre : le prendre en compte, ou l'écarter **avec un motif**. Rien de bloquant — mais le
dossier de validation affiche « 3 avis d'exécution écartés », ce qu'un approbateur doit voir
avant de signer.

*Pourquoi pas l'écriture* : elle casserait le quatre-yeux, la responsabilité du chiffre (qui
répond du 0,25 h si deux personnes l'ont touché ?) et la trace de qui pensait quoi. Donner un
avis n'est pas toucher au chiffrage — celui qui pèse **garde** donc son droit d'approbation,
celui qui corrige le perd. La séparation devient naturelle au lieu d'être une contrainte.

*Ce qui fera vivre la fonction* : à la phase 7, on croise les avis avec l'écart réel.
« Sur les postes signalés, l'écart moyen est de +18 % ; sur les autres, +2 %. » Le jour où le
conducteur voit que ses alertes avaient raison 7 fois sur 10, il remplit. Sinon il arrête au
bout d'un mois — c'est ce qui tue toutes les fonctions de commentaire. À terme, c'est aussi un
corpus « chiffré / jugé tenable / réellement fait » qu'aucun concurrent n'aura.

*Portée retenue* : l'avis porte sur le **poste**, en continu pendant l'étude (pas d'étape de
revue dédiée — en avant-vente, on n'a pas le temps d'une réunion). L'avis au niveau du
**composant** — « ton 0,25 h de peintre est optimiste » — est plus riche mais plus lourd à
l'écran : second temps.

---

## Questions tranchées en cours de conception

**Un prix « de mémoire », c'est un coût ou un prix de vente ?**
Par défaut, **un coût** — c'est ce que le schéma prévoyait et ce que fait le métier. Mais le
cas inverse existe : le **marché à prix unitaires imposés**, où le client fournit le bordereau
déjà chiffré. Le chiffreur n'a alors pas à décider son prix, il doit répondre à une seule
question : *« est-ce que je sais le faire à ce prix-là ? »* — et sans coût, il soumissionne à
l'instinct. On capture donc l'intention : `estimation_saisie_en` ∈ `COUT` (défaut) | `VENTE`,
et le système déduit l'autre avec les taux de l'affaire.

**Un coût déduit d'un prix n'est pas un coût connu.** Il est marqué comme déduit et compté à
part dans la synthèse — sinon la marge affichée serait circulaire, donc toujours parfaite et
toujours muette.

**Le chiffreur est-il forcé de décomposer ? Y a-t-il des composants obligatoires ?**
Non aux deux. Une étude peut être chiffrée entièrement en `ESTIME` et franchir toutes les
étapes. Aucune nature de composant n'est imposée — pas de « il faut de la main-d'œuvre », pas
de « il faut du matériel ». Un ouvrage peut être décomposé en une seule ligne. Seule règle
conservée, et elle existe déjà : `DECOMPOSE` exige au moins un composant à rendement > 0,
sinon le choix ne veut rien dire.

---

## Deux points qui ne se rattrapent pas

Ils sortent de leur phase parce qu'ils sont non rétroactifs.

| Quoi | Quand | Pourquoi |
|---|---|---|
| **Clause d'usage des données dans les CGU** — droit d'exploiter des données anonymisées et agrégées pour construire un référentiel métier | **avant le 1ᵉʳ client réel** | À 200 clients, on ne rouvre pas 200 contrats |
| **Codification lot / famille / ouvrage** | **avant la phase 3** | La bibliothèque va produire des ouvrages destinés à être promus au catalogue. Codifier après, c'est jeter l'accumulé |

---

## Les phases

Détail et critères d'acceptation dans [`02-phases.md`](02-phases.md).

| # | Phase | Ce que ça débloque | Poids |
|---|---|---|---|
| 1 | Le coût de chaque ligne | Le patron voit la marge réelle avant de signer | S |
| 2 | Le sous-détail branché sur le référentiel + gel du prix retenu | Le chiffreur arrête de retaper ses prix ; l'étude devient auditable | **L** |
| 3 | Ouvrage composite + bibliothèque qui se remplit | La 2ᵉ affaire se chiffre bien plus vite que la 1ʳᵉ | M |
| 4 | Fournisseurs, conditionnements, comparaison | « A : 30 DH/L — B : 28 DH/L » | M |
| 5 | Catalogue Sektor + rapprochement déterministe | Un nouveau client ne démarre plus sur une page blanche | **L** |
| 6 | Intelligence | Propositions de décomposition, prix anormaux, candidats catalogue | M |
| 7 | Chaînage aval | L'étude devient le budget du chantier ; écart prévu / réalisé | **L** |

> **La phase 7 est le moment où tout l'effort se transforme en argent.** Elle peut être avancée
> juste après la phase 2 si la priorité commerciale l'exige : elle ne dépend ni du catalogue,
> ni de l'IA. Elle est placée en 7 parce qu'elle rend plus si les phases 3 et 4 l'ont précédée,
> pas parce qu'elle en dépend.

**Le catalogue est un pilier, pas un préalable.** Sektor doit être vendable sans lui ; il le
rend seulement beaucoup plus difficile à quitter. Les phases 1 à 4 servent le produit tout de
suite — et produisent au passage la matière du catalogue.

---

## Rapport à l'epic `etude-prix-unifiee`

Cet epic **ne le remplace pas**. Il reste valide sur l'essentiel : chaîne de calcul, wizard à
5 étapes, machine à états, réutilisation d'`achats`, prix de vente jamais stocké comme tarif.

Ce qui est révisé :

| Élément | Avant | Maintenant |
|---|---|---|
| Mode d'un article | `FOURNI` \| `DECOMPOSE` | Origine du coût : `DECOMPOSE` \| `FORFAIT` \| `ESTIME` (décision A) |
| Catalogue Sektor | non traité | Module séparé, produit à part entière (décision E) |
| Ouvrage composite (D9) | décidé, jamais livré | Phase 3 |
| Étape 3 du wizard | « Décomposition » | « Coût » |

### Raccordement — aucun lot orphelin

Le projet a déjà produit deux doublons faute d'avoir recensé l'existant. Ce tableau existe pour
qu'aucun lot ne soit refait ni oublié.

| Ancien lot | Sort | Détail |
|---|---|---|
| 2 — Dossier d'étude + wizard | **inchangé** | Backend livré. Front bloqué par le chantier `front-ownership` |
| 3 — Import non destructif du bordereau | **inchangé, indépendant** | À placer librement. Ne dépend d'aucune phase, aucune phase n'en dépend |
| 4 — Décomposition + bibliothèque | **absorbé par la phase 3** | Ne pas l'exécuter séparément |
| 5 — Branchement sur `achats` | **réparti** | Résolution de prix et gel → phase 2. Comparaison fournisseurs et conditionnements → phase 4 |
| 6 — Chiffrage + validation | **coupé en deux** | Le chiffrage (étape 5, taux, synthèse) passe en **phase 1**. Le circuit de validation via `approbations` reste à faire, indépendamment |
| 7 — Chaînage aval | **devient la phase 7** | Sa spécification reste [`07-chainage-aval.md`](../etude-prix-unifiee/07-chainage-aval.md), amendée — voir [`02-phases.md`](02-phases.md) |
| 10 — Ne pas se fermer de portes | **inchangé, transverse** | Rien à livrer isolément |

**Point d'attention sur le lot 6** : son circuit de validation devient le **chantier V** de cet
epic (voir [`02-phases.md`](02-phases.md)) — il porte la décision G, les trois trous du
quatre-yeux actuel, et l'avis d'exécution. Indépendant, bloqué par rien.

> L'ancien document `06-chiffrage-validation.md` décrivait le module `consultation`, supprimé
> depuis. **Son constat « aucun garde-fou » est périmé** : le circuit actuel de `etudes` a deux
> niveaux d'approbation, refuse que l'auteur valide, et verrouille l'étude en écriture dès la
> soumission. Ce qui reste à corriger est plus fin — voir le chantier V.

---

## Contraintes d'exécution

- **Gradle est cassé sur la machine de développement** (`Selector.open()` / loopback) : rien
  n'est compilable localement tant que ce n'est pas réglé. Voir la note mémoire correspondante.
- **La vérification se fait sur staging**, base vierge, `ddl-auto=validate` — comme pour le
  jalon J1. Pas de serveur de développement local.
- Pas de reprise de données : les migrations peuvent recréer plutôt qu'altérer.

---

## Fichiers

| Fichier | Contenu | Pour qui |
|---|---|---|
| `00-INDEX.md` | Ce document — processus, décisions, phases | Tous |
| [`01-modele-cible.md`](01-modele-cible.md) | Modèle de données cible, entité par entité | Implémentation |
| [`02-phases.md`](02-phases.md) | Détail des phases et critères d'acceptation | Implémentation |
| [`03-catalogue-produit.md`](03-catalogue-produit.md) | Le catalogue comme produit : versions, gouvernance, seuil multi-tenant | Produit |
| [`04-execution.md`](04-execution.md) | **16 lots, 6 vagues, ce qui se parallélise** + en-tête commun des prompts | Pilotage des agents |
| [`05-ux.md`](05-ux.md) | **Les écrans, normatifs** — six règles et six maquettes | Front |
| [`JOURNAL.md`](JOURNAL.md) | Suivi d'implémentation par lot | Implémentation |
