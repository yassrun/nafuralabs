---
id: SEKTOR-131
status: done-me
context: nafura
type: qa
agent_type: qa
priority: P0
assignee: agent
gate: none
blocked_by: [SEKTOR-129, SEKTOR-130]
tags: [etudes, qa-parcours]
---

# Preuves completer parcours etude

> Walk Mode B : creer etude, Bordereau manuel, lot+article, Extraire, CTA Continuer/Voir la synthese sans API, PU visible sans reload, soumettre, Valider N+1, Generer devis.

## Étapes

- [x] Relire SEKTOR-129 et SEKTOR-130 (étapes + journaux). Ne pas recoder.
- [x] Walk Mode B (`qa@nafuralabs.local`) : créer → Bordereau manuel → **CTA Continuer** (pas stepper, pas curl `/etape`) jusqu’à la synthèse.
- [x] Étape Coût : Extraire → fermer tiroir → PU visible **sans** reload.
- [x] Soumettre → Valider N+1 → Générer le devis (créer Partner).
- [x] PASS → `done-agent` sur 129, 130 et cette task. FAIL → inbox, pas de patch.

## Journal

```
20/08 22:48  posée
20/08 23:02  status → doing
22/08 12:07  reprise 22/08 — QA interrompu le 20/08, on continue (ne pas recréer)
22/08 12:20  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      rien produit. Relance Mode B (8082 hung + 4200 down) : PF Postgres + bootRun + `start:erp:cursor`. Preuves jouées, pas de patch.
critères prouvés     129 → `node ../../e2e/scripts/verify-completer-parcours-129.mjs` exit 0 (Continuer 2 puis 3 ; header+footer Voir la synthèse → currentStep=5). 130 → `verify-completer-parcours-130.mjs` exit 0 (arbre PU 1 083,75 + total 13 005 + header TOTAL HT sans F5). Walk DE-0050 : créer UI → Bordereau manuel → footer Continuer (currentStep=2) → lot « Gros œuvre » + article « Béton armé C25/30 » accents OK → footer Continuer (étape 3) → Extraire (0 composant) + 1 composant Ciment CPJ persisté → fermer tiroir sans F5 → PU 1.083,75 / TOTAL HT 13.005 → header puis footer Voir la synthèse (étape 4) → Soumettre → Valider N+1 → Créer Partner + devis DV-2026-0006. Pas de stepper, pas de PUT `/etape`.
décidé seul          Extraire IA 0 composant → persist manuel dans le tiroir (critère = 1 composant persisté, pas l’IA). Services locaux relancés une fois (Java figé, 4200 down) — pas une boucle.
écarts / dette       `npx playwright test` dual-require C:/ vs c:/ — déjà inbox, pas un fail de ce sous-lot. Specs e2e pas vertes en CLI Playwright.
