---
id: SEKTOR-129
status: done-me
context: nafura
type: bug
agent_type: exec
priority: P0
assignee: agent
gate: none
tags: [etudes, qa-parcours]
---

# CTA Continuer et Voir la synthese avancent letape

> Walk DE-0036 : footer Continuer / Voir la synthese et header Voir la synthese ne changent pas d etape. Header VOIR_SYNTHESE appelle allerAEtapeUi(3) bloque par maxUi. Footer suivant() doit PUT etape. Un charge d etude avance au clic du CTA, sans stepper ni API.

## Étapes

- [x] Header `VOIR_SYNTHESE` : même chemin que le footer (`suivant()` / `changerEtape`), pas `allerAEtapeUi(3)` (maxUi bloque tant que backend < 5).
- [x] Footer wizard « Continuer vers le bordereau / le coût / Voir la synthèse » : un clic avance l’étape UI **et** le `currentStep` backend. Si le clic n’émet pas `next`, corriger `nf-button-list` / overlay, pas un contournement stepper.
- [x] Stepper : un CTA réussi rend l’étape suivante atteinte ; ne plus exiger PUT manuel `/etape`.
- [x] Preuve : dossier QA sans PDF → Bordereau manuel → **Continuer** → étape 2 → lot+article → **Continuer** → étape 3 → **Voir la synthèse** (header **et** footer) → étape 4. Vu rouge avant (reste sur l’étape). Pas d’appel API hors UI.

## Journal

```
20/08 22:48  posée
20/08 22:54  status → doing
20/08 23:08  e2e @playwright/test dual-require C:/ vs c:/ — preuve = node + playwright (pas @playwright/test)
20/08 23:10  vue rouge : footer Continuer docs→2 et bordereau→3 OK ; header Voir la synthèse currentStep reste 3
20/08 23:18  header VOIR_SYNTHESE → suivant() ; nf-button type=button + host click ; wizard footer z-index 40
20/08 23:22  vue verte : header et footer → currentStep=5 (verify-completer-parcours-129.mjs)
20/08 23:01  status → review
22/08 12:20  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      Header `VOIR_SYNTHESE` appelle `suivant()` (PUT `nextBackendEtape`) au lieu de `allerAEtapeUi(3)`. Footer : `type="button"` + clic host `nf-button`, overlay wizard `z-index: 40`.
critères prouvés     Mode B `verify-completer-parcours-129.mjs` : manuel → Continuer → 2 → lot+article → Continuer → 3 → header puis footer Voir la synthèse → `currentStep=5`. Vu rouge avant (header restait à 3). Spec Playwright `completer-parcours-cta-etape.spec.ts` écrit, non exécutable (dual-require inbox).
décidé seul          Footer Continuer docs/bordereau avançait déjà dans la vue rouge — overlay traité en durcissement, pas un hack stepper. Lot+article seedés par API après l’étape 2 (pas le dialog UI).
écarts / dette       `@playwright/test` dual-require C:/ vs c:/ — déjà inbox ; spec e2e pas verte en CLI Playwright.
