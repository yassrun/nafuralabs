---

id: PLT-12
status: done-me
context: nafura
type: tech
priority: P1
assignee: agent
gate: none
sprint: 2026-W33
blocked_by: [PLT-11]
---

# Un seul endroit pour les secrets

> La forme est décrite à deux endroits — `secrets/README.md` et `docs/VAULT_SECRETS.md`. Deux documents sur le même sujet divergent.

## Étapes

- [x] Créer `nafura-platform/ops/secrets/`
- [x] Fusionner les deux README en **un seul** — la forme, jamais les valeurs
- [x] Déplacer `nafura.secrets` et `dev-staging-local.env` (non suivis)
- [x] `nlops.sh bootstrap-env` lit le nouveau chemin
- [x] Supprimer `secrets/` et `docs/VAULT_SECRETS.md`

## Preuve de fin

`bootstrap-env` seed Vault depuis le nouvel emplacement. Un seul document décrit la forme.

## Journal

```
13/08 23:22  tsk1  nafura-platform/ops/secrets/ créé (README + fichiers locaux).
13/08 23:22  tsk2  Fusion secrets/README.md + docs/VAULT_SECRETS.md → ops/secrets/README.md (forme / template, aucune valeur extraite des fichiers locaux).
13/08 23:22  tsk3  mv nafura.secrets + dev-staging-local.env (toujours gitignored).
13/08 23:22  tsk4  nlops.sh SECRETS_FILE défaut → $ROOT/nafura-platform/ops/secrets/nafura.secrets. Fichier résolu depuis toolchain/ops.
13/08 23:22  décision  bootstrap-env non exécuté (cluster). Preuve = défaut + fichier présent. vault-seed-from-local.sh garde son défaut — hors étapes → inbox.
13/08 23:23  tsk5  git rm secrets/README.md + docs/VAULT_SECRETS.md ; dossier secrets/ supprimé.

Livré : un README · SECRETS_FILE nouveau chemin · secrets/ et VAULT_SECRETS.md absents
```
