# CH-01-EVOL — ids d'action

**Type :** `EVOL`
**Cible :** BC `document-extraction`
**Qualification :** le socle remplace `P-LECTURE-*` ; le BC doit suivre.

## Pourquoi

R-4 pointait des IDs qui n'existent plus.

## Aujourd'hui

`P-LECTURE-LANCER` · `P-LECTURE-REVOIR`. Dossier Pact `lecture/`.

## Attendu

Le contexte s'appelle `document-extraction`. R-4 exige `P-EXTRACTION-LANCER` et `P-EXTRACTION-REVOIR`. Même comportement.

## Critères d'acceptation (gelés)

- **AC-1** La SPEC ne mentionne plus `P-LECTURE-*`.
- **AC-2** Le dossier Pact du contexte est `document-extraction/`, plus `lecture/`.

## Preuves attendues

Revue de `SPEC.md`. Les e2e INIT (`lecture-*`) restent verts — même comportement.
