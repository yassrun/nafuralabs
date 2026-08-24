---
id: SEKTOR-158
status: done-me
context: nafura
type: qa
agent_type: qa
priority: P1
assignee: agent
gate: none
---

# Preuves — décompte cumulatif jusqu'à la facture

> e2e : trois situations enchaînées, cumul juste, retenues appliquées dans l'ordre, passage en facture.

## Étapes

- [ ] …

## Journal

```
23/08 18:22  posée
24/08 12:31  status → doing
24/08 (auto)  Lu CONTRAT.md (13 AC) + rapports de livraison SEKTOR-156/SEKTOR-157.
24/08 (auto)  Code réel relu (pas seulement les rapports) : SituationGenerationService.java
              (generate + computeFinancialTotals + resolveRetenueAvancePercent), migration
              v1.6/001_situation_depuis_attachements.sql, SituationGenerationServiceTest.java,
              situation-api.service.ts, situation-detail.page.ts (diff git avant/après pour le
              bug decompteLive), AttachementChantier.java (STATUTS_FIGES), repository query.
24/08 (auto)  nb-compile.sh chantiers ventes etudes → EXIT=0 les trois modules.
24/08 (auto)  nb-test.sh chantiers → 76/76, module entier, aucun échec — confirme le chiffre du
              rapport de livraison, rejoué indépendamment.
24/08 (auto)  Vérifié le bug corrigé sur resolveRetenueAvancePercent par git diff ciblé : l'ancien
              code faisait bien `return new BigDecimal("5");`, le nouveau `return
              chantier.getTauxAvance();` — la constante a disparu, confirmé sur le diff, pas
              seulement sur le rapport.
24/08 (auto)  Vérifié le bug decompteLive (situation-detail.page.ts) par git diff : avant,
              cumulCourantHt sommait les montantHt de ligne (traités comme cumul) puis
              travauxPeriodeHt = cumulCourantHt − cumulPrecedentHt (double soustraction fausse
              depuis qu'AC-3 fait de montantHt une valeur de période) ; après, travauxPeriodeHt =
              somme directe des montantHt de période, cumulCourantHt = cumulPrecedentHt +
              travauxPeriodeHt. Correction réelle, cohérente avec AC-3/AC-6.
24/08 (auto)  Décision "montantHt = valeur de période" (SEKTOR-156, décidé seul) confirmée comme
              lecture correcte d'AC-3 : "Le montant HT de la ligne est cette quantité multipliée
              par le prix unitaire vendu du nœud" — la quantité en question est définie juste
              avant comme la quantité de la période. Pas de lecture alternative défendable.
24/08 (auto)  Vérifié moi-même (au-delà de ce que l'orchestrateur avait déjà confirmé) : AC-11 sur
              VentesSituationFactureAdapter/FactureClientService.createFromSituation — ne lit ni
              rasTaux ni rasMontant.
24/08 (auto)  Vocabulaire (AC-13) vérifié par grep indépendant sur
              sektor/sources/web/app/chantiers/situations et
              sektor/sources/web/public/assets/i18n/applications/erp/chantiers/ : aucun terme
              interdit (quotité, WBS, valeur acquise, earned value, ligne d'équilibre, activité).
24/08 (auto)  Dette generateLignesFromLots vérifiée sur SituationApiService.create() : le corps
              posté à /generate est bien `{}` (numero/penalitesRetardHt en query params) —
              confirmé que l'aperçu client n'est jamais soumis, la dette signalée par l'exec n'est
              pas silencieuse.
24/08 (auto)  Aucun backend ne tourne : écrit sektor/e2e/scripts/verify-situation-et-retenues.mjs
              (NON EXÉCUTÉ, forme reprise de verify-budget-et-marge.mjs), un scénario par ligne du
              tableau § Scénarios e2e du contrat (AC-1 à AC-13). node --check → syntaxe OK.
24/08 (auto)  node raster/t.mjs check → 0 erreur, 32 warnings préexistants sans rapport avec ce
              sous-lot.
24/08 (auto)  Verdict : les 13 AC tiennent sur le code réel. SEKTOR-156 → done-agent, SEKTOR-157 →
              done-agent, SEKTOR-158 → done-agent.
24/08 12:33  status → done-agent · gate none → done-me
```

## Rapport de livraison

Verdict : **les 13 AC du contrat tiennent**, vérifiés sur le code réel (pas seulement sur les rapports de livraison SEKTOR-156/SEKTOR-157), plus deux corrections rapportées par l'exec confirmées par diff. `SEKTOR-156` → `done-agent`, `SEKTOR-157` → `done-agent`, `SEKTOR-158` → `done-agent`.

Vérifications transverses :
- `nb-compile.sh chantiers ventes etudes` → `EXIT=0` sur les trois modules (rejoué moi-même).
- `nb-test.sh chantiers` → **76/76**, module entier (rejoué moi-même, chiffre confirmé indépendamment du rapport).
- `node raster/t.mjs check` → 0 erreur, 32 warnings préexistants sans lien avec ce sous-lot.
- Bug `resolveRetenueAvancePercent` : `git diff` confirme l'ancien `return new BigDecimal("5");` remplacé par `return chantier.getTauxAvance();` (`SituationGenerationService.java:319-324`) — la constante a bien disparu.
- Bug `decompteLive` : `git diff` sur `situation-detail.page.ts` confirme l'ancien calcul en double-soustraction (`cumulCourantHt` = somme des lignes, `travauxPeriodeHt` = `cumulCourantHt − cumulPrecedentHt`) remplacé par le bon sens (`travauxPeriodeHt` = somme directe des montants de période, `cumulCourantHt` = `cumulPrecedentHt + travauxPeriodeHt`) — correction réelle, cohérente avec AC-3/AC-6.
- Décision seule de l'exec (`montantHt` de ligne = valeur de **période**, pas cumulative) : confirmée comme la lecture correcte d'AC-3 — le texte de l'AC définit explicitement la quantité comme celle de la période avant de poser `montantHt = quantité × prix`. Pas de lecture alternative défendable.
- Dette `generateLignesFromLots` (aperçu client jamais soumis) : confirmée non silencieuse — `SituationApiService.create()` poste un corps vide (`{}`) à `/generate`, `numero`/`penalitesRetardHt` en query params seulement (`situation-api.service.ts:324-338`).

| AC | Preuve | Verdict |
|----|--------|---------|
| AC-1 | `SituationGenerationService.generate` lit `attachementRepository.findByTenantIdAndChantierIdAndStatusInAndSituationIdIsNullOrderByDateDebutAsc(..., AttachementChantier.STATUTS_FIGES)` — jamais `AvancementPhysique`/`ChantierLot.quantite` (aucun import, aucun appel). `STATUTS_FIGES` = `SIGNE_MOE, EN_ATTENTE_MOA, CONTRESIGNE_MOA, CONTESTE, CLOS` (`AttachementChantier.java:41-42`), exclut `BROUILLON`/`EN_ATTENTE_MOE`. Test `generateBuildsDraftFromSignedAttachements` vert. e2e `situation-lignes-depuis-attachements-signes`, `situation-attachement-non-signe-ignore` (écrits, non exécutés). | tient |
| AC-2 | `resolveNoeudInfo` lit poste puis lot-feuille, jamais retapé (`SituationGenerationService.java:214-222`). Test capture `code="P01"` lu sur le poste mocké. e2e `situation-lignes-depuis-attachements-signes`, `situation-poste-vendu-sous-lot-interne`. | tient |
| AC-3 | `quantitePeriodeParNoeud` = somme des `AttachementLigne.quantitePeriode` groupées par nœud sur les attachements retenus ; `montantHt = quantitePeriode × prixUnitaire` (`SituationGenerationService.java:111-128`). Test `generateSommeParNoeudEtLitLeLot` : deux lignes du même nœud (30+20) → `quantitePeriode=50`, `montantHt=500.00`. Décision "période, pas cumul" confirmée correcte. | tient |
| AC-4 | Requête filtre `SituationIdIsNull` ; à la génération, chaque attachement consommé reçoit `attachement.setSituationId(situation.getId())` (`SituationGenerationService.java:204-208`). Test vérifie `attCaptor.getValue().getSituationId()`. e2e `situation-attachement-consomme-une-seule-fois`. | tient |
| AC-5 | `attachements.isEmpty()` → `IllegalStateException("chantiers.situation.aucun_attachement_signe: " + chantierId)` (`SituationGenerationService.java:100-103`). Test `generateRefuseSansAttachementSigneDisponible` vert. e2e `situation-sans-attachement-signe-refusee`. | tient |
| AC-6 | `cumulPrecedentHt`/`cumulCourantHt`/`travauxPeriodeHt` gardent leur forme (`SituationGenerationService.java:155-156`), workflow non touché dans ce fichier. `decompteLive` web corrigé pour respecter le même sens (période → cumul, pas l'inverse). e2e `situation-decompte-cumulatif-deux-periodes`. | tient |
| AC-7 | Les lignes viennent exclusivement de `attachementLignes` (filtrées en amont par le contrat voisin, non re-vérifié ici sur consigne). `resolveNoeudInfo` ne lit `ChantierLot`/`PosteBudgetaire` que pour l'affichage d'un nœud déjà retenu, jamais pour en ajouter un. e2e `situation-poste-vendu-sous-lot-interne`. | tient |
| AC-8 | `penalitesRetardHt` est un paramètre explicite de `generate(...)`, jamais dérivé ; `null`/négatif → zéro (`SituationGenerationService.java:161-163`). `SituationApiService.create()` poste `penalitesRetardHt` en query param (saisie, pas calcul). e2e `situation-cascade-penalites-rg-avance-ras`. | tient |
| AC-9 | `rasTaux` vient de `chantier.getTauxRas()` (`SituationGenerationService.java:170`), aucun champ de saisie de RAS sur la situation ; `percentOf` rend zéro si `percent == null` (`SituationGenerationService.java:305-312`). Test `computeFinancialTotalsAtZeroPenalitesEtRas` : `rasTaux=null` → `rasMontant=0.00`. | tient |
| AC-10 | `computeFinancialTotals` applique l'ordre exact du tableau contractuel : pénalités déduites en premier de l'assiette RG/avance, RG et avance en parallèle sur cette assiette, net HT = travaux − pénalités − RG − avance, TVA sur net HT, RAS sur net TTC (`SituationGenerationService.java:263-303`). Test `computeFinancialTotalsAppliesFixedCascade` vérifie les montants exacts (assiette 19000, RG 1330, avance 1900, net HT 15770, net TTC 18924, RAS 946.20). | tient |
| AC-11 | Vérifié moi-même sur le port réel : `VentesSituationFactureAdapter`/`FactureClientService.createFromSituation` ne référencent ni `rasTaux` ni `rasMontant`, seulement `netAPayerHt`/`netAPayerTtc`/`tvaTaux`/`retenueGarantiePercent`/`retenueAvanceMontant`/`lignes`. `SituationToFacturePort` non modifié par ce sous-lot. | tient |
| AC-12 | Avec `penalitesRetardHt=0` et `rasTaux=null`, `computeFinancialTotals` rend `penalitesRetardHt=0.00`, `rasMontant=0.00`, RG/avance/net HT/net TTC calculés normalement (test `computeFinancialTotalsAtZeroPenalitesEtRas`). Aucun champ obligatoire côté DTO (`penalitesRetardHt` a une surcharge à 2 arguments dans `generate`). | tient |
| AC-13 | Grep indépendant sur `sektor/sources/web/app/chantiers/situations` et `sektor/sources/web/public/assets/i18n/applications/erp/chantiers/` : aucun des termes interdits (quotité, WBS, valeur acquise, earned value, ligne d'équilibre, activité). | tient |

**e2e écrits, non exécutés** — aucun backend ne tourne dans cette session (contrainte donnée). `sektor/e2e/scripts/verify-situation-et-retenues.mjs` fixe le contrat d'exécution : un scénario par ligne du tableau `## Scénarios e2e` du `CONTRAT.md`, endpoints réels (`POST .../situations/generate?numero=&penalitesRetardHt=`, `GET .../situations/cumul-precedent`, `GET /api/v1/situations/{id}`), forme reprise de `verify-budget-et-marge.mjs`/`verify-avancement-et-attachement-20260824.mjs`. `node --check` → syntaxe OK. AC-11 y est aussi documenté par lecture de code (comme dans le rapport SEKTOR-157), en plus d'un scénario prêt pour le jour où `convert-to-facture` sera rejouable de bout en bout.

**Dette confirmée, pas de régression cachée** — la prévisualisation client (`generateLignesFromLots` dans `situation-detail.page.ts`) reste cosmétique : `SituationApiService.create()` poste un corps vide à `/generate`, donc cet aperçu n'est jamais soumis au serveur et ne peut violer aucun AC. Signalée nommément dans les deux rapports de livraison, pas silencieuse.
