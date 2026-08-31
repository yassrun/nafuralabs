# Contrat — Catalogue parc & lignes mouvement

> Ce sous-lot est autonome. Ce fichier est le **seul ancrage QA** (`AC-n` gelés).
> Canvas : [`ux/catalogue-parc-et-lignes-wireframe.canvas.tsx`](ux/catalogue-parc-et-lignes-wireframe.canvas.tsx).
> Plan : [`00-PLAN.md`](00-PLAN.md).
> Lookups : [`../socle-lookups-combobox/CONTRAT.md`](../socle-lookups-combobox/CONTRAT.md) (bouclé).
> Picker : [`../../etudes/picker-article/CONTRAT.md`](../../etudes/picker-article/CONTRAT.md) (bouclé).

**Qualification : EVOL.** Réception / retour / transfert ont déjà le picker stock. Perte / inventaire (et sortie qui réutilise l’éditeur perte) dumpent encore le catalogue via `ArticleCatalogService.loadArticles`. Les filtres / champs emplacement passent par `lookupKey` mais les facades posent des caches vides ou d’anciens dumps. Le parc GMAO (`materiel-parc/**`) reste FormsModule + texte UUID / `<select>` natif.

Gelé le **28/08/2026**. Les tasks exec **référencent** `AC-n` ; elles ne les recopient pas.

---

## Intention

| Surface | Problème labo | Cible pro |
|---------|---------------|-----------|
| `perte-lines-editor`, `inventaire-lines-editor` (+ sortie) | `nf-select` + dump catalogue entier | Même geste que réception : `app-article-picker` / field, contexte **stock** |
| Fiche / listing perte & inventaire | Emplacement `lookupKey` + cache vide ou dump | Combobox `locations` / `allLocations` / `chantierLocations` (socle) |
| `materiel-parc` pointage / carburant / affectation | Texte UUID, `<select>` FormsModule | Combobox engins + chantier ; carnet borné au contexte |

Pas de refonte listing articles. Pas de `pageSize: 5000` stock balances (P2 nommé).

---

## Critères gelés — lignes perte / inventaire / sortie

**AC-1 — Perte : picker, pas dump.** Sur la fiche perte (création / édition brouillon), chaque ligne choisit l’article via le **picker partagé** (bouton / field `data-testid="article-picker-open"`, contexte **stock**). Plus de `nf-select` peuplé par `loadArticles({ activeOnly: true })` ni options catalogue préchargées.

**AC-2 — Inventaire : picker sur ligne manuelle.** Ajout de ligne (hors préremplissage stock) : même picker stock. Une ligne déjà préremplie (code + id) affiche le code en lecture ; pas de re-dump pour peupler un select.

**AC-3 — Sortie.** L’éditeur réutilisé en `variant: 'sortie'` suit AC-1 (picker stock). Cause détaillée absente = OK.

**AC-4 — Pas de dump au mount.** Au chargement de l’éditeur, **aucun** GET collection catalogue / `loadArticles` sans recherche. Interdit : peupler `articleSelectOptions` depuis un dump pageSize large.

**AC-5 — Pied stock.** Ouverture picker : natures **stockables** (contrat picker AC-10). Ouverture vide tant que `q < 2` et aucun filtre. Hit → code + désignation + UoM posés sur la ligne.

**AC-6 — Cause = enum.** Colonne cause détaillée (perte) reste un select **natif / options bornées** (DECOUPE, CASSE, …). Pas d’œil, pas de typeahead serveur.

**AC-7 — Prefill inventaire.** « Charger le stock » reste ; il remplit des lignes depuis les soldes de **l’emplacement déjà choisi**. Ne réintroduit pas un select dump article.

---

## Critères gelés — emplacements (filtres + fiches)

**AC-8 — Inventaire listing.** Filtre emplacement (`destLocationId` / `lookupKey: allLocations`) = combobox socle. Ouverture sans dump ; saisie ≥ 2 car. → serveur.

**AC-9 — Inventaire fiche.** Champ emplacement destination = combobox `allLocations` (ou `locations`). Plus de liste préchargée via facade cache dump.

**AC-10 — Perte fiche.** Champ chantier / emplacement (`chantierLocationId` / `chantierLocations`) = combobox. La facade **ne pose plus** `chantierLocations: []` comme unique source d’options : le contrôle typeahead du socle porte la recherche.

**AC-11 — Perte listing.** Si un filtre emplacement / chantier existe ou est ajouté pour homogénéité : combobox. Motif perte = liste bornée (motifs du type PERTE) — select natif ou options courtes OK, **pas** un dump partenaires.

**AC-12 — Anti-dump emplacements.** Interdit : `getAll({ pageSize: 500 })` (ou équivalent) pour peupler un champ / filtre emplacement. `ErpLookupService.locations` sans `q ≥ 2` → `[]` (déjà socle) ; ne pas contourner.

---

## Critères gelés — parc GMAO (MVP)

**AC-13 — Pointage engins.** Sur `/materiel/.../pointage` (ou route parc équivalente) : champ engin = combobox `materiels` (lookup à brancher sur `/api/v1/materiels` si absent de la carte). Plus d’`<input>` texte UUID / code inventé. Hit : **code + nom** (série en secondaire si utile).

**AC-14 — Pointage chantier.** Champ chantier = combobox `chantiers`. Plus de texte libre `chantierRef` comme seule vérité. Le POST conserve un id chantier réel.

**AC-15 — Pleins carburant.** Choix du carnet / engin : pas un `<select>` qui dump toute une collection non bornée au contexte. Soit combobox engin puis carnet(s) de **cet** engin (liste courte native), soit combobox carnet via recherche. Litres / jauge / prix = inputs natifs.

**AC-16 — Affectation.** Création / édition d’affectation chantier : chantier = combobox `chantiers` ; engin = combobox `materiels`. Plus de texte UUID nu comme contrôle principal.

**AC-17 — Hors MVP parc.** Plans OT listing, fiche 360, planning Gantt, hub locations : **pas** de refonte entity-listing complète dans ce sous-lot. Uniquement les gestes de saisie AC-13…AC-16. Pas de restauration FormsModule dump ailleurs « pour homogénéité ».

---

## Hors v1 (dette nommée, pas AC)

- `stock-balances` `pageSize: 5000` (P2)
- Refonte arbre familles / listing articles filtres client
- Homogénéisation cosmétique `item-prices` / `inventory-tx-lines` si déjà picker field
- CTA « + » créer engin / emplacement depuis le champ
- Entity-listing/detail complet de tout `materiel-parc/**`

---

## Scénarios e2e (noms) + état initial

L’exec implémente ; le QA joue. Mode B : `make -C nafura-platform/ops mode-b`, owner `qa@nafuralabs.local` (alias `magasinier` si la preuve discrimine le rôle stock).

| Scénario | Couvre |
|----------|--------|
| `perte-ligne-pas-dump` | AC-1, AC-4 — pas `loadArticles` dump ; picker open |
| `perte-picker-stock` | AC-5 — ouverture vide, `q` → hit stockable |
| `inventaire-ligne-picker` | AC-2, AC-7 |
| `sortie-picker` | AC-3 |
| `cause-enum-natif` | AC-6 |
| `inventaire-filtre-location` | AC-8, AC-12 |
| `inventaire-fiche-location` | AC-9 |
| `perte-fiche-location` | AC-10 |
| `pointage-engin-combobox` | AC-13 |
| `pointage-chantier-combobox` | AC-14 |
| `pleins-pas-select-dump` | AC-15 |
| `affectation-combobox` | AC-16 |

**État initial :** tenant `qa-local` ; ≥ 1 dépôt / emplacement nommé ; ≥ 30 articles actifs stockables (preset) ; ≥ 1 chantier ; ≥ 1 matériel / engin actif (`/api/v1/materiels`) — **fabriquer dans la preuve** si le preset n’en a pas ; un carnet carburant lié si scénario pleins.

**Constats API (preuve, pas UI) :** `GET …/locations?q=…` avec `q ≥ 2` → hits. Un GET locations / items collection sans `q` déclenché à l’ouverture du champ ligne ou filtre = **FAIL**.
