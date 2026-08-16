---
id: RAS-78
status: done-me
context: nafura
type: spec
agent_type: spec
priority: P1
assignee: agent
gate: me
tags: [raster, pact, cadre, orchestration]
---

# Porter le mode autonome dans le CADRE

> Huit décisions figées le 16/08 dans `AGENTS.md` §0.1-9 et §7 sans frontière qui les autorise.
> Couvre [`CH.md`](../../../../../pact/CH-01-EVOL-orchestration-autonome/CH.md) — AC-1 à AC-6.

## Question

AC-2 — la contrainte du CADRE « Pas de base, pas d'auth. Un dépôt Git suffit à faire tourner Raster. » : on la tient, ou on la remplace ?

- **A** — tenue : l'app ne lance jamais rien, le skill `orchestration` lance depuis le terminal. Le dépôt reste autosuffisant, mais la décision 7 (§7 « Qui appuie sur le bouton ») tombe.
- **B** — remplacée : on écrit ce que l'exécution d'agents ajoute comme prérequis (processus, clés d'API), et où passe la frontière avec « pas de base, pas d'auth ».

Recommandé : **B** — la décision 7 fait déjà lancer l'app. Garder A obligerait à la rouvrir.

**Réponse (16/08) : B.**

## Étapes

- [x] Relire les huit décisions (`AGENTS.md` §7) et marquer chacune : CADRE ou BC
- [x] Toi : trancher AC-2 — « pas de base, pas d'auth » tenue ou remplacée → **B**
- [x] Spec : patcher `CADRE.md` (owns · not_owns · acteurs · contraintes · vocabulaire)
- [x] Vérifier qu'il tient toujours en une page

## Journal

```
16/08  spec · gate me · pas d'exec tant que le CADRE n'autorise pas le mode autonome
16/08  toi · B — la contrainte « pas de base, pas d'auth » est remplacée
16/08  spec · CADRE patché · done-agent · attend ton approbation
```

## Rapport de livraison

ce qui a changé      `CADRE.md` — intention (fenêtre déroulée sans toi) · owns (parallèle + borne) · not_owns (+2 : clés/bac à sable → environnement local, qualité → qa) · acteur **orchestrateur** · 2 contraintes (dépôt lit mais n'exécute pas · aucun agent ne dépasse la borne) · 4 termes au vocabulaire

critères prouvés     AC-1 contrainte « aucun agent ne dépasse la borne », opposable (3 interruptions nommées) · AC-2 **B** — « pas de base, pas d'auth » remplacée par « le dépôt suffit à lire, pas à exécuter » · AC-3 roadmap · borne · readiness · rapport de livraison · AC-4 deux exclusions d'exécution, chacune avec son responsable · AC-5 79 lignes, une page · AC-6 les 8 décisions placées (ci-dessous) · revue humaine : toi

décidé seul          répartition CADRE / BC des 8 décisions : au CADRE → 2 (lot = isolation), 4 (roadmap), 5 (borne), 7 (l'app lance), 8 (readiness, le terme). Aux BC → 1 (écriture CLI), 3 (grain de fan-out), 6 (skill vs règles), 8 (le calcul). Aucune n'est orpheline. · Le mot « auth » disparaît des contraintes mais reste en `not_owns` — l'absence d'utilisateurs n'était pas la même chose que l'absence de clés.

écarts / dette       le BC qui portera l'orchestration n'est pas décidé (`work` élargi ou BC neuf) — c'est le lot 2 de la roadmap · la Carte du CADRE est marquée « généré » mais reste écrite à la main · `blocked` externe n'est pas dans le vocabulaire, il est dans `AGENTS.md` §7
