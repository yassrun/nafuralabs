---
id: PLT-133
status: done-me
context: nafura
type: spec
agent_type: spec
priority: P1
assignee: agent
gate: none
tags: [platform, impression]
sprint: 2026-W34
---

# SPEC + geler AC — admin modèles et rendu PDF

> Geler AC-1…AC-5. Preuves devis et bordereau. Engin platform.

## Étapes

- [x] Qualifier EVOL (déjà posé) et geler AC-1…AC-5 dans `CH.md`
- [x] Nommer les scénarios e2e et l'état initial
- [x] Patcher `SPEC.md` impression (admin modifie · rendu chemin unique)
- [x] Canvas admin + pointer la SPEC · sync preview
- [x] Indexer `P-IMPRESSION-MODELE-ECRIRE` dans la matrice socle (pas un EVOL socle)

## Journal

```
17/08 10:50  posée
17/08 10:50  sprint → 2026-W34
17/08 10:53  status → doing
17/08 11:00  contrat gelé — AC-1…AC-5, canvas admin, SPEC patchée, P-IMPRESSION-MODELE-ECRIRE
17/08 10:58  status → done-agent · gate none → done-me
```

## Rapport de livraison

**ce qui a changé**
`CH.md` gelé (worktree + intégration). SPEC `impression` : admin **modifie**, rendu chemin unique, `R-4`. Canvas `admin-modeles-wireframe`. Matrice socle : `P-IMPRESSION-MODELE-ECRIRE`.

**critères**
AC-1…AC-5 gelés dans `CH.md` (plus « à geler »). Scénarios nommés : `impression-admin-modele`, `impression-rendre-pdf`, `sektor-impression-devis`, `sektor-impression-bordereau`, suite `impression-*`.

**décidé seul**
- `P-IMPRESSION-MODELE-ECRIRE` (allow `admin-tenant`, deny `utilisateur`) plutôt qu'élargir R-2 — verbe distinct, indexé dans le socle par ce CH, pas un EVOL socle.
- Preuves devis / bordereau sous `sektor/e2e/` (le produit accroche) ; admin + rendu sous `nafura-platform/e2e/`.
- Écran admin = canvas du BC `impression`, pas du socle. `page-rendue` reste l'autre flux.
- Hors périmètre : créer / retirer un modèle (AC = modifier).
- HTML gelé AC-1 : `<p>ch03-admin</p>`. Tenant preuves produit : `qa-local` / `qa@nafuralabs.local`.

**écarts / dette**
Aucun. CADRE non touché. PLT-134 / PLT-135 inchangés (statuts).
