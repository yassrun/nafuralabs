# Plier Sektor sur Archi

> Même comportement. Le code suit [`ARCHI_BLUEPRINT.md`](../../../../ARCHI_BLUEPRINT.md). Arbre des dossiers : [`DECISIONS.md`](../../DECISIONS.md). Pas de Pact.

Canon : Gateway fan-out · Socle n’est pas la porte métier · un BC publie `api` · un pair ne voit que ça · externe partagé = platform · externe d’un BC = `adapters/` de ce BC.

**Premier slice :** Socle n’importe plus les jars métier · Études consomme Catalogue via `catalogue.api` seulement. C’est le cas qui décide si le modèle tient.

**Slice domain-objets :** `domain.model` → `domain/<agrégat>/`. Pas sortir le JPA, pas replier `api/services/repositories`.

**Slice seeders :** `*SeedService` → `<bc>/seeders/`. Garde demo dans `socle/config`.

**Slice ports-adapters :** ranger par **exécuteur**. `service/port/{capability,bc}/` + `adapters/{capability,bc}/`. Pas de dossier `socle/` dans un BC. Intra-BC (propre DB) reste à la racine du package.

**Pas dans ce lot :** CADRE / SPEC · HTTP BC→BC · jar `*-api` Maven publié · replier tous les packages `api/domain/services/…` · ChainageAval / clients ventes (inbox).
