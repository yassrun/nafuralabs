---
id: ERP-56
status: done
context: nafura
kind: task
priority: P1
assignee: agent
gate: qa
parent: ERP-16
feature: chiffrage-drawer
sprint: 2026-W33
tags: [sektor, etudes, ux, chiffrage]
---

# UX — Drawer chiffrage mode « J’estime » (lot A)

> Le drawer Estime est trop « formulaire complet » pour poser un PU.
> Lot A : focus saisie → plancher live → CTA honnête ; pas de faux 0 MAD.

## Critères d'acceptation
- [x] Sans coût saisi : plancher affiche « — » / message d’attente (pas une cascade de 0 MAD)
- [x] Footer : pas « Tout est à jour » si le poste n’a pas encore de coût ; message d’invite à saisir
- [x] Dès qu’un coût (ou prix de vente) > 0 : plancher calcule live FG/marge/PU/total
- [x] Descriptif technique moins proéminent en mode Estime (replié / secondaire)
- [x] Pas de régression Décompose / Forfait (plancher inchangé quand données présentes)

## Lots suivants (hors scope ici)
- B — Replier Avis + Commentaires par défaut
- C — Clarifier coût vs prix de vente (un seul contrôle)
- D — Polish Décompose / Forfait AI-first

## Journal
```
11/08 14:27  créé · suite revue drawer · lot A · sprint W33
11/08 14:30  done · placeholders plancher + footer invite + descriptif plié · QA OK
```
