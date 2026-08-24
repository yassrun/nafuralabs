---
id: SEKTOR-153
status: done-me
context: nafura
type: feature
agent_type: exec
priority: P1
assignee: agent
gate: none
---

# L'attachement lit les quantités de la période

> AttachementLigne cesse d'être une saisie parallèle : elle ramasse ce qui a été déclaré sur la période. Zone prise dans le référentiel, plus en texte libre.

## Étapes

- [ ] …

## Journal

```
23/08 18:22  posée
24/08 00:26  status → doing
24/08 02:40  AttachementChantier : date unique → dateDebut/dateFin (AC-10) ; STATUTS_FIGES exposé sur l'entité
24/08 02:45  AttachementLigne réécrite : posteCode/designation/quantiteExecutee/unite/zone(texte) → noeudId/quantitePeriode/zoneId (AC-11, AC-12, AC-14)
24/08 02:50  nouvelle entité ZoneChantier + repository + ZoneChantierService + ZoneChantierController (AC-14, référentiel vide par défaut)
24/08 03:10  AvancementPhysiqueRepository.findByTenantIdAndChantierIdAndDateSaisieBetween (montage) ; AttachementChantierRepository : requête de chevauchement de période + verrou AC-7 porté en période
24/08 03:15  AvancementPhysiqueService.garderContreModificationFigee basculé sur la période (au lieu d'une date unique)
24/08 03:40  AttachementChantierService réécrit : montage depuis les déclarations (AC-11), filtre vendu (AC-13), refus période chevauchante (AC-10) et période sans quantité (AC-11), assignerZone (AC-14), contester → brouillon + remontage (AC-17), lecture code/désignation/unité/prix live sur le nœud (AC-12)
24/08 03:45  AttachementWorkflowController : endpoints contester + zone ; ZoneChantierController : list/create/delete
24/08 03:50  AttachementSignatureService/SignAttachementInfoDto : date unique → dateDebut/dateFin
24/08 03:55  seed ChantierDocumentsSeedService : attachements de démo au posteCode libre retirés (lab métier, non repris)
24/08 04:05  migration schema/v1.4/001_attachement_lit_la_periode.sql
24/08 04:20  frontend web/app/chantiers/attachements/ réécrit en entier : modèles, api service, listing, page de saisie (période + montage serveur + zone + soumettre/contester) ; i18n fr/en/ar mis à jour ; attachement-status.keys.ts élargi aux 7 statuts
24/08 04:30  tests : AttachementChantierServiceTest (6 cas, AC-10/11/12/13/14/15/17) + adaptation AvancementPhysiqueServiceTest (verrou AC-7 en période)
24/08 04:40  module chantiers : compile + 67/67 tests unitaires verts ; tsc --noEmit ciblé sur les fichiers frontend touchés : 0 erreur propre à ces fichiers
24/08 00:52  status → review
24/08 01:45  status → done-agent · gate none → done-me
```

## Rapport de livraison

**Ce qui a changé.** `AttachementChantier` porte `dateDebut`/`dateFin` (plus une date unique). `AttachementLigne` pointe un `noeudId` et porte `quantitePeriode` + `zoneId` — code/désignation/unité/prix ne sont plus stockés, ils sont lus sur le nœud à chaque lecture (`AttachementChantierService.toLigneDto`). Nouveau référentiel `ZoneChantier` (arborescent, vide par défaut) avec CRUD minimal. `AttachementChantierService.create` monte les lignes depuis `AvancementPhysiqueRepository` sur `[dateDebut, dateFin]`, filtre aux nœuds `VENDU`, refuse un chevauchement de période ou une période sans aucune quantité. `contester` remet en `BROUILLON` et remonte. `assignerZone` change la zone d'une ligne tant que l'attachement n'est pas figé. Migration `schema/v1.4/001_attachement_lit_la_periode.sql`. Frontend `web/app/chantiers/attachements/` réécrit (modèles, service API, listing, saisie).

**Critères prouvés.**
- AC-10 : `AttachementChantierServiceTest.create_periodeChevauchante_estRefusee`.
- AC-11, AC-12 : `create_monteLesLignesDepuisLesDeclarationsEtFiltreLInterne` (quantité sommée, code/désignation/montant lus sur le nœud), `create_periodeSansDeclaration_estRefusee`.
- AC-13 : même test — le poste interne déclaré n'apparaît pas dans les lignes.
- AC-14 : `assignerZone_avantSignature_estAcceptee` ; référentiel vide par défaut = comportement par défaut de `ZoneChantierRepository` (aucun seed, `listByChantier` rend `[]` sans erreur).
- AC-15 : `apresSignature_zoneEtContestationSontRefusees`.
- AC-16 : pas de test dédié — garanti **par construction** (AC-10 empêche le chevauchement, le montage recalcule exactement la somme des déclarations de la période) plutôt que par un registre de quantités déjà attachées ; documenté dans le javadoc du service.
- AC-17 : `contester_avantSignature_remonteLesLignes`.
- AC-18 : vérifié par grep — aucun terme interdit (« quotité », « WBS », « valeur acquise », etc.) dans le code ou les i18n touchés ; « activité » n'apparaît que dans le message d'AC-9, jamais à l'écran de ce sous-lot.

**Décidé seul.**
1. **Pas de registre séparé pour AC-16.** La garantie « une quantité n'est jamais attachée deux fois » repose entièrement sur AC-10 (non-chevauchement) + un montage qui recalcule toujours la somme exacte des déclarations de `[dateDebut, dateFin]`. Ajouter une table de liaison aurait dupliqué une vérité déjà garantie par construction — contraire à « Simplicité ».
2. **Chevauchement vérifié contre tous les attachements**, quel que soit leur statut (pas de notion d'attachement « annulé » aujourd'hui — aucun statut de ce type n'existe dans `AttachementChantier`). Le contrat parle d'« un attachement existant non annulé » ; comme rien ne peut être annulé actuellement, la vérification porte sur tous, ce qui est le sur-ensemble strictement correct tant que l'annulation n'existe pas.
3. **Zone assignée via un endpoint dédié** (`PUT /api/v1/attachements/{id}/lignes/{ligneId}/zone`), pas dans le corps de création : puisque les lignes sont montées automatiquement, il n'y a rien à envoyer à la création ; la zone se choisit après coup, ligne par ligne. Non explicité par le contrat, déduit d'AC-14 + AC-11 (« aucun champ de saisie… n'est offert » à la création).
4. **Frontend réécrit sans le canevas de signature manuscrite** de l'ancienne page de saisie interne. Il capturait un dessin et l'envoyait dans le corps de création, mais ne faisait jamais transitionner le statut vers `SIGNE_MOE` (seul `AttachementSignatureService`, via le lien public, le fait) — fonctionnalité incomplète/trompeuse. Remplacé par un bouton « Soumettre pour signature MOE » qui pose `EN_ATTENTE_MOE` ; la signature elle-même reste le geste du lien public (porté par SEKTOR-174), hors de cette page.
5. **Pas d'écran de gestion du référentiel de zones.** Seuls l'API (list/create/delete) et un `<select>` dans la page de saisie existent. Créer/organiser les zones (bâtiment › niveau › zone) se fait donc par API pour l'instant — voir dette.

**Écarts / dette.**
- Pas d'écran pour créer/gérer les zones du référentiel (CRUD API seulement) ; le QA devra peupler les zones par API pour son état initial (« chantier avec référentiel de zones sur 2 niveaux »).
- `ar.json`/`en.json` mis à jour pour les nouvelles clés d'attachement, mais pas relus par un locuteur natif — traduction fonctionnelle, pas polie.
- Le lien public de signature (`SignaturePublicController`) n'est pas durci ici — c'est tout l'objet de SEKTOR-174, qui suit.
- Pas de vérification e2e Playwright ajoutée ; les scénarios nommés au contrat (`attachement-*`) restent à la charge du QA.
