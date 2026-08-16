# CH-04-CORRECTION — sans sprint

**Type :** `CORRECTION`
**Cible :** BC `work`
**Qualification :** `sprint:` n'est plus lu par personne qui décide. Il coûte une écriture et promet un sens qu'il n'a plus.

## Pourquoi

Le pilotage est passé à la **borne** le 2026-08-16. Depuis, plus rien dans le chemin de décision ne consulte `sprint:` :

| Qui décide | Lit `sprint` ? |
|------------|----------------|
| `ready.mjs` — ce qui est lançable | non |
| `roadmap.mjs` / `window` — la fenêtre | non |
| skill `orchestration` — la boucle | non (cité une fois, dans la liste des commandes) |
| agents `exec` · `spec` · `qa` | non |

Il reste **écrit** par `write.mjs`, `regen.mjs` et l'app. Un agent le pose encore par rituel — « je commite le sprint sur les trois tasks » — sans que ça change ce qui se lance.

C'est exactement le motif qui a fait supprimer `parent:` : un champ de moins qui peut être faux. Un champ que personne ne lit finit par mentir, et par coûter une explication à chaque lecture.

## Aujourd'hui

`sprint: YYYY-Wnn` dans le frontmatter · `t.mjs sprint` · colonne `sprint` dans `INDEX.tsv` · `SPRINT.md` généré · la semaine ISO calculée par `isoWeekInfo`.

## Attendu

Le champ, la commande et la vue générée disparaissent. La borne dit ce qui est ouvert, le statut dit où en est le travail. Il n'y a plus de troisième axe.

## Critères d'acceptation (gelés)

- **AC-1** Aucune occurrence de `sprint` dans les fichiers de task, ni dans `write.mjs`, `regen.mjs`, `check.mjs`, `t.mjs`.
- **AC-2** `t.mjs sprint` n'existe plus, et l'aide ne le propose plus.
- **AC-3** `SPRINT.md` est supprimé, et plus rien ne le génère.
- **AC-4** `INDEX.tsv` n'a plus de colonne `sprint`.
- **AC-5** `check` reste au même nombre d'erreurs qu'avant le Change — la suppression ne casse rien.
- **AC-6** La SPEC `work` ne mentionne plus le sprint, ni dans les données, ni dans les états.

## Preuves attendues

`raster/e2e/work/` — un test d'absence, qui échoue si `sprint` réapparaît dans le moteur. Plus la suite existante, verte.

## Hors périmètre

La vue Sprint et le bouton « → Sprint » de l'app → `socle/CH-03-CORRECTION-sans-vue-sprint` · l'historique : les commits gardent ce qui a été engagé et quand
