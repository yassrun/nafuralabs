# <Titre du CH>

> Une ligne : ce que ce Change rend vrai.
> **Obligatoire seulement si le CH a ≥ 2 tasks exec.** Une seule task n'a rien à ordonner.
> Éphémère : il meurt avec le CH. *Si une ligne est encore vraie dans deux ans, elle appartient à la SPEC ou au `CH.md`.*

## Verdict

Pourquoi maintenant. Ce qui commande l'ordre des tasks.

## Constat

Faits vérifiés. Bloquants d'abord.

## Approche technique

Périmètre code · couches et fichiers touchés · ordre d'attaque.
C'est ici que le concret a le droit d'exister — pas dans la SPEC.

## Tasks

Une ligne = **un fichier** `tasks/{ID}-….md`.
Une task par **résultat vérifiable tout seul**. Sinon c'est une étape du plan interne de l'exec, pas un ticket.

| # | Task | blocked_by | // OK |
|---|------|------------|-------|
| 1 | … | — | — |
| 2 | … | 1 | non |
| 3 | … | 1 | **oui** avec 2 |

`// OK` = parallélisable avec la ligne indiquée.
Au promote : les `#` deviennent des ids réels dans `blocked_by: […]`.

## Couverture

Couvre `AC-n` … de [`CH.md`](…). Trous connus, s'il y en a.

## Décisions ouvertes

ADR, ou « aucune — prêt à découper ».
