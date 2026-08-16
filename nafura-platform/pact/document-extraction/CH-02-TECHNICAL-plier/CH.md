# CH-02-TECHNICAL — plier l'arbre

**Type :** `TECHNICAL`
**Cible :** BC `document-extraction`
**Qualification :** le contrat est posé ; le code vit encore sous `features/documents/doc-extractor`. Aucune règle ne change.

## Pourquoi

Un contexte Pact a un arbre (`ARCHI_BLUEPRINT`). Tant que le code s'appelle encore `doc-extractor` dans `features/`, le prochain Change travaille dans le mauvais dossier.

## Aujourd'hui

Backend `sources/backend/features/documents/doc-extractor/`. Web `sources/web/features/documents/{doc-extractor,smart-import}/`. e2e `e2e/lecture/`.

## Attendu

Le module Gradle et le web de ce BC vivent sous `document-extraction`. Les packages Java, les routes HTTP `/doc-extractor`, l'artefact Maven `doc-extractor` et les noms de scénarios `lecture-*` **ne bougent pas**.

## Critères d'acceptation (gelés)

- **AC-1** Le module Gradle est `sources/backend/document-extraction/`, inclus `:platform:document-extraction`.
- **AC-2** Le web de ce BC est sous `sources/web/app/document-extraction/`.
- **AC-3** Les e2e sont sous `e2e/document-extraction/`. Les noms `test("lecture-…")` sont inchangés.
- **AC-4** La suite e2e existante (`lecture-*`) reste verte.
- **AC-5** L'artefact consommé reste `ma.nafuralabs:doc-extractor`. Les FQCN Java et les routes `/doc-extractor` ne changent pas.

## Preuves attendues

Suite existante :

| Scénario | État initial |
|----------|--------------|
| `lecture-heuristique-sans-modele` | xlsx grille + schéma titres connus |
| `lecture-cache-deux-tenants` | même empreinte, tenant A puis B |
| `lecture-frontiere-produit` | compile : zéro type métier produit |
| `lecture-carte-deux-natures` | un brouillon avec les deux natures |
| `lecture-sans-grille-vers-modele` | image / scan sans grille |

`POL-TENANT-ISOLATION` · `POL-PAS-METIER-PRODUIT` — inchangées (pas de patch SPEC).
