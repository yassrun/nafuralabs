---
id: RAS-91
status: done-me
context: nafura
type: tech
agent_type: exec
priority: P1
assignee: agent
gate: none
tags: [raster, api]
---

# Serveur : readiness, corps de task, ecriture via le CLI

> Le serveur cesse d'ecrire lui-meme et expose ce que l'UI n'a jamais eu.

## Étapes

- [x] `raster-api.ts` réécrit — plus une seule écriture de task côté serveur
- [x] `question` · `rapport` · `attend` exposés dans le DTO
- [x] `/api/ready` · `/api/window` · `/api/tasks/:id/approve`
- [x] Refus du CLI → `400` avec son message

## Journal

```
16/08 13:35  posée
16/08 13:43  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      `sources/web/server/raster-api.ts` — 502 → 300 lignes. Les trois `fs.writeFileSync` de task, `nextIdForPrefix`, `setFrontmatterField` et `promoteInboxLine` supprimés au profit de `write.mjs`. Nouveau : `section()` (découpe du corps), `attend`, `/api/ready`, `/api/window`, `/api/tasks/:id/approve`
critères prouvés     AC-5 test structurel : plus aucune écriture hors `inbox.md`, plus d'allocation d'id · AC-2 `question` / `rapport` lus depuis le `.md`, vérifiés en vrai sur `PLT-81` · vérification navigateur : zéro erreur console
décidé seul          la **capture d'inbox reste** la seule écriture directe du serveur — une ligne d'inbox n'est pas une task, la faire passer par le CLI aurait été un contresens · toute mutation renvoie l'état complet (`tasks` + `ready` + `lines`) après regen, ce qui supprime les re-fetch en cascade côté front
écarts / dette       les modules `.mjs` ont perdu leur shebang : esbuild refuse de les inliner dans la config Vite. Ils s'appellent par `node <fichier>`, donc sans effet — mais c'est une contrainte non écrite du couplage config ↔ moteur.
