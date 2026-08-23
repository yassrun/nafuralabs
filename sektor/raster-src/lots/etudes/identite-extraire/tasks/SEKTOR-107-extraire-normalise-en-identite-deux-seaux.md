---
id: SEKTOR-107
status: done-me
context: nafura
type: feature
agent_type: exec
priority: P0
assignee: agent
gate: none
blocked_by: [SEKTOR-106]
tags: [etudes, catalogue]
---

# Extraire normalise en identite deux seaux

> Gelé DECISIONS-PRODUIT.md 20/08 — IA puis deux seaux (déjà tenant / à créer). LIKE n'est plus la cible. Match incertain 2+ : ne pas inventer.

Contrat : [`DECISIONS-PRODUIT.md`](../../../../DECISIONS-PRODUIT.md) § Extraire — après l’IA, deux seaux. `CatalogLookupApiImpl` LIKE = constat, pas la cible.

## Étapes

- [x] Extraire : IA (libellé + descriptif **persisté** + extraits CPS) puis normalisation d’identité Sektor — plus un `LIKE` nom/code comme décision.
- [x] Chaque besoin tombe dans **un** seau : déjà sur le tenant (Item 1–1) → lier, **pas** de proposition de création ; pas d’Item → proposition, **jamais** auto-créer.
- [x] Tiny spec (couleur, RAL, teinte) ≠ 2ᵉ identité. Extraire « peinture acrylique blanche » → identité peinture acrylique intérieure, pas « peinture blanche ».
- [x] Match **incertain** (2+ identités) : **ne pas inventer** (ouvert). `blocked` + `## Question` A/B, ou ligne inbox. Ne pas prendre le meilleur score en silence.
- [x] Preuve e2e : un besoin déjà lié au tenant n’offre pas « créer » ; un besoin nouveau propose de créer sans écrire tout seul.

## Journal

```
20/08 19:21  posée
20/08 19:36  status → doing
20/08 19:40  tsk1 ExtraireIdentiteService — IA corpus PUBLIE, seaux DEJA_TENANT / A_CREER / INCERTAIN (2+ distincts, pas le meilleur score)
20/08 19:42  tsk2 DecompositionProposeService — classerIdentite, plus LIKE+premier tarifé ; jamais createAllege
20/08 19:44  tsk3 Extraire ouvre le dialog deux seaux (Déjà tenant / À créer) ; incertain sans CTA créer
20/08 19:47  e2e extraire-identite-deux-seaux.spec.ts VU ROUGE (JVM sans 106/107) : GET identites → 404 static resource ; POST classer-identite → 500
20/08 19:50  unit ExtraireIdentiteServiceTest + DecompositionProposeServiceTest verts
20/08 19:51  status → review
20/08 20:02  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      Extraire classe via IA (`ExtraireIdentiteService` / `POST /api/v1/items/classer-identite`) puis deux seaux. LIKE n’est plus la décision. UI Extraire : dialog « Déjà sur le tenant » (pas de créer) / « À créer » (humain confirme) / incertain sans action auto.
critères prouvés     unit : 1 identité+Item → DEJA_TENANT ; 1 identité sans Item → A_CREER sans save ; 2+ → INCERTAIN sans meilleur score ; LLM off → A_CREER sans LIKE. Propose : matched sans createAllege. e2e `extraire-identite-deux-seaux.spec.ts` : classer ne persiste pas (count inchangé) — vu rouge 20/08 19:47 avant JVM 107.
décidé seul          2+ identités → seau INCERTAIN (ni lien ni création) ; question produit inbox inchangée. Tiny spec : annotation prompt seulement, pas persistée. LLM down : tout A_CREER, pas de fallback LIKE. Matched même sans tarif consultable.
écarts / dette       Tiny spec note d’emploi encore ouverte. Match incertain : pas de trancher humain (inbox). e2e vert 20/08 20:00 après 007 + bootRun.
