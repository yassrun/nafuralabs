# Harness Raster — Spec / Code / QA

Gelé 27/08/2026. Canon moteur : [`AGENTS.md`](AGENTS.md) · [`RASTER_BLUEPRINT.md`](../RASTER_BLUEPRINT.md).
Pact (coupe) : [`ARCHI_BLUEPRINT.md`](../ARCHI_BLUEPRINT.md). Sektor (BC = lot) : [`sektor/raster-src/DECISIONS.md`](../sektor/raster-src/DECISIONS.md).

Ce fichier porte **comment les agents s’enchaînent**. Il ne remplace pas le CLI ni les enums.

---

## Trois couches

| Couche | Question | Fichiers |
|---|---|---|
| Humain | Écrans, vocabulaire, règles | `CADRE.md` (app) · `spec.md` (chaque BC, **socle compris**) |
| Pact | Où vit le code | platform → app → socle + BC |
| Raster | Qui exécute cette vague | lot / sous-lot / Task / Run |

Une convo Cursor n’est pas l’exécution. Elle **alimente une Task Spec** (ou l’inbox). Jamais un prompt direct à Code.

---

## Spec humaine puis Spec agents

Une Task `type: spec` fait les deux :

1. Écrire ou amender le `spec.md` du BC impacté (`CADRE.md` si la loi d’app bouge ; deux BC → deux `spec.md`).
2. Écrire le sous-lot agents : `00-PLAN.md`, canvas si besoin, Tasks via `t.mjs new`, preuves, `blocked_by`, `gate: me` sur la découpe qui engage.

Le `00-PLAN` dit comment on livre **cette** vague. Le `spec.md` dit ce qui est **vrai** pour le BC après. Coder un sous-lot sans toucher le spec du BC = convo qui dérive.

---

## Pipeline d’un sous-lot

```text
1 agent Spec  →  n tasks Code (1 agent)  →  1 agent QA (preuves) à la fin
```

- **Un sous-lot = un worktree = un worker à la fois.**
- Tasks **en série** dans le sous-lot (`blocked_by`).
- **Parallèle = entre sous-lots ready** (tous projets dont le lot est au-dessus de la borne).

Trois tasks Code « indépendantes » dans **le même** sous-lot : le moteur les joue **l’une après l’autre**. Pour du Code vraiment parallèle, Spec **coupe d’autres sous-lots** (périmètres fichiers disjoints), il n’ajoute pas d’agents sur le même worktree.

---

## Session et orchestrateurs

Vague normale :

```text
Session (1) → Run (1) → 1 orch
                 └── 1 worker par sous-lot ready
```

Max vivant ≈ **1 + N** (N = sous-lots lançables). Le worker **change de skill** selon la task en tête (Spec, puis Code, puis QA) : ce n’est pas 1 Spec + N Code + 1 QA **simultanés** dans un sous-lot.

Même rôle orch, **découpé** seulement si le span l’exige :

- plusieurs apps Pact dans la Session → 1 orch **par projet** sous l’orch Session ;
- un lot avec **beaucoup** de sous-lots parallèles → 1 orch **de ce lot**.

Pas de `agent_type` orch. L’orch ne code pas, ne juge pas QA, ne pose pas `done-me`, ne pousse pas.

`window` = lots permis (borne, **toi**). `ready` = sous-lots possibles. L’orch fan-out là-dessus, y compris **multi-projets**.

---

## Qui écrit les statuts

Personne ne patche le YAML. **Le CLI** :

```bash
node raster/t.mjs status <id> todo|doing|blocked|review|done-agent
node raster/t.mjs approve <id>
```

| Qui | Transitions |
|---|---|
| Spec | `todo → doing → done-agent` |
| Code | `todo → doing` puis `review` (feature/bug) ou `done-agent` (tech) |
| QA | `review → done-agent` (pass) ou `→ doing` (fail). Seul à poser `done-agent` sur feature/bug |
| Toi | `approve` si `gate: me` |
| CLI | `done-agent` + `gate: none` → `done-me` |

`done-me` ne se pose pas à la main. L’orch **ne mute pas** les statuts métier : le worker appelle `status`.

---

## Boucle QA NOK

Pas d’enum `QA_NOK`. Fail = preuves + texte + **`status → doing`**.

1. Code a mis les tasks en `review` (ou une task `qa` de fin de sous-lot).
2. QA exécute les **preuves attendues**, sans les réécrire. Diff ≠ preuve.
3. NOK : remarques dans le journal / rapport de **la** task concernée ; `status doing`.
4. Le sous-lot reste ouvert. L’orch **recalcule `ready`** et **relance Code** sur le même worktree.
5. Code rectifie, `review` à nouveau. QA rejoue les mêmes preuves.
6. Pass → `done-agent`. Toi hors boucle sauf `blocked` + `## Question` ou `gate: me`.

Si **une** task `qa` clôt le sous-lot : le fail doit **rouvrir les tasks Code visées** (`doing`), pas seulement marquer la carte QA — sinon Code n’a rien à dispatcher.

QA ne répare pas pour faire passer.
