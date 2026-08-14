---

id: PLT-13
status: done-me
context: nafura
type: tech
priority: P1
assignee: agent
gate: none
sprint: 2026-W33
blocked_by: [PLT-11]
---

# Check : aucun secret dans un fichier suivi

> Fait passer « pas de secrets commités » du niveau *interdit dans CLAUDE.md* au niveau **check** — le seul qui aurait attrapé `creds.env` il y a trois mois.

## Étapes

- [x] Règle dans `raster/check.mjs` : aucun fichier **suivi** ne matche `*.env` · `*_api_key.txt` · `creds*` · `*.pem` · `*.p12` · `*.jks`
- [x] Exception unique : `nafura-platform/ops/secrets/README.md`
- [x] Test dans `raster/e2e/`

## Preuve de fin

`t.mjs check` sort en 1 si on recommite un secret. Un test le prouve.

## Journal

```
13/08 23:25  tsk1  isTrackedSecret + checkTrackedSecrets sur git ls-files. Exception README.
13/08 23:25  tsk2  raster/e2e/check-secrets.test.mjs — creds.env / *_api_key.txt / pem/p12/jks → erreur ; README et sources OK ; index git courant propre.
13/08 23:26  tsk3  node --test e2e 14/14 · t.mjs check 0 erreur.

Livré : raster/check.mjs + raster/e2e/check-secrets.test.mjs
```
