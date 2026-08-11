---
id: ERP-57
status: done
context: nafura
kind: task
priority: P1
assignee: agent
gate: qa
parent: ERP-16
feature: chiffrage-drawer
sprint: 2026-W33
tags: [sektor, etudes, ux, chiffrage]
---

# UX — Drawer chiffrage lots B · C · D

> Suite ERP-56 : replier le secondaire, clarifier Estime, polish Décompose/Forfait.

## Critères d'acceptation
### B — Secondaire replié
- [x] Avis d’exécution et Commentaires repliés par défaut dans le drawer
- [x] Ouverts restent utilisables (poser avis / publier)

### C — Estime : un contrôle clair
- [x] Plus de double toggle « Je saisis : un coût | un prix de vente » ambigu
- [x] Un seul contrôle de base (select ou segment égal) + champs adaptés

### D — Décompose / Forfait
- [x] Empty Décompose : AI-first (Extraire CPS) + fallback manuel visible
- [x] Forfait : partenaire/offre en zone « optionnel » (pas UUID en titre principal)
- [x] Segment voies (Décompose / Forfait / Estime) largeurs égales

## Journal
```
11/08 14:45  done · QA DE-0001 drawer 5.1 · B/C/D OK
11/08 14:31  créé · go ahead lots B/C/D · sprint W33
```
