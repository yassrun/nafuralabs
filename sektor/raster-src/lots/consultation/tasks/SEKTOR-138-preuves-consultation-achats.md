---
id: SEKTOR-138
status: done-me
context: nafura
type: qa
agent_type: qa
priority: P1
assignee: agent
gate: none
blocked_by: [SEKTOR-134, SEKTOR-135, SEKTOR-136, SEKTOR-137]
tags: [consultation]
---

# Preuves consultation achats

> Rejouer liste Achats, popup arbre, import magique, flag CONSULTE. Ne pas reecrire les e2e.

## Étapes

- [x] Liste `/achats/consultations` : créer hors étude.
- [x] Étude Coût : arbre visible, popup crée / ajoute, pas de panneau page.
- [x] Import magique → lignes ; N devis → ciment CONSULTÉ, peinture non. Rapport. `done-agent` sur 134–137 + cette task si PASS.

## Journal

```
22/08 13:02  posée
22/08 13:55  status → doing
22/08 13:58  rejoué 134–137 : 4× exit 0, pas de SKIP ; Mode B liste + Coût overlay
22/08 13:57  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      Rien — QA n’a pas touché le produit. Rejoué les 4 scripts node + chrome Mode B (`127.0.0.1:4200`, `qa@nafuralabs.local`).
critères prouvés     1 liste hors étude / pas DA / pas menu Études → `verify-consultation-achat-134.mjs` exit 0 (`CS-2026-0010`, DA n’en crée pas) ; browser `/achats/consultations` sous Achats, `+ Consultation`, hors étude visibles. 2 Coût arbre + popup / pas panneau → `verify-consultation-achat-136.mjs` exit 0 (`CS-2026-0012` ciment 1 ligne, PATCH merge) ; browser DE-0057 étape Coût : `Arbre du bordereau 4 articles`, overlay Créer/Ajouter, `app-consultation-etude-panel` = 0. 3 import magique → `verify-consultation-achat-135.mjs` exit 0 (`CS-2026-0011` 1 devis / 2 lignes ; `lignes: []` → 400, statut DEMANDE). 4 flag + gate → `verify-consultation-achat-137.mjs` exit 0 (hors étude TARIF ; ciment CONSULTÉ ×3 PU 1083,75 sans identifier ; peinture TARIF ; orphelin/hors étude ne lèvent pas la gate ; 1 import lié lève).
décidé seul          Playwright CLI C:/ vs c:/ = inbox, non bloquant (scripts node = preuve). SKIP `cursor-session` exit 0 non déclenché (session 200). Vu rouge avant lu dans les journaux 134 (404 + nav), 135 (POST /devis 404), 136 (panneau page), 137 (gate orphelin) — les scripts throw encore sur ces états.
écarts / dette       Composant `consultation-etude-panel` encore au dépôt (plus monté). Specs Playwright 129/130/parcours-qa + SEKTOR-110 tapent encore `consultations_etudes` / le panneau (inbox). `consultations_etudes` laissé. `approve` non appelé — `gate: none` a basculé seul `done-agent` → `done-me`.
