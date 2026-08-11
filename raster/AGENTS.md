# AGENTS.md — Raster (orchestrateur)

> **Raster** = orchestrateur git-native (INDEX · Sprint · Backlog · CLI).  
> **Les fichiers Task / Feature / Spec ne vivent PAS sous `raster/`** — ils vivent dans chaque **produit / projet**.  
> Sync miroir : [`docs/Raster.md`](../docs/Raster.md).

**Actors :** `me` | `agent` uniquement.  
**Contrainte #1 :** coût d’interaction (capture &lt; 5 s · scan INDEX &lt; 2 s · check progress = dialogue à deux).

---

## 0. Décisions figées (2026-08-11) — orchestrateur

| Décision | Choix |
|----------|--------|
| Rôle Raster | Orchestre : regen vues, owns **Sprint**, affiche backlog complet, CLI `t` |
| Stockage tickets | **Dans le produit/projet** — jamais sous `raster/nafura/…` |
| Chemin tasks | `products/<app>/docs/specs/epics/<feature-slug>/tasks/{ID}-{slug}.md` |
| Inbox | **Une globale** : `raster/inbox.md` (promote vers un projet ensuite) |
| IDs | **Par projet** (préfixe dédié, immuable) — ex. Sektor=`ERP`, Raster=`RAS`, Personal=`PER`, Ops=`OPS` |
| Epic docs | Même dossier : `00-PLAN.md` (+ UX / ADR si besoin) — **pas** de `00-PROGRESS.md` obligatoire (suivi = tickets) |
| Vocabulaire | `Feature` → `Spec`? → `Task` · dépendances = `blocked_by` · **pas** de kind `lot` / `vague` |
| Tout est un projet | Personal, ops, client… = `products/<app>/` (plus de dossiers spéciaux sous `raster/`) |

**Migration :** chemins legacy `raster/nafura/…/tasks/` encore présents → à migrer ; **nouvelles écritures** = modèle ci-dessous uniquement.

---

## 0.1 Hard rules

1. Travail Nafura = ticket avec `sprint: 2026-Wn` avant exécution.
2. Status ne bouge que au **Check progress** (à deux).
3. Pas d’`estimate`. Pas de `dropped` (abandon = delete).
4. Feature **sans** Tasks enfants = pas commit sprint / pas d’impl.
5. On commit / exécute des **Tasks**, pas la Feature seule.
6. `done` → archive **dans le produit** (garde `sprint:`) — hors INDEX live.
7. Bugs = `kind: task` + `tags: [bug]` — **pas** de dossier epic dédié bug (rattacher à une feature existante ou `epics/_backlog/`).

---

## 1. Où vit quoi

### Produit / projet (`products/<app>/`)

```
products/<app>/
  docs/specs/
    epics/
      <feature-slug>/
        00-PLAN.md                    # conception
        ux/…                          # wireframe si UI
        01-ADR-….md                   # si besoin
        tasks/
          {ID}-feature-….md           # kind:feature (parapluie)
          {ID}-….md                   # kind:task | kind:spec
      _backlog/                       # tickets sans epic encore (bugs isolés, triage)
        tasks/
      _archive/                       # epics terminées (dossier complet)
  ROADMAP.md                          # optionnel
```

### Raster orchestrateur (`raster/` racine)

```
raster/
  AGENTS.md           # ce contrat
  inbox.md            # capture globale (pas liée à un projet)
  regen.mjs / t.mjs   # walk products/*/docs/specs/epics/**/tasks
  INDEX.tsv           # GÉNÉRÉ — all live tasks
  SPRINT.md           # GÉNÉRÉ — sprint courant (Raster owns)
  BACKLOG.md          # GÉNÉRÉ — par projet / feature
  PORTFOLIO.md        # GÉNÉRÉ — santé projets
  # PAS de nafura/products/…/tasks (legacy → migrer)
```

### App UI (futur)

`products/raster/` — shell UI qui consomme les vues / fichiers agrégés.

---

## 2. Schema ticket (inchangé — résumé)

### Obligatoire

```yaml
id: ERP-12
status: todo                 # todo | doing | blocked | review | done
context: nafura              # nafura | saham | personal
kind: task                   # feature | spec | task
priority: P1                 # P0 | P1 | P2 | P3
assignee: me                 # me | agent | either
gate: none                   # none | me | qa
```

### Fréquent

```yaml
sprint: 2026-W33
parent: ERP-16               # feature parente
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
| `feature` | Ensemble de Tasks — pas exécutable seul |
| `spec` | Décision / ADR — rarement dans le sprint comme « travail » |
| `task` | Unité exécutable + AC |

---

## 3. Pipeline

| # | Action | Où |
|---|--------|-----|
| 1 | **Capture** | `raster/inbox.md` (globale) |
| 2 | **Promote** | → `products/<app>/…/epics/<slug>/tasks/{ID}-….md` (+ créer epic/PLAN si Feature nouvelle) |
| 3 | **Commit** | `sprint: 2026-Wn` sur les **Tasks** |
| 4 | **Check progress** | status + journal sur les tickets produit |
| 5 | **Archive** | `done` → archive produit (hors INDEX) |

Pack agent « nouvelle epic » :

1. `epics/<slug>/00-PLAN.md`
2. `epics/<slug>/tasks/` : 1× `kind:feature` + N× `kind:task` (`parent:` + `blocked_by:`)
3. `ux/` si UI  
4. Regen Raster (`node raster/t.mjs index`)

---

## 4. IDs par projet (exemples)

| Projet (`products/…`) | Préfixe |
|-----------------------|---------|
| `sektor-btp` | `ERP` |
| `raster` | `RAS` |
| `personal` | `PER` |
| `ops` | `OPS` |
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
| 2026-08-05 | Pipeline Capture→…→Archive · pas d’estimate |
| 2026-08-11 | Brand **Raster** · `pm/` → `raster/` |
| 2026-08-11 | **Orchestrateur** : tasks dans `epics/<slug>/tasks/` · IDs par projet · plus de stockage métier sous `raster/` |
| 2026-08-12 | Inbox **globale** `raster/inbox.md` (pas liée à un projet) · filtre projet = Backlog / Sprint seulement |
