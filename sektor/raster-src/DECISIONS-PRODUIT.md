# Décisions produit — Sektor Études

> Journal vivant **avant** CADRE / SPEC / CH.
> Pas du code. Découpage Raster : lot `etudes/` — SEKTOR-106…112.
>
> Arbre des dossiers code : [`DECISIONS.md`](DECISIONS.md).
>
> Comment continuer : ajouter une entrée datée sous **Gelé** ou **Ouvert**. Une fois gelé, on ne rejoue pas le débat dans le chat — on amende ce fichier.

Dernière passe : 28/08/2026 (consultation RFQ : 1 panier + N destinataires — casse « un fournisseur » du 22/08).

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
   - **Ajouter depuis le catalogue** → picker explicite d’un article déjà là (CTA en tête du panneau, pas sur la ligne).
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

- **Métrés & Quantitatifs** (`/etudes/metres`) : hors menu **et** hors code. Livré 20/08 (SEKTOR-111). Ancien takeoff (L×l×h → DPGF `createFromMetre`). Le chemin dossier vit par `createEmpty` / `createFromImport`. Dette : changelog v1.0 crée encore `metrees` puis `023_drop_metres` les droppe — inbox.
- **Console catalogue Sektor** (`/catalogue`) : **pas dans le chrome tenant**. Outil interne Nafura (candidats / éditions G2). Extraire publie l’identité sans ouvrir cette console — livré 20/08 (SEKTOR-108, QA PASS).

### Extraire les composants

- Pas une recherche catalogue d’abord. IA (libellé + descriptif **sauvé** + extraits CPS) puis **normalisation d’identité**.
- « Voir le descriptif CPS » = viewer, ne copie pas dans le textarea.
- « Ajouter depuis le catalogue » = picker explicite en tête du panneau, pas le chemin Extraire, pas un swap de ligne.

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

## Gelé (22/08/2026) — consultation = objet Achats

**Casse le gel 20/08** (objet `ConsultationEtude` collé au dossier, panneau sur la page Coût, saisie `cle=prix`). Walk 22/08 : le panneau mange l’arbre ; la DA est un objet **chantier** (approbation → BC) — ce n’est pas une consultation.

### Ce que c’est / ce que ce n’est pas

| Objet | Rôle |
|-------|------|
| **Consultation** | Demande de **prix fournisseur**. Panier d’articles + **un** fournisseur (fiche achats). Vit dans **Achats**. Peut exister **sans** étude et **sans** chantier. |
| **Demande d’achat** | Besoin d’**acheter** pour un **chantier** → BC. Pas une consultation. |
| **Appel d’offres achats** | Consultation **chantier** qui finit en attribution / BC. Pas le flux étude. |
| **Devis client** | Offre au maître d’ouvrage, menu Études. |

Cycle consultation : **demande** → **devis reçu**. Le devis se **importe** (fichier). **Import magique** extrait les lignes (libellé, qté, PU). Pas de saisie `cle_stable=prix`. Pas de checkbox « identifier » à la main.

### Chrome

- **Liste** = sous-menu **Achats** (à côté Demandes / Appels d’offres). **Pas** un item Études.
- **Geste étude** = overlay depuis l’article / le composant. L’arbre **reste visible**. Panneau dans la page Coût : interdit.

**Overlay (gelé 23/08 — casse le formulaire 22/08)**

Pas un formulaire « fournisseur + cases + deux CTA ». Clic sur un article / composant → **d’abord la liste** des consultations **déjà liées à cette étude**.

1. Chaque ligne : n° · fournisseur · **statut** · ce composant **déjà dans le panier ou pas** · **œil** vers la fiche Achats (`/achats/consultations/:id`, nouvel onglet, même geste que le nf-select).
2. Clic une consultation → **ses articles** (panier), pas un dropdown.
3. S’il n’est pas dedans → l’ajouter à celle-là.
4. **Créer** seulement si aucune ne convient (fournisseur + l’article courant, pas tout l’arbre à cocher).
5. IA propose (déjà chez Lafarge / créer chez X). Le fallback manuel = cette liste, pas un select.

Interdit dans l’overlay : deux selects + checkboxes de toutes les identités + « Créer » et « Ajouter à » côte à côte.

### Grain

Une consultation = **un fournisseur + un paquet** d’identités (`cle_stable`) prises sur **plusieurs postes**. Pas une consultation par ligne DPU / par poste. Ciment sur 3 postes = une ligne de panier.

> **Cassé 28/08** sur « un fournisseur » — voir gel 28/08 (1 panier + N destinataires). Le paquet d’identités (panier) reste.

### Lien étude (la seule diff)

Sans lien étude : la consultation vit dans Achats, pas de flag sur un arbre.

Liée à une étude : pour chaque **article du panier**, si **N devis reçus** (import magique, lignes extraites) le couvrent → flag **CONSULTÉ** sur le composant + prix consulté. Peinture dans le même appel, 0 devis → pas flaguée.

N = paramètre tenant (inchangé 20/08) :

| Paramètre | Valeurs | Effet |
|-----------|---------|--------|
| Consultation | **optionnelle** (défaut) ou **obligatoire** | Optionnelle → pas de gate. Obligatoire → gate **bloquante** sur l’étude. |
| Minimum | **entier** ≥ 1 | Si obligatoire : au moins **N devis reçus** (imports extraits) sur les consultations **liées** à l’étude. |

Le flag est **sur l’article**, pas sur la consultation.

### Interdit

- Réutiliser la DA ou `OffreFournisseur` AO.
- Coller la consultation au dossier comme agrégat Études.
- Menu Consultation sous Études (à côté Devis client).
- Saisir les lignes de devis à la main comme chemin principal.

---

## Gelé (23/08/2026) — picker article partagé

**Casse le dump actuel** (`CatalogItemPickDialog` → `getAll({ page: 1, pageSize: 40 })` à l’ouverture ; selects stock qui chargent tout le catalogue).

Ancrage QA : [`lots/etudes/picker-article/CONTRAT.md`](lots/etudes/picker-article/CONTRAT.md) (`AC-1`…`AC-14`).
Canvas : [`lots/etudes/picker-article/ux/picker-article-wireframe.canvas.tsx`](lots/etudes/picker-article/ux/picker-article-wireframe.canvas.tsx).
Ne pas dupliquer `etude-decompo-wireframe` ni `articles-fiche-wireframe`.

### Ce que c’est / ce que ce n’est pas

| Objet | Rôle |
|-------|------|
| **Picker article** | Recherche à la demande d’un article **déjà sur le tenant**. Un composant, plusieurs pieds. |
| **Extraire** | Chemin **IA**. Deux seaux, pas une recherche. Inchangé. |
| **Créer dans le catalogue** | Hors de ce picker. Reste Extraire / fiche articles. |

### Ouverture

Aucun GET catalogue tant qu’il n’y a pas **≥ 2 caractères** **ou** un filtre posé (nature, famille, lot d’usage). Prompt de saisie, pas une liste. Ouverture DPU = header, **sans** chip nature pré-rempli ; un chip posé par l’humain déclenche.

### Recherche

As-you-type, debounce ~300 ms, **code + désignation** uniquement. Code exact en tête. Actifs seulement par défaut. Unité + PU sur chaque hit. ↑↓ + Entrée.

### Filtres — serveur, pas une page de 20–40 puis filtre client

| Axe | Quoi |
|-----|------|
| **Nature** | Type composant (`Nature`) — chips. |
| **Famille** | Arbre `item_categories`. Parent **inclut** les enfants. |
| **Lot d’usage** | GROS_OEUVRE, VRD, FINITIONS, SECOND_OEUVRE, TECHNIQUE. |

**Pas** de triplet Catégorie / Famille / Type : catégorie et famille = le même arbre ; type = nature.

Pagination / scroll — **pas** un plafond 40.

### Pied selon le contexte

| Contexte | Rendu |
|----------|--------|
| DPU / étude | article + qty + PU tarif → **Ajouter au poste**. Ouverture **header** seulement (« Ajouter depuis le catalogue ») — pas de CTA ligne, pas de nature pré-remplie. |
| Réception / retour / transfert | article seul ; natures **stockables** (MATIERE, CONSOMMABLE, CARBURANT, OUTILLAGE). |
| Tarif / solde / lookup `items` | article seul. |

### Interdit

- Dump à l’ouverture.
- Filtrer famille / nature / usageLot **après** une page client.
- CTA Extraire / « Créer » **dans** ce picker.
- Un dialog études parallèle au picker stock.

### Hors v1

SKU / `cleStable` dans la barre · filtre fournisseur · filtre unité · listing articles encore filtré client.

---

## Gelé (23/08/2026) — lookup combobox

**Casse le dump actuel** (selects client / fournisseur / chantier qui chargent 200–500 partenaires ; `searchable` = filtre local ; œil = toujours la liste).

Ancrage QA : [`lots/_archive/lookups/CONTRAT.md`](lots/_archive/lookups/CONTRAT.md) (`AC-1`…`AC-14`).
Canvas : [`lots/_archive/lookups/ux/lookup-combobox-wireframe.canvas.tsx`](lots/_archive/lookups/ux/lookup-combobox-wireframe.canvas.tsx).
Ne pas recoller le picker article ici.

### Trois gestes

| Cas | Contrôle |
|-----|----------|
| Enum fermé | select natif, **pas** d’œil |
| FK métier (client, fournisseur, chantier, employé…) | **combobox** inline, recherche serveur ≥ 2 car. |
| Article | **picker** overlay — déjà gelé, hors de ce lot |

### Œil

| Champ | Clic œil |
|-------|----------|
| Valeur posée + route fiche | nouvel onglet **fiche** `/{ressource}/{id}` |
| Vide + route liste | nouvel onglet **liste** (comportement actuel) |
| Pas de route / enum | pas d’œil |

### Interdit

- Dump `pageSize: 500` à l’ouverture d’un FK.
- Picker overlay pour un client / fournisseur.
- CTA Créer dans le combobox v1.
- Re-discuter le picker article.

### Hors v1

CTA + / créer depuis le champ · ICE comme axe dédié · `partnerContacts` · `nf-form` custom sans `lookupKey`.

---

## Gelé (28/08/2026) — consultation = 1 panier + N destinataires

**Casse le gel 22/08** sur « une consultation = **un** fournisseur ». Le reste du 22/08 tient : objet **Achats**, pas DA, pas AO, pas collé au dossier ; devis = **import magique** ; lien étude / flag CONSULTÉ / overlay 139 **hors ce sous-lot**.

Ancrage QA : [`lots/consultation/destinataires-envoi-suivi/CONTRAT.md`](lots/consultation/destinataires-envoi-suivi/CONTRAT.md).
Canvas : [`lots/consultation/destinataires-envoi-suivi/ux/destinataires-envoi-suivi-wireframe.canvas.tsx`](lots/consultation/destinataires-envoi-suivi/ux/destinataires-envoi-suivi-wireframe.canvas.tsx).

### Grain

| Objet | Grain | Rôle |
|--------|--------|------|
| **Consultation** | 1 panier + N destinataires | Grouper, envoyer, suivre |
| **Destinataire** | 1 fournisseur + contact mail | Qui reçoit |
| **Devis** | 1 fournisseur, sur cette consult | Réponse (import magique) |

Ordre des gestes : **panier d’abord** → **destinataires ensuite** (contacts) → envoyer (action) → import **par destinataire**.

Create `/achats/consultations/new` = panier seulement. Pas de wizard. Fiche = destinataires + CTA Envoyer + suivi.

Ajouter un fournisseur **refuse** s’il n’a aucun `PartnerContact` avec e-mail. Pas de mail collé. Pas de fallback `partners.email`.

### Statut (dérivé des devis, pas de l’envoi)

- Destinataire : `EN_ATTENTE` | `DEVIS_RECU` (import confirmé). L’envoi est un **journal**, pas le statut principal.
- Consultation : `PREPARATION` → `OUVERTE` (envoyée, 0 devis) → `PARTIELLE` (≥ 1 devis, pas tous) → `COMPLETE` (tous les destinataires ont un devis qui compte).

Listing : résumé N fournisseurs + avancement k/n — plus « le » fournisseur unique.

Après le 1er envoi : panier **figé** ; on peut encore ajouter un destinataire et renvoyer aux nouveaux.

### Interdit (inchangé + ce gel)

- Overlay étude, flag CONSULTÉ, gate N devis, portail invité, attribution / BC, scoring AO, saisie manuelle PU — pas dans ce tour.
- Réintroduire `fournisseur_id` unique sur la consultation.

---

## Aujourd’hui dans le code (constat, pas une spec)

Pendant Extraire / DPU (livré 20/08, QA PASS SEKTOR-106…108) :

- Extraire : IA (`ExtraireIdentiteService`) → seaux DEJA_TENANT / A_CREER / INCERTAIN. LIKE n’est plus la décision.
- Créer (humain confirme) : `POST /api/v1/items/extraire-creer` — PUBLIER Sektor puis Item 1–1. Pas G2, pas `items.create`.
- **Consulté** → plus le bouton `marquerConsulte`. Gate 4 compte les **devis consultation reçus** (SEKTOR-109/110, `review` en attente QA). Identification + CONSULTE = SEKTOR-112.

Après étude :

- Capitalisation → `Ouvrage` + `ComposantOuvrage`. Les composants de l’ouvrage **référencent** des items s’ils étaient liés ; ça ne crée pas un article « poste ».

G2 / console Nafura :

- `CatalogEnrichissementService.contribuer` = signaux vers la console interne, **pas** des items tenant.
- `RapprochementDeterministeService` / `LlmRapprochementAdapter` rapprochent un libellé vers `catalogCle` — **pas branché Extraire**.

Catalogue fournisseur :

- `catalogue_fournisseur_lignes.article_id` = UUID Item + `ref_fournisseur` texte. Pas de `cle_stable`.

Consultation / devis fournisseur :

- Livré 20/08 (SEKTOR-109/110/112) : objet **collé au dossier** + panneau page Coût — **à remplacer** (gel 22/08).
- `OffreFournisseur` = AO **achats** chantier, pas ce flux. DA = chantier → BC, pas ce flux.

---

## Ouvert (prochain tour avant spec)

Cocher / amender ici, ne pas re-débattre à l’aveugle.

- [ ] **Confirmer les 3 couches** (poste ≠ article ; composants = articles si réutilisables ; recette = ouvrage).
- [x] Manquant Extraire : **tranché 26/08** — toujours demander explicitement **poste seulement** ou **créer Catalogue et lier** ; aucun ajout implicite des manquants au bouton final. Contrat `raffinement-etude` AC-16.
- [x] Capitalisation : **tranché 26/08** — reste opt-in après validation, avec rappel du nombre de postes capitalisables, jamais une gate ni une création automatique. Contrat `raffinement-etude` AC-27.
- [ ] Composant manuel one-shot : peut-on le promouvoir article **plus tard** (après save), ou seulement au moment Extraire / bouton actuel ?
- [ ] Ouvrage capitalisé : les composants non-articles restent manuels dans l’ouvrage, ou on force « créer l’article » avant versement ?
- [x] Enrichissement G2 : **tranché 20/08** — créer un article = identité Sektor **PUBLIEE** tout de suite, puis tenant. Pas un candidat. La console `/catalogue` reste hors chrome tenant (fusion / retrait plus tard, pas Extraire).
- [x] Extraire, match **incertain** : **tranché 26/08** — l'utilisateur choisit un candidat, recherche, garde au poste ou crée ; aucun meilleur score pris silencieusement. Contrat `raffinement-etude` AC-14.
- [x] Création Extraire : **tranché 20/08** — **PUBLIEE** tout de suite. L’IA a déjà décidé que c’est un article à ajouter ; pas une proposition G2.
- [x] Binding : **tranché 20/08** — 1 Item tenant **par** `cle_stable` (1–1). Tiny spec (couleur, RAL) ≠ 2ᵉ Item. Variante d’achat sous l’identité, plus tard, si SKU/stock l’exigent.
- [x] Tiny spec Extraire : **tranché 26/08** — conservée en note d'emploi sur le composant DPU dès v1 ; elle ne crée jamais une identité. Contrat `raffinement-etude` AC-17.
- [x] Consultation : **retranché 22/08** — objet **Achats** (pas DA, pas AO, pas collé au dossier). Menu Achats. Popup décompo. Devis = **import magique**. Lien étude → flag CONSULTÉ sur l’article après N devis. Pas une consult par ligne.
- [x] Consultation RFQ : **retranché 28/08** — **casse** « un fournisseur ». 1 panier + N destinataires (contact mail obligatoire). Envoyer = action + journal. Statut dérivé des devis (1 par fournisseur). Overlay / flag / portail hors tour.
- [x] Consultation obligatoire : **tranché 20/08, inchangé** — min **N devis reçus**. On n’oblige pas 100 % des articles décomposés.
- [x] Devis reçu : **tranché 22/08** — on **importe** le fichier ; Import magique **extrait** les lignes. Fichier sans extraction n’identifie pas / ne flague pas.
- [x] Picker article : **tranché 23/08** — composant **partagé** (pas un dialog études). Pas de dump à l’ouverture. Recherche code + désignation. Filtres serveur nature / famille / lot d’usage. 3 pieds (DPU, stock, lookup). Extraire reste le chemin IA.
- [x] Lookups FK : **tranché 23/08** — **combobox** anatomy (pas un picker, pas un `<select>` natif). Pas de dump. Recherche serveur ≥ 2 car. Œil → fiche si id, liste si vide. Enums = select natif sans œil. Article reste le picker. Ancrage [`lots/_archive/lookups/CONTRAT.md`](lots/_archive/lookups/CONTRAT.md). **Sous-lot retiré de la fenêtre** (28/08).

---

## Hors sujet de ce fichier (déjà ailleurs)

- Ce journal nourrit les plans et décisions des lots Études et Catalogue.
- Portail invité : inbox, livré hors backlog actif.
- Impression PDF / Gotenberg : lot platform, pas ici.
