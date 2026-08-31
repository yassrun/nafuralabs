# Contrat — Consultation Achats UX pro

> Ce sous-lot est autonome. Ce fichier est le **seul ancrage QA** (`AC-n` gelés).
> Canvas : [`ux/consultation-ux-pro-wireframe.canvas.tsx`](ux/consultation-ux-pro-wireframe.canvas.tsx).
> Plan : [`00-PLAN.md`](00-PLAN.md).
> Métier objet déjà livré : [`../../consultation/00-PLAN.md`](../../consultation/00-PLAN.md) (134–139, 249).

**Qualification : EVOL.** Backend + overlay étude OK. Chrome Achats encore labo : table HTML custom, pills custom, textarea `cle_stable`, select fournisseur dumpable.

Gelé le **28/08/2026**. Les tasks exec **référencent** `AC-n` ; elles ne les recopient pas.

---

## Intention

| Surface | Problème labo | Cible pro |
|---------|---------------|-----------|
| Liste `/achats/consultations` | Table HTML custom + chips maison | `nf-entity-listing` (même chrome que DA / BC / AO) |
| Fiche `/achats/consultations/{id}` | Pills custom hors entity anatomy | `nf-entity-detail` + sections ; **import magique inchangé** |
| Création `/achats/consultations/new` | Textarea `cle_stable` + dump fournisseur | Combobox fournisseur + panier multi-lignes via `app-article-picker` |

---

## Critères gelés — liste & fiche (anatomie)

**AC-1 — Listing entity.** `/achats/consultations` rend via `nf-entity-listing` (config + facade). Plus de `<table>` HTML custom ni toolbar chips hors anatomy.

**AC-2 — Colonnes listing.** Au minimum : numéro, fournisseur (libellé, pas UUID), résumé panier, statut, lien étude (liée / hors). CTA primaire « + Consultation » → `/achats/consultations/new`. Clic ligne → fiche.

**AC-3 — États listing.** Chargement, vide (« Aucune consultation… »), erreur API + retry — patterns entity-listing, pas de faux tableau à zéro.

**AC-4 — Fiche entity.** `/achats/consultations/{id}` rend via `nf-entity-detail` (ou chrome anatomy équivalent). Identité visible : numéro, fournisseur, statut, lien étude, articles du panier (code + libellé).

**AC-5 — Import magique conservé.** Sur la fiche : `nf-smart-import-trigger` + revue des lignes extraites restent le seul chemin pour poser les prix. Pas de saisie manuelle PU. Régression interdite vs SEKTOR-135 / agrégat 249.

**AC-6 — États fiche.** Chargement / introuvable / erreur : message + retour liste. Pas de pills orphelines sans contenu.

---

## Critères gelés — création & panier

**AC-7 — Plus de textarea.** Sur `/achats/consultations/new`, aucun `<textarea>` (ni champ texte libre) pour saisir des `cle_stable`. Grep source create : zéro `clesText` / placeholder type `ciment-cpj-45` en saisie libre.

**AC-8 — Panier multi-lignes.** Le panier est une liste de lignes. Chaque ligne = article catalogue (code + désignation). Actions : ajouter (ouvre picker), retirer. ≥ 1 ligne requise pour soumettre.

**AC-9 — Picker article.** L’ajout passe par `app-article-picker` (composant partagé `catalogue/`, contrat `etudes/picker-article`). Ouverture vide ; recherche serveur ≥ 2 car. ; pas de dump catalogue. Contexte adapté consultation (lookup / choix article, pas pied DPU qty+PU obligatoire).

**AC-10 — Fournisseur combobox.** Champ fournisseur = combobox `lookupKey: fournisseurs` (contrat `socle-lookups-combobox` AC-1…AC-10) : ouverture sans dump, recherche ≥ 2, œil fiche si valeur posée. Obligatoire à la création.

**AC-11 — Payload create.** Submit envoie les identités panier attendues par l’API existante (cles stables / item ids — **sans** changer le contrat métier 134). Succès → navigation fiche créée.

**AC-12 — Validation create.** Fournisseur manquant ou panier vide → pas de POST ; message inline. Erreur API → message, formulaire conservé.

---

## Hors v1 (dette nommée, pas AC)

- Refonte AO, DA, cycle de statuts consultation
- Overlay étude (139) — inchangé
- Flag CONSULTÉ / import magique moteur (135–137) — hors chrome
- Édition panier post-création (ajouter articles depuis la fiche) — hors scope sauf si déjà présent
- Portail invité / AO chrome-less

---

## Dépendances externes (soft)

| Sous-lot | Statut attendu | Effet |
|----------|----------------|--------|
| `socle-lookups-combobox` | **bouclé** | Fournisseur combobox déjà dispo ; AC-10 = branchement, pas réinvention |
| `etudes/picker-article` (SEKTOR-260+) | **en cours / review** | Create/panier **dépend** du picker partagé. Soft-note seulement (pas de `blocked_by` externe) pour ne pas bloquer la readiness de toute la tranche (liste/detail). Exec 264 se bloque lui-même si `app-article-picker` absent. |

---

## Scénarios e2e (noms) + état initial

L’exec implémente le script ; le QA joue. Mode B : `make -C nafura-platform/ops mode-b`, identité **owner** (`qa@nafuralabs.local`).

| Scénario | Couvre |
|----------|--------|
| `cs-listing-entity` | AC-1, AC-2, AC-3 |
| `cs-detail-entity-import` | AC-4, AC-5, AC-6 |
| `cs-create-no-textarea` | AC-7 |
| `cs-create-panier-picker` | AC-8, AC-9 |
| `cs-create-fournisseur-combobox` | AC-10 |
| `cs-create-submit` | AC-11, AC-12 |

**Scripts :**

- Étendre / remplacer les assertions labo de `verify-consultation-achat-134.mjs` (plus de textarea).
- Nouveau agrégat UX : `sektor/e2e/scripts/verify-ux-pro-consultation.mjs`.
- Ne pas casser `verify-consultation-achat-249.mjs` (métier 134/135/137/139).

**État initial requis :** tenant `qa-local` ; ≥ 1 fournisseur actif ; ≥ 2 articles actifs (codes différenciés) ; création consultation via UI create pro. Graphe fabriqué dans la preuve. Pas de seed demo runtime.
