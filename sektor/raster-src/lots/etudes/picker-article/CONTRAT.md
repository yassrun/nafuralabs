# Contrat — Picker article partagé

> Ce sous-lot est autonome. Ce fichier est le **seul ancrage QA** (`AC-n` gelés).
> Journal produit : [`DECISIONS-PRODUIT.md`](../../../DECISIONS-PRODUIT.md) § 23/08/2026.
> Canvas : [`ux/picker-article-wireframe.canvas.tsx`](ux/picker-article-wireframe.canvas.tsx).
> Les preuves attendues vivent dans ce sous-lot.

**Qualification : EVOL.** Le picker actuel dump 40 items à l’ouverture ; le comportement visé (recherche à la demande, filtres serveur, un composant partagé) n’existe pas.

Gelé le **23/08/2026**. Re-gelé le **23/08/2026** (AC-1 / AC-12 preset). Re-gelé le **23/08/2026** : AC-12 = CTA header, pas de preset ligne. Les tasks exec **référencent** `AC-n` ; elles ne les recopient pas.

---

## Intention

Un **seul** picker article, cœur commun catalogue, pas un dialog études. Extraire reste le chemin IA. Ce picker est le **fallback manuel** (« Ajouter depuis le catalogue », CTA en tête du panneau — pas sur chaque ligne).

Pas de dump à l’ouverture. Recherche as-you-type sur code + désignation. Filtres nature / famille / lot d’usage **côté serveur**. Pagination. Pied selon le contexte d’ouverture.

---

## Critères gelés

**AC-1 — Ouverture vide.** À l’ouverture, aucune liste. Aucune requête catalogue tant que l’utilisateur n’a pas saisi **≥ 2 caractères** **ou** posé au moins un filtre (nature, famille, lot d’usage).

**AC-2 — Recherche.** As-you-type, debounce ~300 ms, sur **code** et **désignation** uniquement. Un match de **code exact** apparaît en tête.

**AC-3 — Filtres serveur.** Nature (chips = `Nature` : MATIERE, CONSOMMABLE, CARBURANT, OUTILLAGE, MATERIEL, LOCATION, MAIN_DOEUVRE, SOUS_TRAITANCE, SERVICE), famille (arbre `item_categories`, un parent ramène les enfants), lot d’usage (GROS_OEUVRE, VRD, FINITIONS, SECOND_OEUVRE, TECHNIQUE) filtrent **côté serveur**. Un filtre seul, sans saisie, déclenche la recherche.

**AC-4 — Axes.** Pas de triplet Catégorie / Famille / Type. Famille = l’arbre. Type = nature.

**AC-5 — Pagination.** La liste n’est pas plafonnée à 40. Scroll / page suivante charge la suite.

**AC-6 — Actifs.** Par défaut, seuls les articles **actifs**.

**AC-7 — Hit.** Chaque ligne : code, désignation, **unité**, **PU**.

**AC-8 — Clavier.** ↑↓ déplace le focus ; Entrée valide le hit focusé.

**AC-9 — Pied DPU.** Contexte étude / décompo : qty + PU tarif + CTA **« Ajouter au poste »**.

**AC-10 — Pied stock.** Contexte réception / retour / transfert : natures restreintes aux **stockables** (MATIERE, CONSOMMABLE, CARBURANT, OUTILLAGE) ; pick seul (pas de qty / tarif).

**AC-11 — Pied lookup.** Contexte tarif / solde / lookup `items` : pick article seul.

**AC-12 — Ajout DPU depuis le header.** Le picker DPU s’ouvre par **« Ajouter depuis le catalogue »** en tête du panneau (état vide et tableau rempli). Pas de CTA sur chaque ligne — ce n’est pas un remplacement. À l’ouverture : **aucun** chip nature pré-rempli. Un chip **posé par l’humain** déclenche la recherche.

**AC-13 — Vide.** 0 hit : message clair. **Pas** de CTA Extraire / « Créer dans le catalogue » dans ce picker.

**AC-14 — Erreur.** Échec réseau : message + relance, sans fermer le picker.

---

## Hors v1 (dette nommée, pas AC)

- SKU / `cleStable` dans la barre de recherche
- Filtre fournisseur
- Filtre unité
- Listing articles (`/inventory/catalogue/articles`) : les 3 filtres UI restent **client** ; hors de ce sous-lot

---

## Scénarios e2e (noms) + état initial

L’exec implémente ; le QA joue. Ne pas choisir des valeurs qui passent toutes seules.

| Scénario | Couvre |
|----------|--------|
| `picker-ouverture-vide` | AC-1 |
| `picker-recherche-code-exact` | AC-2, AC-7 |
| `picker-filtres-serveur` | AC-3, AC-4, AC-6 |
| `picker-pagination` | AC-5 |
| `picker-dpu-ajouter-au-poste` | AC-9, AC-12 |
| `picker-stock-natures-stockables` | AC-10 |
| `picker-lookup-article-seul` | AC-11 |
| `picker-aucun-resultat` | AC-13 |
| `picker-erreur-reseau` | AC-14 |
| `picker-clavier` | AC-8 |

**État initial requis :** tenant `qa-local` ; **≥ 30** articles actifs ; **2 familles** (un parent + au moins un enfant) ; natures **distinctes** (au moins MATIERE, MAIN_DOEUVRE, et une stockable autre que MATIERE) ; **1 code exact** `ART-…` ; au moins **1 inactif** ; assez de hits sur une requête large pour **plus d’une page**.
