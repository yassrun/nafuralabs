# CH-01-TECHNICAL — plier l'arbre

**Type :** `TECHNICAL`
**Cible :** BC `commentaire`
**Qualification :** le contrat est posé ; le code de **ce** BC vit encore sous `features/collaboration/comment`. Aucune règle ne change.

## Pourquoi

Un contexte Pact a un arbre (`ARCHI_BLUEPRINT`). Tant que le code de ce BC porte le nom de son ancien paquet, le prochain Change travaille dans le mauvais dossier.

## Aujourd'hui

- Backend `sources/backend/features/collaboration/comment/` (sources Java sous `src/main/java/ma/nafura/comment/`).
- Include `includePlatform(":platform:features:collaboration:comment")` dans `sources/backend/settings.gradle.kts`.
- Web `sources/web/features/collaboration/comment/` (`index.ts` · `components/comment-thread.component.ts` · `services/comment-api.service.ts`).
- e2e déjà `e2e/commentaire/` ; Gradle des e2e `:platform:features:collaboration:comment` (`e2e/commentaire/_gradle.mjs`).

## Attendu

Le module Gradle et le web de **ce** BC vivent sous `commentaire`. Les packages Java, les routes HTTP et les noms de scénarios `commentaire-*` **ne bougent pas**.

## Critères d'acceptation (gelés)

- **AC-1** Le module Gradle de ce BC est `sources/backend/commentaire/`, inclus `:platform:commentaire` (`projectDir` = `commentaire`). L'ancien include `:platform:features:collaboration:comment` n'est plus. Les e2e lancent `:platform:commentaire:test` ; le dossier sources Java interne `src/main/java/ma/nafura/comment/` reste.
- **AC-2** Le web de ce BC est sous `sources/web/app/commentaire/` (`index.ts` · `components/comment-thread.component.ts` · `services/comment-api.service.ts`). L'ancien dossier `sources/web/features/collaboration/comment/` n'est plus.
- **AC-3** Les e2e restent sous `e2e/commentaire/`. Les noms `test("commentaire-…")` sont inchangés : `commentaire-poster-et-lire` · `commentaire-deux-tenants` · `commentaire-auteur-seul` · `commentaire-retirer` · `commentaire-repondre` · `commentaire-frontiere-produit`.
- **AC-4** La suite e2e existante (`commentaire-*`) reste verte.
- **AC-5** Les FQCN Java `ma.nafura.platform.collaboration.comment` (dont `CommentController` · `CommentBaselineTest`) et la route `/api/v1/platform/collaboration/comments` ne changent pas.

## Preuves attendues

| Scénario | État initial | AC |
|----------|--------------|----|
| `commentaire-plier-arbre` | backend `features/collaboration/comment` · web `features/collaboration/comment` · include `:platform:features:collaboration:comment` · e2e déjà `e2e/commentaire/` | AC-1, AC-2, AC-3, AC-5 |
| suite `commentaire-*` | inchangée (tenant A / deux tenants / auteur / retirer / répondre / frontière produit — CH-00) | AC-4 |

`POL-TENANT-ISOLATION` · `POL-PAS-METIER-PRODUIT` — inchangées (pas de patch SPEC).

## Hors périmètre

Renommer les packages · aligner le dossier `ma/nafura/comment/` sur le FQCN · refondre l'intérieur `api/domain/…` · toucher au comportement · organism anatomy `lib/anatomy/…/comment-thread` · autres BC (seul un `project(':platform:…')` qui nomme l'ancien include suit AC-1)
