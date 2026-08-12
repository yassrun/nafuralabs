---
id: MBS-01
status: done
context: nafura
kind: task
priority: P1
assignee: either
gate: me
sprint: 2026-W32
tags: [frontend, homepage, client-feedback]
---


# Homepage — traiter les remarques client (nouvelle version)

> Retours client sur la homepage (message Yassine).
> Pack de correctifs copy / curseur / projets / footer / magnétique.

## Critères d'acceptation
- [x] Texte CTA : `CLICK TO DRAW !` (pas `CLICK TO DRAW:`)
- [x] Décalage crayon / souris corrigé (alignement curseur)
- [x] Cercle inversé un peu plus grand au hover sur l'image
- [x] Photos projets mises à jour + 2e photo au hover souris
- [x] Photo projet **ENCORE** présente
- [x] Ordre des photos **exactement** comme Figma : ENCORE → Oh My Bun → Mik → … (suite Figma)
- [x] Footer : logo plus petit + logo avec tagline `brand intelligence`
- [x] Effet magnétique sur les photos plus subtil (réf. lien envoyé la veille)

## Source
Message client (homepage v2) — « Merci beaucoup yassine ! »

## Journal
```
05/08 10:54  capturé depuis retours client · promu MBS-01
05/08 21:30  framework v2 · task schema (estimate out · gate/kind)
06/08 23:20  sprint 2026-W32 · images Desktop/mbs → public/projects · hover · layout Figma · deploy staging
06/08 23:24  hovers dédoublonnés (lof / oh-my-bun) · re-export + redeploy staging
06/08 23:28  cercle invert (mix-blend sur wrapper) + plus grand · redeploy staging
06/08 23:40  CLICK TO DRAW ! hint + anim droite→gauche · hide after first stroke · redeploy
06/08 23:58  layout Figma (ordre+pos) · crop cadre blanc assets · hover CSS group · redeploy
07/08 00:12  footer logo + BRAND INTELLIGENCE · taille Figma · redeploy staging
07/08 00:20  check progress · gate me · done · livré prod mbs.nafuralabs.com · archivé
```
