---
id: SEKTOR-170
status: done-me
context: nafura
type: feature
agent_type: exec
priority: P1
assignee: agent
gate: none
blocked_by: [SEKTOR-169]
tags: [sektor, ux]
---

# Client et fournisseur sur les écrans

> Plus de dump pageSize 500. Debounce → `partnersByRole(role, q)`. Devis, BC, contrat métier, chantier et facture de vente. Preuves détaillées dans le plan du lot.

## Étapes

- [x] Brancher client / fournisseur sur devis, BC achat, contrat fournisseur, chantier (création / édition), facture de vente. Contrat [`CONTRAT.md`](../CONTRAT.md) : **AC-11**.
- [x] Recherche serveur code + raison sociale, debounce, code exact en tête, actifs par défaut. **AC-3**, **AC-4**. Interdire le dump à l’ouverture.
- [x] 0 hit et erreur réseau sans CTA créer, sans perdre la valeur posée. **AC-9**, **AC-10**.
- [x] Preuve scénarios `lookup-client-devis` et `lookup-fournisseur-bc`.

## Journal

```
23/08 18:47  posée
23/08 19:21  status → doing
23/08 19:55  tsk1 q sur listByRole (code + raison sociale, exact code en tête) · LOOKUP_SEARCHERS clients/fournisseurs
23/08 19:56  tsk2 facades devis/BC/contrat/facture + chantier create/edit : plus de dump pageSize 500
23/08 19:57  preuve verify-lookup-combobox-170.mjs VERT
             (discriminerait pageSize 500 / partnersByRole(role) sans q / pas de Réessayer)
23/08 19:50  status → review
23/08 20:31  status → doing
             QA 172 : 170.mjs FAIL — cherche clients:/fournisseurs: dans app.config ; factories dans erp-lookup-searchers.ts
25/08 14:56  preuve 170 rejouée VERT après alignement du script sur buildErpLookupSearchers + erp-lookup-searchers.ts
25/08 14:04  status → done-agent · gate none → done-me
25/08 14:30  status → review
25/08 18:19  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      Client / fournisseur : plus de dump `pageSize: 500`. Saisie ≥ 2 car. → `partnersByRole(role, q)` (debounce 300 ms). `LOOKUP_SEARCHERS` branché sur devis, BC, contrat, facture (entity-detail) et chantier create/edit. 0 hit / erreur réseau : message + Réessayer, pas de CTA Créer. Valeur posée conservée (seed par id / nom).
critères prouvés     AC-3,4,9,10,11 → `sektor/e2e/scripts/verify-lookup-combobox-170.mjs` VERT. Scénarios `lookup-client-devis` / `lookup-fournisseur-bc`. Discrimination : dump `pageSize: 500` ou `partnersByRole('CLIENT')` sans q ferait échouer le script.
décidé seul          Partner n’a pas de flag `actif` : « actifs par défaut » = tous les partenaires du rôle (pas de filtre possible). Filtres listing client/fournisseur restent vides tant que 171 ne les branche pas — acceptable, noté.
écarts / dette       Listing filters (devis, BC, …) encore vides : SEKTOR-171. Autres `lookupKey` (chantier, employé, dépôt, …) : 171. Picker article inchangé (AC-13). La preuve 170 n'est plus couplée à l'ancienne localisation inline des factories.
