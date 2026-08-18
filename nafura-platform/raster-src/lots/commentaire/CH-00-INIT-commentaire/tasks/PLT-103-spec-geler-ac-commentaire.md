---
id: PLT-103
status: done-me
context: nafura
type: spec
agent_type: spec
priority: P1
assignee: agent
gate: none
tags: [platform, commentaire]
---

# SPEC + geler AC — commentaire

> Premier contrat du BC commentaire. Coupe mention / notification / modération.

## Étapes

- [x] Photographier le jar `collaboration/comment` (API, widget, isolation, auteur)
- [x] Écrire `pact/commentaire/SPEC.md` (8 sections, vrai maintenant)
- [x] Geler les AC dans le CH + table Preuves `commentaire-*` + POL
- [x] Canvas widget `ux/fil-commentaire-wireframe.canvas.tsx`

## Journal

```
16/08 14:15  posée
17/08 21:09  sprint → 2026-W34
17/08 21:11  status → doing
17/08 21:20  tsk1  lu CADRE, CH, socle POL, jar comment
17/08 21:25  tsk2  SPEC.md — coupe mention/notif/modération dehors
17/08 21:28  tsk3  CH : preuves nommées, POL listées, AC inchangés
17/08 21:30  tsk4  canvas fil vide/messages/saisie
17/08 21:13  status → done-agent · gate none → done-me
17/08 21:26  constat écart PLT-104 : retiré POL-ERREUR-CODE de la SPEC (pas tenu) · inbox
```

## Rapport de livraison

- **ce qui a changé** — `pact/commentaire/SPEC.md` créée (8 sections). CH : table Preuves + POL, AC gelés inchangés. Canvas `ux/fil-commentaire-wireframe.canvas.tsx`.
- **critères prouvés** — AC-1 SPEC `not_owns` ≥ 1, chacun nomme qui. AC-2 coupe mention → identité, notification → notification, modération → non spécifié / produit. AC-4 lisible seule. AC-5 `entité`/`id` opaques, zéro règle produit. AC-3 scénarios nommés, pas encore exécutés : `commentaire-poster-et-lire` · `commentaire-deux-tenants` · `commentaire-auteur-seul` · `commentaire-retirer` · `commentaire-repondre` · `commentaire-frontiere-produit`.
- **décidé seul** — mention/notification/modération **dehors**. `isInternal` hors contrat (champ mort). Pas de `P-COMMENT-*` (PLT-108). Canvas dans l'INIT (widget visible). Réponses : API oui, widget non.
- **écarts / dette** — matrice socle consommateur hors périmètre. Baseline e2e = PLT-104. Champ `isInternal` non contracté.
