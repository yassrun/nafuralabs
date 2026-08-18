# CH-04-CORRECTION — sans sprint

**Type :** `CORRECTION`
**Cible :** BC `work`
**Qualification :** `sprint:` n'est plus lu par personne qui décide. Il coûte une écriture et promet un sens qu'il n'a plus.

**Politiques applicables :** `POL-FICHIER-SSOT` · `POL-VUES-GENEREES` · `POL-ECRITURE-CLI`

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

- **AC-1** Aucune clé `sprint:` dans le frontmatter des fichiers `**/raster-src/lots/**/tasks/*.md`. Aucune occurrence de `sprint` dans `raster/write.mjs`, `raster/regen.mjs`, `raster/check.mjs`, `raster/t.mjs`.
- **AC-2** `node raster/t.mjs sprint` n'existe plus. `node raster/t.mjs -h` ne propose plus `sprint`.
- **AC-3** `raster/SPRINT.md` est absent du dépôt. Ni `raster/regen.mjs` ni `node raster/t.mjs index` ne le génèrent.
- **AC-4** L'en-tête de `raster/INDEX.tsv` n'a plus de colonne `sprint`.
- **AC-5** `node raster/t.mjs check` reste au même nombre d'erreurs qu'avant le Change — la suppression ne casse rien.
- **AC-6** `raster/pact/work/SPEC.md` ne mentionne plus le sprint — ni Données, ni États, ni owns, ni commandes, ni Liens. INV-3 ne dit plus « sprintable ».

## Preuves attendues

`raster/e2e/work/` — test d'absence, état initial = dépôt après RAS-103. Échoue si `sprint` réapparaît dans `raster/write.mjs`, `raster/regen.mjs`, `raster/check.mjs` ou `raster/t.mjs` ; si `raster/SPRINT.md` est présent ; si `raster/INDEX.tsv` porte une colonne `sprint`. Plus la suite existante, verte.

## Hors périmètre

La vue Sprint et le bouton « → Sprint » de l'app → `socle/CH-03-CORRECTION-sans-vue-sprint` · l'historique : les commits gardent ce qui a été engagé et quand
