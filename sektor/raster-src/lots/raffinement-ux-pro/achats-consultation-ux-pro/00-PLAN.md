# Achats — consultation UX pro

> Liste + fiche + création consultation = entity anatomy. Panier = picker article, pas textarea `cle_stable`.

Contrat : [`CONTRAT.md`](CONTRAT.md) (AC-1…AC-12).
Canvas : [`ux/consultation-ux-pro-wireframe.canvas.tsx`](ux/consultation-ux-pro-wireframe.canvas.tsx)
(itère [`../../consultation/ux/consultation-achats-wireframe.canvas.tsx`](../../consultation/ux/consultation-achats-wireframe.canvas.tsx) sur list/create/detail).
Métier objet : [`../../consultation/00-PLAN.md`](../../consultation/00-PLAN.md).

## Intention

Quand ce sous-lot est livré : `/achats/consultations` et la fiche utilisent l’anatomie entity (comme DA / BC / AO) ; `/achats/consultations/new` n’a plus de textarea `cle_stable` — panier multi-lignes via `app-article-picker` + fournisseur combobox ; l’import magique sur fiche reste le seul chemin prix.

## Périmètre

Inclus :

- Migrate list / create / detail chrome Achats (AC-1…AC-12).
- Panier multi-lignes + `app-article-picker` ; fournisseur combobox.
- Conserver import magique fiche (AC-5).
- Script e2e `verify-ux-pro-consultation.mjs` ; non-régression 249.

Exclus : refonte AO, DA, cycle statuts ; overlay étude (139) ; moteur flag CONSULTÉ.

## Approche

1. **SEKTOR-263 (exec, gate: me)** — listing + detail entity ; import magique intact.
2. **SEKTOR-264 (exec)** — create : panier picker + fournisseur. Parallèle à 263 après gate.
3. **SEKTOR-265 (qa)** — scénarios CONTRAT ; verdict indépendant.

### Dépendances externes

| Sous-lot / task | Statut Spec | Effet |
|-----------------|-------------|--------|
| `socle-lookups-combobox` | **bouclé** | AC-10 = branchement, pas réinvention |
| `etudes/picker-article` · SEKTOR-260 | **review** (picker partagé) | Soft : 264 a besoin de `app-article-picker`. **Pas** de `blocked_by` externe — sinon `ready` bloque aussi 263. Exec 264 → `status: blocked` + Question si picker absent. |

## Tasks

| # | Task | agent_type | blocked_by | Scope AC |
|---|------|------------|------------|----------|
| 1 | SEKTOR-263 Liste + détail entity anatomy | exec | — · `gate: me` | AC-1…AC-6 |
| 2 | SEKTOR-264 Create + panier picker + fournisseur | exec | — (soft : 260) | AC-7…AC-12 |
| 3 | SEKTOR-265 Preuves | qa | 263, 264 | tous scénarios |

263 et 264 sont parallèles après approbation gate 263 (ou en série si orch serialise).

## Preuves attendues (SEKTOR-265)

Détail dans [`CONTRAT.md`](CONTRAT.md) § scénarios.

- `node sektor/e2e/scripts/verify-ux-pro-consultation.mjs` — Mode B owner.
- Non-régression : `node sektor/e2e/scripts/verify-consultation-achat-249.mjs`.
- Étendre / remplacer assertions textarea de `verify-consultation-achat-134.mjs` si encore citées.
- Pas de clôture sur grep seul d’un symbole.

## Décisions ouvertes

Aucune — métier consultation gelé (134–139). Soft-dep picker documentée ; pas de hard-block externe.
