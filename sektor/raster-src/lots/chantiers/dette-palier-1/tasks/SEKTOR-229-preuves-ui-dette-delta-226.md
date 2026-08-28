---
id: SEKTOR-229
status: done-me
context: nafura
type: qa
agent_type: qa
priority: P1
assignee: agent
gate: none
blocked_by: [SEKTOR-227, SEKTOR-228]
tags: [qa, e2e]
---

# Preuves UI dette + delta 226

> Valider AC-D1/D2/D3 après 227 et 228. Rejouer delta 226 sur panne DA + CTA.

Contrat : [`../CONTRAT.md`](../CONTRAT.md) AC-D1 à AC-D3.

## Étapes

- [x] Rejouer scripts 227 et 228.
- [x] Mettre à jour `verify-alqods-scenario-226.mjs` : panne DA = PASS (plus NOTE dette).
- [x] Captures desktop + 390 cockpit + conversion si Browser MCP ; sinon skip documenté.
- [x] `node raster/t.mjs check`.

## Preuves attendues

- Matrice AC-D1/D2 verte.
- Captures sous `sektor/e2e/captures/dette-palier-1/` ou skip explicite.

## Journal

```
28/08 10:20  posée
28/08 10:31  status → doing
28/08 10:31  status → done-agent · gate none → done-me
28/08        QA : verify-dette-palier-1-229.mjs PASS (227+228 rejoués, chrome CTA OK)
28/08        AC-D3 : skip captures — Browser MCP absent
28/08        226 : NOTE dette panne Achats retirée (couvert par 227)
```

## Rapport de livraison

**Verdict : PASS**

| AC | Preuve |
|---|---|
| D1 | `verify-dette-cockpit-achats-227.mjs` — NOT_AVAILABLE si panne, alignement API si dispo |
| D2 | `verify-dette-conversion-228.mjs` — CTA « Créer le chantier », sans marché, `marcheGenereId` nul |
| D3 | Skip captures documenté (pas de Browser MCP) |

Script agrégateur : `sektor/e2e/scripts/verify-dette-palier-1-229.mjs`
