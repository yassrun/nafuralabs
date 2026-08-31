# Cockpit chantier — raccourcis, UX pro, recherche

> Un conducteur ouvre la fiche : chaque raccourci atterrit, le cockpit est lisible, la recherche du portefeuille répond sans vider la table.

Contrat : [`CONTRAT.md`](CONTRAT.md) (AC-1…AC-15).
Canvas : [`ux/cockpit-ux-pro-wireframe.canvas.tsx`](ux/cockpit-ux-pro-wireframe.canvas.tsx).

## Intention

Le lot `chantiers/cockpit-chantier` a livré le read model. L’écran reste labo tant que les boutons « Gérer / Ouvrir » peuvent naviguer vers des clés i18n, que `?tab=` n’est pas réactif, que le chrome double ou filtre la nav, et que `/portefeuille` compose summary + affectations + lots **pour tous les candidats** avant de paginer.

Quand ce sous-lot est livré : chaque CTA résolution `code` → route `/…` ; onglets live ; un seul bandeau nav stable ; recherche portefeuille serveur + compose borné à la page si `tri=code` ; table qui ne se vide pas à chaque frappe.

## Périmètre

Inclus :

- Fiche cockpit (`pilotage-tab`) : mapping prep/alertes, flux `premiereAction` route, bandeau nav toujours visible, hiérarchie pro (AC-1…AC-9).
- Fiche détail : onglets synchronisés sur `queryParamMap` ; retrait du doublon workflow (AC-3, AC-5).
- Portefeuille `/chantiers` + `ChantierPortefeuilleService` : search avant compose ; compose page si tri=code ; UX table stable (AC-10…AC-15).
- Script e2e `sektor/e2e/scripts/verify-ux-pro-cockpit.mjs` + unitaires cités.

Exclus : refonte Gantt, budget dashboard P2, combobox lookup (`socle-lookups-combobox`), mutation des clés i18n DTO (contrat 196).

## Approche

1. **SEKTOR-255 (spec)** — geler CONTRAT + canvas ; cadrer 256–258.
2. **SEKTOR-256 (exec)** — front mapping + chrome + tabs. Fichiers typiques : `cockpit-routes.ts`, `pilotage-tab`, `chantier-detail.page.ts`.
3. **SEKTOR-257 (exec, tech)** — backend compose borné + front reload silencieux. Fichiers typiques : `ChantierPortefeuilleService`, tests, `chantiers-listing.page.ts`.
4. **SEKTOR-258 (qa)** — jouer les scénarios CONTRAT ; verdict indépendant.

Risque : du code partiel peut déjà être présent (mapping, `cockpitNavShortcuts`, `list(search)`, reload silencieux). L’exec **ferme les écarts** jusqu’aux AC, sans rouvrir le contrat 196. QA ne compte pas un grep partiel comme PASS.

## Tasks

| # | Task | agent_type | blocked_by | Scope AC |
|---|------|------------|------------|----------|
| 1 | SEKTOR-255 Plan + CONTRAT + canvas | spec | — | gèle AC-1…15 |
| 2 | SEKTOR-256 Raccourcis + chrome pro | exec | 255 | AC-1…AC-9 |
| 3 | SEKTOR-257 Recherche portefeuille sans N+1 | exec | 255 | AC-10…AC-15 |
| 4 | SEKTOR-258 Preuves | qa | 256, 257 | tous scénarios |

256 et 257 sont parallèles après 255.

## Preuves attendues (SEKTOR-258)

Détail opérationnel dans [`CONTRAT.md`](CONTRAT.md) § scénarios et dans le corps de SEKTOR-258.

- Unitaire front : `cockpit-routes.spec` — chaque code prep/alerte → route `/…`, jamais `chantiers.cockpit.*` ; nav shortcuts présents.
- Unitaire backend : `ChantierPortefeuilleServiceTest` — `list(..., search, false)` avec le terme ; compose limitée à la page si `tri=code`.
- `node sektor/e2e/scripts/verify-ux-pro-cockpit.mjs` — chrome source (mapping + tab URL + list/search + table stable) + API portefeuille recherche (Mode B owner).
- Pas de clôture sur grep seul d’un seul symbole.

## Décisions ouvertes

Aucune — les clés i18n `action` du read model ne changent pas (contrat 196). Le front mappe `code` → route.
