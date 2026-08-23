# INBOX

<!-- Capture globale Raster — task draft : une ligne = description, @tag optionnel, pas d'ID. -->
sektor picker-article : sorties / pertes / inventaire / inventory-tx-panel / etat-stock encore `loadArticles` dump GET /items — hors SEKTOR-144 (réception/retour/transfert seulement) @sektor
sektor picker-article : import BL réception résolvait les lignes via dump `articlesAll` (GET /items size 500) — dump retiré pour AC-10 ; matching code à rebrancher sur `/items/search` @sektor
sektor picker-article : filtres listing stock-balances / inventory-tx-lines encore `lookupKey: items` — pas le détail tarif/solde ; listing articles hors v1 @sektor
sektor e2e completer-parcours / parcours-qa : specs attendent encore `app-consultation-etude-panel` (retiré SEKTOR-136). Preuve 136 = `verify-consultation-achat-136.mjs`. @sektor
sektor e2e parcours-qa-*.spec.ts : `npx playwright test` crash « Requiring @playwright/test second time » (chemins C:/ vs c:/). Preuves 115/119–123 = Mode B 20/08. Specs non réécrits. @sektor
sektor e2e SEKTOR-137 : spec Playwright optionnelle (même crash C:/ vs c:/). Preuve = `node sektor/e2e/scripts/verify-consultation-achat-137.mjs`. SEKTOR-110 e2e compte encore `consultations_etudes` — gate 137 ne les voit plus. @sektor
sektor e2e SEKTOR-136 : chrome overlay assert encore le formulaire select+cases+deux CTA (cassé par SEKTOR-139). Preuve overlay = `node sektor/e2e/scripts/verify-consultation-achat-139.mjs`. Spec Playwright 139 non écrite (C:/ vs c:/). @sektor
sektor : portail invité chrome-less (lien email+token, vue client + dépôt devis fournisseur) — livré hors Pact (Sektor pas encore pacté) @sektor
document-extraction : colonnes JPA `extracted_record.workflow_status` / `doc_type_definition.builder_state` encore en base alors que compose/décider ne sont plus exposés — drop lab à trancher @platform
document-extraction : libellés i18n validate/workflow encore présents alors que l'action décider n'est plus exposée @platform
impression CH-03 : canvas « Proposer » (IA) — aucune capacité conversation/IA consommable ici ; livré le fallback manuel (textarea). Brancher Proposer quand le BC conversation sera consommable. @platform
sektor études Extraire : match **incertain** (2+ identités) — faire trancher l’humain, ou meilleur score IA ? ouvert DECISIONS-PRODUIT ; SEKTOR-107 ne doit pas inventer @sektor
sektor études Extraire : tiny spec couleur en **note d’emploi** dès v1, ou seulement le lien identité ? ouvert DECISIONS-PRODUIT @sektor
sektor études Extraire : L9 `createAllege` / `contribuer` encore hors Extraire (SEKTOR-108 non touché) @sektor
sektor e2e Extraire : `npx playwright test` depuis `sektor/sources/web` ne résout pas `@playwright/test` pour les specs sous `sektor/e2e/` (CJS require hors package). Preuve 118 lancée via `node sektor/e2e/scripts/verify-extraire-rattachement-118.mjs`. @sektor
sektor : console `/catalogue` G2 hors chrome tenant — **hors menu** 20/08 ; Extraire publie l’identité sans ouvrir la console — SEKTOR-108 @sektor
sektor chrome : sidebar regroupée par BC (cycle Études→…→HSE, Catalogue = articles+stock+ouvrages+matériel, Ventes sorti de Marchés) — livré 20/08, routes inchangées ; gelé raster-src/DECISIONS.md @sektor
sektor études : `:sektor:etudes:test` 21 échecs Mockito/gates/capitalisation (hors blast mètres SEKTOR-111) @sektor
sektor études : Liquibase v1.0 crée encore `metrees` puis 023 drop — nettoyage changelog lab à trancher @sektor
sektor études : clés i18n `etudesDpu.generateDpgf` / `createDevis` orphelines (SEKTOR-111) @sektor
commentaire : CommentServiceImplTest utilise entityType dpgf_noeud (mot produit) — hors scan main de la baseline INIT @platform
commentaire : erreurs exposées = message / statut HTTP, pas de code — POL-ERREUR-CODE @platform
approbation : `getEntityTypes` fuit un catalogue produit (Invoice, Quote, Receipt, Order, PurchaseOrder, Contract, Document) — POL-PAS-METIER-PRODUIT @platform
approbation : refus — commentaire obligatoire au front (`rejectCommentRequired` défaut true), optionnel au back (null accepté) @platform
approbation : `timeoutHours` / escalation stockés sur la chaîne, jamais joués par WorkflowEngine @platform
approbation : exceptions métier (CrudNotFound, IllegalArgument, IllegalState) = message seule, pas de code — POL-ERREUR-CODE @platform
conversation : erreurs exposées = HTTP + texte, pas de code — POL-ERREUR-CODE @platform
conversation : statuts ARCHIVED/CLOSED dans l'enum, aucune transition exposée @platform
conversation : actions d'une session nouvelle non listées via l'API agent (baseline sans tour, R-3) @platform
identite : erreurs invite / retrait / jeton = message (IllegalArgumentException ; parfois INVALID_OR_EXPIRED_INVITATION) — pas un code métier — POL-ERREUR-CODE @platform
identite : relancer l'invitation échoue si le courrier n'est pas parti alors que l'invite initiale crée quand même l'appartenance invitée @platform
raster app : après CH-04, `setSprint` n'existe plus dans write.mjs — raster-api.ts / api.ts / e2e socle api-delegue importent encore commit-sprint → CH-03 RAS-105/106
CADRE Raster : owns encore « vues dérivées INDEX, BACKLOG, SPRINT » et vocabulaire Sprint / unité sprintable — EVOL CADRE après clôture CH-03 chrome, pas un gate de ce sous-lot @raster
sektor e2e dpgf-noeuds-libelle-utf8.spec.ts : TDZ `const chargeEtudeUserId = await chargeEtudeUserId(...)` — crash avant le POST ; preuve 126 = curl Mode B + MockMvc, spec non réécrit @sektor
sektor : HttpMessageNotReadableException (JSON illisible) → 500 INTERNAL_ERROR via GlobalExceptionHandler, pas 400 ; filtre UTF-8 SEKTOR-116 borné à /api/v1/etudes/dpgf* @sektor
