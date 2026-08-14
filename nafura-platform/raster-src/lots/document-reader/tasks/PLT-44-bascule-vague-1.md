---
id: PLT-44
status: todo
context: nafura
type: feature
priority: P1
assignee: agent
gate: none
sprint: 2026-W33
blocked_by: [PLT-43]
tags: [platform, documents, doc-extractor]
---

# Bascule vague 1 — liste puis arbre

> Forme par forme : `liste` (5 écrans câblés) puis `arbre` (lots de chantier + bordereau). LLM en repli.
> Couvre **AC-1** · **AC-2** · **AC-6** de [`LOT.md`](../LOT.md). Hors lot : facture / offre / pointage (vagues 2–3).

## Étapes

- [ ] Bascule `liste` : clients, fournisseurs, employés, articles, ouvrages — lignes créées, LLM seulement si le validateur refuse le plan
- [ ] Bascule `arbre` : lots de chantier + bordereau — étalon 703 articles vert
- [ ] Vérifier qu’aucun trigger `smart-import` déjà câblé ne régresse

## Journal

```
14/08 19:52  spec · mesure par forme, pas par écran · écrans nouveaux = autre lot
14/08 19:55  orch · sprint 2026-W33
```
