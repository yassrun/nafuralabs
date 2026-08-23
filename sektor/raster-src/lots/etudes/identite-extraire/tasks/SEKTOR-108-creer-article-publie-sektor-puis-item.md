---
id: SEKTOR-108
status: done-me
context: nafura
type: feature
agent_type: exec
priority: P0
assignee: agent
gate: none
blocked_by: [SEKTOR-107]
tags: [etudes, catalogue]
---

# Creer article publie Sektor puis Item

> Gelé DECISIONS-PRODUIT.md 20/08 — identité déjà Sektor = Item seul ; absente = PUBLIER puis Item 1-1. Pas candidat G2. Tiny spec couleur ≠ 2e identité.

Contrat : [`DECISIONS-PRODUIT.md`](../../../../DECISIONS-PRODUIT.md) § Créer un article — Sektor d’abord. Console `/catalogue` G2 hors chrome tenant.

## Étapes

- [x] Avant d’écrire : chercher l’identité sur le **catalogue Sektor** (pas seulement le tenant).
- [x] Identité déjà là, pas d’Item → créer **seulement** l’Item lié. Pas une 2ᵉ fiche Sektor.
- [x] Identité absente → **PUBLIER** Sektor (pas candidat G2), puis Item 1–1, puis tarif / ligne DPU.
- [x] L’humain confirme la proposition Extraire. Ce n’est pas une validation dans `/catalogue`.
- [x] Preuve e2e : créer depuis Extraire n’ouvre pas la console G2 ; un `cle_stable` déjà publié ne duplique pas Sektor.

## Journal

```
20/08 19:21  posée
20/08 19:51  status → doing
20/08 19:53  tsk1 ExtraireCreationService — Sektor d’abord (cle hint ou slug), PUBLIE direct, puis Item 1–1
20/08 19:54  tsk2 POST /api/v1/items/extraire-creer ; dialog Extraire extraireCreer (pas items.create, pas G2)
20/08 19:56  e2e extraire-creer-publier-sektor.spec.ts VU ROUGE (JVM 107) : POST extraire-creer → 500
20/08 19:58  ExtraireCreationServiceTest vert
20/08 20:00  e2e 108 + 107 verts après restart JVM
20/08 19:56  status → review
20/08 20:02  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      Création Extraire = `POST /api/v1/items/extraire-creer` (`ExtraireCreationService`) : cherche `catalog_articles`, PUBLIE si absent, Item 1–1 sinon. Dialog Extraire « Créer dans le catalogue » n’appelle plus `items.create` ni `/catalogue`.
critères prouvés     unit : absent → save PUBLIE + Item ; déjà PUBLIE sans Item → Item seul ; déjà les deux → no-op. e2e : +1 article PUBLIE, replay sans 2ᵉ fiche, count candidats G2 inchangé. Vu rouge 20/08 19:56 (500) puis vert 20:00.
décidé seul          `cleStable` hint Extraire prioritaire (évite slug « peinture blanche »). BROUILLON existant → passe PUBLIE. Edition `2026.1`. Tarif poste inchangé (après Item).
écarts / dette       LLM off + création sans hint peut encore publier le slug du libellé saisi (tiny spec). Rattrapage L9 `createAllege` / `contribuer` hors Extraire, pas touché.
