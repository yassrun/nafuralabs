# CH-05-EVOL — consommateur commentaire

**Type :** `EVOL`
**Cible :** socle `nafura-platform`
**Qualification :** le BC `commentaire` tire tenant et erreurs ; la matrice ne l'indexe pas.

## Pourquoi

Une capacité sans consommateur nommé juste est à jeter. Les IDs d'action du nouveau BC vivent ici.

## Aujourd'hui

Le socle ne cite pas `commentaire`. Aucune permission `P-COMMENTAIRE-*`.

## Attendu

`commentaire` consomme tenant et erreurs. Matrice : `P-COMMENTAIRE-LIRE` · `P-COMMENTAIRE-ECRIRE`.

## Critères d'acceptation (gelés)

- **AC-1** Les capacités tenant et erreurs nomment `commentaire`.
- **AC-2** La matrice indexe `P-COMMENTAIRE-LIRE` et `P-COMMENTAIRE-ECRIRE` sur `commentaire`.

## Preuves attendues

Revue du `SPEC.md` socle.

## Hors périmètre

Le comportement du BC lui-même → son `CH-00-INIT`
