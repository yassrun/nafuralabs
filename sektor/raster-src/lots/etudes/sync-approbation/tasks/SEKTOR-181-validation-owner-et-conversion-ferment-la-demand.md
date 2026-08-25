---
id: SEKTOR-181
status: review
context: nafura
type: bug
agent_type: exec
priority: P1
assignee: agent
gate: none
tags: [etudes, approbations]
---

# Validation Owner et conversion ferment la demande ETUDE_PRIX

> Inbox Approbations garde les études converties (walk QA Owner) : valider en Owner saute le moteur, convertir ne clôture pas.

## Étapes

- [x] `valider` / `refuser` Owner synchronisent le moteur (plus de skip)
- [x] Dernière validation + conversion (y compris rejeu) clôturent la demande
- [x] `annuler` dossier annule la demande ouverte
- [x] Inbox : `ANNULE` n'est plus remappé en « à traiter »
- [x] Preuves unitaires moteur + dossier

## Journal

```
25/08 12:18  posée
25/08 12:18  status → doing
25/08 12:22  Owner skipait approuverEtape ; convertir ne fermait rien
25/08 12:28  cloreApprouvee / cancel moteur ; filet convert replay
25/08 12:32  tests verts ApprovalEngine + QuatreYeux + ChainageAval
25/08 12:24  status → review
```

## Rapport de livraison

ce qui a changé      `DossierEtudeService.valider` pousse le moteur même en Owner ; dernière étape + `convertir` (rejeu inclus) appellent `cloreApprouvee` ; `annuler` dossier → `ANNULE`. Inbox mappe `ANNULE` hors « à traiter ».
critères prouvés     `owner_derniereEtape_clotureLaDemandeMoteur` · `owner_n1_avanceLeMoteurSansClore` · `convertir_rejoue_clotureLaDemandeMoteurResiduelle` · `approveRemaining_drainsUntilApprouve` · `cancel_closesOpenRequest` — `./gradlew :sektor:socle:test --tests ApprovalEngineServiceTest :sektor:etudes:test --tests DossierEtudeValidationQuatreYeuxTest --tests DossierEtudeChainageAvalTest` vert.
décidé seul          Filet conversion = approuver le reste (métier déjà validé), pas annuler. Les 2 cartes Walk QA déjà converties se ferment au rejeu `convertir` (après reboot API) ou via Rejeter/Approuver inbox.
écarts / dette       Les 2 demandes déjà en base restent ouvertes tant que l'API n'a pas redémarré + rejeu convert ou action inbox. Pas d'e2e Playwright (crash C:/ connu).
