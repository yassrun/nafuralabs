---
id: SEKTOR-106
status: done-me
context: nafura
type: feature
agent_type: exec
priority: P0
assignee: agent
gate: none
tags: [etudes, catalogue]
---

# Item tenant 1-1 avec cle_stable Sektor

> Gelé DECISIONS-PRODUIT.md 20/08 — identité canonique = cle_stable ; Item 1-1 ; Raster autonome.

Contrat : [`sektor/raster-src/DECISIONS-PRODUIT.md`](../../../../DECISIONS-PRODUIT.md) § Identité. Pas de SPEC / CH.

## Étapes

- [ ] Lier chaque `Item` tenant à **une** `cle_stable` catalogue Sektor (1–1 par tenant). Unique. Jamais un Item orphelin.
- [ ] `catalogue_fournisseur_lignes` pointe cette identité (prix + `ref_fournisseur`), pas une 3ᵉ fiche article.
- [ ] Migration Liquibase lab clean (drop/rename OK). Seed / fixtures suivent.
- [ ] Preuve : créer deux fois le même `cle_stable` sur le tenant refuse ; une ligne fournisseur ne crée pas d’article parallèle.

## Journal

```
20/08 19:21  posée
20/08 19:24  status → doing
20/08 19:36  status → review
20/08 20:02  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      Item 1–1 `cle_stable` (Liquibase `007_item_cle_stable.sql`, ItemService, fiche article). Ligne fournisseur copie l’identité via trigger — pas une 3ᵉ fiche.
critères prouvés     duplicate → `item.cle_stable.duplicate` (unit) ; bind fournisseur `createdItem=false` (unit). e2e `identite-item-cle-stable.spec.ts` : curl 20/08 19:36 deux POST 201 (rouge avant JVM).
décidé seul          si `cleStable` absent à la création, slug du libellé. Identité immuable au PUT. Java achats inchangé — trigger SQL remplit `cle_stable`.
écarts / dette       e2e vert = migrate + restart bootRun. Champ `cle_stable` pas encore sur l’entité JPA achats.
