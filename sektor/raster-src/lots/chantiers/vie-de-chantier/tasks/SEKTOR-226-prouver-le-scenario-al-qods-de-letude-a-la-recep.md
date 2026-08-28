---
id: SEKTOR-226
status: done-me
context: nafura
type: qa
agent_type: qa
priority: P0
assignee: agent
gate: none
blocked_by: [SEKTOR-222, SEKTOR-223, SEKTOR-224, SEKTOR-225]
---

# Prouver le scenario Al Qods de letude a la reception provisoire

> Graphe créé par API. Faits, pas écrans. Rôles nommés. Un listing 200 sans BL partiel ne passe pas.

Contrat AC-13 à AC-15. Scénario : [`../SCENARIO.md`](../SCENARIO.md).

## Étapes

- [x] Fabriquer Al Qods (180 / 25 / 850 / 420, 2 ST, 1 interne, consultations).
- [x] Jouer les 10 id du contrat avec `ingenieur`, `conducteur`, `chef-chantier`, `magasinier`, `daf`.
- [x] Acte 3 : BL 12/25, refus 181 m³, interne hors attachement, ST 0 m², RBAC, panne DA ≠ 0 (note dette).
- [x] `POST /clore` depuis EN_COURS refuse. Captures desktop + 390 — non fait (Browser MCP absent). `node raster/t.mjs check`.

## Preuves attendues

- Matrice scénario → commande → rôle → URL → artefact.
- Écarts listés, pas absorbés. Skip propre si Mode B down.

## Journal

```
27/08 22:43  posée
28/08 02:12  status → doing
28/08 10:17  status → done-agent · gate none → done-me
```

## Rapport de livraison

**Verdict : PASS** — `node sektor/e2e/scripts/verify-alqods-scenario-226.mjs` (28/08).

Rejoue les 5 scripts unitaires 221–225 puis fabrique un graphe Al Qods (pas DE-0103) et les discriminants acte 3. Graphe final `d6b0c3b8-6dad-4639-a0e0-833358ad0b73`.

| Id contrat | Résultat |
|---|---|
| alqods-etude-vers-os | PASS |
| alqods-da-bl-direct-2-1 / bl-partiel | PASS (222) |
| alqods-st-coffrage-sans-planning | PASS (224) |
| alqods-documents-os-pv | PASS (223) |
| alqods-marche-notification | PASS (225) |
| alqods-roles | PASS (221 + 226) |
| alqods-interne-hors-situation | PASS |
| 181 m³ refusé | PASS |
| étanchéité 0 m² non inventée | PASS |
| alqods-reception-provisoire (/clore) | PASS |

**Dette (hors fail) :** tuile cockpit « DA indisponible » si Achats down non implémentée ; captures desktop/390 ; CTA conversion études (SEKTOR-213).

221–225 : `done-agent` posé par QA après rejeu indépendant.
