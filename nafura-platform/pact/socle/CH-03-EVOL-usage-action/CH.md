# CH-03-EVOL — action mesurer

**Type :** `EVOL`
**Cible :** socle `nafura-platform`
**Qualification :** documents publie un usage ; la matrice n'a pas l'action.

## Pourquoi

Une action sans ID au socle n'existe pas. Mesurer n'est pas lire un fichier.

## Aujourd'hui

`P-DOCUMENT-JOINDRE` · `P-DOCUMENT-LIRE` · `P-DOCUMENT-RETIRER`. Pas de mesurer.

## Attendu

La matrice indexe `P-DOCUMENT-MESURER` sur le BC `documents`.

## Critères d'acceptation (gelés)

- **AC-1** La matrice indexe `P-DOCUMENT-MESURER` sur `documents`.

## Preuves attendues

Revue du `SPEC.md` socle.

## Hors périmètre

Le chiffre lui-même → `documents/CH-03-EVOL-usage-tenant`.
