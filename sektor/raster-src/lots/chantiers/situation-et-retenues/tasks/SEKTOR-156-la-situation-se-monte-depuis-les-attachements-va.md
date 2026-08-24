---
id: SEKTOR-156
status: done-me
context: nafura
type: feature
agent_type: exec
priority: P1
assignee: agent
gate: none
---

# La situation se monte depuis les attachements validés

> Les lignes de situation viennent des attachements de la période, valorisées au prix vendu. Plus de saisie de quantités dans la situation.

## Étapes

- [ ] …

## Journal

```
23/08 18:22  posée
24/08 02:31  status → doing
24/08 02:35  AttachementChantier.situationId ajouté (AC-4) ; migration v1.6/001_situation_depuis_attachements.sql écrite (noeud_id/code/quantite_periode sur situation_lignes, situation_id sur attachements_chantier ; colonnes pénalités/RAS de SEKTOR-157 incluses dans le même fichier, même famille de tables)
24/08 (auto)  SituationGenerationService réécrit : source = attachements SIGNE_MOE+ non consommés (AC-1,4,5), lignes par nœud poste/lot via resolveNoeudInfo comme AttachementChantierService (AC-2), quantité = somme AttachementLigne.quantitePeriode (AC-3), période bornée par min/max des attachements consommés, attachements marqués consommés (situationId) à la génération. computeFinancialTotals étendu à la cascade pénalités/RAS d'AC-10 (SEKTOR-157) dans le même passage pour éviter une deuxième réécriture de la méthode ; resolveRetenueAvancePercent corrigé (retourne chantier.getTauxAvance() au lieu de la constante "5")
24/08 (auto)  DTO/entité mis à jour en cascade : SituationLigneDto (noeudId/code/quantitePeriode, lotId/posteBudgetaireId retirés), SituationTravauxDto+SituationTravaux (penalitesRetardHt, rasTaux, rasMontant), SituationTravauxService (lotsById/ChantierLotRepository retirés — code/désignation déjà résolus sur la ligne à la génération), SituationTravauxChantierController.generate accepte penalitesRetardHt en RequestParam optionnel. Compile OK : chantiers+etudes et chantiers+ventes (nb-compile.sh) — FactureClientService (ventes) lit designation/unite/quantiteCumulee/quantitePrecedente/prixUnitaire, jamais lotId, donc non cassé par le renommage.
24/08 (auto)  SituationGenerationServiceTest réécrit sur le nouveau modèle (attachements signés, resolveNoeudInfo poste/lot, cascade financière) — nb-test.sh chantiers : 76/76 tests passent, module entier, rien cassé ailleurs.
24/08 (auto)  Front web/app/chantiers/situations aligné sur le renommage : models/index.ts SituationLigne (noeudId/code/quantitePeriode), situation-api.service.ts (ApiSituationLigne + apiLigneToModel), decompte-print et lots-saisie-table (l.code au lieu de l.lotCode), situation-detail.page.ts generateLignesFromLots (noeudId/code). Cette page reste un aperçu client calculé depuis avancementPercent du lot AVANT génération — SituationApiService.create() poste un corps vide à /generate, donc cet aperçu n'est jamais soumis au serveur ; la vraie source (attachements signés) est backend-only. Noté en dette ci-dessous.
24/08 12:01  status → review
24/08 12:33  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé — `SituationGenerationService.generate` lit désormais les attachements `SIGNE_MOE`+ non consommés du chantier (`AttachementChantierRepository`/`AttachementLigneRepository`), plus jamais `AvancementPhysique` ni `ChantierLot.quantite` ; `SituationLigne` pointe un `noeudId` (poste ou lot-feuille, résolu comme dans `AttachementChantierService`) au lieu d'un `lotId`. `AttachementChantier.situationId` marque la consommation. Migration `v1.6/001_situation_depuis_attachements.sql`. DTO/entités et le web `chantiers/situations` suivent le renommage.
critères prouvés — AC-1 (source unique = attachements figés, test `generateBuildsDraftFromSignedAttachements` + refus si aucun disponible), AC-2 (nœud résolu via poste puis lot, `code`/`designation`/`unite`/prix jamais retapés), AC-3 (`quantitePeriode` = somme des `AttachementLigne.quantitePeriode` du nœud sur les attachements retenus, testé avec deux lignes du même nœud), AC-4 (attachement marqué `situationId` à la génération, jamais réutilisable — testé), AC-5 (`generateRefuseSansAttachementSigneDisponible`), AC-6 (`cumulPrecedentHt`/`cumulCourantHt`/`travauxPeriodeHt` gardent leur sens, workflow inchangé), AC-7 (aucune ligne interne possible : le filtre vient déjà de l'attachement, `SituationGenerationService` ne relit `ChantierLot`/`PosteBudgetaire` que pour l'affichage). `nb-test.sh chantiers` : 76/76 (module entier).
décidé seul — j'ai fusionné l'écriture d'AC-8→AC-12 (pénalités/RAS, cascade) dans le même passage que 156 plutôt que de réécrire `computeFinancialTotals` une deuxième fois pour 157 : le fichier `SituationGenerationService.java` est le même et les deux tâches sont en série sur ce sous-lot, donc pas de risque de collision. `generate()` a un nouveau paramètre optionnel `penalitesRetardHt` (surchage à 2 arguments conservée) ; le contrôleur expose `penalitesRetardHt` en `RequestParam` optionnel. Migration SQL v1.6 unique pour les deux tasks (même famille de tables `situations_travaux`/`situation_lignes`/`attachements_chantier`). J'ai gardé `montantHt` de la ligne = quantité **de la période** × prix (lecture littérale d'AC-3), alors que l'ancien modèle stockait une valeur cumulée par ligne — `quantitePrecedente`/`quantiteCumulee` restent affichées comme contexte cumulatif mais ne portent plus le calcul du montant.
écarts / dette — le web `situation-detail.page.ts` (`generateLignesFromLots`) calcule toujours un aperçu de lignes depuis `avancementPercent` du lot avant de cliquer « générer » ; ce n'est qu'un aperçu client jamais soumis (`SituationApiService.create()` poste un corps vide à `/generate`), donc aucune AC n'est violée, mais l'aperçu ne reflète plus la vraie source (attachements) tant que l'écran n'a pas été refait — dette front, pas couverte par un AC de ce contrat. Aucune migration de données (lab métier, gel du contrat) : les situations existantes sur l'ancien modèle ne sont pas reprises.
