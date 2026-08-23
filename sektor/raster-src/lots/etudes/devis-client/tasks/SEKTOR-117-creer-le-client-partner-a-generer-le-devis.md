---
id: SEKTOR-117
status: done-me
context: nafura
type: feature
agent_type: exec
priority: P0
assignee: agent
gate: none
tags: [etudes, devis]
---

# Creer le client Partner a Generer le devis

> Sans client Partner, bandeau + toast. Demander si on cree le client, sinon on ne peut pas generer.

Cible produit (inbox, pas gelé UX fine) : [`DECISIONS-PRODUIT.md`](../../../../DECISIONS-PRODUIT.md) § Devis — demander si on **crée le client**.

## Étapes

- [x] À « Générer le devis » sans Partner : dialog / flux pour **créer le client** (raison sociale depuis MOA si présente) puis générer.
- [x] Annuler = pas de devis, bandeau conservé. Confirmer = Partner créé + devis.
- [x] Ne pas inventer un second écran Ventes. Réutiliser l’API Partner existante.
- [x] Preuve e2e : dossier validé sans client → créer → devis existe. Vu rouge avant (toast « Sélectionnez un client Partner »).

## Journal

```
20/08 21:12  posée
20/08 21:35  status → doing
20/08 21:48  tsk1 dialog prompt « Créer le client Partner » (MOA préremplie) → POST /api/v1/partners rôle CLIENT → POST generer-devis { clientId }
20/08 21:48  tsk2 genererDevis accepte clientId : VALIDEE n'est plus PUT-modifiable
20/08 21:48  tsk3 preuve : DossierEtudeServiceClientTest + node sektor/e2e/scripts/verify-devis-client-117.mjs
20/08 21:43  vu rouge : POST generer-devis {} et { clientId } → 400 etudes.gate.chiffrage.client_manquant (i18n « Sélectionnez un client Partner… »)
20/08 21:45  après restart bootRun : {} reste 400 ; { clientId } → 200 DEVIS_GENERE
20/08 21:48  status → review
20/08 21:51  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      Header « Générer le devis » : dialog créer Partner (raison sociale = MOA) puis `POST /api/v1/partners` + `POST …/generer-devis` avec `clientId`. Back : `GenererDevisDto` lie le Partner sur un dossier VALIDEE.
critères prouvés     Sans Partner → 400 `client_manquant` (vu rouge / garde). Partner + `clientId` → `devisGenereId` + `DEVIS_GENERE` (`verify-devis-client-117.mjs`). Annuler = return avant API (bandeau conservé).
décidé seul          Prompt design-system (pas un écran Ventes). Code Partner auto `CLI-{8}`. `clientId` sur generer-devis plutôt qu'un PUT en-tête (VALIDEE verrouillé). Preuve runnable = script node (Playwright dual-require déjà inbox).
écarts / dette       Spec Playwright UI (`devis-client-creer-partner.spec.ts`) non exécutable ici — même blocage `@playwright/test` que SEKTOR-118. Partner orphelin si create OK et génération KO.
