---

id: PLT-11
status: done-me
context: nafura
type: tech
priority: P0
assignee: agent
gate: none
sprint: 2026-W33
---

# Sortir les secrets de l'index et fermer le .gitignore

> `.gitignore` listait déjà `deepseek_api_key.txt` — mais la règle est **inerte** sur un fichier déjà suivi. Et `creds.env` n'était couvert par aucun motif.

## Étapes

- [x] `git rm --cached creds.env deepseek_api_key.txt`
- [x] `.gitignore` en **deny-by-default** :

```gitignore
nafura-platform/ops/secrets/*
!nafura-platform/ops/secrets/README.md
creds.env
*.env
!*.env.example
*_api_key.txt
```

- [x] Vérifier qu'aucun fichier suivi ne matche plus ces motifs

## Preuve de fin

`git ls-files` ne remonte plus aucun fichier de credentials.

## Journal

```
13/08 23:20  tsk1  git rm --cached creds.env deepseek_api_key.txt — sortis de l'index, fichiers locaux conservés.
13/08 23:20  tsk2  .gitignore : motifs demandés ajoutés (*.env, creds.env, *_api_key.txt, nafura-platform/ops/secrets/* deny-by-default + README).
13/08 23:20  décision  Conservé les règles secrets/ legacy (.env / .env.* / nafura.secrets) — PLT-12 n'a pas encore déplacé le dossier.
13/08 23:21  tsk3  git ls-files : plus aucun *.env ni *_api_key.txt suivi. check-ignore : creds.env + deepseek_api_key.txt. Seul secrets/README.md reste suivi.

Livré : .gitignore deny-by-default · creds.env et deepseek_api_key.txt hors index
```
