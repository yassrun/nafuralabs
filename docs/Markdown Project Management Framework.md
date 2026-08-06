# AGENTS.md — Markdown Project Management Framework

> Single source of truth for the **task / backlog / sprint** system (`pm/`).
> Read this file completely before creating, moving, or editing any task
> markdown under `pm/`.
> Applies to: Cursor, Claude Code, and any other agent operating in this repo.
>
> Monorepo code/ops rules live in [`docs/AGENTS.md`](AGENTS.md) — different scope.
> Canonical copy when `pm/` exists: `pm/AGENTS.md` (keep in sync with this doc).

---

## 0. What this system is

A plain-markdown, git-native task system for a solo operator + agents,
running three parallel contexts:

| Context    | What it covers                                            |
|------------|-----------------------------------------------------------|
| `nafura`   | Nafura Labs — products, client projects, prototypes, ops   |
| `saham`    | Contractor architect engagement (project management only)  |
| `personal` | Personal tasks — captured here, not mixed with Nafura work |

No database. No web app. No Kanban board of all cards.
Files + git + a small CLI (`t`) when available.

**Actors:** only two — `me` (human) and `agent`. Nobody else.

**Design constraint that overrides everything else: interaction cost.**

| Action            | Budget  |
|-------------------|---------|
| Capture           | < 5 s   |
| Scan INDEX/sprint | < 2 s   |
| Check progress    | dialogue à deux |
| Balayage          | < 30 min|

If a proposed change makes any of these slower, reject it.

---

## 0.1 Agent playbook — read this first

### Hard rules (Nafura)

1. **Tout travail / prompt sur `context: nafura` = une tâche structurée avec `sprint: 2026-Wn`.**
   Pas de code, spec, ou exploration « hors ticket » sur Nafura.
2. **Status ne bouge que pendant un Check progress** (rituel à deux : humain + agent).
3. **`estimate` n’existe pas.** Planification = `priority` (+ sprint).
4. **Abandon = delete partout** (fichier + INDEX). Pas de status `dropped`.
5. **`done` → `pm/backlog_archive/`** immédiatement. Le champ `sprint:` est **conservé à vie**.

### Storage vs views

| Layer | Role |
|-------|------|
| `inbox.md` | Capture brute — une ligne, pas de fichier tâche |
| `…/<projet>/tasks/` | **Backlog par projet** — stockage live (non-done) |
| `backlog_archive/` | **Archive globale** des `done` (conserve `sprint:`) |
| `INDEX.tsv` | Vue all-tasks live (générée) — point d’entrée agent |
| `BACKLOG.md` | Vue humaine live (générée) — par projet, clusters feature |
| `SPRINT.md` | Vue sprint courant (générée) — id ISO week + dates lun→dim dérivées |
| `PORTFOLIO.md` | Santé projets (générée) |

Pas de board Kanban global. **INDEX** = backlog live trié (agents). **BACKLOG** = même live, lisible humain. **SPRINT** = engagement de la semaine.
`NOW.md` / capacité 26h / daily : **retirés**.

### Pipeline d’actions (ordre canonique)

| # | Action | Effet |
|---|--------|--------|
| 1 | **Capture** | Ligne dans `inbox.md` (< 5 s). Pas d’ID, pas de sprint, pas de priorité obligatoire. |
| 2 | **Promote** | Inbox → fichier `tasks/{ID}-{slug}.md` bien documenté. Vague → `kind: feature` ; clair → `kind: task` ou `kind: spec`. |
| 3 | **Commit** | Backlog → sprint : pose `sprint: 2026-Wn` (+ `priority` si manquante). Engagé ≠ commencé. |
| 4 | **Check progress** | Rituel **à deux** (humain + agent). Seul moment où l’on met à jour `status` (+ journal). |
| 5 | **Archive** | Sur `done` confirmé → move vers `pm/backlog_archive/` (garde `sprint:`). |

**Balayage** (`t sweep`) = housekeeping à la demande (pas un Friday close) : vider inbox (promote ou jeter), grouper/merger features, archiver done orphelins, regen vues, proposer commit git `balayage 2026-W<n>`.

### Classification à la capture

| Exemple | Tag | Promote → |
|---------|-----|-----------|
| fix bug import sektor | `@erp` | `nafura/products/<produit>/tasks/` — souvent `kind: task` |
| « raffinement module RH » / « écran employé » | `@erp` | **`kind: feature`** (epic vague, **sans** sprint tant que non commité) |
| livrer remarques mbs | `@mbs` | `nafura/projects/mbs-website/tasks/` |
| RDV comptable | `@ops` | `nafura/ops/tasks/` |
| préparer CV consultant RH | `@per` | `personal/tasks/` — `assignee: me`, `gate: me` ; sprint **non** obligatoire |

Ambigu → **demander**. Nouveau dossier projet/proto → **OK humain** avant création.

---

## 1. Folder structure

```
pm/
  AGENTS.md                 # this file (sync with docs/…)
  SCHEMA.md                 # enum reference (generated from §2)
  inbox.md                  # raw capture
  INDEX.tsv                 # GENERATED — live backlog (+ sprintés non archivés)
  BACKLOG.md                # GENERATED — human live backlog by project
  SPRINT.md                 # GENERATED — current ISO week + date range
  PORTFOLIO.md              # GENERATED — project health
  regen.mjs / t.mjs         # CLI regen (+ future mutate path)

  backlog_archive/          # GLOBAL — done tasks (keep sprint:). Flat or mirror path OK.
                            # Prefer mirror: backlog_archive/nafura/products/sektor-btp/…

  nafura/
    products/<product>/
      ROADMAP.md
      tasks/                # live backlog for this product
    projects/<client>/
      project.md
      tasks/
      decisions/
    prototypes/<name>/
      prototype.md          # MUST have question + kill_by
      tasks/
      graveyard/
    ops/tasks/

  saham/
    engagement.md
    tasks/

  personal/
    tasks/
```

**Rule:** one project/product folder → its own `tasks/`. Never a single shared live `tasks/`.

### Naming

- Task file: `tasks/{ID}-{slug}.md`
- ID prefixes: `SAH` `MBS` `ERP` `OPS` `PER` + one per new project
- IDs are **immutable**. Never renumber, never reuse (même après delete).
- The slug may change ; the ID never does.

---

## 2. Schema

### Required on every structured task file

```yaml
id: MBS-07
status: todo                 # todo | doing | blocked | review | done
context: nafura              # nafura | saham | personal
kind: task                   # feature | spec | task
priority: P1                 # P0 | P1 | P2 | P3 — REQUIRED after promote
assignee: me                 # me | agent | either
gate: none                   # none | me | qa — who must confirm before done
```

### Sprint

```yaml
sprint: 2026-W32             # ISO week. Absent = backlog only (not committed)
```

- Identifiant sprint = **numéro de semaine ISO** (`2026-Wn`).
- Dates début/fin du print = **dérivées** (lundi→dimanche), pas stockées sur chaque tâche.
- Une fois posé, `sprint:` **reste** dans le fichier même après archive.
- **Nafura :** avant tout travail agent/humain → la tâche **doit** avoir `sprint:`.

### Optional

```yaml
parent: ERP-16               # ID d’un kind:feature — max 1 niveau
feature: chiffrage-drawer    # slug kebab
due: 2026-08-03              # ISO 8601
billable: true
blocked_by: [MBS-04]
tags: [frontend, perf]
```

### Closed vocabularies — NEVER invent values

```
status     todo | doing | blocked | review | done
priority   P0 | P1 | P2 | P3
context    nafura | saham | personal
assignee   me | agent | either
gate       none | me | qa
kind       feature | spec | task
type       product | project | prototype | ops | personal
```

**Supprimé :** `estimate`, `dropped`, daily / `NOW.md`, capacité heures 26h.

`in-progress`, `wip`, `high`, `urgent`, `yassine`, `cursor`, `ai` = **errors**.

### Forbidden in frontmatter — derived state

Never store: `progress`, `percent`, `done_count`, `days_left`, `age`,
`completion`, or any counter.

### kind × assignee × gate

| kind | Sens | DoD |
|------|------|-----|
| `feature` | Vague / parapluie (« raffiner RH ») | Enfants livrés ou découpés — pas du travail atomique |
| `spec` | Décisions / ADR / plan / découpage | Doc tranché + lots créés |
| `task` | Unité exécutable, AC clairs | AC + gate |

| assignee | Sens |
|----------|------|
| `me` | Humain seul |
| `agent` | Agent |
| `either` | Les deux OK |

| gate | Sens |
|------|------|
| `none` | AC/tests suffisent → candidat `done` (souvent agent) |
| `me` | Humain doit dire « c’est fait » |
| `qa` | Review/QA avant `done` (agent peut faire la QA ; humain peut quand même valider la feature) |

Flux typique : **feature** → **spec** → **tasks** (lots).

### Type-specific requirements

| Type      | Extra required fields                        |
|-----------|----------------------------------------------|
| project   | `deadline`, `budget_hours`, `invoice_status` |
| prototype | `question`, `kill_by`                        |
| product   | none — uses `ROADMAP.md`, not a backlog      |

### 2.1 Features — grouper / merger (sans casser les IDs)

| Action | Quand | Comment |
|--------|-------|---------|
| **Grouper** | Même sujet, encore utiles séparément | Parapluie `kind: feature` ; enfants `parent:` + `feature:` |
| **Merger** | Doublons | Garder **une** tâche ; **supprimer** les autres (pas `dropped`) ; journal sur la survivante `mergé depuis ID` |
| **Laisser plat** | Isolée | Pas de `parent` |

Règles :

1. Max 2 niveaux : `feature` → (`spec`|`task`). Pas de feature sous feature.
2. `kind: feature` : pas une ligne de travail sprint atomique ; ce sont les enfants qu’on commit.
3. À la capture : même écran/flux → préférer une feature, pas 5 micro-fichiers.
4. Au balayage / promote : l’agent **propose** ; l’humain confirme. Pas de merge silencieux.
5. IDs immuables.

---

## 3. Task file format

```markdown
---
id: ERP-29
status: todo
context: nafura
kind: task
priority: P1
assignee: either
gate: me
parent: ERP-26
feature: rh-pointage-raffinement
sprint: 2026-W32
---

# RH / pointage — Lot 2 · Validation

> Contrôle produit des heures et validation avant paie.

## Critères d'acceptation
- [ ] …
- [ ] …

## Journal
```
05/08 20:15  ERP-28 done · débloqué
```
```

Structure rules:

1. **Blockquote after the H1** — 2 lines max. Mandatory.
2. **Acceptance criteria as checkboxes** — only place for checkboxes.
3. **`## Journal` is a fenced code block, APPEND-ONLY.**
4. Content language is French. Field names and enum values are English.

---

## 4. Capture → Promote → Commit → Progress → Archive

### Capture (`inbox.md`)

```markdown
# INBOX

- raffinement écran employé @erp
- fix overlay commentaires chiffrage @erp
- préparer CV consultant RH @per @me
```

- One line. No frontmatter. No ID. No sprint.
- `@tag` → préfixe projet ; `@me` / `@agent` / `@either` hint assignee.

### Promote

- Transforme l’inbox en markdown documenté sous le bon `tasks/`.
- « Raffinement module X » / « écran Y » → **`kind: feature`**, backlog, **sans** sprint.
- Item clair → `kind: task` (ou `spec` si le livrable est une décision/plan).
- Exige `priority`, `assignee`, `gate`, `kind`.
- Retire la ligne de l’inbox.

### Commit

- Pose `sprint: 2026-Wn` (semaine courante par défaut, ou flag).
- Nafura : **obligatoire** avant tout prompt de travail sur ce ticket.
- N’implique **pas** `status: doing`.

### Check progress (à deux)

Déclenché par l’humain (« check progress », « où on en est W32 ») ou par l’agent en fin de lot / avant de changer de sujet Nafura.

| Rôle | Apporte |
|------|---------|
| Agent | Faits code/tests, AC, risques, candidat status |
| Humain | Jugement produit, priorités, validation gates `me` / feature |

Transitions typiques : `todo` → `doing` → `blocked` | `review` → `done`.

- `gate: none` → agent propose `done` ; confirmation dans le check.
- `gate: me` | `qa` → humain confirme le `done` (QA peut être faite par l’agent).
- Append journal ; **ne jamais** réécrire l’historique.

### Archive

- Dès `done` confirmé au check progress → move fichier vers `pm/backlog_archive/…`.
- Conserver tout le frontmatter, surtout **`sprint:`**.
- Hors INDEX live.

### Abandon

- **Delete** fichier + toute ligne INDEX. Zéro status `dropped`. Zéro référence volontaire.

---

## 5. INDEX.tsv — agent entry point

Regenerated on **every** write. One line per **live** (non-archived) task:

Columns, tab-separated:

`id  status  priority  context  assignee  gate  kind  sprint  parent  feature  title`

**Sort :**
1. `status` : `doing` → `review` → `blocked` → `todo` → (`done` rare si archive immédiate)
2. puis `priority` : `P0` → `P3`
3. puis `feature` (cluster) ; umbrella avant enfants ; sinon `id`

**Agent read protocol — mandatory:**

1. Read `INDEX.tsv` first. Always.
2. For active Nafura work, prefer rows with `sprint:` = current ISO week (or open `SPRINT.md`).
3. Identify 1–3 task IDs → open only those files.

Never grep the whole `tasks/` tree as first move.

---

## 6. The CLI — single write path

When `pm/t` exists, human and agent write through it. Until then, apply the same semantics by editing files + regenerating views.

```bash
node pm/t.mjs index                 # regen INDEX.tsv + SPRINT.md + BACKLOG.md
node pm/regen.mjs                   # same regen (direct)
# Windows: pm\t.cmd index

t capture "texte" [@tags…]          # append inbox (or edit inbox.md) — planned
t promote <inbox-ref|text> …        # → task/feature/spec file — planned
t commit <ID> [--sprint 2026-W32]   # set sprint: — planned
t progress <ID> <status> ["note"]   # check-progress transition + journal — planned
t archive <ID>                      # done → backlog_archive — planned
t delete <ID>                       # abandon — hard delete — planned
t sprint                            # print SPRINT.md — planned
t sweep                             # balayage — planned
```

Every mutating command MUST regenerate `INDEX.tsv`, `SPRINT.md`, and `BACKLOG.md` before returning.

---

## 7. Generated views

Design for **raw terminal**, 72 columns, fixed-width, no emoji except `PORTFOLIO.md`.
40 lines max per **operational** view (`SPRINT.md`). `BACKLOG.md` may exceed (overview).

Status glyphs:

```
·  todo      ▸  doing      ✕  blocked      ◐  review      ✓  done
```

### SPRINT.md

```markdown
# SPRINT 2026-W32                         lun 03/08 → dim 09/08

▸ ERP-29  RH Lot 2 validation              P1  [either]  gate:me
· ERP-12  Popup chiffrage double-clic      P1  [me]      gate:none
· MBS-01  Homepage remarques client        P1  [me]      gate:me

  ────────────────────────────────────────────────────────────────
  committed  3   doing 1   review 0   blocked 0
  ────────────────────────────────────────────────────────────────
```

Header **must** show ISO week **and** derived Monday→Sunday dates.

### BACKLOG.md

Human overview of **all live** (non-archived) tasks, grouped by project folder.
Feature clusters stay together (umbrella then children). Generated only — never hand-edit.

```markdown
# BACKLOG (généré — ne pas éditer)

## sektor-btp
\`\`\`
· ERP-16  feature  Drawer chiffrage poste
  · ERP-12  todo     Ouverture popup chiffrage…
· ERP-03  feature  Raffinement achats (lot 3)
\`\`\`

## mbs-website
\`\`\`
· MBS-01  todo     Homepage — remarques client
\`\`\`
```

Blocs code = une ligne par tâche (preview MD ne fusionne pas).
### PORTFOLIO.md

Project health only (tables + emoji allowed). One row per project — not a task board.

---

## 8. Rituals

### Check progress — à la demande, à deux

Pas de daily fixe. Remplace l’ancien `t now` / `t log` du soir.

### Commit sprint — à la demande

Choisir dans le backlog (promoted) ce qui entre dans `2026-Wn`.

### Balayage — à la demande (`t sweep`)

1. Inbox : jeter ou **promote**.
2. Grouper / merger features (confirm humain).
3. Sprint non finis : garder / reporter (`sprint:` semaine suivante) / rester backlog (retirer sprint seulement si **jamais** commencé — sinon conserver l’historique sprint dans le journal ; préférer reporter le même id de semaine ou noter report dans le journal et recommiter).
4. Prototypes `kill_by` → promote produit ou graveyard.
5. Archiver tout `done` encore dans `tasks/`.
6. Regen vues.
7. Proposer commit git `balayage 2026-W<n>`.

**Note report :** une tâche déjà commitée garde la trace ; append journal `reporté → 2026-W33` puis `sprint: 2026-W33`.

---

## 9. What is deliberately excluded

| Excluded | Replaced by |
|----------|-------------|
| `estimate` / story points / 26h capacity | `priority` + sprint commit |
| Status `dropped` | Hard delete |
| Daily standup / `NOW.md` | Check progress à deux |
| Friday-only close | Balayage on demand |
| Kanban global | `INDEX.tsv` + `BACKLOG.md` + `SPRINT.md` |
| Work Nafura hors ticket sprint | Interdit |
| Epics > 2 levels | `feature` → `spec`\|`task` |

---

## 10. Agent rules — non-negotiable

1. **Read `INDEX.tsv` / `SPRINT.md` before anything else** (when `pm/` exists). Humain : `BACKLOG.md` OK pour scan.
2. **Never hand-edit generated views** (`INDEX.tsv`, `BACKLOG.md`, `SPRINT.md`, `PORTFOLIO.md`) except via regen semantics.
3. **Never invent an enum value.**
4. **Never rewrite `## Journal` history.** Append only.
5. **Never renumber or reuse an ID.**
6. **Never store derived state** in frontmatter.
7. **Never create a prototype** without `question` and `kill_by`.
8. **Dates :** ISO 8601 in frontmatter ; `DD/MM` in journals.
9. **Flat frontmatter only.**
10. **Mutate through `t`** when the CLI exists ; otherwise same semantics manually.
11. **Capture → inbox.** **Promote** before treating as real work. **Commit** before Nafura execution.
12. **Structured file ⇒ `priority` + `assignee` + `gate` + `kind` required.**
13. **One `tasks/` folder per project.** Archive globale = `pm/backlog_archive/`.
14. **New backlog folder** only with human OK.
15. **Group/merge via `kind: feature` + `parent:`** — never renumber to fake hierarchy.
16. **Check progress is joint** — don’t silently mass-`done` without the human when `gate` ≠ `none`.
17. **On abandon → delete.** On **done → archive** (keep `sprint:`).

---

## 11. Build sequence

| Step | Build | Why |
|------|-------|-----|
| 1 | Doc + inbox + INDEX discipline (this revision) | Shared agent contract |
| 2 | `t capture` / `t promote` / `t commit` / `t progress` | Pipeline minimal |
| 3 | `t sprint` + date-range header | Human-useful week view |
| 4 | Auto-archive on done + `t sweep` | Keep live backlog small |

### Migration note (2026-08-05)

- Contrat agents = **ce fichier** / `pm/AGENTS.md` (déjà en vigueur).
- Fichiers `tasks/*.md` existants peuvent encore contenir `estimate:` ou manquer `gate` / `kind` — **legacy**.
- **Nouvelles écritures** : schéma §2 uniquement (pas d’`estimate`, pas de `dropped`).
- Prochain balayage : strip `estimate`, poser `gate`/`kind`, **Commit** sprint courant, move `done` → `backlog_archive/`.

---

## Changelog (decisions locked · 2026-08-05)

| Decision | Choice |
|----------|--------|
| Pipeline | **Capture → Promote → Commit → Check progress → Archive** |
| Daily | **Supprimé** |
| Sprint id | ISO week `2026-Wn` ; dates print dérivées lun→dim |
| Nafura work | **Toujours** tâche + `sprint:` |
| Planif | **`priority` required** ; **pas d’`estimate`** |
| kind | `feature` \| `spec` \| `task` |
| assignee | `me` \| `agent` \| `either` |
| gate | `none` \| `me` \| `qa` (QA agent OK ; humain peut valider feature) |
| Check progress | **À deux** (humain + agent) ; seul lieu de update status |
| Done | → **`pm/backlog_archive/`** (global) ; **`sprint:` conservé** |
| Abandon | **Delete partout** ; pas de `dropped` |
| Backlog | Par projet (`…/tasks/`) |
| Vues | `INDEX.tsv` + `BACKLOG.md` + `SPRINT.md` (+ `PORTFOLIO.md`) |
| Groupement | `kind: feature` + `parent:` / `feature:` ; IDs immuables |
