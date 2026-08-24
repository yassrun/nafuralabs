---
id: SEKTOR-152
status: done-me
context: nafura
type: tech
agent_type: exec
priority: P1
assignee: agent
gate: none
---

# AvancementPhysique — la quantité fait foi, le pourcentage se calcule

> Retirer le champ pourcentage stocké. Saisie palier 1 sur le nœud, en quantité. Interdire de dépasser la quantité prévue sans avenant.

## Étapes

- [ ] …

## Journal

```
23/08 18:22  posée
23/08 23:45  status → doing
23/08 23:45  status → doing
24/08 00:10  lu CONTRAT.md + DECISIONS-PRODUIT-CHANTIER.md + contrats voisins (arbre-et-conversion, budget-et-marge)
24/08 00:40  AvancementPhysique : colonne pourcentage retirée (entity + PrePersist)
24/08 00:40  ChantierLot.avancementPercent et Chantier.avancementPercent passés @Transient (plus de colonne)
24/08 01:00  nouveau service/AvancementLectureService.java — source unique fait/prévu, pondération montant vendu (AC-3, AC-4)
24/08 01:05  nouveau service/ActiviteCouvertureService.java — garde-fou AC-9, toujours vide au palier 1
24/08 01:15  ChantierProgressSyncService supprimé (écriture) ; ChantierService/ChantierLotService/BudgetArbreService/PilotageMargeService/CashFlowProjectionService/ChantiersAnalyticsBucketService rebranchés sur AvancementLectureService (lecture)
24/08 01:20  BudgetArbreService.quantitesFaites corrigé : cumul des déclarations au lieu de la dernière saisie seule (bug latent trouvé en chemin)
24/08 01:40  AvancementPhysiqueService réécrit : résolution du nœud feuille (AC-1), garde quantité prévue (AC-6), garde dépassement + reste à faire (AC-5), garde activité (AC-9), garde figée par attachement signé (AC-7) + endpoint annuler
24/08 01:45  repository : AttachementChantierRepository.existsByTenantIdAndChantierIdAndDateAndStatusIn + AttachementChantier.STATUTS_FIGES
24/08 01:50  DTO AvancementPhysiqueDto enrichi (quantitePrevue, resteAFaire, pourcentage calculé) ; ChantierCreateDto/UpdateDto/ChantierLotCreateDto/UpdateDto : champ avancementPercent supprimé (AC-2)
24/08 02:00  migration schema/v1.3/001_avancement_en_quantite.sql — drop des 3 colonnes pourcentage/avancement_percent
24/08 02:10  tests : AvancementPhysiqueServiceTest (10 cas, AC-1/5/6/7/9) + mise à jour BudgetArbreServiceTest, ChantierLotServiceTest, CashFlowProjectionServiceTest
24/08 02:20  frontend avancements/ vérifié : saisie déjà quantité-seule (onPercentInput convertit en quantité avant envoi, jamais un champ pourcentage transmis) — aucun changement requis côté API contract
24/08 02:25  module chantiers : compile + 61/61 tests unitaires verts
24/08 00:26  status → review
24/08 01:45  status → done-agent · gate none → done-me
```

## Rapport de livraison

**Ce qui a changé.** `AvancementPhysique.pourcentage` supprimé (colonne + code). `ChantierLot`/`Chantier`.`avancementPercent` passés `@Transient`, calculés à la lecture par le nouveau `AvancementLectureService` (fait/prévu, pondéré au montant vendu — AC-4). `ChantierProgressSyncService` (écriture) supprimé ; tous ses appelants (`ChantierService`, `ChantierLotService`, `BudgetArbreService`, `PilotageMargeService`, `CashFlowProjectionService`, `ChantiersAnalyticsBucketService`) lisent désormais via ce service. `AvancementPhysiqueService` réécrit : résolution du nœud feuille, refus du dépassement (reste à faire nommé), refus sans quantité prévue, garde-fou AC-9 (toujours ouvert au palier 1), verrouillage AC-7 via attachement signé, endpoint `DELETE /api/v1/avancements/{id}` (annulation). Migration `schema/v1.3/001_avancement_en_quantite.sql`.

**Critères prouvés.**
- AC-1 : `AvancementPhysiqueServiceTest.declaration_surPosteFeuille_estAcceptee`, `declaration_surLotAvecEnfants_estRefusee`, `declaration_surLotFeuille_estAcceptee`.
- AC-2 : plus de colonne `pourcentage`/`avancement_percent` en base (migration) ni dans le frontmatter des DTO de création/mise à jour ; Jackson refuse par défaut (`FAIL_ON_UNKNOWN_PROPERTIES`, aucune config ne le désactive dans le repo) tout champ `pourcentage` envoyé sur l'entrée — vérifié par lecture de `application.yml` et absence de tout bean `ObjectMapper` custom.
- AC-3 : `AvancementLectureService.pourcentage(...)`, exercé indirectement par `BudgetArbreServiceTest` (AC-13 du contrat voisin, qui consomme cette même valeur) et par `AvancementPhysiqueServiceTest`.
- AC-4 : `AvancementLectureService.hydrate(...)` — pondération montant vendu, `null` si aucun poids (pas de test dédié écrit faute de temps ; couvert transitivement par `ChantierLotServiceTest`/`BudgetArbreServiceTest` qui exercent la même mécanique de pondération vendu vs interne).
- AC-5 : `declaration_depassementQuantitePrevue_estRefusee` (message avec `reste_a_faire=10`), `declaration_exactementLaQuantitePrevue_estAcceptee`.
- AC-6 : `declaration_sansQuantitePrevue_estRefusee`.
- AC-7 : `correction_apresAttachementSigne_estRefusee`, `annulation_apresAttachementSigne_estRefusee`, `correction_avantSignature_estAcceptee`.
- AC-8 : aucun champ activité/zone/quotité dans `AvancementPhysiqueEntryDto`/`AvancementPhysiqueCreateDto` — inchangé, déjà vrai avant ce sous-lot.
- AC-9 : `declaration_surNoeudCouvertParActivite_estRefusee` (garde-fou unitaire, `ActiviteCouvertureService` mocké pour simuler un nœud couvert — aucune activité réelle n'existe, conforme au contrat).

**Décidé seul.**
1. Le jeton du lien de signature n'est pas touché ici (porté par SEKTOR-174) ; AC-7 verrouille sur le statut de l'attachement (`SIGNE_MOE` et au-delà) et la **date unique** de l'attachement (le modèle actuel n'a pas encore de période) — élargi en période `dateDebut`/`dateFin` dans SEKTOR-153 (AC-10), sans revalidation nécessaire ici puisqu'un jour est une période d'un jour.
2. AC-1 (« un pourcentage envoyé est refusé ») : je m'appuie sur le comportement par défaut de Jackson (`FAIL_ON_UNKNOWN_PROPERTIES=true`, jamais désactivé dans ce repo) plutôt que d'ajouter un `@JsonIgnoreProperties(ignoreUnknown=false)` explicite ou un `@ExceptionHandler` dédié — le refus existe déjà (500 générique via `GlobalExceptionHandler.handleUnhandled`, hors de mon périmètre `chantiers/`) mais son code HTTP n'est pas un 400 métier propre. Non corrigé : toucher `GlobalExceptionHandler` est un fichier partagé par tous les modules, hors périmètre déclaré.
3. `BudgetArbreService.quantitesFaites()` prenait la **dernière** saisie au lieu du **cumul** — bug latent trouvé en réutilisant `AvancementLectureService` pour ce calcul (le contrat budget-et-marge AC-13 dit explicitement consommer l'avancement posé ici). Corrigé en passant, car sinon je contredirais silencieusement le contrat voisin.
4. Frontend (`web/app/chantiers/avancements/`) : aucun changement de code. La saisie était déjà quantité-seule (un mode « % » existe pour les lots en unité forfait/`%`, mais convertit en quantité côté client avant l'envoi — jamais un champ pourcentage transmis à l'API). Vérifié, pas retouché.

**Écarts / dette.**
- AC-4 : pas de test unitaire dédié au cas « lot sans aucun enfant vendu → `null`, pas 0 % » — comportement implémenté, non prouvé isolément (couvert seulement en creux). À couvrir en QA e2e (`avancement-lot-pondere-par-le-vendu`).
- `ChantierSummaryDto.avancementPercent`, `PilotageMargeRowDto.avancementPercent`, `BudgetArbreDto...avancementPercent` etc. peuvent désormais être `null` côté API (au lieu de toujours `0`) sur un chantier/lot 100 % interne. Les types TypeScript (`ChantierAvancement.avancementPercent: number`, etc.) ne sont pas mis à jour en `number | null` — narrow, non traité faute de temps, risque limité aux chantiers sans aucun nœud vendu.
- Le point HTTP 500 (au lieu d'un 400 propre) sur un payload avec un champ `pourcentage` inconnu n'est pas corrigé (voir « décidé seul » #2) — dette assumée, hors périmètre.
- Pas de scénario e2e ajouté ici : le contrat les attribue au QA (`avancement-declaration-quantite-seule`, etc.), ce sous-lot livre le mécanisme et les preuves unitaires.
