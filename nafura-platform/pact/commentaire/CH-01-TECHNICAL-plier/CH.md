# CH-01-TECHNICAL — plier l'arbre

**Type :** `TECHNICAL`
**Cible :** BC `commentaire`
**Qualification :** le contrat est posé ; le code de **ce** BC vit encore sous `features/collaboration/comment`. Aucune règle ne change.

## Pourquoi

Un contexte Pact a un arbre (`ARCHI_BLUEPRINT`). Tant que le code de ce BC porte le nom de son ancien paquet, le prochain Change travaille dans le mauvais dossier.

## Aujourd'hui

Backend `sources/backend/features/collaboration/comment/`. Web et e2e à relever au spec.

## Attendu

Le module Gradle et le web de **ce** BC vivent sous `commentaire`. Les packages Java, les routes HTTP et les noms de scénarios **ne bougent pas**.

## Critères d'acceptation (gelés)

- **AC-1** Le module Gradle de ce BC est `sources/backend/commentaire/`, inclus `:platform:commentaire`.
- **AC-2** Le web de ce BC est sous `sources/web/app/commentaire/`.
- **AC-3** Les e2e restent sous `e2e/commentaire/` et leurs noms sont inchangés.
- **AC-4** La suite e2e existante reste verte.
- **AC-5** Les FQCN Java et les routes HTTP ne changent pas.

## Preuves attendues

| Scénario | État initial | AC |
|----------|--------------|----|
| `commentaire-plier-arbre` | sources actuelles | AC-1, AC-2, AC-3, AC-5 |
| suite `commentaire-*` | inchangée | AC-4 |

Aucun patch SPEC : un TECHNICAL ne change pas les règles.

## Hors périmètre

Renommer les packages · refondre l'intérieur `api/domain/…` · toucher au comportement
