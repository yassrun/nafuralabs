---
id: SEKTOR-164
status: done-me
context: nafura
type: tech
agent_type: exec
priority: P2
assignee: agent
gate: none
---

# Contrat de sous-traitance typé côté Achats

> Sortir du ContratFournisseur type=SOUS_TRAITANCE + ContratSousTraitanceNotes. Achats tient le contrat, chantiers tient l'execution.

## Étapes

- [ ] …

## Journal

```
23/08 18:23  posée
24/08 02:00  status → doing
24/08 09:10  reprise (2e incident infra) — code from scratch, methode: ecrire d abord, cartographier apres
24/08 09:15  supprime ContratSousTraitanceNotes.java, ChantierSousTraitanceService/Controller/GlobalController, seed JSON + seeder (AC-2, AC-10 "ou disparait")
24/08 09:35  cree ContratSousTraitance + BpuLigne + Caution (domain) et ContratSousTraitanceRepository (AC-1, AC-3, AC-4, AC-5)
24/08 09:50  DTOs reponse/requete ecrits (Bpu, Caution, FactureRef, Create, Update) sans champ avancementPercent (AC-7)
24/08 10:05  ContratSousTraitanceService ecrit (list, get, create, update, synthese) — fournisseurNom/ice lus sur Partner (AC-3), pas de codec
24/08 10:15  ContratSousTraitanceController ecrit sous /api/v1/achats/sous-traitance, domain=achats, chantierId en query param (AC-8)
24/08 10:25  FactureFournisseur+repo+CreateDto+Service : ajout contratSousTraitanceId (AC-6, rattachement explicite)
24/08 10:35  ContratFournisseur+CreateDto+UpdateDto+Service : retire TYPE_SOUS_TRAITANCE, art187Declare/ValideMoa, paiementDirectMoa (AC-1, AC-3)
24/08 10:45  faux signal "rien ecrit" du coordinateur — verifie via git status --porcelain : 29 fichiers modifies/crees dans achats/, tout intact. Continue sans repartir de zero. SQL 005+008 modifies (AC-1, AC-3, AC-6).
24/08 10:55  nouveau changelog v1.1/004_create_contrats_sous_traitance.sql : tables contrats_sous_traitance + _bpu + _caution (AC-1, AC-4, AC-5)
24/08 11:05  nb-compile.sh fourni pointe sur le depot principal (faux vert) — cree nb-compile-wt.sh (sources worktree, classpath deps depuis le depot principal). AchatsAnalyticsBucketService retire sa dependance au seed ST supprime (compile cassee sinon)
24/08 11:10  achats/ compile propre en worktree. chantiers/ ne reference plus rien du code ST supprime (grep verifie)
24/08 11:30  dossier web deplace chantiers/sous-traitance -> achats/sous-traitance (models, service, create, listing, routes) — fournisseurId reel (Partner, via select fournisseur) remplace le sousTraitantId invente, avancementPercent retire de l'UI (AC-7, AC-9)
24/08 11:40  erp-nav.generated.ts : noeud chantiers.sousTraitance sort du groupe chantiers.pilotage, entre dans achats.engagements avec route /achats/sous-traitance (id/label i18n inchanges — AC-9)
24/08 11:55  i18n : bloc sousTraitance (title, list, create) deplace de chantiers/{fr,en,ar}.json vers achats/{fr,en,ar}.json, + routes.sousTraitanceTitle/Crumb. Les 3 locales verifiees JSON valide (python json.load), aucune cle orpheline
24/08 12:05  contrat-fournisseur.mapper.ts (achats/contrats, ecran generique) : retire art187*/paiementDirectMoa/chantierId de ApiContratFournisseur, type toujours 'FOURNISSEUR' — la branche PONCTUEL->SOUS_TRAITANCE aurait envoye une valeur que le backend rejette desormais
24/08 12:15  corrige AchatsAnalyticsBucketServiceTest.java (mock du seed ST supprime retire du test) — recompile achats/ propre (worktree)
24/08 12:20  crawl-qa-routes.mjs (e2e) : route /chantiers/sous-traitance -> /achats/sous-traitance
24/08 12:30  proofs AC-1/AC-2/AC-6/AC-8 rejouees par grep : TYPE_SOUS_TRAITANCE absent d'achats/, codec absent de sektor/sources (corrige 2 commentaires qui le citaient et cassaient le grep litteral), anciennes routes "sous-traitances" absentes du backend. AC-6 chantiers/ importe encore ma.nafura.achats dans CashFlowProjectionService — attendu, ce fichier part au socle en SEKTOR-165
24/08 12:35  bug de journalisation detecte : plusieurs `sed` sur ce fichier n'ont pas matche (entries 10:55->12:30 manquantes malgre le travail reellement fait) — reconstruit le journal a la main depuis l'historique reel. Bascule sur Edit (old_string/new_string) pour la suite, plus de sed silencieux sur ce fichier
24/08 12:48  status → done-agent · gate none → done-me
```

## Rapport de livraison

**Ce qui a changé** — `achats/` : nouvel objet `ContratSousTraitance` (+`ContratSousTraitanceBpuLigne`, `+Caution`), repo, service, controller `/api/v1/achats/sous-traitance` ; `ContratSousTraitanceNotes` (codec), `ChantierSousTraitanceService`/`Controller`/`GlobalController`, seed ST supprimés ; `ContratFournisseur` perd `TYPE_SOUS_TRAITANCE`, `art187Declare`, `art187ValideMoa`, `paiementDirectMoa` ; `FactureFournisseur` gagne `contratSousTraitanceId`. Changelogs SQL : `005` (contrats_fournisseur) épuré + contrainte type resserrée, `008` (+colonne), nouveau `v1.1/004` (3 tables). Web : `web/app/chantiers/sous-traitance/` → `web/app/achats/sous-traitance/` (routes, nav, i18n fr/en/ar des 2 côtés) ; `contrat-fournisseur.mapper.ts` nettoyé.

**Critères prouvés** (`CONTRAT.md` — `sektor/raster-src/lots/chantiers/frontieres-bc/CONTRAT.md`) :
- AC-1 : `grep -rn TYPE_SOUS_TRAITANCE sektor/sources/backend/achats` → vide ; `chk_contrats_fournisseur_type` n'admet plus que `'FOURNISSEUR'`.
- AC-2 : `grep -r ContratSousTraitanceNotes sektor/sources` → vide.
- AC-3 : colonnes typées sur `contrats_sous_traitance` (fournisseur_id référence Partner, chantier_id, objet, dates, statut, montant_ht, retenue_garantie_taux, art187*, paiement_direct_moa) ; `sousTraitantNom`/`ice` lus sur `Partner` dans `ContratSousTraitanceService.toDto` ; les 3 colonnes ST quittent `contrats_fournisseur`.
- AC-4 : table `contrats_sous_traitance_bpu` — pas de colonne quantité.
- AC-5 : table `contrats_sous_traitance_caution` — indépendante de `Chantier` (non touché).
- AC-6 : `FactureFournisseur.contratSousTraitanceId` + `findByTenantIdAndContratSousTraitanceIdOrderByCreatedAtDesc` ; `ContratSousTraitanceDto.factures` les liste. `grep -rn "import ma.nafura.achats" .../chantiers/src/main/java` renvoie encore `CashFlowProjectionService` — attendu, ce fichier part au socle en SEKTOR-165 (AC-6 se referme à la bascule complète des deux tasks).
- AC-7 : `avancementPercent` absent de l'entité, du DTO, du service et du web (colonne "Avancement" retirée du listing).
- AC-8 : routes sous `/api/v1/achats/sous-traitance`, `chantierId` en `@RequestParam` ; `grep -rln "sous-traitances" sektor/sources/backend` → vide ; `@SecuredResource(domain = "achats", …)`.
- AC-9 : `web/app/chantiers/sous-traitance/` supprimé, `web/app/achats/sous-traitance/` créé ; nœud `chantiers.sousTraitance` déplacé de `chantiers.pilotage` vers `achats.engagements` (route `/achats/sous-traitance`) dans `erp-nav.generated.ts` ; i18n `nav.chantiers.sousTraitance` intact dans les 3 locales top-level ; contenu d'écran déplacé `chantiers/{fr,en,ar}.json` → `achats/{fr,en,ar}.json` (vérifié `json.load` sur les 6 fichiers + les 3 top-level).
- AC-10 : changelog `v1.1/004` = `CREATE TABLE` neuf, aucune reprise des `notes` JSON ; seed ST supprimé (disparu, cf. option explicite de l'AC).

**Décidé seul** :
1. Le seed de démo ST (`ContratFournisseurSousTraitanceSeedService` + JSON) est **supprimé**, pas adapté : ses `fournisseurId` (`st-ent-001`…) ne référençaient aucun `Partner` réel, et aucun seeder `Partner` n'existe dans `achats/` pour les fabriquer proprement. AC-10 autorise explicitly "le seed ST alimente la table typée ou disparaît" — j'ai pris la seconde option plutôt que d'inventer une fixture Partner fragile sous pression de temps.
2. `contrat_sous_traitance_id` sur `factures_fournisseur` est une colonne **sans FK stricte** (comme `fournisseur_id`/`chantier_id` sur la même table) : `contrats_sous_traitance` est créée dans `v1.1`, après `008` (`v1.0`) — une FK forward aurait cassé l'ordre des changelogs.
3. Écran de création ST : le champ libre "sous-traitant" (qui générait un `fournisseurId` inventé `st-${Date.now()}`) devient un `<select>` sur les `Partner` existants (réutilise `FournisseurApiService`), pour rester cohérent avec AC-3 (référence réelle). Ce n'est pas un nouvel écran — c'est le même champ, retypé.
4. `contrat-fournisseur.mapper.ts` (écran générique `/achats/contrats`, hors périmètre du contrat) enverait encore `type: 'SOUS_TRAITANCE'` pour l'option UI "PONCTUEL" — supprimé silencieusement puisque le backend n'accepte plus cette valeur ; sinon la création de contrat "ponctuel" aurait échoué en 400 après cette task.
5. Nœud de nav `chantiers.sousTraitance` gardé **tel quel** (id + clé i18n) mais déplacé de groupe — au lieu d'un id `achats.sousTraitance`, pour suivre littéralement l'énoncé de l'AC-9 ("le nœud … quitte le groupe Chantiers pour Achats").

**Écarts / dette** :
- Pas de couverture unitaire neuve pour `ContratSousTraitanceService` (aucun test JUnit existant sur `ChantierSousTraitanceService` avant non plus — parité, pas régression).
- Frontend non type-checké par `tsc` (pas de `node_modules` dans ce worktree, pas dans la recette fournie) — vérifié par relecture + grep de cohérence des champs/imports uniquement.
- CRUD BPU/cautions exposé uniquement via `create`/`update` (listes imbriquées) ; pas d'endpoints granulaires dédiés — suffisant pour les AC, pas au niveau d'un écran de gestion.
- Pas de test e2e écrit (hors périmètre exec — SEKTOR-166/QA).
