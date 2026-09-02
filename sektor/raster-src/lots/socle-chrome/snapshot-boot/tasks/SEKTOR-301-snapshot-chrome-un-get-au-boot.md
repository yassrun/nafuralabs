---
id: SEKTOR-301
status: done-me
context: nafura
type: tech
agent_type: exec
priority: P2
assignee: agent
gate: none
---

# Snapshot chrome un GET au boot

> Un GET /api/v1/erp/chrome pour alertes + complétude. Plus de getAll factures / expirant / requests / dismissals / completeness au reload.

## Étapes

- [x] `GET /api/v1/erp/chrome` : alertes (approbations, factures en retard, cautions/formations expirant) + complétude
- [x] Ports marches/HSE — requêtes ciblées, pas `getAll`
- [x] Front : boot + poll + SSE hydratent cloche et jauge via ce GET
- [x] Preuve source + test Java

## Preuves attendues

- `node sektor/e2e/scripts/verify-socle-chrome-snapshot-301.mjs`
- `ErpChromeSnapshotServiceTest`

## Journal

```
01/09 11:57  posée
01/09 11:57  status → doing
01/09 12:06  status → done-agent · gate none → done-me
```

## Rapport de livraison

**Changé.** `GET /api/v1/erp/chrome` agrège cloche + jauge. Le boot n’appelle plus factures `getAll`, expirant, requests, dismissals, cleanup, ni `/completeness`. SSE/poll réutilisent le même GET.

**Preuves.** `node sektor/e2e/scripts/verify-socle-chrome-snapshot-301.mjs` OK. `./gradlew :sektor:socle:test --tests ma.nafura.socle.chrome.service.ErpChromeSnapshotServiceTest` SUCCESS. Adapters marches/hse compilent.

**Décidé seul.** Ports socle + adapters BC (pas d’agrégat dans `app/` nafgen). Cleanup dismissals côté serveur dans le snapshot. Completeness dans le chrome sans check owner (la jauge header était déjà globale ; 403 devenait score vide). Branding / prefs / stream / `pending/count` platform inchangés.

**Écarts.** L’API locale doit être relancée pour exposer le nouvel endpoint. Karma front non exécuté (preuve source + Java).

