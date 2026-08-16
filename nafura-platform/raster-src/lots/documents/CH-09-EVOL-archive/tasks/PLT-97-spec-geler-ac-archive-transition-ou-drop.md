---
id: PLT-97
status: done-me
context: nafura
type: spec
agent_type: spec
priority: P1
assignee: agent
gate: none
tags: [platform, documents]
sprint: 2026-W33
---

# SPEC + geler AC — archive : transition ou drop

> Trancher `archivé` (reste inatteignable) et geler une seule vérité dans la SPEC + les AC.

## Étapes

- [x] Lire CADRE, SPEC documents, CH-09, CH-07 (hors périmètre historique), politiques socle
- [x] Inspecter le code documents (`DocumentStatus`) pour savoir si `ARCHIVED` a une sémantique réelle — sans le modifier
- [x] Trancher : drop (pas une transition)
- [x] Patcher `pact/documents/SPEC.md` — plus la phrase « existe dans le code sans transition »
- [x] Réécrire / geler les AC du CH, scénarios e2e, POL-*
- [x] Journal + rapport de livraison

## Journal

```
16/08 14:15  posée
16/08 14:22  sprint → 2026-W33
16/08 14:23  status → doing
16/08 14:35  inspecté DocumentStatus : UPLOADED | ARCHIVED | DELETED — seul UPLOADED/DELETED sont écrits ; aucune action P-DOCUMENT-ARCHIVER
16/08 14:36  décision seule : drop — état inatteignable, motifs (corbeille / rétention / export) hors périmètre CH-09
16/08 14:37  SPEC patchée · AC gelés AC-1…AC-5 · canvas inchangé (pas d'écran)
16/08 14:25  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      `pact/documents/SPEC.md` — Tenu = `déposé → retiré` seulement, plus de mention `archivé`. `pact/documents/CH-09-EVOL-archive/CH.md` — décision drop + AC gelés.
critères prouvés     AC-1 livré (SPEC). AC-2…AC-5 à prouver par PLT-98 / PLT-99.
décidé seul          drop plutôt que transition. Pas de canvas : le widget pièce ne change pas. Pas de règle négative « il n'y a pas d'archivé » dans la SPEC — le cycle suffit.
écarts / dette       aucune. Hors périmètre inchangé (corbeille · rétention · export).
