---
id: SEKTOR-126
status: done-me
context: nafura
type: qa
agent_type: qa
priority: P0
assignee: agent
gate: none
blocked_by: [SEKTOR-116]
tags: [etudes]
---

# Preuves dpgf libelle UTF-8

> POST noeud avec libelle accentue 201, pas 500.

Ne pas réécrire l’e2e. Rejouer la preuve 116.

## Étapes

- [x] POST nœud libellé accentué → 201, pas 500.
- [x] Rapport. `done-agent` sur 116 + cette task si PASS.

## Journal

```
20/08 21:12  posée
20/08 21:25  status → doing
20/08 21:32  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      Filtre UTF-8 DPGF chargé après reboot 8082 (java 6640 tué 21:27 — `Béton` encore 500 parse JSON ; process 11732 21:28 — 201). MockMvc + codec déjà verts sans reboot.
critères prouvés     POST accentué 201 + libellé persisté : curl Mode B `dpgf/93c68e40-…/noeuds` `libelle=Béton` HTTP 201 `"libelle":"Béton"` ; `été déjà façadé à çà` 201 tel quel ; windows-1252 `Béton` 201. ASCII `Beton` 201 `"libelle":"Beton"`. Avant reboot : `Béton` HTTP 500 `Invalid UTF-8 middle byte 0x74` (corr `ad0dc8a5-…`) · ASCII 201. Unit : `./gradlew :sektor:etudes:test --tests DpgfControllerLibelleUtf8Test --tests JsonUtf8BodyCodecTest` BUILD SUCCESSFUL — 2+3 tests, 0 fail.
décidé seul          PASS critères malgré e2e Playwright rouge : TDZ `const chargeEtudeUserId = await chargeEtudeUserId(...)` (crash avant le POST, pas le bug 116). Preuve = curl + MockMvc. E2e non réécrit → inbox.
écarts / dette       e2e `dpgf-noeuds-libelle-utf8.spec.ts` non exécutable (TDZ) — inbox. 8082 retombé après les curls (GET hierarchie non rejoué ; persisté lu sur le 201). Parse JSON hors `/dpgf*` reste 500 (inbox déjà).
