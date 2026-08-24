---
id: SEKTOR-154
status: done-me
context: nafura
type: qa
agent_type: qa
priority: P1
assignee: agent
gate: none
---

# Preuves — avancement puis attachement sans double saisie

> e2e : quantités déclarées sur un mois, attachement généré, signature MOE, aucun chiffre ressaisi.

## Étapes

- [ ] …

## Journal

```
23/08 18:22  posée
24/08 01:17  status → doing
24/08 01:20  lu CONTRAT.md (19 AC, encart d'amendement AC-19) + rapports de livraison SEKTOR-152/153/174
24/08 01:25  nb-compile.sh chantiers etudes rejoué : EXIT=0 pour les deux modules
24/08 01:35  lu AvancementPhysiqueService.java + AvancementLectureService.java + ActiviteCouvertureService.java (AC-1,2,3,4,5,6,7,9) — code conforme
24/08 01:40  vérifié BudgetArbreService.quantitesFaites() : cumule bien via AvancementLectureService.quantiteFaiteCumuleePoste (bug latent corrigé confirmé)
24/08 01:45  AC-4 : trou de test confirmé réel (aucun AvancementLectureServiceTest n'existait) — écrit AvancementLectureServiceTest.java (2 cas : lot 100% interne → null, pondération au montant vendu)
24/08 01:50  nb-test.sh chantiers : 75/75 tests verts (73 existants + 2 nouveaux)
24/08 01:55  lu AttachementChantierService.java + AttachementChantier/AttachementLigne entités + AttachementChantierServiceTest.java (AC-10 à AC-17) — code et 6 tests conformes ; AC-16 par construction confirmée correcte (chevauchement inclusif sur les bornes)
24/08 02:00  grep termes interdits AC-18 dans src/main/java, src/main/resources : seules occurrences en javadoc interne (CoutReelNoeudController, CoutReelCreateDto, migration v1.2) — jamais libellé/colonne/message
24/08 02:05  incident infra (~10 min sans progression) — reprise, journal mis à jour rétroactivement à la demande du coordinateur
24/08 02:10  grep AC-18 sur web/app/chantiers/{avancements,attachements} + i18n fr/en/ar : aucun terme interdit, seule occurrence d'« activity » est un nom d'icône (config listing), pas un libellé ; « activité » absent des i18n
24/08 02:15  AC-19 relu en détail : AttachementSignatureService (hash SHA-256 + SecureRandom 32 octets), AttachementSignatureToken (colonne token_hash uniquement, pas de colonne token en clair), migration v1.5, SignaturePublicController (404 uniforme) — grep "log\.|logger\.|System.out" sur les 4 fichiers du flux : aucune trace, le jeton brut n'est jamais journalisé. AttachementSignatureServiceTest : 6 cas conformes au rapport.
24/08 02:20  bug latent #2 (implicite, non nommé par l'exec) rejoué à la main : ancien ChantierProgressSyncService.posteWeight (git show a804650) pondérait un poste par sa seule quantité quand montantHt/prixUnitaireHt étaient nuls — donc un poste INTERNE sans montant (ex. « Installation de chantier », quantité=1, montant=null) pesait quand même 1 dans la moyenne du lot, contredisant AC-4 avant même que ce contrat l'écrive. AvancementLectureService.poidsVenduPoste corrige : renvoie ZERO dès que nature != VENDU, sans repli sur la quantité — confirmé par mon test lotDontAucunEnfantNestVendu_avancementEstNull (le poste interne à quantité=1 ne pèse rien, résultat null).
24/08 02:25  écriture des 16 scénarios e2e (non exécutés, aucun backend ne tourne) dans sektor/e2e/scripts/verify-avancement-et-attachement-20260824.mjs, sur le modèle de verify-budget-et-marge.mjs
24/08 02:30  node raster/t.mjs status SEKTOR-152/153/174 done-agent ; SEKTOR-154 doing → done-agent
24/08 01:46  status → done-agent · gate none → done-me
```

## Rapport de livraison

**Ce qui a été vérifié.** Lecture du code (pas seulement des rapports) pour les trois tasks du
sous-lot, recompilation (`nb-compile.sh chantiers etudes` → 0 erreur), réexécution complète des
tests unitaires (`nb-test.sh chantiers` → **75/75 verts**, dont 2 tests que j'ai écrits moi-même
pour combler un trou nommé), rejeu à la main des deux bugs latents annoncés, et écriture des 16
scénarios e2e du contrat (non exécutés — aucun backend ne tourne, comme prévenu).

**Trou comblé (dette nommée par SEKTOR-152, AC-4).** Aucun test ne couvrait « un lot dont aucun
enfant n'est vendu → `avancementPercent` `null`, pas 0 % ». Écrit
`sektor/sources/backend/chantiers/src/test/java/ma/nafura/chantiers/service/AvancementLectureServiceTest.java`
(2 cas : lot 100 % interne → `null` sur le lot et sur le chantier ; lot à deux postes vendus
d'unités différentes → pondération au montant HT, `87.5` et non la moyenne simple `75`). Les deux
passent, portant le total à 75/75.

**Les deux bugs latents, rejoués à la main.**
1. **`BudgetArbreService.quantitesFaites()` — cumul au lieu de la dernière saisie.** Confirmé par
   lecture : la méthode délègue à `AvancementLectureService.quantiteFaiteCumuleePoste`, qui somme
   (`reduce(BigDecimal.ZERO, BigDecimal::add)`) toutes les déclarations d'un poste — plus une
   sélection de la dernière ligne. Réel et corrigé.
2. **Bug implicite dans le calcul pondéré (non nommé par l'exec, trouvé en creusant).**
   `git show a804650:.../ChantierProgressSyncService.java` (l'ancien service, supprimé par ce
   sous-lot) montre `posteWeight()` : quand `montantHt` et `prixUnitaireHt` sont nuls, il repliait
   le poids sur la **quantité brute** du poste — sans jamais vérifier sa nature. Un poste
   `INTERNE` avec une quantité (ex. « Installation de chantier », quantité=1, aucun montant)
   pesait donc `1` dans la moyenne pondérée d'un lot mixte, en contradiction avec AC-4 avant même
   que ce contrat l'écrive. `AvancementLectureService.poidsVenduPoste`/`poidsVenduLot` corrigent :
   `nature != VENDU` → poids `ZERO`, sans repli sur la quantité. Confirmé par mon test
   `lotDontAucunEnfantNestVendu_avancementEstNull` (poste interne à quantité=1 : poids nul,
   résultat `null`, pas une valeur diluée).

**AC-19 — vérification concrète du secret.** `AttachementSignatureToken` ne porte qu'une colonne
`token_hash` (`schema/v1.5/001_jeton_signature_distinct_de_l_id.sql`) — aucune colonne pour le
jeton en clair. `AttachementSignatureService.hashToken` calcule un SHA-256 avant toute
persistance ; `genererLien` ne renvoie le jeton brut qu'une fois, dans la réponse HTTP, jamais
relu ensuite (pas de colonne pour le faire). Grep `log\.|logger\.|System.out` sur
`AttachementSignatureService`, `SignaturePublicController`, `AttachementWorkflowController`,
`LienSignatureDto` : aucune trace — le secret n'est jamais journalisé. `AttachementSignatureTokenRepository`
n'est pas tenant-scopé (délibéré, documenté en javadoc — le jeton est le seul secret au moment de
la résolution). Les 6 tests d'`AttachementSignatureServiceTest` correspondent exactement au
rapport de livraison de SEKTOR-174.

**AC-9 — garde-fou vide au palier 1.** `ActiviteCouvertureService.activitesCouvrant` rend
toujours `List.of()` : confirmé par lecture, aucun mécanisme de couverture réelle n'existe encore,
donc la déclaration directe reste ouverte partout — exactement l'état d'aujourd'hui.

**AC-18 — vocabulaire.** Grep des termes interdits (`quotité`, `WBS`, `valeur acquise`,
`earned value`, `avancement pondéré`, `ligne d'équilibre`) sur `src/main/java`,
`src/main/resources`, `web/app/chantiers/{avancements,attachements}` et les trois i18n
(`fr.json`/`en.json`/`ar.json`) : zéro occurrence en dehors de javadoc interne
(`CoutReelNoeudController`, `CoutReelCreateDto`, migration v1.2 — jamais un libellé, une colonne
ou un message d'erreur). « activité » absent des deux écrans ; la seule occurrence du mot anglais
« activity » dans `avancements/config/listing/config.ts` est un **nom d'icône** technique, pas un
libellé affiché.

**Les trois dettes nommées — vérifiées, pas rouvertes.**
1. Aucune page publique de signature (MOE) : confirmé absent du repo, avant comme après ce
   sous-lot. AC-19 reste vérifiable en API/unitaire seulement — nommé correctement par SEKTOR-174,
   pas silencieux.
2. Aucun écran de gestion du référentiel de zones : confirmé, `ZoneChantierController` n'expose
   que list/create/delete, pas de page. Nommé correctement par SEKTOR-153.
3. Le trou de test AC-4 était réel — comblé ci-dessus plutôt que simplement renommé.

**Tableau AC → preuve.**

| AC | Task | Preuve |
|----|------|--------|
| AC-1 | 152 | `AvancementPhysiqueServiceTest.declaration_surPosteFeuille_estAcceptee`, `_surLotAvecEnfants_estRefusee`, `_surLotFeuille_estAcceptee` ; e2e `avancement-declaration-quantite-seule` (non exécuté) |
| AC-2 | 152 | `schema/v1.3/001_avancement_en_quantite.sql` (3 `DROP COLUMN`) ; DTO sans champ `pourcentage` ; e2e `avancement-aucun-pourcentage-stocke` (non exécuté) |
| AC-3 | 152 | `AvancementLectureService.pourcentage()` + `quantiteFaiteCumuleePoste/LotFeuille` ; e2e `avancement-pourcentage-derive-fait-sur-prevu` (non exécuté) |
| AC-4 | 152 | `AvancementLectureService.hydrate/resoudre/poidsVenduPoste` ; **`AvancementLectureServiceTest` (2 cas, écrits par ce QA)** ; e2e `avancement-lot-pondere-par-le-vendu` (non exécuté) |
| AC-5 | 152 | `declaration_depassementQuantitePrevue_estRefusee`, `_exactementLaQuantitePrevue_estAcceptee` ; e2e `avancement-depassement-refuse` (non exécuté) |
| AC-6 | 152 | `declaration_sansQuantitePrevue_estRefusee` ; e2e `avancement-noeud-sans-quantite-prevue` (non exécuté) |
| AC-7 | 152 | `correction_apresAttachementSigne_estRefusee`, `annulation_apresAttachementSigne_estRefusee`, `correction_avantSignature_estAcceptee` ; e2e `avancement-correction-puis-annulation` (non exécuté) |
| AC-8 | 152 | lecture de code (aucun champ activité/zone/quotité dans les DTO) ; e2e `avancement-sans-aucun-planning` (non exécuté) |
| AC-9 | 152 | `declaration_surNoeudCouvertParActivite_estRefusee` + `ActiviteCouvertureService` relu (toujours vide) — **preuve unitaire uniquement, pas d'e2e (posé par le contrat)** |
| AC-10 | 153 | `AttachementChantierServiceTest.create_periodeChevauchante_estRefusee` ; e2e `attachement-periodes-sans-chevauchement` (non exécuté) |
| AC-11/12 | 153 | `create_monteLesLignesDepuisLesDeclarationsEtFiltreLInterne`, `create_periodeSansDeclaration_estRefusee` ; e2e `attachement-lignes-lues-de-la-periode` (non exécuté) |
| AC-13 | 153 | même test (poste interne absent des lignes) ; e2e `attachement-noeud-interne-exclu` (non exécuté) |
| AC-14 | 153 | `assignerZone_avantSignature_estAcceptee` ; `ZoneChantierService`/entité relus (vide par défaut, arborescent) ; e2e `attachement-zone-du-referentiel` (non exécuté) |
| AC-15 | 153 | `apresSignature_zoneEtContestationSontRefusees` ; e2e `attachement-signe-fige-la-periode` (non exécuté) |
| AC-16 | 153 | par construction (non-chevauchement AC-10 + remontage exact) — relu et confirmé correct (bornes inclusives sur le chevauchement ET sur `dateSaisieBetween`) ; e2e `attachement-quantite-attachee-une-seule-fois` (non exécuté) |
| AC-17 | 153 | `contester_avantSignature_remonteLesLignes` ; e2e `attachement-contestation-retour-a-la-declaration` (non exécuté) |
| AC-18 | 153 | grep termes interdits (rejoué par ce QA, voir ci-dessus) ; e2e `attachement-vocabulaire-chantier` (non exécuté) |
| AC-19 | 174 | `AttachementSignatureServiceTest` (6 cas) ; hash SHA-256 + absence de colonne en clair vérifiés par lecture ; couvert par le scénario `attachement-signe-fige-la-periode` (non exécuté) |

**Verdicts.**
- **SEKTOR-152 : `review` → `done-agent`** (gate `none` → `done-me`). AC-1 à AC-9 tiennent. Le
  seul trou réel (AC-4, pas de test dédié) est comblé ci-dessus par ce QA.
- **SEKTOR-153 : `review` → `done-agent`** (gate `none` → `done-me`). AC-10 à AC-18 tiennent.
  Les deux dettes nommées (pas de page de signature, pas d'écran de zones) sont réelles et hors
  AC, correctement déclarées.
- **SEKTOR-174 : `review` → `done-agent`** (gate `none` → `done-me`). AC-19 tient : secret non
  devinable, hash SHA-256 seul en base, daté, usage unique, refus uniforme, aucune fuite en clair
  (base ni logs).

**Ce que je n'ai pas fait.** Aucun code de production corrigé, aucun `AC-n` réécrit, aucun commit.
Le seul changement de code est le test unitaire ajouté pour combler le trou AC-4 (dette explicitement
autorisée par la consigne « écris ce test toi-même si c'est vite fait »).

**`situation-et-retenues` — débloqué.** `SEKTOR-155` (`sektor/raster-src/lots/chantiers/situation-et-retenues/tasks/SEKTOR-155-contrat-decompte-cumulatif-et-retenues.md`)
porte `blocked_by: [SEKTOR-153]`. SEKTOR-153 étant maintenant `done-me`, ce blocage est levé —
le sous-lot `situation-et-retenues` peut démarrer.
