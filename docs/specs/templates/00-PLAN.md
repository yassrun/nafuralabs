---
kind: epic-plan
app: <app-id>                 # ex. sektor-btp
slug: <feature-slug>          # = nom du dossier + feature: sur tickets
module: <module>
raster_feature: null          # ID kind:feature une fois créé (ex. ERP-05)
status: draft                 # draft | active | done
language: fr
---

# <Titre court>

> 2 lignes max — intention livrable (flux mince).

**Objectif** : …
**Périmètre code** : `products/<app>/…`
**Hors scope** : …

---

## 1. Verdict

Pourquoi maintenant. Ce qui commande l’ordre des tasks.

## 2. Constat

Faits vérifiés. Bloquants d’abord.

## 3. Cible

Comportement / modèle voulu.

## 4. Tasks (découpage exécutable)

Chaque ligne → **1 fichier** `tasks/{ID}-….md` (`kind:task`, `parent:` = feature).  
Feature sans tasks enfants = **pas** exécutable / pas commit sprint.

| # | Task (titre) | blocked_by (#) | // OK |
|---|--------------|----------------|-------|
| 1 | … | — | oui |
| 2 | … | — | oui |
| 3 | … | 1, 2 | non |

Même groupe sans dépendance mutuelle = **parallélisable**.  
Au promote : `#` → IDs réels dans `blocked_by: […]`.

## 5. Décisions ouvertes

ADR ou « aucune — prêt à découper ».

## 6. UX

- SSOT : [`ux/<name>-wireframe.canvas.tsx`](./ux/) ou `n/a`
- Valider canvas = Task `gate:me` si pas encore fait
- Impl UI = Task(s) classiques

## 7. Liens Raster (tickets dans ce dossier)

| Rôle | Id |
|------|-----|
| Feature | … |
| Spec | … |
| Tasks | … |

---

### DoD « PLAN + tickets prêts »

- [ ] Dossier `epics/<slug>/` + `00-PLAN.md`
- [ ] `tasks/` : 1× `kind:feature` + N× `kind:task` (`parent:` + `feature:` + `blocked_by`)
- [ ] Inbox projet non utilisée comme SSOT (lignes promues)
- [ ] `node raster/t.mjs index` OK
