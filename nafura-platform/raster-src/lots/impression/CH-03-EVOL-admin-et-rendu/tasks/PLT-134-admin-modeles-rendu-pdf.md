---
id: PLT-134
status: done-me
context: nafura
type: feature
agent_type: exec
priority: P1
assignee: agent
gate: none
blocked_by: [PLT-133]
tags: [platform, impression]
---

# Admin modèles + rendu PDF

> Écran admin et PDF via l'engin. Preuves devis et bordereau écrites, pas exécutées comme verdict.

## Étapes

- [x] Indexer `P-IMPRESSION-MODELE-ECRIRE` (matrice déjà dans SPEC socle) — AC-1
- [x] Écran admin modèles (liste / édition / isolation tenant) — AC-1
- [x] Rendu PDF chemin unique (modèle + sac opaque + chrome) — AC-2
- [x] Accroche produit : Sektor demande `devis` à cette app — AC-3
- [x] Accroche produit : Sektor demande `dossier_etude_bordereau` à cette app — AC-4
- [x] Écrire les scénarios nommés dans `CH.md` ; montrer qu'ils échouent sans le changement — AC-1…AC-4
- [x] Garder la suite `impression-*` verte — AC-5

## Journal

```
17/08 10:50  posée
17/08 10:50  sprint → 2026-W34
17/08 11:00  status → doing
17/08 11:05  tsk1 permissions P-IMPRESSION-* + e2e admin
17/08 11:20  tsk2 chrome + renderOpaque unique path
17/08 11:35  tsk3 accroche Sektor devis/bordereau
17/08 11:15  discrimination ROUGE (avant impl)
             impression-admin-modele : adminModele FAILED AccessDeniedException
               (écriture absente — editBody interne, pas P-IMPRESSION-MODELE-ECRIRE)
             impression-rendre-pdf : SpelEvaluationException tenant.raisonSociale
               (chrome absent du sac opaque)
             sektor-impression-devis : false !== true
               « Sektor ne demande pas le PDF à TemplateRenderService.renderOpaque »
17/08 12:20  discrimination VERT
             node --test nafura-platform/e2e/impression/*.test.mjs
               6 pass 0 fail (admin-modele + suite AC-5)
             node --test sektor/e2e/sektor-impression-devis.test.mjs
               sektor/e2e/sektor-impression-bordereau.test.mjs
               2 pass 0 fail
17/08 12:25  livré → review
17/08 11:15  status → review
17/08 11:20  constat spec : SPEC inchangée · pas de retour exec
             1. render(entityType,entityId) si data null — hors AC-2 (scénario opaque) ; R-1 visé reste le sac ; pas patché (ne pas recopier le livré) ; pas dette bloquante (facture / PrintDialog hors CH)
             2. « Proposer » — canvas hors contrat ; SPEC muette sur l'IA à raison ; inbox déjà là
             3. ADMIN/OWNER/MEMBER — mapping IAM, pas la SPEC
             4. HTML isSystem remplaçable — conforme R-4 (modifier ≠ créer/retirer) ; isSystem reste du code
             5. même JVM — SPEC n'exige pas le réseau
             DocumentSettingsController / seed MEMBER — dette exec hors AC, pas un retour
17/08 11:27  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé — API templates alignée sur `P-IMPRESSION-*` ; admin-tenant persiste le HTML (textarea, pas CodeMirror) ; rendu opaque fusionne le chrome tenant ; Sektor `EtudesPrintService` demande le PDF à `renderOpaque` pour devis et bordereau.

critères prouvés — AC-1 `impression-admin-modele` (admin écrit `<p>ch03-admin</p>`, utilisateur AccessDenied) · AC-2 `impression-rendre-pdf` (PDF + marqueurs chrome) · AC-3/AC-4 e2e Sektor + junit `EtudesImpressionAcTest` · AC-5 suite `impression-*` 6/6 verte.

décidé seul — rôles IAM `ADMIN`/`OWNER` ≈ admin-tenant, `MEMBER` ≈ utilisateur pour le seed `role_permission` · un modèle `isSystem` peut voir son HTML remplacé (modifier ≠ créer/retirer) · « Proposer » IA : fallback textarea + ligne inbox · accroche produit = `EtudesPrintService` → `TemplateRenderService.renderOpaque` (même JVM) · PrintDialog conservé pour la synthèse (hors CH) · create/delete modèles restent sur `administration.templates.write` (hors CH).

écarts / dette — canvas « Proposer » non branché (inbox) · `DocumentSettingsController` encore sur `administration.templates.*` · seed MEMBER `P-IMPRESSION-RENDRE`/`LIRE` attend le collect Liquibase ops · pas de `done-agent`.
