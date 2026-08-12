---
id: ERP-52
status: done
context: nafura
kind: task
priority: P2
assignee: agent
gate: qa
parent: ERP-47
feature: etude-gates-ux
sprint: 2026-W33
tags: [sektor, etudes, bug, ux]
---

# Bug — Polish dossier étude (header / shell / post-extraction)

> Lots UX secondaires observés sur DE-0001 : badge Partner trompeur, UUID tenant
> dans le shell, encoding filename CPS, Extraire ambigu après arbre validé,
> articles ignorés non listés, stepper non navigable au clic.

## Repro (bundle)
1. DE-0001 · header : badge « Partner à lier au devis » alors que le nom client s’affiche (`clientId` manquant)
2. Shell : bouton org = UUID `a5e802e9-…` + « Siège »
3. Documents : filename CPS `NÂ°…`
4. Bordereau validé auto : bouton **Extraire** encore proéminent ; status « 2 articles ignorés » sans liste
5. Clic sur pastilles stepper 1–4 : pas de navigation (seul Précédent / Continuer)

## Critères d'acceptation
- [x] Badge client FR clair ; affiché seulement si partenaire réellement non lié (pas si nom présent sans id — ou lier/créer)
- [x] Switcher org : label = nom tenant / site, **pas** l’UUID
- [x] Filename pièce : encodage UTF-8 correct (plus de `NÂ°`)
- [x] Post-validation auto : Extraire en secondaire / confirm écrasement ; liste ou lien vers les articles ignorés
- [x] Stepper : cliquable vers étapes déjà atteintes, **ou** style explicitement non-interactif

## Journal
```
11/08 11:25  QA Mode B DE-0001 OK · done (agent gate:qa)
11/08 11:06  capturé QA DE-0001 · bundle polish P2
```
