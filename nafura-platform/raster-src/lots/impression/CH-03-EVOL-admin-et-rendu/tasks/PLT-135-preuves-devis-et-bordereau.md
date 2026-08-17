---
id: PLT-135
status: done-me
context: nafura
type: qa
agent_type: qa
priority: P1
assignee: agent
gate: none
blocked_by: [PLT-134]
tags: [platform, impression]
sprint: 2026-W34
---

# Preuves — devis et bordereau

> Exécuter AC gelés : admin, PDF, devis, bordereau, suite impression-*.

## Étapes

- [x] Exécuter `impression-admin-modele` (AC-1)
- [x] Exécuter `impression-rendre-pdf` (AC-2)
- [x] Exécuter `sektor-impression-devis` (AC-3)
- [x] Exécuter `sektor-impression-bordereau` (AC-4)
- [x] Exécuter la suite `impression-*` (AC-5)
- [x] Vérifier la discrimination au journal PLT-134

## Journal

```
17/08 10:50  posée
17/08 10:50  sprint → 2026-W34
17/08 11:18  status → doing
17/08 11:28  preuves worktree — Gradle --rerun-tasks --no-build-cache
             impression JUnit 4/4 0 fail (timestamp 10:23:30Z)
             etudes JUnit 2/2 0 fail (timestamp 10:26:37Z)
             node --test impression/*.test.mjs → 6 pass 0 fail
             node --test sektor-impression-devis + bordereau → 2 pass 0 fail
             discrimination journal PLT-134 : AC-1/2/3 vus rouge ; AC-4 même assertion renderOpaque
17/08 11:27  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé — rien (QA). Preuves relancées dans le worktree CH-03, pas le cache XML de l'exec.

critères prouvés
- AC-1 → `node --test nafura-platform/e2e/impression/*.test.mjs` · `ok impression-admin-modele` · JUnit `adminModele()` 0 fail (BUILD SUCCESSFUL 45s, `--rerun-tasks --no-build-cache`)
- AC-2 → même commande · `ok impression-rendre-pdf` · JUnit `rendrePdf()` 0 fail
- AC-3 → `node --test sektor/e2e/sektor-impression-devis.test.mjs …` · `ok sektor-impression-devis` · JUnit `impressionDevis()` 0 fail · scan jar sans type `devis`
- AC-4 → même commande · `ok sektor-impression-bordereau` · JUnit `impressionBordereau()` 0 fail · scan jar sans type `bordereau` / `dossier_etude_bordereau`
- AC-5 → suite `impression-*` 6 pass 0 fail (`admin-modele`, `deux-tenants`, `frontiere-produit`, `plier-arbre`, `rendre-pdf`, `type-opaque`)

décidé seul — cache JUnit de l'exec ignoré (XML UP-TO-DATE) : rerun Gradle forcé. Mode B non lancé : chaque AC a une e2e. Discrimination AC-4 : le journal PLT-134 nomme `sektor-impression-devis` rouge (`renderOpaque` absent) ; `sektor-impression-bordereau` porte la même assertion sur le même fichier — pas un trou (le test n'aurait pas passé). Pas un fail.

écarts / dette — canvas « Proposer » non branché (inbox exec) · `DocumentSettingsController` encore `administration.templates.*` · seed MEMBER Liquibase ops. Hors AC gelés. Journal exec n'a pas nommé le fichier bordereau en rouge (dette de trace, pas de preuve).
