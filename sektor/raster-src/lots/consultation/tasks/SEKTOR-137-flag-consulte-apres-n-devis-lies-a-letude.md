---
id: SEKTOR-137
status: done-me
context: nafura
type: feature
agent_type: exec
priority: P0
assignee: agent
gate: none
blocked_by: [SEKTOR-135, SEKTOR-136]
tags: [consultation, etudes]
---

# Flag consulte apres N devis lies a letude

> Lien etude : article du panier couvert par N devis extraits -> CONSULTE + PU. Hors etude : pas de flag.

Contrat : [`DECISIONS-PRODUIT.md`](../../DECISIONS-PRODUIT.md) § lien étude. Canvas vue Flag CONSULTÉ / Hors étude.

## Étapes

- [x] Consultation **sans** lien étude : pas de flag DPU, pas d’arbre.
- [x] **Liée** : pour chaque `cle_stable` du panier, si **N** devis reçus (lignes extraites) le couvrent → `CONSULTE` + PU sur **tous** les postes de cette identité. Article du panier non couvert → pas flagué.
- [x] Gate étude optionnelle / obligatoire + min N (déjà 20/08) compte les devis **importés extraits** des consultations **liées**, pas un PDF orphelin.
- [x] Preuve : N=1, ciment extrait → CONSULTÉ 3 postes ; peinture non extraite → tarif. Hors étude → pas de flag. Vu rouge : checkbox identifier à la main.

## Journal

```
22/08 13:02  posée
22/08 13:47  status → doing
22/08 14:05  flag auto (ConsultationAchatFlagService) + gate countDevisExtraitsLies
22/08 14:08  vu rouge Mode B : gate comptait encore hors étude / PDF orphelin
22/08 14:12  preuve verte verify-consultation-achat-137.mjs après reload 8082
22/08 13:54  status → review
22/08 13:57  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      `ConsultationAchatFlagService` : import lié → CONSULTÉ + PU sur tous les postes de l’identité couverte (N devis extraits). Hors étude : port non appelé. Gate 4 = `countDevisExtraitsLies` (imports extraits des consultations liées). Preuve `sektor/e2e/scripts/verify-consultation-achat-137.mjs`.
critères prouvés     hors étude → DPU reste TARIF ; liée N=1 ciment extrait → CONSULTÉ ×3 + PU 1083,75 sans POST identifier ; peinture non extraite → TARIF ; gate obligatoire min 1 : orphelin/hors étude ne compte pas, 1 import lié lève.
décidé seul          PU le plus bas si plusieurs devis couvrent la même cle (comme 112). Pas d’alimentation catalogue fournisseur (identifier 112 le faisait). Flag après PATCH panier si la consultation est / devient liée. Spec Playwright non écrite (dual-require C:/ vs c:/ → inbox).
écarts / dette       SEKTOR-110 e2e tape encore `consultations_etudes` — la gate ne les compte plus. Checkbox identifier du panneau legacy encore dans le dépôt (plus sur la page Coût).
