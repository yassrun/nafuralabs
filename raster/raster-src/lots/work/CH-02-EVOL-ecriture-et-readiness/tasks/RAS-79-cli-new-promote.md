---
id: RAS-79
status: done-me
context: nafura
type: tech
agent_type: exec
priority: P1
assignee: agent
gate: none
tags: [raster, cli]
---

# `t.mjs new` et `promote`

> Créer une task sans jamais taper de frontmatter. Refuser plutôt qu'écrire à moitié.
> Couvre AC-1 · AC-2 de [`CH.md`](../../../../../pact/work/CH-02-EVOL-ecriture-et-readiness/CH.md).

## Étapes

- [x] `write.mjs` : allocation d'id (max des fichiers + `NEXT`), rendu du frontmatter, corps type
- [x] `new <projet> <lot>[/<sous-lot>] "<titre>" --type --priority --assignee --gate`
- [x] `promote "<ligne>" <projet> <cible>` — retire la ligne de `raster/inbox.md`
- [x] Refus sans écriture : enum inconnu, dossier lot absent, couple type/agent_type incohérent
- [x] Regen en fin de commande

## Journal

```
16/08  posée
16/08 13:32  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      `raster/write.mjs` (neuf) — enums, allocation d'id, `createTask`, `promoteLine`, `RefusError` · `t.mjs` routé
critères prouvés     AC-1 cinq refus vérifiés (type, lot, agent_type, blocked_by, titre vide), empreinte du dossier inchangée · AC-2 `RAS-88` → `RAS-90` alloués sans collision, `NEXT` à 90
décidé seul          un lot inexistant est **refusé** par défaut, `--nouveau-lot` pour l'ouvrir — sinon une faute de frappe crée un lot · `@tag` d'inbox devient le `type:` quand il en nomme un, un tag sinon
écarts / dette       `raster-api.ts` continue d'écrire en direct (lot `socle`) · pas de verrou : deux `new` simultanés peuvent lire le même `NEXT`
