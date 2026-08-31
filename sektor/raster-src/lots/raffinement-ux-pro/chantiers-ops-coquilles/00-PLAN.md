# Chantiers — ops coquilles

> Parcours conducteur : affecter un employé, saisir un avancement, un attachement, un ST, un journal — même anatomie que cockpit / situations. Plus de `<select>` dump (ni vide).

Contrat : [`CONTRAT.md`](CONTRAT.md) (AC-1…AC-16).
Canvas : [`ux/chantiers-ops-coquilles-wireframe.canvas.tsx`](ux/chantiers-ops-coquilles-wireframe.canvas.tsx).
Aligné : [`../../chantiers/vie-de-chantier/00-PLAN.md`](../../chantiers/vie-de-chantier/00-PLAN.md).
Lookups : [`../socle-lookups-combobox/CONTRAT.md`](../socle-lookups-combobox/CONTRAT.md) (déjà livré — on **branche**, on ne réinvente pas).

## Intention

Le socle combobox (`nf-select` + `lookupKey`) refuse le dump : `ErpLookupService.employes('ACTIF')` sans `q ≥ 2` rend `[]`. L’onglet Équipe et l’étape create gardent un `<select>` natif → **liste toujours vide**, alors que les employés QA existent (`QaLocalEmployeProvisioner`).

Quand ce sous-lot est livré : employé / chantier / fournisseur ST = combobox inline (recherche serveur, œil fiche). Rôle chantier, météo, type journal, nœud du **ce** chantier = select natif. Boutons Annuler / Enregistrer traduits.

## Périmètre

Inclus :

- Onglet Équipe (`chantier-equipe-tab`) + étape 5 create (`chantier-create`) : combobox `lookupKey: employes` (AC-1…AC-9).
- Attachement saisie, ST create, journal, documents : combobox chantier ; ST sous-traitant = partenaire fournisseur, plus `st-${Date.now()}` (AC-10…AC-16).
- i18n Équipe : `chantiers.common.actions.cancel|save`, pas `common.cancel`.
- Script e2e `verify-ux-pro-chantiers-ops.mjs`.

Exclus : budget dashboard P2, refonte Gantt, picker article, RH `planning-equipes` et finance `contre-partie-lookup` (même anti-dump, autres lots), CTA créer employé depuis le champ.

## Approche

1. **SEKTOR-266 (spec)** — geler CONTRAT + canvas. Cause du select vide nommée : anti-dump lookup, pas seed manquant.
2. **SEKTOR-267 (exec)** — Équipe + create. Fichiers typiques : `chantier-equipe-tab.component.ts`, `chantier-create.page.ts`.
3. **SEKTOR-268 (exec)** — parallèle après 266. Attachement / ST / journal / documents. Avancement chantier déjà combobox : ne pas régresser.
4. **SEKTOR-269 (qa)** — scénarios CONTRAT ; verdict indépendant.

Risque : ST aujourd’hui poste `sousTraitantId: st-${Date.now()}`. Cible = UUID partenaire `FOURNISSEUR`. Si l’API chantier refuse un partner id, l’exec pose `status: blocked` + Question — ne pas inventer un second référentiel ST.

## Tasks

| # | Task | agent_type | blocked_by | Scope AC |
|---|------|------------|------------|----------|
| 1 | SEKTOR-266 Plan + CONTRAT + canvas | spec | — | gèle AC-1…16 |
| 2 | SEKTOR-267 Équipe + create combobox employé | exec | 266 | AC-1…AC-9 |
| 3 | SEKTOR-268 Ops chantier / fournisseur | exec | 266 | AC-10…AC-16 |
| 4 | SEKTOR-269 Preuves | qa | 267, 268 | tous scénarios |

267 et 268 sont parallèles après 266.

## Preuves attendues (SEKTOR-269)

Détail dans [`CONTRAT.md`](CONTRAT.md) § scénarios.

- `node sektor/e2e/scripts/verify-ux-pro-chantiers-ops.mjs` — Mode B owner.
- API : `GET /api/v1/rh/employes?statut=ACTIF&q=QA` → ≥ 1 hit (les employés y sont).
- Pas de clôture sur grep seul.

## Décisions ouvertes

Aucune — combobox vs picker déjà gelé 23/08. Équipe = ligne FK, pas un overlay.
