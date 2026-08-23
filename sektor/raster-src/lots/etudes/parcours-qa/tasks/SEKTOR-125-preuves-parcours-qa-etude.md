---
id: SEKTOR-125
status: done-me
context: nafura
type: qa
agent_type: qa
priority: P0
assignee: agent
gate: none
blocked_by: [SEKTOR-115, SEKTOR-119, SEKTOR-120, SEKTOR-121, SEKTOR-122, SEKTOR-123]
tags: [etudes, qa-parcours]
---

# Preuves parcours QA etude

> Rejouer le parcours QA user : creer etude, etape 1 sans PDF via Manuel, Cout drawer clic, panneau consultation, anomalies, Partager.

Ne pas réécrire les e2e. Rejouer les preuves des 115/119–123. User QA `qa@nafuralabs.local`.

## Étapes

- [x] Dossier créé, CTA enabled à la saisie (122).
- [x] Étape 1 sans PDF → bordereau manuel → étape 2 (115).
- [x] Étape 3 : clic article ouvre drawer (121) ; panneau consultation dans le DOM (119) ; header anomalies = étape 3 (120).
- [x] Partager : enabled selon 123, ou dette journalisée.
- [x] Rapport de livraison. `done-agent` sur 115/119–123 + cette task si PASS.

## Journal

```
20/08 21:12  posée
20/08 21:36  status → doing
20/08 21:40  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      Chrome dossier étude (création, voie manuelle, Coût) rejoué Mode B `qa@nafuralabs.local` @ `127.0.0.1:4200`. Playwright `parcours-qa-*.spec.ts` crash module — non réécrit.
critères prouvés     122 fill natif objet+MOA → CTA enabled → `/etudes/dossiers/ffcc2395-…` (DE-0029). 115 DE-0027 sans PDF → Bordereau manuel → Continuer → étape 2 « Arbre du bordereau » + « Ajouter un lot ». 119 `app-consultation-etude-panel` h=191px, CTA Ouvrir + paquet.enabled. 120 « Anomalies étape 3 » (pas 2) → dialog « Détail des erreurs (2) ». 121 clic simple Beton QA → `.poste-drawer` visible (cursor:pointer, title « clic pour ouvrir »). 123 Partager enabled → dialog « Partager le dossier ».
décidé seul          Preuves = Mode B (browser+curl) après crash Playwright « Requiring @playwright/test second time » (C:/ vs c:/). Pas de réécriture e2e. Verdict PASS sur les 6 sœurs.
écarts / dette       e2e Playwright inexécutable en local — ligne inbox. Discrimination rouge-avant = journal exec, non rejouée (QA n’a pas le diff).
