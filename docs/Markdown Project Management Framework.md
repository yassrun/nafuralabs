# AGENTS.md — Markdown Project Management Framework

> Single source of truth for the **task / backlog** system (`pm/`).
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
| `personal` | Personal tasks — captured here, excluded from capacity     |

No database. No web app. No Kanban board of all cards.
Files + git + a small CLI (`t`).

**Actors:** only two — `me` (human) and `agent`. Nobody else.

**Design constraint that overrides everything else: interaction cost.**

| Action                   | Budget  |
|--------------------------|---------|
| Capture a task           | < 5 s   |
| "what do I do now"       | < 2 s   |
| Change a status          | < 3 s   |
| Balayage                 | < 30 min|

If a proposed change makes any of these slower, reject it.

---

## 0.1 Agent playbook — what to do (read this first)

### Storage vs views

| Layer | Role |
|-------|------|
| `inbox.md` | Capture brute — une ligne, pas de fichier tâche |
| `…/<projet>/tasks/` | **Un dossier `tasks/` par projet** — stockage réel |
| `INDEX.tsv` | Vue all-tasks (générée) — point d’entrée agent |
| `NOW.md` / `WEEK.md` / `PORTFOLIO.md` | Vues générées — ne jamais éditer à la main |

Pas de board Kanban global. La vision “toutes les tâches” = `INDEX.tsv` + `NOW` / `WEEK`.

### Actions CLI — set complet

| Intent | Commande | Notes |
|--------|----------|-------|
| Capturer | ligne dans `inbox.md` | tags `@mbs` `@erp` `@ops` `@sah` `@per` + optionnel `@me` / `@agent` |
| Créer tâche structurée | `t add "titre" <ctx>` | exige `assignee` + `estimate` (ou les passer en flags) |
| Démarrer | `t do <ID>` | → `doing` + journal |
| Bloquer | `t block <ID> "raison"` | → `blocked` + journal |
| Terminer | `t done <ID>` | → `done` + journal |
| Abandonner | `t drop <ID>` | → `dropped` |
| Logger | `t log <ID> "note" 2h` | journal append-only + heures |
| Aujourd’hui | `t now` | print `NOW.md` |
| Semaine | `t week` | print `WEEK.md` |
| **Balayage** | `t sweep` | **à la demande** — pas lié au vendredi |

Toute mutation régénère `INDEX.tsv`, `NOW.md`, `WEEK.md` avant de retourner.

### Classification (agent)

Quand l’humain capture ou demande une tâche :

1. **Connu** → une ligne `inbox.md` avec le bon `@tag` (ne pas créer le fichier tout de suite).
2. **Promotion** → seulement pendant un **balayage** (`t sweep`), ou via `t add` si engagé tout de suite.
3. **Nouveau projet / proto** → **proposer** un dossier, ne pas le créer sans OK humain.
4. **Ambigu** → demander (ex. facture client vs ops Nafura).

| Exemple capture | Tag | Si promu → dossier |
|-----------------|-----|--------------------|
| fix bug import sektor | `@erp` | `nafura/products/<produit>/tasks/` |
| livrer remarques mbs | `@mbs` | `nafura/projects/mbs-website/tasks/` |
| RDV comptable facture | `@ops` | `nafura/ops/tasks/` |
| courses Marjane | `@per` | souvent jamais promu ; sinon `personal/tasks/` |

### Balayage (`t sweep`) — à la demande

Pas un “Friday close”. Fréquence libre. Enchaîne :

1. Balayer `inbox.md` — fait/abandonné → supprimer ; survivants → tâches structurées (`assignee` + `estimate` obligatoires).
2. Sprint non `done` → semaine suivante ou backlog (+ compteur report).
3. Recaler le plan capacité (26h, **uniquement** `assignee: me`).
4. Prototypes : `kill_by` dépassé → promote ou graveyard.
5. Archiver `done` > 30 jours.
6. Régénérer toutes les vues.
7. Proposer un commit git du type `balayage 2026-W<n>`.

---

## 1. Folder structure

```
pm/
  AGENTS.md              # this file (sync with docs/…)
  SCHEMA.md              # enum reference (generated from §2)
  inbox.md               # raw capture, one line per item, NO frontmatter
  INDEX.tsv              # GENERATED — agent entry point (all tasks)
  NOW.md                 # GENERATED — daily view
  WEEK.md                # GENERATED — weekly view
  PORTFOLIO.md           # GENERATED — monday / portfolio view
  t                      # the CLI (single write path)

  nafura/
    products/
      agentic-erp/          # or sektor-btp — one folder per product
        ROADMAP.md          # quarters, not tasks
        tasks/
    projects/
      mbs-website/
        project.md          # client, deadline, budget_hours, quote
        tasks/
        decisions/          # ADRs — why X over Y
    prototypes/
      <name>/
        prototype.md        # MUST have `question` + `kill_by`
        tasks/
      graveyard/
    ops/
      tasks/                # branding, fiscal, admin, sales

  saham/
    engagement.md           # days/week, rate, period
    tasks/

  personal/
    tasks/

  archive/                  # done > 30 days, mirrors source path
```

**Rule: one project/product folder → its own `tasks/`. Never a single shared `tasks/` for everything.**

### Naming

- Task file: `tasks/{ID}-{slug}.md` → `tasks/MBS-07-canvas-cursor-safari.md`
- ID prefixes: `SAH` `MBS` `ERP` `OPS` `PER` + one per new project
- IDs are **immutable**. Never renumber, never reuse, even after deletion.
- The slug may change on rename; the ID never does.

---

## 2. Schema

### Required on every structured task file

```yaml
id: MBS-07
status: todo
context: nafura
assignee: me              # me | agent — default me if omitted at capture; required at promote/add
estimate: 4h              # REQUIRED on structured tasks (me AND agent). Never omit after promotion.
```

Inbox lines have **none** of these except informal `@tags`.
Estimate is set at **balayage** / `t add`, never at raw capture.

Every view MUST still render if only `id` / `status` / `context` exist (legacy / mid-migrate).
New writes via `t` MUST set `assignee` + `estimate`.

### Optional

```yaml
priority: P1              # P0 | P1 | P2 | P3
due: 2026-08-03           # ISO 8601 only
sprint: 2026-W32          # ISO week. Absent = not committed this week
billable: true
blocked_by: [MBS-04]
tags: [frontend, perf]
```

### Closed vocabularies — NEVER invent values

```
status     todo | doing | blocked | done | dropped
priority   P0 | P1 | P2 | P3
context    nafura | saham | personal
assignee   me | agent
type       product | project | prototype | ops | personal
```

`in-progress`, `in_progress`, `wip`, `high`, `urgent`, `yassine`, `cursor`, `ai`
are **errors**. Inconsistent enums are the #1 failure mode of this system.

### Forbidden in frontmatter — derived state

Never store: `progress`, `percent`, `done_count`, `days_left`, `age`,
`completion`, or any counter. These are computed at generate time.
Every stored derived field is a field that becomes wrong.

### Type-specific requirements

| Type      | Extra required fields                        |
|-----------|----------------------------------------------|
| project   | `deadline`, `budget_hours`, `invoice_status` |
| prototype | `question`, `kill_by`                        |
| product   | none — uses `ROADMAP.md`, not a backlog      |

A prototype without a `question` and a `kill_by` date must not be created.
When `kill_by` passes, the balayage forces a decision: promote to product,
or move to `prototypes/graveyard/`.

---

## 3. Task file format

```markdown
---
id: MBS-07
status: doing
context: nafura
assignee: me
priority: P1
estimate: 4h
due: 2026-08-03
---

# Perf curseur canvas Safari

> Le curseur mix-blend-mode chute à 20fps sur Safari 17.
> Chrome et Firefox sont ok.

## Critères d'acceptation
- [ ] 60fps stables sur Safari 17, MacBook Air M1
- [ ] Pas de régression Chrome / Firefox
- [ ] Testé sur iOS Safari

## Journal
```
30/07 14:20  démarré · 0.5h
30/07 16:00  cause = repaint sur mix-blend-mode. will-change → non
31/07 09:30  piste OffscreenCanvas · 2h
```
```

Structure rules:

1. **Blockquote after the H1** — 2 lines of context, max. This is what gets
   re-read 3 weeks later and what the agent reads first. Mandatory.
2. **Acceptance criteria as checkboxes** — the only place checkboxes are used.
3. **`## Journal` is a fenced code block, APPEND-ONLY.**
   The agent appends a timestamped line. It NEVER rewrites, reformats,
   reorders, or summarizes existing journal lines. The fence prevents
   reflowing and keeps date columns aligned.
4. Content language is French. Field names and enum values are English.

---

## 4. inbox.md — the capture layer

90% of captured items are done or abandoned within 7 days. Those must not
pay the cost of a structured file.

```markdown
# INBOX

- fix curseur safari @mbs @me
- relancer Amine devis @mbs
- schema tool-call agent @erp @agent
- renouveler CIN @per
```

- One line. No frontmatter. No ID. No estimate.
- `@tag` maps to a project prefix ; `@me` / `@agent` hint assignee (défaut `me`).
- Promotion to a structured task file happens **only at balayage** (`t sweep`),
  or via explicit `t add` — **only** for items that deserve a file.

Target: ~20 structured task files live at any time, not 200.

---

## 5. INDEX.tsv — the agent entry point

Regenerated on **every** write. One line per non-archived task:

```
MBS-07	doing	P1	nafura	me	4h	2026-08-05	Perf curseur canvas Safari
ERP-31	todo	P1	nafura	agent	1h		Schéma tool-call agent
SAH-14	doing	P0	saham	me	2h	2026-08-01	Revue archi event-driven
```

Columns, tab-separated:
`id  status  priority  context  assignee  estimate  due  title`
Empty field = empty column, never a placeholder.

**Agent read protocol — mandatory:**

1. Read `INDEX.tsv` first. Always.
2. Identify the 1-3 relevant task IDs.
3. Open only those task files.

Never grep or read the whole `tasks/` tree. 200 tasks via INDEX ≈ 3k tokens;
200 tasks read individually ≈ 40k tokens. Factor of 10.

---

## 6. The CLI — single write path

Both the human and the agent write through `t`. Never hand-edit frontmatter,
never let two write paths coexist — they diverge within a week.

```bash
t add "titre" <ctx> [--assignee me|agent] --estimate 4h
t do MBS-07             # → status: doing + journal line
t block MBS-07 "raison" # → status: blocked + journal line
t done MBS-07           # → status: done + journal line
t drop MBS-07           # → status: dropped
t log MBS-07 "note" 2h  # append journal line + hours
t now                   # print NOW.md
t week                  # print WEEK.md
t sweep                 # balayage à la demande
```

Every command that mutates a task MUST regenerate `INDEX.tsv`, `NOW.md`,
`WEEK.md` before returning. A stale index is a lying index.

`t add` may default `assignee` to `me` but **must** require `estimate`.
Raw capture stays in inbox without estimate.

---

## 7. Generated views — design spec

Design for **raw terminal output**, not for rendered preview. Raw is 80% of
reads plus everything the agent sees.

Global rules:

- **72 columns max.**
- **Fixed-width padding for alignment.** No markdown tables in daily views.
- **No emoji outside `PORTFOLIO.md`** — double-width in terminals, breaks
  every column.
- **40 lines max per view.** If `NOW.md` scrolls, it failed.
- The number that matters appears in the first 3 lines.

Status glyphs (single-width, consistent everywhere):

```
·  todo      ▸  doing      ✕  blocked      ✓  done
```

ASCII fallback if any terminal misrenders: `[ ]` `[>]` `[!]` `[x]`

Assignee marker in NOW (fixed width): `[moi]` / `[agent]`

### NOW.md — opened often

```markdown
# NOW · sam 01 août                        22h restantes · W31

▸ SAH-14  Revue archi event-driven         P0  [moi]    ÉCHÉANCE AUJOURD'HUI
▸ MBS-07  Perf curseur canvas Safari       P1  [moi]    lun 03 · 4h
· ERP-31  Schéma tool-call agent           P1  [agent]  ────────  1h
· MBS-09  Export PDF facture               P2  [moi]    mer 05 · 3h
✕ SAH-16  Valider specs Kafka              →  [moi]    attend retour client

  ────────────────────────────────────────────────────────────────
  produit Nafura   ███░░░░░░░  2h / 6h        ⚠ en retard
  en cours (moi)   ▸▸          2 / 3          ok
  ────────────────────────────────────────────────────────────────

  PERSO   renouveler CIN · appeler comptable
```

Hard rules:
- **5 task lines maximum.** Not 12.
- ID / title / priority columns padded to fixed width.
- Bottom block = the only two numbers that drive decisions.
- Personal items visually separated, never mixed with billable work.

### WEEK.md — capacity view

```markdown
# SEMAINE 2026-W32                     engagé 31h / capacité 26h

  ⚠ SURENGAGÉ DE 5h — retire 2 tâches avant lundi

  saham           16h  ██████████████░░░░░░░░  52%   3 tâches
  nafura produit   6h  █████░░░░░░░░░░░░░░░░░  19%   2 tâches
  nafura client    8h  ███████░░░░░░░░░░░░░░░  26%   2 tâches
  nafura ops       1h  █░░░░░░░░░░░░░░░░░░░░░   3%   1 tâche

## Reporté de W31                                    ⚠ 3 tâches
  MBS-09  Export PDF facture              reporté 2×
  ERP-28  Bench latence outil             reporté 3×  ← tuer ou faire
  SAH-11  Doc patterns intégration        reporté 1×

## Livré en W31                                      7 tâches · 24h
  ✓ MBS-05  Cartes projet draggables               6h  (est. 4h)
  ✓ SAH-09  Diagramme flux paiement                5h  (est. 6h)
  ────────────────────────────────────────────────────────────────
  estimé 21h → réel 24h        multiplicateur perso 1.14
```

Capacity hours in WEEK = **`assignee: me` only**.
Agent estimates are visible on tasks / INDEX but do **not** consume the 26h budget.

The **personal multiplier** is the highest-value number in the system.
After 4 weeks it is reliable; use it to price quotes instead of guessing.

`reporté 3×` is the lie detector. A task deferred three times will never be
done — kill it.

### PORTFOLIO.md — project health (not a task board)

Only view allowed to use markdown tables and emoji (read in preview).
One row per **project**, not per task.

```markdown
# PORTFOLIO · 2026-W32

| Projet          | Type      | Santé | Avancement   | Prochain jalon     |
|-----------------|-----------|-------|--------------|--------------------|
| Saham archi     | contrat   | 🟢    | ██████░░ 71% | Revue archi 01/08  |
| MBS website     | client    | 🟡    | ████░░░░ 52% | Livraison 15/08    |
| Agentic ERP     | produit   | 🔴    | █░░░░░░░ 12% | MVP démo Q4        |
| Branding Nafura | ops       | 🟢    | ███████░ 88% | Logo final 08/08   |
| Proto multi-dev | prototype | ⚫    | ██░░░░░░ 24% | À TUER — 15/09     |

🟢 avance   🟡 ralenti   🔴 bloqué/à l'arrêt   ⚫ à décider
```

---

## 8. Capacity model

**Baseline: 26h/week of real human delivery.** Not 40.
Admin, invoicing, client calls, prospecting and accounting consume the rest.

Target split (`assignee: me` only):

```
saham (contract)      16h   62%
nafura produit         6h   23%   ← PROTECTED. Never traded away.
nafura client work     3h   12%
nafura ops             1h    4%   ← branding/fiscal. Capped.
personal               0h          excluded from work capacity
agent hours            —           tracked on tasks, outside the 26h budget
```

Rules the generator / CLI enforces:

- **WIP limit: max 3 tasks `doing` with `assignee: me`.**
  Agent `doing` tasks do **not** count toward this limit.
  Also: max 2 projects with any **human** task `doing`.
  If a 4th human task moves to `doing`, `t do` refuses and names which one to
  push back.
- **Protected product day.** One fixed weekday, every week, reserved for
  Nafura product.
- **Estimate multiplier.** Multiply **human** estimates by the measured personal
  multiplier (start at 1.4 until 4 weeks of data exist). Agent estimates are
  wall-clock order-of-magnitude; no personal multiplier.
- **Carry-over > 2 tasks for 2 consecutive weeks** → cut next week's
  commitment by 20%. The plan is fiction.

---

## 9. Rituals

### Daily — 2 minutes

```bash
t now                    # morning: read 5 lines
t log <ID> "note" 1.5h   # evening: one line per task touched
```

Hours rounded to 0.5h, logged once per day. Never per-minute tracking.

### Balayage — à la demande (`t sweep`)

Not tied to Friday. Run when the inbox is noisy, the week must be planned,
or views feel stale. Budget < 30 min.

See §0.1 for the ordered steps.

Recommended (not mandatory): once per week + git commit
`balayage 2026-W<n>` as the record of what shipped.

---

## 10. What is deliberately excluded

| Excluded              | Replaced by                              |
|-----------------------|------------------------------------------|
| Story points          | Hours. Solo — relative velocity is noise |
| Epics beyond 2 levels | `ERP-31`, `ERP-31.2`. That's the limit   |
| Burndown / velocity   | One number: committed vs delivered       |
| Per-minute tracking   | 0.5h rounding, once/day                  |
| Sprint ceremonies     | A `sprint:` field. Nothing else          |
| Kanban across all     | `INDEX.tsv` + `NOW` / `WEEK` / `PORTFOLIO` |
| Friday-only close     | Balayage on demand (`t sweep`)           |

---

## 11. Agent rules — non-negotiable

1. **Read `INDEX.tsv` before anything else** (when `pm/` exists). Never scan `tasks/` wholesale.
2. **Never hand-edit `NOW.md`, `WEEK.md`, `PORTFOLIO.md`, `INDEX.tsv`.**
   They are generated. Editing one breaks the system silently.
3. **Never invent an enum value.** Use §2 vocabularies verbatim (`assignee`: only `me`|`agent`).
4. **Never rewrite `## Journal` history.** Append only, timestamped.
5. **Never renumber or reuse an ID.**
6. **Never store derived state** in frontmatter.
7. **Never create a prototype** without `question` and `kill_by`.
8. **Dates are ISO 8601** in frontmatter (`2026-08-03`), `DD/MM` in journals.
9. **Flat frontmatter only** — no nested objects, arrays of strings max.
10. **Mutate through `t`**, not by editing files directly, whenever the CLI
    exposes a command for the operation.
11. **When a view exceeds its line budget, cut content — never widen it.**
12. If asked to add a field, first check it isn't derivable. Default answer
    is no.
13. **Capture → inbox.** Promote only at balayage or explicit `t add`.
14. **Structured task ⇒ `assignee` + `estimate` required** (both actors).
15. **One `tasks/` folder per project.** Do not dump all tasks in one directory.
16. **New backlog folder** only with human OK (real engagement: client, product, contract, proto).
17. Capacity / WIP math ignores `assignee: agent` for the 26h and the max-3 human WIP.

---

## 12. Build sequence

Do not build this all at once. Each step must be usable on its own.

| Week | Build                                              | Why |
|------|----------------------------------------------------|-----|
| 1    | `inbox.md` only, by hand. No script.               | Measure how many items survive 7 days |
| 2    | `t add` + `t now` (~40 lines Python)               | Capture + daily view is 80% of value |
| 3    | Inbox → structured promotion + `INDEX.tsv` + `t sweep` | Only now is there real data to parse |
| 4    | `t week` with capacity math + multiplier           | Needs 3 weeks of logged hours to mean anything |

Writing the full parser before 20 real tasks exist guarantees rewriting it
twice.

**First migration: MBS website.** It is the most bounded project — defined
scope, 10 000 MAD quote, real deadline. Ten tasks are enough to validate the
schema.

---

## Changelog (decisions locked)

| Decision | Choice |
|----------|--------|
| Dossier tâches | **Un `tasks/` par projet** |
| Vue all-tasks | `INDEX.tsv` + NOW/WEEK — **pas** de Kanban global |
| Rituel de rangement | **Balayage** (`t sweep`), **à la demande** |
| Acteurs | `assignee: me \| agent` seulement |
| Estimation | **Obligatoire** sur toute tâche structurée (me et agent) |
| Capacité 26h / WIP×3 | **`assignee: me` uniquement** |
