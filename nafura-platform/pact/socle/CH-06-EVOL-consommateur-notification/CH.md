# CH-06-EVOL — consommateur notification

**Type :** `EVOL`
**Cible :** socle `nafura-platform`
**Qualification :** le BC `notification` tire tenant et erreurs ; la matrice ne l'indexe pas.

## Pourquoi

Une capacité sans consommateur nommé juste est à jeter. Les IDs d'action du nouveau BC vivent ici.

## Aujourd'hui

Le socle ne cite pas `notification`. Aucune permission `P-NOTIFICATION-*`.

## Attendu

`notification` consomme tenant et erreurs. Matrice : `P-NOTIFICATION-LIRE` · `P-NOTIFICATION-ENVOYER`.

## Critères d'acceptation (gelés)

- **AC-1** Les capacités tenant et erreurs nomment `notification`.
- **AC-2** La matrice indexe `P-NOTIFICATION-LIRE` et `P-NOTIFICATION-ENVOYER` sur `notification`.

## Preuves attendues

Revue du `SPEC.md` socle.

## Hors périmètre

Le comportement du BC lui-même → son `CH-00-INIT`
