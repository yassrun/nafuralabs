# CH-08-EVOL — consommateur approbation

**Type :** `EVOL`
**Cible :** socle `nafura-platform`
**Qualification :** le BC `approbation` tire tenant et erreurs ; la matrice ne l'indexe pas.

## Pourquoi

Une capacité sans consommateur nommé juste est à jeter. Les IDs d'action du nouveau BC vivent ici.

## Aujourd'hui

Le socle ne cite pas `approbation`. Aucune permission `P-APPROBATION-*`.

## Attendu

`approbation` consomme tenant et erreurs. Matrice : `P-APPROBATION-LIRE` · `P-APPROBATION-DECIDER` (allow `admin-tenant`, `utilisateur` ; deny aucune).

## Critères d'acceptation (gelés)

- **AC-1** Les capacités tenant et erreurs nomment `approbation`.
- **AC-2** La matrice indexe `P-APPROBATION-LIRE` et `P-APPROBATION-DECIDER` sur `approbation`.

## Politiques

`POL-TENANT-ISOLATION` · `POL-ERREUR-CODE` · `POL-PAS-METIER-PRODUIT`

## Preuves attendues

Revue du `SPEC.md` socle contre la SPEC `approbation` (liens : consomme tenant courant, erreurs).

## Hors périmètre

Le comportement du BC lui-même → son `CH-00-INIT` · la SPEC `approbation` (les IDs y sont déjà ; ce CH n'y touche pas)
