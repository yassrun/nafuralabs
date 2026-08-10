# Le catalogue Sektor comme produit

**Décision produit (2026-08-09)** : le catalogue a deux objectifs, dans cet ordre.

1. **Être un pilier de Sektor.** Un nouveau client ne démarre pas sur une page blanche.
2. **Être vendable séparément**, plus tard, quand il sera riche — y compris à des entreprises
   qui n'utilisent pas le reste de l'ERP.

Le second objectif ne change rien au calendrier, mais **tout à la construction**. Un catalogue
conçu comme une table interne ne devient jamais un produit. Il faut le bâtir comme un produit
dès le premier jour, même s'il reste interne trois ans.

---

## La référence : Batiprix

Batiprix est la bibliothèque de sous-détails de prix du bâtiment en France (groupe Moniteur) :
des dizaines de milliers d'ouvrages classés par lot, chacun avec son unité, sa décomposition en
matériaux / main-d'œuvre / matériel, ses **rendements**, et un prix indicatif. Éditions
annuelles, coefficients régionaux, versions papier et logicielle.

Trois enseignements pour Sektor :

**Ce qui a de la valeur, c'est le rendement, pas le prix.** Le prix affiché est indicatif et
daté ; tout utilisateur sérieux le remplace par le sien. « 0,25 h de peintre par m² », en
revanche, est stable sur des années. C'est exactement la décision C de cet epic, et D10 de
`etude-prix-unifiee`.

**Il n'y a pas de mode « prix fourni ».** Chaque ouvrage est décomposé, toujours. Ce qui
conforte la décision A : le sous-détail est la forme normale, l'estimation le cas dégradé.

**Sa structure est déjà la nôtre.** Ouvrage → composants → rendement × prix unitaire →
déboursé, puis frais et marge appliqués par l'entreprise. Le moteur de calcul de Sektor
respecte ce modèle et il est vérifié sur 84 ouvrages réels.

### Là où Sektor diffère

Au Maroc, il n'existe pas d'équivalent : pas de bordereau de référence public, à jour et
exploitable. Chaque entreprise reconstruit son classeur Excel dans son coin. Le catalogue n'est
donc pas un confort — **c'est un produit en soi**, et probablement le fossé le plus difficile à
franchir pour un concurrent.

Mais il ne se construira pas comme Batiprix. Batiprix est **éditorial** : une équipe rédige,
mesure et publie. Sektor n'a ni ce budget ni ces années. En revanche il a ce que Batiprix
n'aura jamais : **les études réelles de ses clients**. Chaque affaire validée est un vote sur
un rendement réel, au Maroc, à la date d'aujourd'hui.

D'où le différenciateur : Batiprix dit ce que ça coûte *en moyenne, en France, l'an dernier*.
Sektor peut dire ce que ça a coûté *à vous, sur vos trois derniers chantiers, avec vos
fournisseurs*.

> ⚠️ **Le contenu de Batiprix est une œuvre protégée.** On peut s'inspirer de la structure et
> de la nomenclature des lots — c'est de la pratique professionnelle courante. On n'importe pas
> leur base. Le corpus vient des classeurs des clients et des études réelles.

---

## La règle qui protège tout le reste

La matière du catalogue vient du travail des clients. Un rendement, c'est leur savoir-faire.
Deux garde-fous, non négociables.

### G1 — Le droit d'usage doit être contractuel dès le premier client

Clause CGU : droit d'exploiter des données **anonymisées et agrégées** pour construire un
référentiel métier. Banale, mais **non rétroactive**. À 200 clients, on ne rouvre pas
200 contrats.

→ Tâche `PR1` dans [`02-phases.md`](02-phases.md).

### G2 — Seuil de confirmation multi-tenant

**Un concept n'entre au catalogue que s'il est confirmé par plusieurs entreprises
indépendantes. Jamais depuis une seule.**

Sinon on revend littéralement le classeur d'un client à son concurrent. Le jour où ça se sait,
le produit est mort.

Cette règle n'est pas qu'une précaution juridique — **c'est le mécanisme de qualité du
catalogue**. Un rendement confirmé par cinq entreprises vaut infiniment mieux qu'un rendement
copié d'une seule. Le seuil protège et améliore en même temps.

| Objet promu | Seuil |
|---|---|
| Article (concept métier) | ≥ 3 tenants indépendants |
| Ouvrage (avec ses rendements) | ≥ 3 tenants indépendants |
| Prix de référence | ≥ 5 tenants, et une dispersion mesurée publiée avec la valeur |

Les seuils sont **paramétrables**, jamais désactivables. Deux tenants appartenant au même
groupe comptent pour un.

**Conséquences sur ce qui est publié** :
- aucun libellé brut d'un client n'est repris tel quel — le libellé catalogue est reformulé
- les exemples attachés à un candidat sont anonymisés : ni nom de tenant, ni identifiant
  remontant à un client
- un prix de référence est une **agrégation**, jamais le prix d'un fournisseur d'un client

---

## Ce qu'impose « vendable un jour »

### Un module, pas seulement une table

Le reste de Sektor consomme le catalogue à travers une interface. Jamais par une jointure
directe, jamais par une clé étrangère. Le jour où on le sort, c'est un changement de
déploiement — pas une réécriture.

**Vérifié par un test qui casse le build** : aucune FK partant d'une table `catalog_*` vers une
table portant `tenant_id`.

### Des éditions publiées

Les acheteurs attendent des versions : « catalogue Sektor 2027.1 ». Donc :

- un article et un ouvrage ont un **statut** (`BROUILLON` / `PUBLIE` / `RETIRE`) et une version
- leur **identité est stable** à travers les versions (`cle_stable`)
- une dépréciation se fait par `remplace_par`, jamais par suppression
- **toute étude enregistre l'édition du catalogue qu'elle a utilisée**

Sans ça, on ne peut ni expliquer une étude ancienne, ni facturer une mise à jour.

### Des prix de référence dans le catalogue

Un ouvrage sans prix indicatif est un demi-produit pour qui n'a pas Sektor. Le catalogue porte
donc ses propres prix de marché, datés, distincts des prix des clients — et soumis à G2.

Une dimension `zone` existe dès la création, nullable (Maroc entier par défaut). On ne
construit pas la régionalisation maintenant ; on évite seulement de devoir migrer pour
l'ajouter.

### Une codification qui tient

Batiprix a sa nomenclature et elle ne bouge pas d'une édition à l'autre. Il faut la nôtre :
lot → famille → ouvrage, codes stables et lisibles.

**À figer avant la phase 3** — la bibliothèque va produire des ouvrages destinés à la
promotion. Codifier après, c'est jeter l'accumulé.

### Une console éditoriale

Quelqu'un chez Sektor examine les candidats, arbitre, publie. Ce n'est **pas** dans
l'application client. C'est petit, mais ça doit exister dès la première promotion.

Ce qu'elle montre pour chaque candidat : le libellé proposé, le nombre de tenants confirmants,
des exemples anonymisés, la dispersion des rendements observés, et qui l'a proposé — règle
ou IA, avec la version du modèle.

---

## Le cycle de vie, de bout en bout

```
Un chiffreur saisit un libellé inconnu
                │
                ▼
      composant LIBRE  ── ne bloque jamais l'étude
                │
                ▼
   Rapprochement déterministe (phase 5)
        trouve ?  ──oui──►  item_match SUGGERE ──► validé par l'utilisateur
                │
               non
                ▼
   Job d'enrichissement (phase 6) — regroupe les non-rapprochés
                │
                ▼
        catalog_candidat
        nb_tenants_confirmants = 1     ──►  reste en attente, invisible
        nb_tenants_confirmants ≥ 3     ──►  remonte en console éditoriale
                │
                ▼
      Un humain chez Sektor arbitre
                │
                ▼
   catalog_article  BROUILLON ──► PUBLIE dans l'édition suivante
                │
                ▼
   Disponible à l'import chez tous les tenants
```

**L'IA propose et classe. Elle ne publie jamais.**

---

## Ce qui reste à décider

| # | Question | Impact |
|---|---|---|
| C1 | Schéma de codification lot / famille / ouvrage | **Bloque la phase 3** — arbitrage métier |
| C2 | Seuils exacts (3 / 3 / 5) | Paramétrables ; valeurs de départ à confirmer |
| C3 | Le catalogue vendu séparément est-il en lecture seule, ou modifiable par l'acheteur ? | Change le modèle d'import — décidable après la phase 5 |
| C4 | Régionalisation des prix (Casablanca / Marrakech / …) | Hors périmètre ; la colonne `zone` évite d'avoir à migrer |
| C5 | Modèle de tarification du catalogue vendu | Hors périmètre technique |

Aucune ne bloque les phases 1, 2 et 4.
