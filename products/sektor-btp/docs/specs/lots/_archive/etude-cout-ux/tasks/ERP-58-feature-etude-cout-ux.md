---
id: ERP-58
status: done
context: nafura
kind: feature
priority: P1
assignee: either
gate: me
feature: etude-cout-ux
sprint: 2026-W33
tags: [sektor, etudes, ux, cout]
---

# Feature — UX étape Coût (QA DE-0001)

> Parapluie frictions workspace Coût (arbre + chrome + CTA), hors drawer
> déjà couvert par ERP-16 / ERP-56–57.
> Repro : DE-0001 · Mode B · étape 3 Coût.

## Enfants
- ERP-59 — Soft gate « postes à chiffrer » vs alerte qualité estimés · done
- ERP-60 — Chrome « 0 / 0 composants consultés » + alertes mortes · done
- ERP-61 — Badge mode (Estimé / Forfait / Décomposé / déduit) dans l’arbre · done
- ERP-62 — CTA header « Soumettre » prématuré sur Coût · done
- ERP-63 — Arbre déplié / focus quand soft gate postes manquants · done
- ERP-12 — Double-clic ouverture drawer (déjà live, parent ERP-16)

## Contexte QA (11/08)
Tour Cursor : soft ERP-55 OK, mais faux « 1 poste à chiffrer » = `part_couts_estimes`
(gate 5) sans `noeudId` alors que 5.1/5.2 ont un PU. Chrome consultation
bruyant ; pas de mode dans l’arbre ; Soumettre visible trop tôt.

## Journal
```
11/08 15:35  done · enfants 59–63 livrés (gate:me — check progress OK côté agent QA)
11/08 15:28  ERP-62 done
11/08 15:25  ERP-61 done
11/08 15:20  ERP-60 done
11/08 15:20  ERP-59 done
11/08 15:08  créé · go ahead parapluie phase Coût
```
