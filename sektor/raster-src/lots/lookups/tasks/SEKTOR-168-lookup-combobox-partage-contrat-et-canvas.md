---
id: SEKTOR-168
status: done-me
context: nafura
type: spec
agent_type: spec
priority: P1
assignee: agent
gate: me
tags: [sektor]
---

# Lookup combobox partagé — contrat et canvas

> Combobox FK (recherche serveur, œil fiche). Pas un picker. Dans Raster : contrat = DECISIONS-PRODUIT + canvas du lot.

## Étapes

- [x] Qualifier EVOL (select dump 200–500, pas de recherche, œil = liste) ; une ligne dans CONTRAT.md
- [x] Geler section datée 23/08/2026 lookups dans DECISIONS-PRODUIT.md
- [x] Écrire CONTRAT.md (AC-1…AC-14 gelés, scénarios e2e + état initial)
- [x] Canvas SSOT `ux/lookup-combobox-wireframe.canvas.tsx` + copie preview `canvases/`
- [x] LOT.md + 00-PLAN.md (≥ 2 exec)
- [x] Tasks exec + qa via CLI (`--blocked-by SEKTOR-168` sur les features)
- [x] Lot `lookups` au-dessus de la borne ROADMAP (demande « planifie et orchestre »)

## Journal

```
23/08 18:46  posée
23/08 18:49  status → doing
23/08 18:49  status → done-agent
23/08 18:51  toi · approuvée → done-me
```

## Question

Le canvas et le CONTRAT.md (AC-1…AC-14) sont-ils le contrat du combobox lookup ?

- **A** — Approuver : 169–171 restent `todo` jusqu’à ton `done-me` sur 168, puis partent dans l’ordre du PLAN.
- **B** — Amender : tu notes l’écart (œil, dump, premiers écrans) ; le spec re-gèle.

Recommandé : A — le gel suit ta demande (combobox pas picker, recherche serveur, œil fiche si id / liste si vide, client+fournisseur d’abord).

## Rapport de livraison

ce qui a changé      CONTRAT.md (AC gelés) · canvas lot + preview · DECISIONS-PRODUIT § lookups 23/08 · LOT.md · 00-PLAN.md · tasks 169–172 · ROADMAP lot ouvert.
critères gelés       AC-1 combobox · AC-2 pas de dump · AC-3 recherche code+RS · AC-4 hit · AC-5 clavier · AC-6 œil fiche · AC-7 œil liste si vide · AC-8 pas d’œil enum · AC-9 0 hit · AC-10 erreur · AC-11 client/fournisseur · AC-12 reste clés+filtres · AC-13 article hors lot · AC-14 orphelin.
décidé seul          Atome = `nf-select` + lookupKey (pas un 2ᵉ composant). Carte fiche à côté de la carte liste. CTA créer hors v1. Lot `lookups` (transversal), pas un sous-lot études.
écarts / dette       Hors v1 nommé : CTA +, ICE dédié, partnerContacts, nf-form custom. Consultation / études / chantiers restent ouverts dans la même fenêtre ROADMAP.
