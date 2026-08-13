# BC work — orchestration

## Intention

Le travail a un endroit (fichier), un parent, un type, un statut. Le sprint est un champ sur la task, pas un dossier.

## Ce que ça fait

- Indexe **seulement** `**/raster-src/lots/**/tasks/*.md` (peers racine + `products/<app>/` s’ils ont `raster-src/`)
- Arbre **projet → lot → sous-lot → task** via `parent:`
- Inbox globale `raster/inbox.md` → promote vers un lot plat ou un sous-lot
- Commit sprint = `sprint: YYYY-Wnn` sur une **task**
- Regen INDEX / BACKLOG / SPRINT

## Limites

**owns :** schéma ticket, scan, promote, commit sprint, archive `done`  
**not_owns :** chrome nav/capture (socle) · contenu Pact (`pact/` jamais scanné)

**Détection projet :** un dossier est un projet Raster ssi `<projet>/raster-src/lots` existe. Pas `docs/specs`, pas `pact/`.

## Intervenants

`me` · `agent` · `either`

## Données

| Objet | id | Obligations |
|-------|-----|-------------|
| Lot | `kind: lot` | chapeau ; jamais `done` ; jamais `sprint:` |
| Sous-lot | `kind: sous-lot` | `parent:` = lot ; `done` ⇔ toutes ses tasks `done` |
| Task | `kind: task` | `parent:` = sous-lot (ou lot plat) ; `type:` spec \| feature \| bug \| physical ; `status:` todo \| doing \| blocked \| review \| done-agent \| done-me |
| Inbox line | — | task draft ; description = la ligne ; **seulement** `raster/inbox.md` |

Si branché Pact : lot ← socle\|BC ; sous-lot ← Change (`INIT`/`EVOL`/`CORRECTION`/`TECHNICAL`). Le type de Change **n’est pas** le `type:` de la task.

## États

```
inbox line → (promote) task todo
task: todo → doing → review → done-agent → done-me → archive
        ↘ blocked
sans sprint:  = backlog
sprint: Wnn   = Sprint (hors done-agent / done-me)
status done-agent = vue **Done agent** (filtre)
```

`review` = vérif QA (feature/bug).  
`done-agent` = l’agent (ou QA) a fini — **pas** archive. Filtre top-level.  
`done-me` = toi confirmes → archive. Pas forcément toi qui as fait le travail.

## Types de task

`kind: spec` (ADR) ≠ `type: spec`. L’ADR n’est pas sprintable. `type: spec` est une **task** sprintable.

| `type` | C’est quoi | Runnable / testable ? |
|--------|------------|------------------------|
| **spec** | Écrire / patcher SPEC + canvas | non — livrable = contrat |
| **feature** | Comportement nouveau (code + preuve) | **oui** |
| **bug** | Écart code ↔ SPEC déjà juste | **oui** (repro) |
| **physical** | Move / dossiers / ops | non — livrable = chemin réel |

Un CH Pact `INIT`/`EVOL` a une task **`type: spec`** (update SPEC + UX) **et** des tasks `feature` / `bug` séparées. Pas de `type: feature` sur l’écriture de SPEC.

## DOR / DOD

**DOR** (Ready → `todo` sprintable) · **DOD agent** (`done-agent`) · **DOD me** (`done-me` → archive)

| type | DOR | DOD agent | DOD me |
|------|-----|-----------|--------|
| **spec** | CH connu ; périmètre dit | SPEC + canvas écrits | `me` a lu / validé |
| **feature** | SPEC à jour ou task spec sœur ; AC | code + e2e vert ; QA `review` | `me` confirme |
| **bug** | repro ; SPEC inchangée | e2e repro → vert ; QA `review` | `me` confirme |
| **physical** | chemins | arbre réel conforme | `me` confirme |

## Règles

- **INV-1** Raster n’indexe pas `pact/`.
- **INV-6** Un projet Raster existe ssi `<projet>/raster-src/lots` est présent.
- **INV-2** `parent:` est la SSOT de l’arbre (pas le chemin, même s’ils coïncident).
- **INV-3** Seule la task est sprintable.
- **INV-4** Inbox = **uniquement** `raster/inbox.md`. Chaque ligne = **task draft** (description, pas d’ID). Pas de lot / sous-lot dans l’inbox.
- **INV-5** Promote sans parent → la ligne reste dans `inbox.md`.
- **R-3** Lot / sous-lot sans task : ne pas créer. Invisible inbox **et** backlog.
- **R-1** Si le lot a déjà des sous-lots, `parent:` d’une task ≠ ce lot.
- **R-4** `type:` obligatoire si `kind: task` — `spec` \| `feature` \| `bug` \| `physical`. Feature/bug = runnable. Écriture de contrat = `spec`.

## Liens

- **publie** INDEX.tsv, BACKLOG.md, SPRINT.md sous `raster/`
- Canvas : [`ux/work-wireframe.canvas.tsx`](ux/work-wireframe.canvas.tsx)
