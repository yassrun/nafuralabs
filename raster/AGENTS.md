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
| Chemin tasks | `products/<app>/docs/specs/lots/<lot-slug>/<sous-lot-slug?>/tasks/{ID}-{slug}.md` |
| Inbox | **Une globale** : `raster/inbox.md` (promote vers un projet ensuite) |
| IDs | **Par projet** (préfixe dédié, immuable) — ex. Sektor=`ERP`, Raster=`RAS`, Personal=`PER`, Ops=`OPS` |
| Epic docs | Même dossier : `00-PLAN.md` (+ UX / ADR si besoin) — **pas** de `00-PROGRESS.md` obligatoire (suivi = tickets) |
| Vocabulaire | **Lot / sous-lot** = chapeaux (draft tant que pas de task) · **Task** `type:` bug \| feature \| physical · **pas** de feature/epic/bug-umbrella |
| Tout est un projet | Personal, ops, client… = `products/<app>/` (plus de dossiers spéciaux sous `raster/`) |

**Migration :** chemins legacy `raster/nafura/…/tasks/` encore présents → à migrer ; **nouvelles écritures** = modèle ci-dessous uniquement.

---

## 0.1 Hard rules

1. Travail Nafura = ticket avec `sprint: 2026-Wn` avant exécution.
2. Status ne bouge que au **Check progress** (à deux).
3. Pas d’`estimate`. Pas de `dropped` (abandon = delete).
4. **Lot / sous-lot sans Tasks = draft** (inbox), **pas** backlog. Ne pas créer de sous-lot vide « au cas où ».
5. **Backlog + Sprint = Tasks seulement.** Un lot/sous-lot n’est pas sprintable. Commit = `sprint:` sur une task.
6. `done` → archive **dans le produit** (garde `sprint:`) — hors INDEX live.
7. Toute task a un **`type:`** `bug` | `feature` | `physical`. **Pas** de bug-umbrella. **Pas** de `kind: bug`.

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

### Produit / projet (`products/<app>/`)

```
products/<app>/
  docs/specs/
    lots/
      <lot-slug>/                     # chapitre (kind:lot dans tasks/)
        tasks/
          {ID}-lot-….md               # kind: lot
          {ID}-….md                   # kind: task  (lot plat, pas de sous-lot)
        <sous-lot-slug>/              # optionnel — §0.2
          00-PLAN.md
          ux/…
          tasks/
            {ID}-sous-lot-….md        # kind: sous-lot
            {ID}-….md                 # kind: task | spec
      _archive/                       # lots / flux terminés
      _backlog/tasks/                 # triage orphelin
  ROADMAP.md                          # optionnel
```

### Raster orchestrateur (`raster/` racine)

```
raster/
  AGENTS.md           # ce contrat
  inbox.md            # capture globale (pas liée à un projet)
  regen.mjs / t.mjs   # walk products/*/docs/specs/lots/**/tasks
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
kind: task                   # lot | sous-lot | spec | task
type: feature                # bug | feature | physical  (obligatoire si kind:task)
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
| `lot` | Chapeau CBS — **draft** tant que pas de task (inbox, hors backlog) |
| `sous-lot` | Chapeau flux optionnel (§0.2) — **draft** tant que pas de task |
| `spec` | Décision / ADR — pas sprintable |
| `task` | Seule unité backlog + sprint. `type:` **bug** \| **feature** \| **physical** |

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

1. `lots/<lot-slug>/tasks/` : ticket `kind: lot`
2. Même `tasks/` : N× `kind: task` avec `parent:` = lot
3. `ux/` si UI (sur le lot plat)
4. Regen Raster (`node raster/t.mjs index`)

Pack agent « nouveau sous-lot » (seulement si critère §0.2) :

1. Dossier `lots/<lot-slug>/<sous-lot-slug>/`
2. `00-PLAN.md` + `tasks/` : 1× `kind: sous-lot` (`parent:` = lot) + N× `kind: task`
3. Si le lot avait déjà des tasks directes du **même** flux : les reparenter. Si c’est un **2ᵉ** flux : créer le sous-lot + reparenter l’ancien flux aussi
4. Regen Raster

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
| 2026-08-12 | **`kind: bug-umbrella`** figé (comme `feature`) · enfants = `kind: bug` |
| 2026-08-12 | Backlog/Sprint = **tasks** · hats vides = inbox/draft · `type:` bug \| feature \| physical |
