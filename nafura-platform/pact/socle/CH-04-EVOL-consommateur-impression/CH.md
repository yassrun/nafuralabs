# CH-04-EVOL — consommateur impression

**Type :** `EVOL`
**Cible :** socle `nafura-platform`
**Qualification :** le BC `impression` tire tenant + erreurs ; la matrice ne l'indexe pas.

## Pourquoi

Une capacité sans consommateur nommé juste est à jeter. Les IDs d'action du nouveau BC vivent ici.

## Aujourd'hui

Consommateurs : `document-extraction`, `documents`. Pas de `P-IMPRESSION-*`.

## Attendu

`impression` consomme tenant et erreurs. Matrice : `P-IMPRESSION-RENDRE` · `P-IMPRESSION-MODELE-LIRE`.

## Critères d'acceptation (gelés)

- **AC-1** Les capacités tenant et erreurs nomment `impression`.
- **AC-2** La matrice indexe `P-IMPRESSION-RENDRE` et `P-IMPRESSION-MODELE-LIRE` sur `impression`.

## Preuves attendues

Revue du `SPEC.md` socle.

## Hors périmètre

Le rendu lui-même → `impression/CH-00-INIT-impression` · écrire un modèle
