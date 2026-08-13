# BC work — le contrat des tickets

> Ce qui est **vrai maintenant**. Pas de futur ici : le reste à faire vit dans le backlog.
> Canon : [`PACT_BLUEPRINT.md`](../../../PACT_BLUEPRINT.md) · [`RASTER_BLUEPRINT.md`](../../../RASTER_BLUEPRINT.md).

## Intention

Le travail a un endroit, un parent, un type, un statut. Le sprint est un **champ sur la task**, pas un dossier.

## Ce que ça fait

- Scanne **uniquement** `**/raster-src/lots/**/tasks/*.md`
- Dérive l'arbre **projet → lot → sous-lot → task** depuis **le chemin**
- Promeut une ligne d'inbox en task rattachée à un lot
- Engage une task sur une semaine (`sprint: YYYY-Wnn`)
- Régénère INDEX · BACKLOG · SPRINT

## Limites

**owns** — schéma de la task, scan, dérivation de l'arbre, promote, sprint, archive
**not_owns** — le chrome et la capture (socle) · le contenu Pact (`pact/` n'est jamais scanné)

Un dossier est un projet Raster **ssi** `<projet>/raster-src/lots` existe. Pas `docs/specs`, pas `pact/`.

## Intervenants

`me` · `agent` · `either`. `agent_type:` **spec** | **exec** | **qa** — plus **orch**, qui est un skill, pas un `type:` de task.

## Données

| Objet | Forme | Obligations |
|-------|-------|-------------|
| **Lot** | **dossier** | chapeau ; jamais `done` ; jamais de `sprint:` |
| **Sous-lot** | **dossier** | branché Pact : son nom **est** celui du CH ; `done` **dérivé** ⇔ toutes ses tasks `done` |
| **Task** | **fichier** | seul ticket. `id` · `status` · `type` · `agent_type` · `priority` · `assignee` · `gate` |
| **Ligne d'inbox** | ligne | demande brute, sans ID, **seulement** dans `raster/inbox.md` |

`type:` **spec** | **feature** | **bug** | **tech** | **physical** | **qa**
`status:` `todo` | `doing` | `blocked` | `review` | `done-agent` | `done-me`

Branché Pact : lot ← **CADRE | socle | BC** · sous-lot ← **CH**. Le type du Change (`EVOL`, `CORRECTION`, `TECHNICAL`) **n'est pas** le `type:` de la task.

## États

```
ligne d'inbox → (promote) task todo

feature | bug        todo → doing → review → done-agent → done-me → archive
spec | tech | physical | qa   todo → doing → done-agent → done-me → archive
                            ↘ blocked

sans sprint:   = backlog
sprint: Wnn    = sprint (hors done-agent / done-me)
```

`review` = l'exec a fini, la main passe au spec puis au QA.
`done-agent` = **le QA** l'a posé sur feature/bug — jamais l'exec.
`done-me` = tu confirmes → archive.

## Règles

- **INV-1** Raster n'indexe jamais `pact/`.
- **INV-2** **L'arbre est le chemin.** Pas de champ `parent:` — il ne peut donc pas mentir.
- **INV-3** Seule la task est un ticket, et la seule chose sprintable.
- **INV-4** L'état d'un chapeau est **dérivé**, jamais stocké : un lot n'est jamais `done`, un sous-lot l'est ⇔ toutes ses tasks le sont.
- **INV-5** Inbox = **uniquement** `raster/inbox.md`. Une ligne = une demande brute, sans ID.
- **INV-6** Un projet Raster existe ssi `<projet>/raster-src/lots` est présent.
- **R-1** `agent_type` suit `type` : spec→spec · feature|bug|tech|physical→exec · qa→qa. Le walker **dérive** si absent et **refuse** un couple incohérent.
- **R-2** Une task **référence** les critères du `CH.md` (`AC-1`, …). Elle ne les recopie pas ; sa checklist est faite d'**étapes de travail**.
- **R-3** Un dossier sans task n'apparaît nulle part — le « sous-lot au cas où » est impossible, pas interdit.
- **R-4** Branché Pact, le nom du sous-lot est **identique** au nom du CH.
- **R-5** Pas d'`estimate`, pas de compteur dérivé dans le frontmatter.

Soumis à `POL-FICHIER-SSOT` · `POL-VUES-GENEREES` · `POL-CAPTURE-INBOX` · `POL-SANS-BASE`.

## Liens

- **publie** `INDEX.tsv` · `BACKLOG.md` · `SPRINT.md` sous `raster/`
- **consomme** socle (navigation, capture, détail)
- Canvas : [`ux/work-wireframe.canvas.tsx`](ux/work-wireframe.canvas.tsx)
