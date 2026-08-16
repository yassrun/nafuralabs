# CH-09-EVOL — consommateur conversation

**Type :** `EVOL`
**Cible :** socle `nafura-platform`
**Qualification :** le BC `conversation` tire tenant et erreurs ; la matrice ne l'indexe pas.

## Pourquoi

Une capacité sans consommateur nommé juste est à jeter. Les IDs d'action du nouveau BC vivent ici.

## Aujourd'hui

Le socle ne cite pas `conversation`. Aucune permission `P-CONVERSATION-*`.

## Attendu

`conversation` consomme tenant et erreurs. Matrice : `P-CONVERSATION-LIRE` · `P-CONVERSATION-ECRIRE`.

## Critères d'acceptation (gelés)

- **AC-1** Les capacités tenant et erreurs nomment `conversation`.
- **AC-2** La matrice indexe `P-CONVERSATION-LIRE` et `P-CONVERSATION-ECRIRE` sur `conversation`.

## Preuves attendues

Revue du `SPEC.md` socle.

## Hors périmètre

Le comportement du BC lui-même → son `CH-00-INIT`
