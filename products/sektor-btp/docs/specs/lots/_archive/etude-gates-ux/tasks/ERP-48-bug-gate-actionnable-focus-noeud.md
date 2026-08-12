---
id: ERP-48
status: done
context: nafura
kind: task
priority: P0
assignee: agent
gate: qa
parent: ERP-47
feature: etude-gates-ux
sprint: 2026-W33
tags: [sektor, etudes, bug, ux, frontend]
---

# Bug — Gate bloquante sans savoir quels nœuds corriger

> Sur Bordereau (et Coût), la bannière dit « N points empêchent de continuer »
> mais **aucune liste**, **aucun jump** vers le nœud fautif. En mode Automatique
> l’arbre est lecture seule alors qu’il faut corriger la structure.

## Repro
1. Mode B Cursor QA · dossier DE-0001 (ou extraction BDP avec codes répétés)
2. Étape **Bordereau** après validation extraction
3. Gate rouge (ex. 37 points) + « Continuer vers le coût » disabled
4. Observer : pas de liens, pas de highlight ; `?noeudId=` ne focus pas l’arbre bordereau

## Attendu / obtenu
- **Attendu** : liste des problèmes (code + libellé) + CTA « Voir dans l’arbre » (expand / scroll / select) ; si mode Auto → CTA explicite « Passer en manuel pour corriger »
- **Obtenu** : une ligne compacte ; `corriger` non émis par `app-gate-blocage` ; `focusNoeudId` branché seulement sur le workspace Coût, pas sur `bordereau-arbre` (pieces-marche)

## Critères d'acceptation
- [x] Bannière gate (ou panneau) liste les problèmes de l’étape courante (code + libellé, plafonné + « voir tout »)
- [x] Clic → focus nœud dans l’arbre **bordereau** et **coût** (expand parents, scroll, sélection)
- [x] Mode Automatique + gate structure : CTA « Passer en manuel pour corriger (N) » visible
- [x] Aligné avec les liens « Corriger » déjà présents en Synthèse (consultation)
- [x] Repro DE-0001 : on atteint au moins un nœud `code_duplique` sans fouiller à l’aveugle

## Journal
```
11/08 11:25  QA Mode B DE-0001 OK · done (agent gate:qa)
11/08 11:06  capturé QA DE-0001 · pain point principal gates
```
