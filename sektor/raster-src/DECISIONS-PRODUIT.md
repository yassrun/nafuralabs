# Décisions produit — Sektor Études (avant Pact)

> Journal vivant **avant** CADRE / SPEC / CH / PLAN.
> Pas du code. Pas un ticket. On gèle ici, on spécifie après.
>
> Arbre des dossiers code : [`DECISIONS.md`](DECISIONS.md).
>
> Comment continuer : ajouter une entrée datée sous **Gelé** ou **Ouvert**. Une fois gelé, on ne rejoue pas le débat dans le chat — on amende ce fichier.

Dernière passe : 20/08/2026 (identité + consultation fournisseurs).

---

## Trois couches (à geler)

Le bordereau mélange trois objets. Les coller dans le même référentiel casse Extraire, le stock, et la bibliothèque.

| Couche | Quoi | Où ça vit | Référentiel tenant ? |
|--------|------|-----------|----------------------|
| **Poste** | Ligne de *ce* marché (qty, libellé BDP, DPU de l’étude) | Arbre DPGF du dossier | **Non** — jamais un article catalogue |
| **Composant** | Matière / MO / matériel / ST d’un DPU | Lignes DPU du poste | **Oui, si réutilisable** → article tenant **lié à l’identité Sektor** |
| **Ouvrage** | Recette réutilisable (composants + rendements) | Bibliothèque de prix (`catalogue/`) | **Oui, après étude** — pas un article |

**Réponse à la question :** un poste décomposé **n’est pas** ajouté au référentiel **articles** « avec ses composants ». Les composants peuvent devenir des **articles**. Le poste comme recette devient un **ouvrage** (capitalisation), pas un item stock.

---

## Cycle cible — chiffrer un poste déjà décomposé

Ordre voulu. Ce qui n’est pas dans cette liste n’est pas le flux.

1. **Ouvrir le poste** sur le bordereau (instance d’étude, pas une fiche catalogue).
2. **Descriptif métier** : écrire / coller, **enregistrer**. Extraire ne lit pas le textarea live — seulement le descriptif persisté + libellé + jusqu’à 4 extraits CPS.
3. **Extraire** (IA d’abord, identité ensuite) — deux seaux, pas plus :
   - **Déjà sur le tenant** → liste des articles existants, composant **lié**. Pas de création.
   - **Pas sur le tenant** → **proposition de création** (l’humain confirme). Pas d’auto-création.
4. **Trancher chaque proposition de création, pendant le chiffrage** :
   - **Créer l’article** → d’abord s’assurer (IA) que l’identité n’existe **pas déjà** sur Sektor. Si elle y est → Item tenant lié seulement. Si absente → **PUBLIER** Sektor, puis Item. Puis tarif, lien DPU.
   - **Ajouter au poste seulement** → composant manuel, one-shot, pas d’article.
   - **Depuis le catalogue** → picker explicite d’un article déjà là.
5. **Ajuster** rendements / PU / sous-détail, **enregistrer le DPU**.
6. **Chiffrer le poste** (coût → PV / marge). Le poste reste une ligne d’étude.
7. Répéter 1–6 sur les autres postes.
8. **Valider** le dossier (`VALIDEE` / devis généré).
9. **Capitaliser** (opt-in, panneau dédié, **pas** auto à la validation) : les postes décomposés utiles → **ouvrages** bibliothèque, avec leurs composants et rendements. Collision = créer / remplacer / nouveau code / ignorer.

Interdit dans ce cycle :

- Créer un **article** pour le poste lui-même.
- Auto-créer des articles à Extraire.
- Verser en ouvrage **pendant** le chiffrage.
- Confondre `/catalogue` (console éditoriale interne Nafura / G2) avec `/inventory/catalogue/articles` (projection tenant) ou `/etudes/bibliotheque-prix` (ouvrages). L’**identité** est Sektor ; la console n’est pas l’écran Extraire.

---

## Gelé (17/08/2026)

### Chrome études

- **Métrés & Quantitatifs** (`/etudes/metres`) : hors menu **et** hors code. Ancien takeoff (L×l×h → DPGF `createFromMetre`). Le chemin dossier vit par `createEmpty` / `createFromImport` avec `metreId = null`. Blast : API `/etudes/metres`, entité, `createFromMetre`, `metreId` sur DPGF / devis / AO, seeds, lookups. Pas encore implémenté — inbox.
- **Console catalogue Sektor** (`/catalogue`) : **pas dans le chrome tenant**. Outil interne Nafura (candidats / éditions G2). Hors chrome études. Amendé 20/08 : Extraire **utilise** l’identité Sektor, sans ouvrir cette console. Pas encore implémenté — inbox.

### Extraire les composants

- Pas une recherche catalogue d’abord. IA (libellé + descriptif **sauvé** + extraits CPS) puis **normalisation d’identité**.
- « Voir le descriptif CPS » = viewer, ne copie pas dans le textarea.
- « Depuis le catalogue » = picker explicite, pas le chemin Extraire.

### UI bordereau

- Listes d’erreurs gate / consultation : bannière compacte + **Voir les détails** (dialog). L’arbre garde de la hauteur. Déjà en code (front).

### Devis

- Sans client Partner : aujourd’hui bandeau + erreur. Cible : demander si on **crée le client**. Inbox, pas gelé UX fine.

### Capitalisation (comportement actuel = cible)

- Après validation d’étude, vers **ouvrage**, pas vers article.
- Pas automatique à la validation (`CapitalisationOuvrageService`).

---

## Gelé (20/08/2026) — identité article unique

Une désignation n’est pas un article. **Un article = une identité**, partout (étude, tenant, fournisseur, Sektor).

### Identité

- Canonique = article **catalogue Sektor** (`cle_stable`).
- **Item tenant** = **1–1** avec l’identité (`cle_stable` ↔ un Item par tenant). Pas un Item par couleur / teinte / RAL.
- **Ligne catalogue fournisseur** = prix + `ref_fournisseur` (SKU du fournisseur) sur **cette** identité. Pas une 3ᵉ fiche article.
- Libellé IA, libellé BDP, nom tenant, désignation devis fournisseur = **alias**, pas des objets.

### Normalisation = IA

- Le moteur décide que deux désignations différentes **sont le même article**.
- Cible : **IA**. Un `LIKE` / égalité de nom ne suffit pas. Le pipeline déterministe existant (EXACT / REGLE / TRIGRAM, L15) n’est pas Extraire.
- Extraire aujourd’hui (`CatalogLookupApiImpl` LIKE + score ≥ 0.5) = **constat, pas la cible**.

### Extraire — après l’IA, deux seaux

Gemini sort des besoins (désignation, type, unité, rendement). La normalisation (IA) classe **chaque** besoin :

| Seau | Condition | UI | Action |
|------|-----------|-----|--------|
| **Déjà sur le tenant** | Item 1–1 existe pour cette identité | Liste, lié au composant | **Pas** de proposition de création |
| **À créer** | Pas d’Item tenant | Proposition de création | L’humain confirme — jamais auto |

Un besoin n’est « à créer » **que si** l’IA a aussi vérifié qu’on ne duplique pas Sektor (voir ci-dessous). Match incertain (2+ identités) : encore **ouvert**.

### Créer un article — Sektor d’abord, sans doublon

Avant d’écrire quoi que ce soit, l’IA cherche l’identité sur **catalogue Sektor** (pas seulement le tenant).

| Sektor | Tenant | On fait |
|--------|--------|---------|
| Identité **déjà là** | pas d’Item | Créer **seulement** l’Item lié. **Pas** une 2ᵉ fiche Sektor. |
| Identité **absente** | pas d’Item | **PUBLIER** l’identité Sektor, puis l’Item 1–1. |
| Identité déjà là | Item déjà là | Ce n’est pas une création — seau « déjà sur le tenant ». |

Ordre si identité absente :

1. PUBLIER l’identité catalogue Sektor (pas un candidat G2).
2. Créer l’Item tenant lié (1–1).
3. Puis tarif / ligne DPU / ligne catalogue fournisseur.

L’IA a tranché « il faut l’ajouter ». Ce n’est pas une proposition à valider dans `/catalogue`. G2 sert à fusionner / retirer **plus tard**, pas à bloquer Extraire.

Jamais un Item orphelin. Jamais une 2ᵉ identité pour le même produit. Jamais une ligne fournisseur qui invente un article parallèle.

### Identité ≠ tiny spec ≠ emploi

Peinture blanche et peinture rouge **ne sont pas** deux articles. C’est la même identité + une **tiny spec**.

| Niveau | Quoi | Exemple | Où ça vit |
|--------|------|---------|-----------|
| **Identité** | Le produit que l’IA normalise | Peinture acrylique intérieure | Catalogue Sektor → Item tenant (1–1) |
| **Tiny spec** | Option qui ne change pas le produit | Couleur, RAL, teinte | Emploi (DPU / poste) ; variante d’achat plus tard si SKU/stock/prix distincts |
| **Emploi** | Spec de *ce* marché | « teinte au choix de l’architecte » | Descriptif / composant du poste — jamais un article |

Extraire : « peinture acrylique blanche » → identité **peinture acrylique intérieure**, tiny spec **blanc** sur la ligne. **Ne pas** proposer de créer « peinture blanche ».

Nouvelle identité **seulement** si le produit change : nature, unité de chiffrage, ou famille (intérieure vs façade, CPJ 32,5 vs 45, HA Ø12 vs Ø16). Couleur / teinte / RAL / marque équivalente / « au choix » → **pas** une identité.

Variante d’achat (2 SKU fournisseur, 2 stocks) = **sous** l’identité, pas un 2ᵉ `cle_stable`. Hors Extraire v1 : le chiffrage utilise le PU de l’identité ; la couleur reste une note d’emploi. Schéma variante / index unique catalogue fournisseur = spec plus tard.

### Devis / consultation fournisseur

- Inscrire les articles du devis dans le **catalogue fournisseur** sur l’identité déjà connue.
- Même règle Extraire : existant → lier ; absent → créer l’identité (Sektor puis tenant) puis la ligne fournisseur.

---

## Gelé (20/08/2026) — consultation fournisseurs (décompo)

Aujourd’hui « Consulté » se coche **à la main** sur la ligne DPU. Ça ne veut plus rien dire. Un fournisseur est consulté **quand un devis reçu est lié à la consultation études**.

### Paramètre tenant

| Paramètre | Valeurs | Effet |
|-----------|---------|--------|
| Consultation | **optionnelle** (défaut) ou **obligatoire** | Optionnelle → gate informative. Obligatoire → gate **bloquante**. |
| Minimum | **entier** ≥ 1 (pas un choix 1/2/3) | Si obligatoire : au moins **N devis reçus**, **N fournisseurs distincts**. |

Le minimum ne compte que si obligatoire. Optionnel + min 5 n’empêche pas de valider.

### Qui on consulte

- Un fournisseur **de la table fournisseurs** (fiche achats). Pas un nom tapé, pas un e-mail seul.
- On l’invite dans une **consultation études** du dossier (pas un AO achats, pas le devis **client**).

### Où est le devis fournisseur aujourd’hui (constat)

| Objet | Où | Compte comme « consulté » ? |
|-------|-----|-----------------------------|
| PDF déposé via portail invité | `DossierDocument` type `DEVIS_FOURNISSEUR` sur le dossier | **Non** — pas de fournisseur, pas de lien consultation |
| `OffreFournisseur` | Achats, sous un **AO achat** | **Non** — autre flux (acheter, pas chiffrer) |
| Flag `CONSULTE` | `sourcePrix` sur `ComposantDpu`, bouton manuel | **Non** — cible à remplacer |
| Devis **client** | `DevisService` (offre au maître d’ouvrage) | **Non** |

### Cible

1. Créer / ouvrir la **consultation études** du dossier.
2. Choisir 1–N fournisseurs (fiches existantes).
3. Recevoir un **devis** (fichier ou saisie) **lié** à cette consultation **et** à ce fournisseur.
4. Ce lien = « ce fournisseur a été consulté ». Compteur = nombre de devis reçus distincts (un par fournisseur).
5. Si obligatoire et min = N → **N devis consultation reçus** (étude) avant de passer. Moins = gate bloquante. **Pas** « tous les articles décomposés identifiés ».
6. Identifier **quels articles de l’étude** sont couverts par ces devis → eux seuls reçoivent le prix consulté. Les autres restent tarif / manuel.
7. Les lignes du devis alimentent le catalogue fournisseur (identité Sektor, déjà gelé).

Un PDF orphelin sur le dossier **ne compte pas**.

### Objets (pas le flag, pas l’AO achats)

Oui : il faut un **devis consultation**, pas seulement un document sur le dossier.

| Objet | Rôle |
|-------|------|
| **Consultation études** | L’appel, **lié à l’étude**. Paquet d’articles (plusieurs postes). Pas un AO achats. |
| **Devis consultation** | Devis **reçu**, lié à la consultation **et** à une fiche fournisseur. Compte pour le min N. |
| **Articles identifiés** | Sous-ensemble d’identités de **cette étude** couvertes par le(s) devis. C’est **ça** qui rend un article « consulté ». |

On **ne réutilise pas** `OffreFournisseur` (AO achats) ni le devis **client**. Inviter sans devis reçu **ne compte pas**. Un fournisseur = au plus un devis consultation qui compte (pas 2 PDF du même = 2 consultations).

### Grain — lié à l’étude, pas à un article ni à un poste

On ne lance **pas** une consultation par article, ni par poste. On groupe.

- La **consultation** est accrochée à **l’étude** (dossier).
- Le **périmètre** = un **paquet d’articles** (identités), pris sur **plusieurs postes** de la décompo (2 ou 3, ou plus).
- Le **devis consultation** répond à ce paquet.
- Ensuite on **identifie** dans l’étude **quels articles** ont été couverts par au moins un devis. Ceux-là sont consultés. Les autres postes / articles restent non consultés (tarif / manuel).

Même identité sur trois postes (ex. ciment) : **une** identification dans l’étude, pas trois consultations.

**Obligatoire = min N devis, pas 100 % des articles.** Comme SAP (RFQ = paquet) et les ERP BTP (consultation par lot). L’identification sert à **appliquer le prix**, pas à une 2ᵉ gate. Variante plus tard : les articles **mis dans le paquet** devraient revenir sur le devis (couverture du RFQ, pas de tout le DPGF).

Interdit : une consultation « pour le poste 3.2 » ou « pour la ligne peinture du DPU ».

---

## Aujourd’hui dans le code (constat, pas une spec)

Pendant Extraire / DPU :

- Matché → `itemId` sur le composant (LIKE nom/code tenant, score ≥ 0.5 + prix consultable). **Pas** l’identité Sektor.
- Manquant → dialog **Ajouter au poste** (`mode: poste`) ou **Créer dans le catalogue** (`mode: catalogue`) = Item tenant seul, **sans** fiche Sektor.
- Ligne DPU déjà manuelle → bouton **Créer dans le catalogue** (`ajouterComposantAuCatalogue`).
- **Consulté** → bouton `marquerConsulte` qui pose `sourcePrix=CONSULTE` sans devis. Gate étape 4 **non bloquante**.

Après étude :

- Capitalisation → `Ouvrage` + `ComposantOuvrage`. Les composants de l’ouvrage **référencent** des items s’ils étaient liés ; ça ne crée pas un article « poste ».

G2 / console Nafura :

- `CatalogEnrichissementService.contribuer` = signaux vers la console interne, **pas** des items tenant.
- `RapprochementDeterministeService` / `LlmRapprochementAdapter` rapprochent un libellé vers `catalogCle` — **pas branché Extraire**.

Catalogue fournisseur :

- `catalogue_fournisseur_lignes.article_id` = UUID Item + `ref_fournisseur` texte. Pas de `cle_stable`.

Consultation / devis fournisseur :

- Portail invité `FOURNISSEUR_UPLOAD` → fichier `DEVIS_FOURNISSEUR` sur le dossier, **sans** `fournisseur_id`.
- `OffreFournisseur` = réponses d’un AO **achats**, pas la consultation études.
- `ComposantDpu.offreFournisseurId` existe ; le bouton Consulté ne le renseigne pas.

---

## Ouvert (prochain tour avant spec)

Cocher / amender ici, ne pas re-débattre à l’aveugle.

- [ ] **Confirmer les 3 couches** (poste ≠ article ; composants = articles si réutilisables ; recette = ouvrage).
- [ ] Manquant Extraire : rester **toujours demander** (catalogue vs poste) — ou un défaut (ex. poste-only, catalogue en 2ᵉ clic) ?
- [ ] Capitalisation : rester **opt-in** après validation, ou un rappel / gate « X postes capitalisables » ?
- [ ] Composant manuel one-shot : peut-on le promouvoir article **plus tard** (après save), ou seulement au moment Extraire / bouton actuel ?
- [ ] Ouvrage capitalisé : les composants non-articles restent manuels dans l’ouvrage, ou on force « créer l’article » avant versement ?
- [x] Enrichissement G2 : **tranché 20/08** — créer un article = identité Sektor **PUBLIEE** tout de suite, puis tenant. Pas un candidat. La console `/catalogue` reste hors chrome tenant (fusion / retrait plus tard, pas Extraire).
- [ ] Extraire, match **incertain** (2+ identités) : faire **trancher** l’utilisateur, ou prendre le meilleur score IA ?
- [x] Création Extraire : **tranché 20/08** — **PUBLIEE** tout de suite. L’IA a déjà décidé que c’est un article à ajouter ; pas une proposition G2.
- [x] Binding : **tranché 20/08** — 1 Item tenant **par** `cle_stable` (1–1). Tiny spec (couleur, RAL) ≠ 2ᵉ Item. Variante d’achat sous l’identité, plus tard, si SKU/stock l’exigent.
- [ ] Tiny spec Extraire : la coller en **note d’emploi** sur le composant dès v1, ou seulement le lien identité (couleur perdue jusqu’à la variante d’achat) ?
- [x] Consultation : **tranché 20/08** — optionnelle/obligatoire + **min entier** ; objet **devis consultation** ; grain = **étude** + paquet d’articles (plusieurs postes) ; ensuite **identifier** les articles de l’étude couverts. Pas une consult par article/poste. Pas `OffreFournisseur` achats.
- [x] Consultation obligatoire : **tranché 20/08** — le min **N devis reçus** suffit. On n’oblige pas chaque article décomposé à être identifié. Identification = appliquer le prix. Couverture du **paquet** (lignes envoyées) = plus tard, pas tout le DPGF.
- [ ] Devis reçu : **fichier** (portail) suffisant une fois lié, ou lignes de prix saisies / extraites obligatoires pour **identifier** un article ?

---

## Hors sujet de ce fichier (déjà ailleurs)

- Pact Sektor : pas encore. Ce journal nourrira le CADRE / SPEC études + catalogue.
- Portail invité : inbox, livré hors Pact.
- Impression PDF / Gotenberg : lot platform, pas ici.
