# Postes et départements RH

> Deux référentiels dans le module RH ; la fiche employé les choisit par combobox. Le rôle IAM n’est pas un poste.

## Intention

Poste et département sont aujourd’hui des textes libres. Le seed QA y a collé des codes IAM (`BTP_CONDUCTEUR_TRAVAUX`). Ça mélange trois couches.

Après livraison : listings **Postes** et **Départements** dans RH ; fiche employé = combobox `rhPostes` / `rhDepartements` (recherche serveur ≥ 2 car., œil vers le listing). Le rôle applicatif reste sur le compte ; le rôle chantier reste une nomination.

## Périmètre

- Inclus : tables `rh_postes` / `rh_departements` ; CRUD API ; nav RH ; lookups ; FK employé (`posteId` obligatoire, `departementId` optionnel) ; seed / QA sans code IAM dans le poste ; libellé conservé sur l’employé pour le listing.
- Exclus : organigramme hiérarchique ; lier un poste à un rôle IAM ; filtrer les employés de l’onglet Équipe par poste ; unicité de nomination chantier.

## Approche

1. Schéma lab : tables + backfill des libellés existants + `poste_id` NOT NULL.
2. API + listings anatomy (même geste que employés).
3. Combobox via `LOOKUP_SEARCHERS` (`rhPostes`, `rhDepartements`).
4. QA : département « QA » ; postes métier (Conducteur de travaux, …), pas `BTP_*`.

## Tasks

| # | Task | agent_type | blocked_by |
|---|---|---|---|
| 1 | SEKTOR-329 Plan | spec | — |
| 2 | SEKTOR-331 Référentiels + lookups | exec | 329 |

## Validation technique

- `GET /api/v1/rh/postes?q=Co` et `…/departements?q=QA` → hits.
- Fiche employé : champs `posteId` / `departementId` en combobox, plus de saisie libre.
- Gradle `:rh:test` sur les classes touchées.
- `node raster/t.mjs check`.

## Blocages extérieurs

Aucun. Mode B owner (`*`) lit et écrit les deux référentiels.
