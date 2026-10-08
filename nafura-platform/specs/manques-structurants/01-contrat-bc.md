# 1 — Contrat entre BCs

## Décision (2026-10-08)

Un BC **peut** dépendre d’un autre. La dépendance est le contrat publié, jamais le code.

- `spec.provides` : le BC publie **son** id, à `metadata.version`, avec `api` (clés de `spec.records`) et `events` (ids de `spec.notifications`).
- `spec.requires` : un autre BC à une version `^x.y.z`, et éventuellement une partie de son `api` et de ses `events`. `optional` reste admis. Les `cap.*` restent le catalogue de capabilities.
- Le validateur de manifestes et `BusinessContextContracts` au démarrage refusent un id étranger, une version différente de celle du manifeste, une surface non déclarée, une version incompatible ou un cycle.
- Un BC ne référence pas le projet Gradle d’un autre BC et n’importe pas `ma.nafura.bc.<autre>`.

## État

Livré. Le BC démo publie `bc.demo` (projets, demandes d’achat, événements d’approbation).
