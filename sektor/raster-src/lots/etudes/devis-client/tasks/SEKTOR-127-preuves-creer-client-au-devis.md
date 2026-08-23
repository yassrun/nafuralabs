---
id: SEKTOR-127
status: done-me
context: nafura
type: qa
agent_type: qa
priority: P0
assignee: agent
gate: none
blocked_by: [SEKTOR-117]
tags: [etudes, devis]
---

# Preuves creer client au devis

> Generer le devis propose de creer le client Partner puis produit un devis.

Ne pas réécrire l’e2e. Rejouer la preuve 117. User QA.

## Étapes

- [x] Dossier validé sans client → Générer le devis → créer Partner → devis créé.
- [x] Annuler = pas de devis.
- [x] Rapport. `done-agent` sur 117 + cette task si PASS.

## Journal

```
20/08 21:12  posée
20/08 21:49  status → doing
20/08 21:51  PASS — verify-devis-client-117.mjs + Mode B UI (Playwright dual-require)
20/08 21:51  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      Header dossier VALIDEE : dialog « Créer le client Partner » (MOA préremplie) puis Partner CLIENT + devis. Pas d’écran Ventes.
critères prouvés     (1) sans Partner → dialog créer + MOA, puis Partner + devis — Mode B DE-0035 + `verify-devis-client-117.mjs`. (2) Annuler = VALIDEE / clientId null / devisGenereId null / bandeau conservé. (3) Confirmer = Partner `CLI-CAD22CCA` « MOA QA 117 Tanger » + `DEVIS_GENERE` / `DV-2026-0004` / URL reste `/etudes/dossiers/…`.
décidé seul          Playwright dual-require (inbox) : spec non réécrite ; Annuler/dialog prouvés Mode B `qa@nafuralabs.local` `127.0.0.1:4200`.
écarts / dette       Spec Playwright `devis-client-creer-partner.spec.ts` non exécutable (C:/ vs c:/). Partner orphelin si create OK et génération KO (dette exec).

### Commandes + sortie

```
$ node sektor/e2e/scripts/verify-devis-client-117.mjs
ok sans Partner → client_manquant (garde / vu rouge)
ok Partner + clientId → devis 524de721-0dea-4223-9e63-1d974e4aed59
exit 0

$ cd sektor/sources/web && npx playwright test devis-client-creer-partner --project=chromium-desktop
Error: Requiring @playwright/test second time
First: …/sektor/sources/web/playwright.config.ts (c:\…)
Second: …/sektor/e2e/devis-client-creer-partner.spec.ts (C:\…)
Error: No tests found.
exit 1  — déjà inbox ; non réécrit.

Mode B UI dossier e6d4c432-ecb5-4bed-bd07-f194ae5c9581 (qa@nafuralabs.local)
  CTA « Générer le devis » → heading « Créer le client Partner » · input = « MOA QA 117 Tanger »
  Annuler → GET dossier : status VALIDEE, clientId null, devisGenereId null · bandeau « Client à lier au devis »
  « Créer et générer » → GET dossier : status DEVIS_GENERE, clientId 656c1ce8-…, devisGenereId f74df792-…
  GET partner : code CLI-CAD22CCA, raisonSociale « MOA QA 117 Tanger »
  URL inchangée /etudes/dossiers/… — pas Ventes. UI « Devis généré · Devis DV-2026-0004 »
```
