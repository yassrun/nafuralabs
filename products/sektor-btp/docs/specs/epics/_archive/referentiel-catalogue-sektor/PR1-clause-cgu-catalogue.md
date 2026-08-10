# PR1 — Clause CGU : usage des données pour le catalogue Sektor

**Statut :** accepté tel quel — 2026-08-10 (produit)  
**Epic :** referentiel-catalogue-sektor  
**Nature :** hors code · non rétroactif · **avant le 1ᵉʳ client réel**

> Ce texte est la **source de vérité produit** de la clause. Il doit être intégré aux CGU
> Nafura / Sektor (publication marketing ou contrat SaaS) **avant** toute signature client.
> Il ne remplace pas un avis d’avocat ; il fixe le périmètre métier attendu (G1).
> **D1 figé :** pas d’opt-out (option A).

---

## Pourquoi

Le catalogue Sektor se construit à partir des **études et chiffrages réels** des clients
(rendements, structures d’ouvrages, prix de référence agrégés). Sans droit contractuel
explicite, ce flux est illicite ou contestable. La clause n’est **pas rétroactive** : à
200 clients on ne rouvre pas 200 contrats.

Garde-fous produit associés (hors clause, dans le code / process) :
[`03-catalogue-produit.md`](03-catalogue-produit.md) § G1 / G2.

---

## Texte proposé (à coller dans les CGU)

### Article — Catalogue métier et données anonymisées

**1. Objet.** Le Client autorise NafuraLabs (éditeur de Sektor) à utiliser certaines données
issues de son usage de la Solution, exclusivement sous forme **anonymisée et agrégée**, afin
de constituer, enrichir et publier un **référentiel métier** (ci-après le « Catalogue »),
utilisable dans Sektor et, le cas échéant, commercialisé séparément.

**2. Données concernées.** Peuvent être utilisées à cette fin, après anonymisation /
agrégation :

- structures d’ouvrages et décompositions (composants, unités, rendements) ;
- statistiques de coûts et de prix **agrégées** (indicateurs, distributions, références) ;
- motifs de rapprochement ou de capitalisation **sans** identification du Client.

**3. Exclusions.** Sont exclus de tout usage catalogue, sauf accord écrit distinct :

- les données permettant d’identifier le Client, ses chantiers, ses partenaires ou ses
  collaborateurs (noms, ICE, adresses, identifiants techniques de tenant, références
  d’affaires) ;
- les libellés bruts du Client repris **tels quels** — tout libellé catalogue est
  reformulé ;
- le prix unitaire ou l’offre nominative d’un fournisseur d’un Client, publié comme prix
  catalogue (seules des **agrégations** de prix de référence sont autorisées) ;
- le contenu d’œuvres protégées de tiers (ex. bases éditoriales concurrentes).

**4. Seuils de publication.** NafuraLabs s’engage à ne publier dans le Catalogue un concept
(article, ouvrage / rendements, prix de référence) qu’après confirmation par un **nombre
minimum d’entreprises indépendantes**, selon des seuils paramétrables et non désactivables
(politique produit G2). Deux entités du même groupe comptent pour une.

**5. Propriété.** Le Client demeure propriétaire de ses données nominatives et de son
savoir-faire identifié. NafuraLabs demeure propriétaire du Catalogue, des libellés
reformulés, des agrégats et de la structure éditoriale qui en résultent.

**6. Opt-out.** Pas d’opt-out catalogue une fois les CGU acceptées — le service catalogue fait
partie du modèle produit. (Décision D1 — 2026-08-10.)

**7. Entrée en vigueur.** La présente clause s’applique aux Clients ayant accepté la version
des CGU qui l’inclut. Elle **ne s’applique pas rétroactivement** aux contrats antérieurs
sans avenant.

**8. Transparence.** Sur demande raisonnable, NafuraLabs décrit les catégories de données
utilisées pour le Catalogue et les principes d’anonymisation / agrégation (sans communiquer
de données d’autres clients).

---

## Décisions à figer à la validation

| # | Question | Décision |
|---|----------|----------|
| D1 | Opt-out (art. 6) | **A** — pas d’opt-out (figé 2026-08-10) |
| D2 | Catalogue vendable hors ERP | Oui, déjà prévu art. 1 (« commercialisé séparément ») |
| D3 | Droit applicable | Droit marocain · tribunaux de Casablanca *(à confirmer juridique)* |
| D4 | Langue | FR (source) · AR/EN traduction non divergente |

---

## Intégration (hors epic code)

Quand le texte est validé :

1. Insérer l’article dans le document CGU SaaS Sektor / NafuraLabs (publication).
2. Versionner le document (`CGU-Sektor-vX.Y`) et conserver la date d’effet.
3. Checkbox d’acceptation à l’onboarding / contrat — **avant** 1ᵉʳ client réel.
4. Cocher PR1 dans [`00-PROGRESS.md`](00-PROGRESS.md) → débloque **L14**.

---

## Critères d’acceptation PR1

- [x] Texte validé « tel quel » (ou amendé) par décideur produit *(2026-08-10)*
- [ ] Relecture juridique externe ou interne notée (date / qui) — *recommandée, hors chemin critique L14 lab*
- [x] Décision D1 (opt-out A) figée
- [x] Emplacement de publication CGU identifié : intégrer dans CGU SaaS Sektor / NafuraLabs
      (pas encore de page live — lab mode)
- [x] PR1 marqué **done** dans PROGRESS — L14 autorisé

---

## Hors périmètre PR1

- Implémentation module `catalogue` (L14+)
- UI d’acceptation CGU dans l’ERP (peut suivre la publication)
- Avis d’avocat formel (recommandé, pas automatisable ici)
