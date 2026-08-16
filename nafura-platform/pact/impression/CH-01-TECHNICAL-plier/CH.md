# CH-01-TECHNICAL — plier l'arbre

**Type :** `TECHNICAL`
**Cible :** BC `impression`
**Qualification :** le contrat est posé ; le code de **ce** BC vit encore sous `features/collaboration/doc-manager`. Aucune règle ne change.

## Pourquoi

Un contexte Pact a un arbre (`ARCHI_BLUEPRINT`). Tant que produire une page s'appelle encore `doc-manager`, le prochain Change travaille dans le mauvais dossier.

## Aujourd'hui

Backend `sources/backend/features/collaboration/doc-manager/` (rendu + modèles). Web print `sources/web/features/administration/templates/`. e2e déjà `e2e/impression/`.

## Attendu

Le module Gradle et le web de **ce** BC vivent sous `impression`. Les packages Java, les routes HTTP des modèles / du rendu et les noms de scénarios `impression-*` **ne bougent pas**.

## Critères d'acceptation (gelés)

- **AC-1** Le module Gradle de ce BC est `sources/backend/impression/`, inclus `:platform:impression`.
- **AC-2** Le web de ce BC est sous `sources/web/app/impression/`.
- **AC-3** Les e2e restent sous `e2e/impression/`. Les noms `test("impression-…")` sont inchangés.
- **AC-4** La suite e2e existante (`impression-*`) reste verte.
- **AC-5** Les FQCN Java et les routes `/api/v1/platform/templates` ne changent pas.

## Preuves attendues

| Scénario | État initial | AC |
|----------|--------------|----|
| `impression-plier-arbre` | sources actuelles | AC-1, AC-2, AC-3, AC-5 |
| suite `impression-*` | inchangée | AC-4 |

`POL-TENANT-ISOLATION` · `POL-PAS-METIER-PRODUIT` — inchangées (pas de patch SPEC).

## Hors périmètre

Renommer les packages · refondre l'intérieur `api/domain/…` · écran e-mail / workflow · artefact Maven `doc-manager` côté consommateurs déjà branchés
