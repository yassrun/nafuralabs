---
id: PLT-100
status: done-me
context: nafura
type: spec
agent_type: spec
priority: P1
assignee: agent
gate: none
tags: [platform, extraction]
sprint: 2026-W33
---

# SPEC + geler AC — builder et workflow

> Builder et workflow hors du BC. SPEC patchée, AC gelés. Le code suit (PLT-101).

## Étapes

- [x] Lire CADRE, SPEC, socle, CH, code `builder` / `workflow` (lecture)
- [x] Trancher owns / not_owns pour chacun
- [x] Patcher `pact/document-extraction/SPEC.md`
- [x] Geler AC, scénarios e2e, état initial, POL-* dans `CH.md`
- [x] Pas de canvas — aucun écran nouveau
- [x] Rapport de livraison

## Journal

```
16/08 14:15  posée
16/08 14:23  sprint → 2026-W33
16/08 14:24  status → doing
16/08 14:50  tranché : builder not_owns → le produit ; workflow not_owns → Approbation.
             SPEC patchée. AC-1..4 gelés. Pas de canvas (dette de contrat, pas nouveau flux).
             Affine AC-4 : la suite existante s'appelle `lecture-*`, pas `extraction-*` (CH-00 / CH-02).
             Sens inchangé : les preuves d'extraction déjà là restent vertes.
16/08 14:26  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      `pact/document-extraction/SPEC.md` : builder et workflow en `not_owns`. `CH.md` : AC gelés, scénarios nommés. Canvas inchangé.
critères prouvés     AC-1, AC-2 → revue SPEC + CH (ce livrable). AC-3, AC-4 → PLT-101 / PLT-102.
décidé seul          Les deux hors du BC. Builder → **le produit** (il fournit le schéma ; le composer n'est pas l'extraction). Workflow DRAFT/VALIDATED/REJECTED → **contexte Approbation** (CADRE « faire décider une demande », déjà nommé). Revoir un doute reste owns (R-5).
écarts / dette       Code encore en avance sur la SPEC (builder + workflow exposés) — PLT-101. Pas de canvas. Pas de 00-PLAN (une seule task exec).
