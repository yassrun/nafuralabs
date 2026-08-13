# Raster — où lire

Ce fichier était une **copie** de `raster/AGENTS.md`. Une copie diverge : elle est supprimée.

| Quoi | Où |
|------|-----|
| **Contrat agents** (schéma ticket, pipeline, hard rules) | [`raster/AGENTS.md`](../raster/AGENTS.md) |
| **Blueprint Raster** (vocabulaire, projection Pact, verbe *raster*) | [`RASTER_BLUEPRINT.md`](../RASTER_BLUEPRINT.md) |
| **Blueprint Pact** (CADRE, SPEC, CH, agents, orchestration) | [`PACT_BLUEPRINT.md`](../PACT_BLUEPRINT.md) |
| **Template PLAN** | [`raster/templates/00-PLAN.md`](../raster/templates/00-PLAN.md) |

```bash
node raster/t.mjs index    # regen INDEX / BACKLOG / SPRINT
node raster/t.mjs check    # valide le canon — sort en 1 si erreur
node raster/t.mjs sweep    # supprime les tasks done-me
```
