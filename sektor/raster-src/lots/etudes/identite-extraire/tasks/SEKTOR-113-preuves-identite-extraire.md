---
id: SEKTOR-113
status: done-me
context: nafura
type: qa
agent_type: qa
priority: P0
assignee: agent
gate: none
blocked_by: [SEKTOR-106, SEKTOR-107, SEKTOR-108]
---

# Preuves identite Extraire

> Preuves e2e des etapes 106/107/108. Contrat gelé DECISIONS-PRODUIT.md § Identité + Extraire (20/08).

## Étapes

- [x] Exécuter e2e 106, 107, 108 (Mode B, API 8082) — ne pas les réécrire
- [x] Relier chaque étape des trois features à une preuve exécutée
- [x] Vérifier la discrimination (journaux exec rouge-avant)
- [x] Verdict + rapport ; done-agent sur 106/107/108 et cette qa

## Journal

```
20/08 19:58  posée
20/08 19:58  status → doing
20/08 20:05  e2e parallèle : 106 ok · 108 ok · 107 FAIL count 16→17 (course 106/108)
20/08 20:06  e2e 107 seul : PASS 2.1s
20/08 20:07  e2e 106+107+108 --workers=1 : 3 passed (2.6s)
20/08 20:08  units ItemService + ExtraireIdentite + ExtraireCreation + DecompositionPropose : BUILD SUCCESSFUL
20/08 20:02  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      rien produit. Preuves jouées sur API Mode B `localhost:8082` (cursor-session 200). Front `127.0.0.1:4200` up, non requis (e2e API).
critères prouvés     **106** Item 1–1 unique → e2e `identite-item-cle-stable.spec.ts` POST 201 puis duplicate **409** `item.cle_stable.duplicate` ; bind `fournisseur-ref` **200** `createdItem=false` count inchangé, cle inconnue **400**. Unit `createRefusesDuplicateCleStableOnTenant` + `bindFournisseurRefDoesNotCreateItem`. Unique live = migrate `007_item_cle_stable`.
                     **107** classer ne persiste pas → e2e `extraire-identite-deux-seaux.spec.ts` `classer-identite` **200**, seau ∈ {DEJA_TENANT,A_CREER,INCERTAIN}, GET identite **200** vs **404**, count inchangé. Déjà-tenant / pas LIKE / 2+ INCERTAIN → units `dejaTenant_siIdentiteUniqueEtItemExiste`, `llmIndisponible_aCreerSansLike`, `incertain_siDeuxIdentites_nePrendPasLeMeilleurScore`, `separeDeuxSeaux_dejaTenantSansCreation_aCreerSansEcrire` (jamais `createAllege`). Tiny spec → unit `promptIgnoreTinySpec_peintureBlancheNEstPasUneIdentite` (prompt, pas output LLM).
                     **108** absent → PUBLIER + Item → e2e `extraire-creer-publier-sektor.spec.ts` **201** `createdSektor=true` `createdItem=true`, articles PUBLIE +1 ; replay même `cle_stable` `createdSektor=false` pas de 2ᵉ fiche ; candidats G2 inchangé. Identité déjà là sans Item → unit `identiteDejaPublieeSansItem_creeItemSeul`.
discrimination       journaux exec, pas rejouée (code déjà en JVM) : **106** deux POST 201 avant unique ; **107** GET identites 404 / classer 500 ; **108** extraire-creer 500. Cohérent avec les e2e (sans endpoint = rouge).
décidé seul          107 rouge en parallèle = course de `items/count` avec 106/108, pas une écriture de `classer-identite` — relancé `--workers=1` (3 passed). Pas de fail sur match incertain ni tiny spec note d’emploi (ouverts produit, déjà inbox). e2e 107 n’asserte pas `DEJA_TENANT` (LLM off → A_CREER admis) : chemin couvert par unit, pas un trou sans preuve.
écarts / dette       Tiny spec non persistée (prompt seulement) — inbox note d’emploi. Match incertain : pas de trancher UI — inbox. Champ `cle_stable` JPA achats encore absent (écart 106). Verdict **PASS**.
