# CH-06-EVOL — consommateur notification

**Type :** `EVOL`
**Cible :** socle `nafura-platform`
**Qualification :** le BC `notification` tire tenant et erreurs ; la matrice ne l'indexe pas.

## Pourquoi

Une capacité sans consommateur nommé juste est à jeter. Les IDs d'action du nouveau BC vivent ici.

## Aujourd'hui

Le socle ne cite pas `notification`. Aucune permission `P-NOTIFICATION-*`.

## Attendu

`notification` consomme tenant et erreurs. Matrice : `P-NOTIFICATION-LIRE` · `P-NOTIFICATION-MARQUER` · `P-NOTIFICATION-DEPOSER` (allow `admin-tenant`, `utilisateur` ; deny aucune).

## Critères d'acceptation (gelés)

- **AC-1** Les capacités tenant et erreurs nomment `notification`.
- **AC-2** La matrice indexe `P-NOTIFICATION-LIRE`, `P-NOTIFICATION-MARQUER` et `P-NOTIFICATION-DEPOSER` sur `notification`.

## Politiques

`POL-TENANT-ISOLATION` · `POL-ERREUR-CODE` · `POL-PAS-METIER-PRODUIT`

## Preuves attendues

Revue du `SPEC.md` socle contre la SPEC `notification` (liens : consomme tenant courant, erreurs).

## Hors périmètre

Le comportement du BC lui-même → son `CH-00-INIT` · la SPEC `notification` (les IDs y sont déjà ; ce CH n'y touche pas)
