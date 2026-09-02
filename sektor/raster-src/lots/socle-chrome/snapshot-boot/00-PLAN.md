# Snapshot chrome au boot

> Un GET chrome alimente cloche + jauge de complétude. Plus de `getAll()` factures ni fan-out dismissals / expirant / requests au reload.

## Intention

Le shell refetchait au F5 les listings métier pour calculer des alertes côté client. Après ce sous-lot, le boot authentifié appelle `GET /api/v1/erp/chrome` : alertes déjà filtrées + score de complétude.

## Périmètre

- Inclus : endpoint snapshot, ports marches/HSE, store front, cloche, jauge header.
- Exclus : SSE `stream`, branding, preferences, badge workflow platform `pending/count`, KPI dashboard.

## Approche

Socle agrège. Marchés et HSE exposent des ports (factures en retard, cautions / formations expirant) — pas un dump d’entités. Dismiss + cleanup restent côté serveur dans le snapshot.

## Tasks

| # | Task | agent_type | blocked_by |
|---|---|---|---|
| 1 | SEKTOR-301 Snapshot chrome un GET au boot | exec | — |

## Preuves attendues

- `node sektor/e2e/scripts/verify-socle-chrome-snapshot-301.mjs`
- `ErpChromeSnapshotServiceTest` vert

## Décisions ouvertes

Aucune.
