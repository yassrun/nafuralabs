# CH-01-EVOL — orchestration autonome

**Type :** `EVOL`
**Cible :** app `raster`
**Qualification :** le CADRE owns « l'orchestration des mains entre agents » — une main à la fois, passée par toi. Le mode visé est autre : plusieurs agents en parallèle, sans prompt, dans une fenêtre que tu bornes.

## Pourquoi

Le CADRE décrit un travail que **tu déclenches**. L'usage visé est : planifier un lot ou deux, et partir. Trois notions manquent pour que ça soit seulement *dicible* — ce qui rend deux travaux parallélisables, ce qui dit quoi ouvrir ensuite, et jusqu'où un agent avance seul.

Deux contraintes du CADRE sont en tension avec ce mode, et c'est le vrai objet de ce Change :

- **« Pas de base, pas d'auth. Un dépôt Git suffit à faire tourner Raster. »** Une app qui lance des agents exécute des processus et porte des clés. Le dépôt ne suffit plus — il faut soit rouvrir la contrainte, soit dire où passe la frontière.
- **« Coût d'interaction »** est écrit pour un humain qui lit (capture < 5 s, INDEX < 2 s). En mode autonome le lecteur principal devient un agent, et le coût qui compte devient celui du **rapport** que tu lis après coup.

## Aujourd'hui

`CADRE.md` : `owns` « l'orchestration des mains entre agents ». Aucun vocabulaire pour la roadmap, la borne, la readiness. `not_owns` ne dit rien de l'exécution d'agents. Les acteurs sont `toi` et `agent` — l'orchestrateur, qui conduit d'autres agents, n'existe pas.

Côté travail, huit décisions ont été figées le 2026-08-16 dans `raster/AGENTS.md` (§0.1-9, §7) sans passer par le CADRE : elles y sont en avance sur la frontière qui devrait les autoriser.

## Attendu

Un `CADRE.md` qui rend le mode autonome opposable — toujours **une page**, toujours sans roadmap ni technique.

- `owns` : la conduite d'agents en parallèle, et la **borne** d'autonomie
- `not_owns` : ce que Raster ne fera pas de l'exécution (nommer qui s'en charge)
- Acteurs : l'**orchestrateur** apparaît, avec ce qu'il décide seul et ce qu'il ne décide jamais
- Contraintes : les deux ci-dessus tranchées — rouvertes ou tenues, mais explicitement
- Vocabulaire : **roadmap** · **borne** · **readiness** · **rapport de livraison**

## Critères d'acceptation (gelés)

- **AC-1** Le CADRE dit **jusqu'où** un agent avance sans toi, et cette limite est opposable — on peut montrer un cas qui la dépasse.
- **AC-2** La contrainte « pas de base, pas d'auth » est soit maintenue, soit remplacée par une contrainte qui dit ce que l'exécution d'agents ajoute comme prérequis. Le silence n'est pas une réponse.
- **AC-3** Les quatre termes (roadmap, borne, readiness, rapport de livraison) sont au Vocabulaire, chacun en une ligne.
- **AC-4** `not_owns` gagne au moins une exclusion sur l'exécution, avec qui s'en charge à la place.
- **AC-5** Le CADRE tient toujours en une page et ne contient ni roadmap, ni règle technique.
- **AC-6** Les huit décisions du 2026-08-16 sont soit couvertes par le CADRE, soit listées comme relevant d'un BC — aucune ne reste orpheline.

## Preuves attendues

**Revue humaine.** Pas d'e2e : il n'y a pas de parcours à prouver sur une frontière. Même régime que `CH-00-INIT-cadre`.
