# Écriture et readiness

> Le CLI devient la seule voie d'écriture, et sait dire ce qui est lançable.

## Verdict

Rien d'autre ne peut démarrer avant. Le skill, le spawn et l'UI supposent tous qu'une task s'écrit par commande et qu'on sache quels sous-lots sont ouverts.

## Constat

- `t.mjs` n'expose que `index` · `check` · `sweep` — aucune écriture, malgré son en-tête
- `sources/web/server/raster-api.ts` réimplémente l'allocation d'id (l.177) et écrit en direct (l.297, l.451, l.487)
- `blocked_by:` n'est jamais résolu ; `PLT-33` référence `PLT-32`, id inconnu depuis un sweep
- `parseFrontmatter` existe déjà (`regen.mjs` l.27) mais rien ne sait **écrire** un frontmatter

## Approche technique

Deux modules neufs à la racine du projet Raster, à côté du moteur existant :

- `write.mjs` — rendu du frontmatter, allocation d'id, création de fichier, patch en place
- `ready.mjs` — groupement par sous-lot, résolution de `blocked_by`, verdict lançable

`t.mjs` ne fait que router. L'allocation d'id reprend la logique de `raster-api.ts` (max des fichiers, `_archive` compris, plus `NEXT`) — c'est elle qui devient canonique ; le serveur l'appellera plus tard.

Ordre d'attaque : `write.mjs` d'abord (79 puis 80, même fichier), `ready.mjs` en parallèle (81, indépendant).

## Tasks

| # | Task | blocked_by | // OK |
|---|------|------------|-------|
| 1 | RAS-79 `new` + `promote` | — | **oui** avec 3 |
| 2 | RAS-80 `sprint` + `status` + `approve` | 1 | **oui** avec 3 |
| 3 | RAS-81 readiness `ready` | — | **oui** avec 1, 2 |
| 4 | RAS-82 consolider `work/SPEC.md` | 1, 2, 3 | non |
| 5 | RAS-83 QA | 4 | non |

## Couverture

Couvre `AC-1` → `AC-6` de [`CH.md`](../../../../pact/work/CH-02-EVOL-ecriture-et-readiness/CH.md).
Trou connu : le serveur Vite continue d'écrire en direct — le repasser par le CLI est dans le lot `socle`.

## Décisions ouvertes

Aucune — prêt à découper.
