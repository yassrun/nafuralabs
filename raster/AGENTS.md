# AGENTS.md — Raster (orchestrateur)

> **Raster** = **projet** (lot · sous-lot · **task**) **et** moteur (INDEX / Sprint / CLI). **Pas** Pact (SPEC / CH / canvas).  
> **`<projet>/raster-src/`** = fichiers Raster du projet — **obligatoire**.  
> **`raster/`** = le projet Raster (`raster/raster-src/` + `pact/` + moteur).  
> Blueprint : [`RASTER_BLUEPRINT.md`](../RASTER_BLUEPRINT.md) · Pact : [`PACT_BLUEPRINT.md`](../PACT_BLUEPRINT.md).  
> Sync miroir : [`docs/Raster.md`](../docs/Raster.md).

**Actors :** `me` | `agent` uniquement.  
**Contrainte #1 :** coût d’interaction (capture &lt; 5 s · scan INDEX &lt; 2 s · check progress = dialogue à deux).

---

## 0. Décisions figées (2026-08-11) — orchestrateur

| Décision | Choix |
|----------|--------|
| Rôle `raster/` | **Projet** Raster : app + moteur (regen vues, Sprint, CLI `t`) |
| Stockage tickets | **Dans le projet** sous `<projet>/raster-src/lots/…` — jamais sous `raster/nafura/…` (legacy) |
| Chemin tasks (canon) | `<projet>/raster-src/lots/<lot-slug>/…/tasks/{ID}-{slug}.md` |
| Chemin tasks (legacy) | `<projet>/raster/lots/…` · `products/<app>/docs/specs/lots/…` — encore indexé |
| Inbox | **Une globale** : `raster/inbox.md` (dans le projet Raster) |
| IDs | **Par projet** (préfixe dédié, immuable) — ex. Sektor=`SEKTOR`, Platform=`PLT`, Raster=`RAS`, Personal=`PER`, Ops=`OPS` |
| Pact | `<projet>/pact/` si **app ou site** — Raster n’indexe pas les SPEC/canvas |
| Vocabulaire | **Lot** · **sous-lot** (= CH si branché sur Pact) · **Task** = seul item sprintable |
| Tout projet | **DOIT** avoir `raster-src/` (y compris `raster/raster-src/`), même hors IT |

**Migration :** `docs/specs/lots` → `<projet>/raster-src/lots` ; `raster/nafura/…/tasks/` legacy → à migrer.

---

## 0.1 Hard rules

1. Travail Nafura = ticket avec `sprint: 2026-Wn` avant exécution.
2. Status ne bouge que au **Check progress** (à deux).
3. Pas d’`estimate`. Pas de `dropped` (abandon = delete).
4. **Inbox = uniquement `raster/inbox.md`.** Chaque ligne = task draft (description). Lot / sous-lot sans Tasks : ne pas créer ; **pas** inbox.
5. **Backlog + Sprint = Tasks seulement.** Un lot/sous-lot n’est pas sprintable. Commit = `sprint:` sur une task.
6. `done-me` (et legacy `done`) → archive **dans le produit** — hors INDEX. `done-agent` reste live (vue **Done agent**).
7. Toute task a un **`type:`** `spec` | `feature` | `bug` | `physical`. Feature/bug = runnable/testable. Écriture SPEC+canvas = **`spec`**, pas feature. **Pas** de bug-umbrella. **Pas** de `kind: bug`.
8. Status : `todo` \| `doing` \| `blocked` \| `review` \| `done-agent` \| `done-me`. Nav : Inbox · Backlog · Sprint · **Done agent**. DOR/DOD : `raster/pact/work/SPEC.md`.

### 0.2 Critère sous-lot (agents — figé)

**Défaut : Lot → Task.** Le sous-lot n’est pas obligatoire.

Créer un **sous-lot** seulement si le lot mélange **≥ 2 flux livrables indépendants**.

Un flux est indépendant si **les 3** sont vrais :

1. Autre domaine / module / famille d’écrans (pas le même `00-PLAN`)
2. Peut être livré **sans** l’autre flux
3. Un agent peut l’exécuter **sans** lire les tasks de l’autre

| Contexte | Découpe |
|----------|---------|
| 1 app petite/moyenne, 1 contexte (Raster, ops, perso, MBS) | **Lot → Task** |
| 1 lot ERP = 1 chapitre, plusieurs flux (Sektor *Chantier* = fiche + pointage + ST + planning) | **Lot → Sous-lot → Task** |
| Lot encore vide / premier flux | Task directe sous le lot ; le 2ᵉ flux indépendant **crée** les sous-lots (reparent si besoin) |

**Interdit :** sous-lot vide « au cas où ». **Interdit :** rattacher une task au lot si ce lot a **déjà** des sous-lots (alors parent = sous-lot).

---

## 1. Où vit quoi

### Produit / projet

```
<projet>/                         # peer (sektor, raster, ops, …)
  raster-src/                     # OBLIGATOIRE — lots / sous-lots / tasks
    lots/
      <lot-slug>/
        tasks/
          {ID}-….md
        <sous-lot-slug>/          # optionnel — §0.2 ; si Pact = un CH
          00-PLAN.md
          tasks/
            {ID}-….md
      _archive/
      _backlog/tasks/
  pact/                           # SI app ou site
  ROADMAP.md                      # optionnel (hors raster-src)
```

### Projet Raster (`raster/`)

```
raster/
  raster-src/         # tickets du projet Raster (RAS-*)
  pact/               # app → oui
  AGENTS.md           # ce contrat
  inbox.md            # capture globale
  regen.mjs / t.mjs
  INDEX.tsv           # GÉNÉRÉ
  SPRINT.md           # GÉNÉRÉ
  BACKLOG.md          # GÉNÉRÉ
```

### App UI

Vit dans le **projet** `raster/` (`web/` — aujourd’hui encore `products/raster/web` en legacy).

---

## 2. Schema ticket (inchangé — résumé)

### Obligatoire

```yaml
id: ERP-12
status: todo                 # todo | doing | blocked | review | done-agent | done-me
context: nafura              # nafura | saham | personal
kind: task                   # lot | sous-lot | spec | task
type: feature                # spec | bug | feature | physical  (obligatoire si kind:task)
priority: P1                 # P0 | P1 | P2 | P3
assignee: me                 # me | agent | either
gate: none                   # none | me | qa
```

### Fréquent

```yaml
sprint: 2026-W33
parent: ERP-16               # lot (plat) ou sous-lot
feature: chiffrage-drawer    # = slug epic
blocked_by: [ERP-11]
tags: [sektor, ux]
```

### Corps

```markdown
# Titre

> 2 lignes max.

## Critères d'acceptation
- [ ] …

## Journal
```
DD/MM HH:MM  append-only
```
```

Enums fermés — ne jamais inventer. Pas de compteurs dérivés dans le frontmatter.

| kind | Sens |
|------|------|
| `lot` | Chapeau CBS — hors inbox ; hors backlog tant que pas de task |
| `sous-lot` | Chapeau flux optionnel (§0.2) — hors inbox ; hors backlog tant que pas de task |
| `spec` | ADR / décision — **pas** sprintable (`kind: spec` ≠ `type: spec`) |
| `task` | Seule unité backlog + sprint. `type:` **spec** \| **feature** \| **bug** \| **physical** |

---

## 3. Pipeline

| # | Action | Où |
|---|--------|-----|
| 1 | **Capture** | `raster/inbox.md` (globale) — non spécifié = **reste ici** |
| 2 | **Promote / balayage** | rattacher à un **sous-lot**, ou au **lot** s’il n’a pas encore de sous-lots. Sinon rester inbox |
| 3 | **Commit** | `sprint: 2026-Wn` sur une **Task** seulement |
| 4 | **Check progress** | status + journal sur les tickets produit |
| 5 | **Archive** | `done` → archive produit (hors INDEX) |

Pack agent « nouveau lot » (défaut plat) :

1. `raster-src/lots/<lot-slug>/tasks/` : ticket `kind: lot`
2. Même `tasks/` : N× `kind: task` avec `parent:` = lot
3. `ux/` si UI (sur le lot plat)
4. Regen Raster (`node raster/t.mjs index`)

Pack agent « nouveau sous-lot » (seulement si critère §0.2) :

1. Dossier `raster-src/lots/<lot-slug>/<sous-lot-slug>/`
2. `00-PLAN.md` + `tasks/` : 1× `kind: sous-lot` (`parent:` = lot) + N× `kind: task`
3. Si le lot avait déjà des tasks directes du **même** flux : les reparenter. Si c’est un **2ᵉ** flux : créer le sous-lot + reparenter l’ancien flux aussi
4. Regen Raster

---

## 4. IDs par projet (exemples)

| Projet (`products/…`) | Préfixe |
|-----------------------|---------|
| `nafura-platform` (racine) | `PLT` |
| `sektor-btp` / `sektor` | `SEKTOR` (legacy tickets `ERP-*` encore en vie) |
| `raster` | `RAS` |
| `personal` | `PER` |
| `ops` | `OPS` |
| `nafuralabs-migration` | `MIG` |
| client MBS… | `MBS` (ou préfixe dédié) |

IDs **immuables**. Jamais renumérotés / réutilisés.

---

## 5. Vues générées (Raster owns)

- `INDEX.tsv` — entrée agents  
- `SPRINT.md` — semaine ISO + dates lun→dim  
- `BACKLOG.md` — tree projet → feature → tasks  
- Regen après chaque mutate : `node raster/t.mjs index`

---

## 6. Interdit

- Créer des tasks sous `raster/nafura/…` (legacy)
- `00-PROGRESS.md` comme SSOT de suivi (suivi = tickets)
- Feature commitée / exécutée sans enfants Task
- Epic docs pour un bug
- Dupliquer un ticket (une seule copie fichier)
- Inventer enums / `estimate` / Kanban global

---

## Changelog

| Date | Décision |
|------|----------|
| 2026-08-13 | **`raster-src/`** obligatoire par projet · **`raster/`** = projet Raster · **`pact/`** si app/site |
| 2026-08-05 | Pipeline Capture→…→Archive · pas d’estimate |
| 2026-08-11 | Brand **Raster** · `pm/` → `raster/` |
| 2026-08-11 | **Orchestrateur** : tasks dans `epics/<slug>/tasks/` · IDs par projet · plus de stockage métier sous `raster/` |
| 2026-08-12 | Inbox **globale** `raster/inbox.md` (pas liée à un projet) · filtre projet = Backlog / Sprint seulement |
| 2026-08-12 | **`kind: bug-umbrella`** figé (comme `feature`) · enfants = `kind: bug` |
| 2026-08-13 | Inbox **uniquement** `raster/inbox.md` · ligne = task draft |
| 2026-08-13 | `type:` spec \| feature \| bug \| physical · DOR/DOD · `done` = me · `review` = QA (feature/bug) |
