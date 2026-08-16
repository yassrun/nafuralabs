# CH-03-CORRECTION — sweep et blocked_by

**Type :** `CORRECTION`
**Cible :** BC `work`
**Qualification :** deux règles justes se combinent en blocage permanent.

## Pourquoi

`sweep` supprime les `done-me` ; la readiness tient qu'un **bloqueur inconnu bloque**. Chacune se défend seule :

- supprimer, parce que Git porte l'histoire et qu'un backlog n'est pas une archive
- bloquer sur l'inconnu, parce qu'un sous-lot dont la dépendance est perdue ne doit pas paraître lançable

Mais une dépendance **satisfaite** devient, après balayage, une dépendance **inconnue**. Elle repasse donc de « levée » à « bloquante » — dans le mauvais sens, et pour toujours.

Constaté en vrai le 2026-08-16 : après le balayage de 53 tasks, `SEKTOR-97` référence `SEKTOR-96`, terminé et supprimé. Son sous-lot est devenu impossible à lancer. `PLT-33` → `PLT-32` était le même cas, plus ancien, qu'on avait pris pour une anomalie isolée.

## Aujourd'hui

`sweep.mjs` supprime le fichier et bumpe `NEXT`. Il ne touche à aucune autre task. Les références restent, orphelines.

## Attendu

Avant de supprimer une task, `sweep` retire son id des `blocked_by` de toutes les autres.

Un `done-me` est une dépendance **satisfaite** : la référence n'a plus de raison d'être. Les deux invariants tiennent alors ensemble — l'inconnu reste bloquant, le terminé ne bloque plus.

## Critères d'acceptation (gelés)

- **AC-1** Après un sweep, aucune task vivante ne référence un id supprimé.
- **AC-2** Le nettoyage précède la suppression : interrompu au milieu, on ne laisse pas de référence orpheline derrière un fichier déjà parti.
- **AC-3** `blocked_by` vidé de tous ses ids **disparaît** du frontmatter — pas de `blocked_by: []` résiduel.
- **AC-4** `--dry` ne modifie rien, ni fichier supprimé ni référence retirée.
- **AC-5** Les références déjà orphelines (`SEKTOR-97` → `SEKTOR-96`) sont réparées, sinon la correction ne corrige pas le présent.
- **AC-6** `check` redevient vert.

## Preuves attendues

`raster/e2e/work/` — nettoyage d'un `blocked_by` sur un frontmatter en mémoire : un id retiré parmi d'autres, le dernier id retiré, un `blocked_by` absent. Plus `check` vert sur le dépôt.
