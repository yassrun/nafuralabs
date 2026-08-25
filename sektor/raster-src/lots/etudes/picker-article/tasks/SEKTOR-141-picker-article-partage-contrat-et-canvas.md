---
id: SEKTOR-141
status: done-me
context: nafura
type: spec
agent_type: spec
priority: P1
assignee: agent
gate: me
tags: [sektor, ux, catalogue]
---

# Picker article partagé — contrat et canvas

> Recherche as-you-type code+désignation ; filtres serveur nature/famille/lot d usage ; pagination. Dialog DPU + selects stock (réception, retour, transfert, tarifs). Pas de dump à l ouverture. Dans Raster : contrat = DECISIONS-PRODUIT + canvas sous-lot.

## Étapes

- [x] Qualifier EVOL (picker actuel dump 40 — comportement nouveau) ; une ligne dans CONTRAT.md
- [x] Geler section datée 23/08/2026 dans DECISIONS-PRODUIT.md
- [x] Écrire CONTRAT.md (AC-1…AC-14 gelés, scénarios e2e + état initial)
- [x] Canvas SSOT `ux/picker-article-wireframe.canvas.tsx` + copie preview `canvases/`
- [x] LOT.md + 00-PLAN.md (≥ 2 exec)
- [x] Tasks exec + qa via CLI (`--blocked-by SEKTOR-141` sur les features)

## Journal

```
23/08 17:26  posée
23/08 17:26  status → doing
23/08 17:35  EVOL gelé. Lookups = même picker (pied article seul), pas un autocomplete parallèle.
23/08 17:35  Sans q≥2 et sans filtre → page vide 200, pas 400. Nature pré-remplie = 1 chip = type DPU.
23/08 17:35  SearchFields v1 = code+name. Listing articles hors scope. SKU/fournisseur/unité = dette hors AC.
23/08 17:35  Découpe 142 API → 143 picker+DPU → 144 stock+lookups → 145 qa.
23/08 17:31  status → done-agent
23/08 17:35  toi · approuvée → done-me
```

## Question

Le canvas et le CONTRAT.md (AC-1…AC-14) sont-ils le contrat du picker partagé ?

- **A** — Approuver : 142–144 restent `todo` jusqu’à ton `done-me` sur 141, puis partent dans l’ordre du PLAN.
- **B** — Amender : tu notes l’écart (vue, AC, pied lookup) ; le spec re-gèle.

Recommandé : A — le gel suit ta demande (pas de dump, 3 pieds, Extraire = chemin IA, lookups dans v1).

## Rapport de livraison

ce qui a changé      CONTRAT.md (AC gelés) · canvas lot + preview · DECISIONS-PRODUIT § 23/08 · LOT.md · 00-PLAN.md · tasks 142–145.
critères gelés       AC-1 ouverture vide · AC-2 recherche code+nom · AC-3 filtres serveur · AC-4 pas de triplet · AC-5 pagination · AC-6 actifs · AC-7 unité+PU · AC-8 clavier · AC-9 pied DPU · AC-10 pied stock · AC-11 pied lookup · AC-12 nature pré-remplie · AC-13 vide sans CTA créer · AC-14 erreur+relance.
décidé seul          Lookups = même geste (144, pas dette). HTTP 200 vide plutôt que 400. Nature pré-remplie = un chip type DPU (pas le seau stockable). Scroll = load more, pas de pages numérotées imposées.
écarts / dette       Hors v1 nommé : SKU/cleStable barre, filtre fournisseur, filtre unité, listing articles encore client. Raster autonome (interdit sur ce travail).
