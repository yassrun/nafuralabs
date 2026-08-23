---
id: SEKTOR-116
status: done-me
context: nafura
type: bug
agent_type: exec
priority: P0
assignee: agent
gate: none
tags: [etudes]
---

# POST dpgf noeuds accepte libelle UTF-8

> POST /api/v1/etudes/dpgf/{id}/noeuds 500 si libelle avec accent (Beton). ASCII passe. QA 20/08 DE-0012.

Repro QA 20/08 DE-0012 : POST nœud `libelle=Béton…` → 500 INTERNAL_ERROR (parse JSON) ; ASCII `Beton` → 201.

## Étapes

- [x] Identifier charset / Jackson / Tomcat sur `POST /api/v1/etudes/dpgf/{id}/noeuds`.
- [x] Un libellé avec accents (é, è, à, ç) crée le nœud 201, persisté tel quel.
- [x] Preuve : test API + e2e ou unit. Vu rouge avant le correctif (`Béton` → 500).

## Journal

```
20/08 21:12  posée
20/08 21:16  status → doing
20/08 21:19  curl ASCII 201 ; UTF-8 Béton 201 ; windows-1252/ISO-8859-1 → 500 Jackson Invalid UTF-8 middle byte 0x74
20/08 21:21  MockMvc vu rouge : expected 201 was 500 (JsonParseException) avant filtre
20/08 21:25  filtre JsonUtf8BodyFilter + codec ; tests verts ; e2e dpgf-noeuds-libelle-utf8.spec.ts
20/08 21:24  status → review
20/08 21:32  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      Filtre `JsonUtf8BodyFilter` sur `/api/v1/etudes/dpgf*` : body JSON windows-1252/ISO-8859-1 réécrit en UTF-8 avant Jackson. Tomcat `server.servlet.encoding` forcé UTF-8. POST noeuds `consumes/produces` JSON.
critères prouvés     Accents (é) → 201 + libellé persisté : MockMvc windows-1252 vu rouge 500 puis vert ; UTF-8 `Béton armé — déjà façadé` 201. Codec unit. e2e `sektor/e2e/dpgf-noeuds-libelle-utf8.spec.ts` (UTF-8 + latin-1). Curl live UTF-8 déjà 201 avant reboot.
décidé seul          Fallback windows-1252 (pas ISO-8859-1 seul) — ellipsis QA `…` = 0x85. Filtre borné DPGF, pas tout l’ERP. UTF-8 valide laissé intact (RFC 8259).
écarts / dette       Processus local 8082 à redémarrer pour le filtre. Parse JSON illisible hors DPGF reste 500 (inbox). SEKTOR-126 non touchée.
