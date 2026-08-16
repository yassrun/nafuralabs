# CH-07-EVOL — consommateur identite

**Type :** `EVOL`
**Cible :** socle `nafura-platform`
**Qualification :** le BC `identite` tire tenant et erreurs ; la matrice ne l'indexe pas.

## Pourquoi

Une capacité sans consommateur nommé juste est à jeter. Les IDs d'action du nouveau BC vivent ici.

## Aujourd'hui

Le socle ne cite pas `identite`. Aucune permission `P-IDENTITE-*`.

## Attendu

`identite` consomme tenant et erreurs. Matrice : `P-IDENTITE-LIRE` · `P-IDENTITE-GERER`.

## Critères d'acceptation (gelés)

- **AC-1** Les capacités tenant et erreurs nomment `identite`.
- **AC-2** La matrice indexe `P-IDENTITE-LIRE` et `P-IDENTITE-GERER` sur `identite`.

## Preuves attendues

Revue du `SPEC.md` socle.

## Hors périmètre

Le comportement du BC lui-même → son `CH-00-INIT`
