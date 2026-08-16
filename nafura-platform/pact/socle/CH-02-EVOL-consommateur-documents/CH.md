# CH-02-EVOL — consommateur documents

**Type :** `EVOL`
**Cible :** socle `nafura-platform`
**Qualification :** le BC `documents` tire tenant + erreurs ; la matrice n'avait que l'extraction.

## Pourquoi

Une capacité sans consommateur nommé juste est à jeter. Les IDs d'action du nouveau BC doivent vivre ici.

## Aujourd'hui

Consommateurs : `document-extraction` seulement. Pas de `P-DOCUMENT-*`.

## Attendu

`documents` consomme tenant et erreurs. Matrice : `P-DOCUMENT-JOINDRE` · `P-DOCUMENT-LIRE` · `P-DOCUMENT-RETIRER`.

## Critères d'acceptation (gelés)

- **AC-1** Les capacités tenant et erreurs nomment `documents` comme consommateur (en plus de `document-extraction`).
- **AC-2** La matrice indexe `P-DOCUMENT-JOINDRE`, `P-DOCUMENT-LIRE`, `P-DOCUMENT-RETIRER` sur le BC `documents`.

## Preuves attendues

Revue du `SPEC.md` socle contre le CADRE et la SPEC `documents`.
