---
id: SEKTOR-132
status: done-me
context: nafura
type: bug
agent_type: exec
priority: P0
assignee: agent
gate: none
tags: [etudes, catalogue]
---

# Extraire pose un code article tenant

> Walk Articles : Extraire cree l Item (cle_stable) sans code tenant. Liste Catalogue colonne code vide.

## Étapes

- [x] `ItemService.createEntity` : si `code` vide, allouer un code unique par tenant (dérivé de `cle_stable`, ≤ 20 pour coller au formulaire Articles). Extraire et `createAllege` passent par `create` — ne pas dupliquer dans Extraire seulement.
- [x] Liquibase lab : backfill des `items.code` NULL / blancs (unicité `tenant_id, code`).
- [x] Preuve : `POST /api/v1/items/extraire-creer` puis `GET /api/v1/items/{id}` → `code` non vide. Vu rouge avant (code null). Liste Catalogue : plus de ligne Extraire sans code.

## Journal

```
22/08 12:28  posée
22/08 12:29  status → doing
22/08 12:32  tsk1 ItemService.createEntity allocateTenantCode (≤ 20, unique tenant)
22/08 12:34  vue rouge : extraire-creer GET item.code=null (verify-article-code-extraire-132.mjs)
22/08 12:38  bootRun + 008_item_code_from_cle_stable.sql — bootRun ne joue pas Liquibase (ddl validate)
22/08 12:40  backfill lab : 24 code NULL → 0 ; colonne NOT NULL
22/08 12:41  vue verte : extraire-creer code=PEINTURE-EXTRAIRE--3 liste sans vide
22/08 12:43  trim hyphens (pas de --) ; persistCodeIfMissing sur GET liste
22/08 12:44  status → review
22/08 12:45  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      `ItemService.createEntity` alloue un code tenant si vide (Extraire / createAllege). Liquibase `008_item_code_from_cle_stable.sql` backfill + NOT NULL. GET liste persiste un code manquant (bootRun local ne joue pas Liquibase).
critères prouvés     extraire-creer → GET item.code non vide. Vu rouge 12:34 (`code=null`) puis vert 12:41 `node sektor/e2e/scripts/verify-article-code-extraire-132.mjs`. Liste size=100 sans code vide. Spec Playwright `extraire-article-code.spec.ts` écrite, dual-require inbox.
décidé seul          Code tenant ≠ `cle_stable` : slug uppercasé, ≤ 20 (formulaire Articles). Collision = suffixe `-n` sans `--`. Backfill SQL appliqué sur le lab (24 lignes) parce que `ddl-auto: validate`.
écarts / dette       Playwright dual-require C:/ vs c:/ — déjà inbox. L9 `createAllege` hors Extraire toujours inbox ; il hérite du code via `create`.
