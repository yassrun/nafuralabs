# Contrat — Cockpit UX pro

> Ce sous-lot est autonome. Ce fichier est le **seul ancrage QA** (`AC-n` gelés).
> Canvas : [`ux/cockpit-ux-pro-wireframe.canvas.tsx`](ux/cockpit-ux-pro-wireframe.canvas.tsx).
> Plan : [`00-PLAN.md`](00-PLAN.md).
> Les preuves attendues vivent dans ce sous-lot (SEKTOR-258).

**Qualification : EVOL.** Le read model cockpit (lot `chantiers/cockpit-chantier`, SEKTOR-196…) est livré. Restent : raccourcis morts (clé i18n comme URL), onglets figés au snapshot, chrome labo (bandeau filtré / doublon workflow), et portefeuille qui compose tout le tenant avant de filtrer la recherche.

Gelé le **28/08/2026**. Les tasks exec **référencent** `AC-n` ; elles ne les recopient pas.
Les clés i18n `action` / `libelle` du read model **ne changent pas** (contrat SEKTOR-196). Le front mappe `code` → route.

---

## Intention

| Surface | Problème labo | Cible pro |
|---------|---------------|-----------|
| Fiche cockpit | Bouton « Gérer / Ouvrir » → clé `chantiers.cockpit.*` | Route applicative `/…` |
| Fiche détail | `?tab=` lu une fois au snapshot | Onglet dérivé de `queryParamMap` live |
| Chrome | Nav filtrée par `nextActions` + doublon workflow | Nav **toujours** visible ; commandes dans « À faire » |
| Portefeuille | Compose summary+affectations+lots pour **tous** les chantiers, puis filtre | `list(status, search)` d’abord ; compose la **page** si tri=code |

---

## Critères gelés — raccourcis & chrome (SEKTOR-256)

**AC-1 — Préparation.** Chaque item de checklist préparation avec `etat ∈ {BLOQUANT, A_FAIRE}` (hors `ordre_service`, qui reste inline) expose un CTA dont la navigation résout `code` → route app. Jamais `ouvrirRoute(p.action)` ni une URL contenant `chantiers.cockpit`.

| `code` | Route cible |
|--------|-------------|
| `identite_client` · `reference_vente` · `dates_prevues` | `/chantiers/{id}/edit` |
| `arbre` | `/chantiers/{id}?tab=lots` |
| `responsables` | `/chantiers/{id}?tab=equipe` |
| `budget_initial` | `/chantiers/budget/{id}` |
| `planning` | `/chantiers/planning?chantier={id}` |
| `ordre_service` | pas de navigation — formulaire OS sur le cockpit |

**AC-2 — Alertes.** CTA alerte résout `code` → route :

| `code` | Route cible |
|--------|-------------|
| `marge_negative` · `marge_en_baisse` | `/chantiers/budget/{id}` |
| `finance_incomplete` | `/chantiers/{id}/edit` |
| `retard_contractuel` | `/chantiers/planning?chantier={id}` |
| `source_indisponible` | recharger le read model (pas de route) |

**AC-3 — Onglets URL.** Sur `/chantiers/{id}`, l’onglet actif est dérivé de `ActivatedRoute.queryParamMap` (pas d’un snapshot unique). Un chip nav ou un lien `?tab=lots` / `?tab=equipe` change l’onglet **sans** recharger la fiche entière.

**AC-4 — Nav stable.** Sous le cockpit, un bandeau « Aller à » liste **toujours** (indépendamment de `nextActions`) : Arbre, Équipe, Avancement, Attachement, Situations, Docs, Journal, Planning, Budget, DA, ST, BL — chacun vers la route canonique du module (ids / query params chantier inclus). Les commandes contextuelles restent dans « À faire ».

**AC-5 — Pas de doublon workflow.** Aucune seconde carte / bandeau « workflow » / modules filtrés sous le cockpit sur l’onglet Pilotage. Un seul bandeau nav (AC-4). Styles morts `.workflow-card` retirés s’ils ne servent plus.

**AC-6 — Hiérarchie.** Ordre fixe desktop : KPI → bandeau statut (si suspendu) → grille « À faire / Préparation | Flux du mois » → nav AC-4 → activité récente. Contenu change avec le statut ; géométrie stable.

**AC-7 — Flux `premiereAction`.** Si le read model expose `fluxMois.premiereAction`, c’est une **route** `/…` (jamais une clé i18n). Le CTA « Passer à l’étape » navigue seulement si `isCockpitAppRoute`.

**AC-8 — Code inconnu.** Prep / alerte sans mapping : pas de navigation vers une clé i18n ; CTA absent ou no-op sûr.

**AC-9 — États cockpit.** Chargement : skeleton / message, pas de faux KPI à zéro. Erreur read model : message + relance. État vide (chantier sans feed) : sections absentes, pas de placeholder « TODO ».

---

## Critères gelés — portefeuille sans N+1 (SEKTOR-257)

**AC-10 — Recherche serveur.** `GET /api/v1/chantiers/portefeuille?search=…` passe le terme à `chantierService.list(status, …, search, hydrateAvancement=false)` **avant** toute composition. Match : code, libellé, client (insensible à la casse).

**AC-11 — Compose page.** Si `tri=code` (défaut) **et** aucun filtre dérivé (`severiteAlerte`, `responsable`, `enRetard`, `margeNegative`) : composer **uniquement** les lignes de la page courante (summary + affectations + lots pour ces ids seulement).

**AC-12 — Compose pleine.** Les filtres / tris qui exigent les faits calculés (alerte, échéance, marge, avancement, retard, marge négative, responsable) peuvent composer l’ensemble des **candidats déjà filtrés** par status+search — jamais le tenant entier hors search.

**AC-13 — Table stable.** Sur `/chantiers`, une frappe dans la recherche (debounce ~300 ms) **ne vide pas** le tbody déjà affiché : les lignes précédentes restent visibles pendant le fetch (indicateur de rechargement discret). « Chargement… » plein tableau uniquement si `rows.length === 0`.

**AC-14 — Vide ≠ erreur.** 0 hit après recherche : message / count à 0, pas confondu avec erreur API. Erreur API : bandeau + retry ; lignes précédentes conservées si présentes.

**AC-15 — Unitaire.** `ChantierPortefeuilleServiceTest` prouve : (a) `list(..., search, false)` appelé avec le terme ; (b) avec `tri=code` et N candidats > page size, `getSummary` (ou équivalent compose) n’est invoqué que pour les ids de la page.

---

## Hors v1 (dette nommée, pas AC)

- Refonte Gantt / planning UX
- Dashboard budget P2
- Combobox lookup (sous-lot `socle-lookups-combobox`)
- Changement des clés i18n `action` / `libelle` du DTO cockpit
- Pagination SQL native de `ChantierService.list` (filtre mémoire accepté en lab tant que compose est borné)

---

## Scénarios e2e (noms) + état initial

L’exec implémente le script ; le QA joue. Mode B : `make -C nafura-platform/ops mode-b`, identité **owner** (`qa@nafuralabs.local`).

| Scénario | Couvre |
|----------|--------|
| `cockpit-prep-routes` | AC-1, AC-8 |
| `cockpit-alert-routes` | AC-2 |
| `cockpit-tab-url-live` | AC-3 |
| `cockpit-nav-stable` | AC-4, AC-5 |
| `cockpit-flux-route` | AC-7 |
| `portefeuille-search-api` | AC-10 |
| `portefeuille-compose-page` | AC-11, AC-15 |
| `portefeuille-table-stable` | AC-13, AC-14 |

**État initial requis :** tenant `qa-local` ; ≥ 2 chantiers distincts (codes différenciés, ex. `CH-…`) créés via API dans la preuve si absents ; au moins un chantier `EN_PREPARATION` avec un prérequis non OK (pour CTA Gérer) et un `EN_COURS` avec une alerte ou un flux actionnable si le graphe le permet. Pas de seed demo runtime.
