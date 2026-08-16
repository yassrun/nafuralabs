# CH-08-TECHNICAL — plier l'arbre

**Type :** `TECHNICAL`
**Cible :** BC `documents`
**Qualification :** le contrat est posé ; le code de **ce** BC vit encore sous `features/collaboration/doc-manager`. Aucune règle ne change.

## Pourquoi

Un contexte Pact a un arbre (`ARCHI_BLUEPRINT`). Tant que conserver un fichier s'appelle encore `doc-manager` dans `features/`, le prochain Change travaille dans le mauvais dossier.

## Aujourd'hui

Backend `sources/backend/features/collaboration/doc-manager/` (pièces + tenus **et** le rendu impression). Web `sources/web/features/collaboration/doc-manager/`. e2e déjà `e2e/documents/`.

## Attendu

Le module Gradle et le web de **ce** BC vivent sous `documents`. Les packages Java, les routes HTTP des pièces / tenus et les noms de scénarios `documents-*` **ne bougent pas**.

## Critères d'acceptation (gelés)

- **AC-1** Le module Gradle de ce BC est `sources/backend/documents/`, inclus `:platform:documents`.
- **AC-2** Le web de ce BC est sous `sources/web/app/documents/`.
- **AC-3** Les e2e restent sous `e2e/documents/`. Les noms `test("documents-…")` sont inchangés.
- **AC-4** La suite e2e existante (`documents-*`) reste verte.
- **AC-5** Les FQCN Java et les routes `/api/v1/platform/collaboration/attachments` ne changent pas.

## Preuves attendues

| Scénario | État initial | AC |
|----------|--------------|----|
| `documents-plier-arbre` | sources actuelles | AC-1, AC-2, AC-3, AC-5 |
| suite `documents-*` | inchangée | AC-4 |

`POL-TENANT-ISOLATION` · `POL-PAS-METIER-PRODUIT` — inchangées (pas de patch SPEC).

## Hors périmètre

Impression (reste dans le jar jusqu'à **son** plier) · renommer les packages · refondre l'intérieur `api/domain/…` · artefact Maven `doc-manager` côté consommateurs print
