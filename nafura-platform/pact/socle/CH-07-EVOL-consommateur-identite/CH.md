# CH-07-EVOL — consommateur identite

**Type :** `EVOL`
**Cible :** socle `nafura-platform`
**Qualification :** le BC `identite` tire tenant et erreurs ; la matrice ne l'indexe pas.

## Pourquoi

Une capacité sans consommateur nommé juste est à jeter. Les IDs d'action du nouveau BC vivent ici.

## Aujourd'hui

Le socle ne cite pas `identite`. Aucune permission `P-IDENTITE-*`.

## Attendu

`identite` consomme tenant et erreurs. Matrice : `P-IDENTITE-LIRE` · `P-IDENTITE-GERER` (allow `admin-tenant` ; deny `utilisateur`).

## Critères d'acceptation (gelés)

- **AC-1** Les capacités tenant et erreurs nomment `identite`.
- **AC-2** La matrice indexe `P-IDENTITE-LIRE` et `P-IDENTITE-GERER` sur `identite`.

## Politiques

`POL-TENANT-ISOLATION` · `POL-ERREUR-CODE` · `POL-PAS-METIER-PRODUIT`

## Preuves attendues

Revue du `SPEC.md` socle contre la SPEC `identite` (liens : consomme tenant courant, erreurs).

## Hors périmètre

Le comportement du BC lui-même → son `CH-00-INIT` · la SPEC `identite` (les IDs y sont déjà ; ce CH n'y touche pas)
