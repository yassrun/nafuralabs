---
id: RAS-96
status: done-me
context: nafura
type: tech
agent_type: exec
priority: P1
assignee: agent
gate: me
tags: [raster, exec]
---

# Spawn d'un orchestrateur par lot

> Le seul endroit ou Raster execute quelque chose.

## Question

Raster peut maintenant lancer un processus. Est-ce que tu le laisses lancer **un vrai agent** ?

- **A** — oui : tu poses `RASTER_AGENT_CMD` dans ton environnement (ex. la CLI de ton agent), tu relances l'app, et le bouton « Lancer » du Backlog devient réel. À partir de là, un clic dépense des jetons et modifie un worktree sans que tu relises.
- **B** — pas encore : tu laisses la variable absente. Tout le reste marche, le bouton retombe sur « Orchestrer » et copie un brief. Rien ne s'exécute tant que tu n'as pas décidé.

Recommandé : **B pour un premier essai**, avec une commande inoffensive (`git rev-parse --abbrev-ref HEAD`) pour voir la mécanique tourner, puis A quand tu veux. C'est ce que j'ai fait pour prouver le chemin — jamais un vrai agent, parce que ce n'était pas à moi de le décider.

## Étapes

- [x] `spawn.mjs` — un processus par lot, sortie en tampon
- [x] Refus sans `RASTER_AGENT_CMD`
- [x] Un lot n'est jamais tenu deux fois
- [x] Libération à la sortie du processus
- [x] `t.mjs run` attend son agent

## Journal

```
16/08 13:45  posée
16/08 13:57  status → done-agent
16/08 13:59  toi · approuvée → done-me
```

## Rapport de livraison

ce qui a changé      `raster/spawn.mjs` (neuf) · `t.mjs run | running | stop`
critères prouvés     AC-2 refus sans commande, **avant** toute création de worktree · AC-3 second lancement refusé (« socle est déjà tenu, pid 43140 ») · AC-4 lot libéré à la sortie, aucun état écrit sur disque · AC-6 `spawn.mjs` n'invoque pas git du tout · lancement réel : `git rev-parse --abbrev-ref HEAD` a répondu `socle/CH-01-EVOL-panneau-decision`, donc le processus tournait bien dans le worktree, sur la bonne branche
décidé seul          `t.mjs run` **attend** son agent au lieu de rendre la main. L'état est en mémoire (AC-4) : une CLI qui rendrait la main laisserait un orphelin que plus rien ne suit. Conséquence assumée — `running` et `stop` n'ont de sens que dans le serveur, qui vit longtemps ; la CLI le dit au lieu d'afficher une liste vide trompeuse.
écarts / dette       aucun merge automatique : sous-lot → lot → intégration reste manuel · pas de limite de durée ni de budget sur un agent lancé
