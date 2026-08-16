# CH-00-INIT — conduite

**Type :** `EVOL` (forme `INIT` — premier contrat du BC)
**Cible :** BC `orchestration` (nouveau)
**Qualification :** le CADRE owns « la conduite d'agents en parallèle » et « la borne », mais aucun BC ne les porte. `work` owns le contrat des tickets — pas la conduite.

## Pourquoi

RAS-78 a laissé cette dette explicite : « le BC qui portera l'orchestration n'est pas décidé (`work` élargi ou BC neuf) ». Élargir `work` lui donnerait deux `owns` sans rapport — le contrat des fichiers et la conduite des agents. Un BC qui possède deux choses est un BC qu'on ne peut plus opposer à rien.

## Aujourd'hui

Rien. Les décisions existent (`AGENTS.md` §7 : roadmap, borne, fan-out, worktrees, skill) mais elles vivent dans un contrat d'agents, pas dans une SPEC. Aucun code ne lit `ROADMAP.md`.

## Attendu

Un BC `orchestration` avec sa `SPEC.md`, et de quoi lire la fenêtre de travail.

- `SPEC.md` — intention · owns / not_owns · données (roadmap, borne, lançable) · règles
- Lecture de `ROADMAP.md` et de la borne : quels lots sont ouverts, lequel vient ensuite
- Le skill `orchestration` et les agents `exec` · `spec` · `qa`
- La Carte du CADRE gagne une troisième ligne

## Critères d'acceptation (gelés)

- **AC-1** `SPEC.md` dit ce que `orchestration` ne fait pas, et nomme qui s'en charge — au minimum le contrat des tickets, qui reste à `work`.
- **AC-2** La borne est lue depuis le marqueur `<!-- borne -->` ; un `ROADMAP.md` sans marqueur donne une fenêtre **vide**, jamais une fenêtre ouverte.
- **AC-3** Le skill `orchestration` ne recopie **aucune** règle d'`AGENTS.md` — il y renvoie. Cursor ne lit pas les skills ; une règle recopiée serait une règle que Cursor n'a pas.
- **AC-4** Les trois agents existent en fichiers, avec leur périmètre : un exec ne pose pas `done-agent` sur feature/bug, un qa ne code pas.
- **AC-5** La Carte du CADRE liste `orchestration`.

## Preuves attendues

`raster/e2e/orchestration/` — lecture d'une roadmap avec borne, d'une sans marqueur (fenêtre vide), et d'une où la borne est en tête (fenêtre vide aussi).
