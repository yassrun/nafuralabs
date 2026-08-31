# Contrat — Achats fournisseur & BC UX

> Ce sous-lot est autonome. Ce fichier est le **seul ancrage QA** (`AC-n` gelés).
> Canvas : [`ux/fournisseur-bc-ux-wireframe.canvas.tsx`](ux/fournisseur-bc-ux-wireframe.canvas.tsx).
> Plan : [`00-PLAN.md`](00-PLAN.md).
> Lookups : [`../socle-lookups-combobox/CONTRAT.md`](../socle-lookups-combobox/CONTRAT.md).
> Picker : [`../../etudes/picker-article/CONTRAT.md`](../../etudes/picker-article/CONTRAT.md).

**Qualification : EVOL.** Fiche fournisseur (onglet Catalogue), comparateur et réception BC inline existent. Les FK article / dépôt / UOM sont encore des inputs UUID ou `<select>` dump.

Gelé le **28/08/2026**. Les tasks exec **référencent** `AC-n` ; elles ne les recopient pas.

---

## Intention

| Surface | Problème labo | Cible pro |
|---------|---------------|-----------|
| `/achats/fournisseurs/{id}` onglet Catalogue | Colonne + draft = UUID article ; UOM = UUID brut ; dump catalogue `pageSize: 500` pour peupler le choix | Tableau code + désignation ; draft via `app-article-picker` ; UOM = combobox |
| `/achats/fournisseurs/comparateur` | Champ « Article (UUID) » texte libre | Picker / pick article → libellé visible ; comparer inchangé |
| `/achats/commandes/{id}` réception inline | `<select>` dépôt peuplé par `erpLookup.locations()` sans `q` → liste vide ou dump | Combobox `locations` ; option vide = livraison directe chantier |

Pas de refonte métier catalogue / réception. Pas d’attestations.

---

## Critères gelés — catalogue fournisseur (SEKTOR-270)

**AC-1 — Colonne Article lisible.** Dans le tableau catalogue de la fiche fournisseur, la colonne Article affiche **code + désignation** (ou désignation seule si code absent). Interdit : UUID nu comme libellé principal.

**AC-2 — Plus d’input UUID article.** Le formulaire « Nouvelle ligne / Modifier ligne » n’a plus de `<input>` texte pour `articleId` / placeholder « UUID article ».

**AC-3 — Picker article.** L’ajout / changement d’article passe par `app-article-picker` (contrat `etudes/picker-article`, pied lookup / pick seul). Ouverture vide ; recherche serveur ≥ 2 car. ; pas de dump catalogue tenant.

**AC-4 — Libellé posé.** Après pick : code + désignation visibles dans le formulaire (chip / résumé). Le payload conserve `articleId` pour l’API existante.

**AC-5 — UOM commerciale.** Champ UOM commerciale = combobox `lookupKey` UOM (`unitOfMeasures` / équivalent socle). Plus d’input UUID. Obligatoire si l’API l’exige aujourd’hui — sinon même règles métier qu’avant.

**AC-6 — Conditionnement UOM.** Champ conditionnement UOM (optionnel) = même combobox UOM. Plus d’input UUID.

**AC-7 — Persistance.** Enregistrer / modifier / supprimer ligne catalogue = mêmes endpoints qu’aujourd’hui. Succès → ligne visible avec libellés AC-1.

**AC-8 — États.** Chargement catalogue, vide (« Aucune ligne… »), erreur API + message : conservés. Distinct du picker ouvert sans frappe (aucune option).

---

## Critères gelés — comparateur (SEKTOR-271)

**AC-9 — Plus d’UUID texte.** Sur `/achats/fournisseurs/comparateur`, aucun champ « Article (UUID) » / placeholder « UUID item tenant ».

**AC-10 — Pick article.** L’article de filtre = picker (ou contrôle équivalent pick seul sur identité catalogue). Libellé code + désignation affiché une fois choisi.

**AC-11 — Comparer.** CTA Comparer avec article posé → offres triées comme aujourd’hui (prix comparable, périmé visible). Date de référence = date native inchangée.

**AC-12 — États comparateur.** Sans article : pas d’appel comparer (ou message inline). 0 offre : empty-state actuel. Erreur : message. Fournisseur dans le résultat : désignation lisible ; UUID fournisseur pas seul libellé.

---

## Critères gelés — réception BC inline (SEKTOR-271)

**AC-13 — Combobox dépôt.** Sur la fiche BC, formulaire « Nouvelle réception » : champ dépôt / magasin = combobox `lookupKey` locations (ou `locationsDepot` si déjà filtré dépôts). Plus de `<select>` HTML peuplé à l’ouverture.

**AC-14 — Pas de dump.** À l’ouverture du champ : aucune liste. Aucun `erpLookup.locations()` sans `q ≥ 2`. Saisie ≥ 2 caractères → recherche serveur.

**AC-15 — Livraison directe.** Valeur vide / option explicite « Livraison directe chantier — sans magasin » reste possible (comportement actuel).

**AC-16 — Métier réception.** Quantités lignes, BL fournisseur, submit réception = inchangés. Pas de régression sur le flux réceptionner.

---

## Hors v1 (dette nommée, pas AC)

- Onglet Attestations (enum natif OK)
- Refonte listing / create fournisseur entity anatomy
- Édition masse catalogue ; import magique lignes fournisseur
- Comparateur multi-articles / export
- Réception hors fiche BC (mouvements stock catalogue)

---

## Dépendances externes (soft)

| Sous-lot | Statut attendu | Effet |
|----------|----------------|--------|
| `socle-lookups-combobox` | **bouclé** | UOM + locations = branchement, pas réinvention |
| `etudes/picker-article` | **bouclé** | `app-article-picker` partagé ; AC-3 / AC-10 = câblage |

Pas de `blocked_by` externe : soft-note seulement. Si le picker est absent au moment de l’exec, poser `status: blocked` + Question.

---

## Scénarios e2e (noms) + état initial

L’exec implémente le script ; le QA joue. Mode B : `make -C nafura-platform/ops mode-b`, identité **owner** (`qa@nafuralabs.local`).

| Scénario | Couvre |
|----------|--------|
| `cat-colonne-pas-uuid` | AC-1 |
| `cat-form-pas-input-uuid` | AC-2 |
| `cat-picker-ouverture-vide` | AC-3, AC-8 |
| `cat-picker-save` | AC-3, AC-4, AC-7 |
| `cat-uom-combobox` | AC-5, AC-6 |
| `cmp-pas-uuid` | AC-9, AC-10 |
| `cmp-offres` | AC-11, AC-12 |
| `bc-depot-pas-select` | AC-13 |
| `bc-depot-ouverture-vide` | AC-14 |
| `bc-reception-directe` | AC-15, AC-16 |

**Script :** `sektor/e2e/scripts/verify-ux-pro-fournisseur-bc.mjs`.

**État initial :** tenant `qa-local` ; ≥ 1 fournisseur actif ; ≥ 2 articles actifs (codes différenciés) ; ≥ 1 UOM ; ≥ 1 dépôt / entrepôt ; ≥ 1 BC éligible réception (lignes avec reste à recevoir) — graphe fabriqué dans la preuve. Pas de seed demo runtime.

**Constats API (preuve, pas UI) :** `GET /api/v1/locations` sans `q` **n’est pas** requis depuis le formulaire réception. Un GET collection locations sans `q` depuis l’ouverture réception = **FAIL**.
