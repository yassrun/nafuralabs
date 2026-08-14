# Web — socle + un arbre

> `sources/web/app/` devient `socle/` + un dossier par domaine actuel. Comportement identique.

## Verdict

Le dual `pages/` vs `etudes/` (etc.) est ce qui empêche de ranger. Le socle d’abord : sans lui on ne sait pas ce qui reste dans un domaine.

## Constat

- `app/pages/` = 1304 `.ts` ; les dossiers domaine existent déjà à côté
- Cinq aliases tsconfig vers platform ; `@features` / `@services` morts
- Docs internes (`ARCHITECTURE.md`) encore sur `platform/web`

## Approche technique

Suivre `MAPPING.md` (SEKTOR-83). Moves + retarget imports / routes. Pas de rewrite UI. Un alias `@platform/*` seulement. Preuve = `npm run build:dev` VERT (mêmes WARN budget qu’avant).

## Tasks

| # | Task | blocked_by | // OK |
|---|------|------------|-------|
| 1 | SEKTOR-84 ramasser `web/socle` | SEKTOR-83 | — |
| 2 | SEKTOR-85 tuer `pages/`, un dossier par domaine | SEKTOR-84 | non |
| 3 | SEKTOR-86 alias unique + preuve build | SEKTOR-85 | non |

## Couverture

Pas de CH. Preuve = compile Angular, routes existantes inchangées.

## Décisions ouvertes

Aucune hors `MAPPING.md` déjà gelé en 83.
