---
id: SEKTOR-165
status: done-me
context: nafura
type: tech
agent_type: exec
priority: P2
assignee: agent
gate: none
---

# Le pilotage portefeuille remonte au socle

> PilotageController et ChantiersAnalyticsController : le multi-chantiers part au socle, la lecture d'un chantier reste dans chantiers.

## Étapes

- [ ] …

## Journal

```
23/08 18:23  posée
24/08 12:48  status → doing
24/08 12:50  demarre — perimetre AC-11..AC-17 : PilotageController, CashFlowProjectionService, PilotageMargeService, ChantiersAnalyticsController/BucketService, ChantierKpiController/Service quittent chantiers/ pour socle/, interfaces cote socle (forme CatalogLookupApi)
24/08 13:10  analyse : CatalogLookupApi est declare+implemente cote catalogue (provider), pas cote consommateur — mais le contrat dit explicitement "interfaces declarees dans socle". socle scanBasePackages inclut tous les BC (ErpApplication) donc un @Service dans chantiers/achats/marches/rh qui implements une interface socle est auto-cable par Spring, sans code app/ a ecrire. achats/marches/rh n'ont pas encore de dependance vers socle (a ajouter, pas de cycle : socle ne depend jamais d'eux)
24/08 13:15  aucun seed de permissions trouve dans le depot (grep chantiers.pilotage.read/analytics.read/kpis.read → 0 hit hors code+CONTRAT.md) — AC-16 n'a rien a mettre a jour, code de permission garde le meme string
24/08 13:30  cree socle/pilotage/port/ : ChantierPortefeuilleApi (+Chantier/Situation/BudgetRealiseSnapshot), MarchesPortefeuilleApi (+Facture/ContratMarcheSnapshot), AchatsFacturationPortefeuilleApi (+FactureFournisseurSnapshot), RhPaiePortefeuilleApi (+FichePaieSnapshot) — records purs, meme forme que CatalogItemSnapshot
24/08 13:45  cree socle/pilotage/api/dto/ (5 DTOs copies depuis chantiers/api/dto, package renomme)
24/08 14:00  cree socle/pilotage/service/CashFlowProjectionService.java — logique identique, repos remplaces par les 4 ports, statuts marches/achats repris en constantes locales (les classes domain restent hors socle)
24/08 14:10  cree socle/pilotage/service/PilotageMargeService.java — memes ports (Chantier, Marches)
24/08 14:20  cree socle/pilotage/service/ChantiersAnalyticsBucketService.java (AC-14) — ChantierPortefeuilleApi seul
24/08 14:30  cree socle/pilotage/service/ChantierKpiService.java (AC-14 bis) — ChantierPortefeuilleApi.listBudgetRealise() remplace BudgetChantierRepository/BudgetLigneRepository, agregation realise/revise deleguee a l'adapter chantiers
24/08 14:40  cree les 3 controllers socle/pilotage/api/controller/ (Pilotage, ChantiersAnalytics, ChantierKpi) — URLs et codes de permission inchanges (AC-15, AC-16), @SecuredResource domain=socle
24/08 14:45  ecrit ChantierPortefeuilleApiImpl (chantiers/) : seed+repo -> snapshots. BudgetChantierRepository n'a pas de findByTenantId declare mais l'herite de TenantScopedRepository — utilisable tel quel
24/08 15:00  ecrit MarchesPortefeuilleApiImpl (marches/), AchatsFacturationPortefeuilleApiImpl (achats/), RhPaiePortefeuilleApiImpl (rh/) — 3 adaptateurs du port socle
24/08 15:10  build.gradle : achats/marches/rh gagnent project(':sektor:socle') (pas de cycle, socle ne depend jamais d'eux) ; chantiers perd achats+marches, garde rh (AC-12)
24/08 15:15  supprime dans chantiers/ : 3 controllers (Pilotage, ChantiersAnalytics, ChantierKpi), 4 services (CashFlowProjectionService, PilotageMargeService, ChantiersAnalyticsBucketService, ChantierKpiService), 5 DTOs — AC-17. Test CashFlowProjectionServiceTest deplace+reecrit sous socle/pilotage/service (mock des ports, meme assertion)
24/08 15:20  compile socle/ (worktree) — 0 erreur
24/08 15:30  compile socle+marches+achats+rh+chantiers+etudes (worktree, ordre de dependance) — 0 erreur partout. AC-12, AC-13 verifies mecaniquement (build vert)
24/08 15:40  proofs rejouees par grep : socle/build.gradle 0 dep BC, 0 import ma.nafura.<bc>.domain/.repository dans socle/, 0 fichier des 7 deplaces sous chantiers/, chantiers/build.gradle ne porte plus que socle+rh, AC-6 (SEKTOR-164) desormais vide (import achats disparu de chantiers/ avec CashFlowProjectionService)
24/08 15:45  verifie web/app/socle/{pilotage,dashboard,analytics}/ et sektor/e2e/pilotage-analyses-kpis.spec.ts non touches (git status). Nav chantiers.pilotage (situations/budget) intact — non renomme, non deplace
24/08 13:36  status → done-agent · gate none → done-me
```

## Rapport de livraison

**Ce qui a changé** — `socle/pilotage/` (nouveau) : 3 controllers (`PilotageController`, `ChantiersAnalyticsController`, `ChantierKpiController`), 4 services (`CashFlowProjectionService`, `PilotageMargeService`, `ChantiersAnalyticsBucketService`, `ChantierKpiService`), 5 DTOs, 4 ports (`ChantierPortefeuilleApi`, `MarchesPortefeuilleApi`, `AchatsFacturationPortefeuilleApi`, `RhPaiePortefeuilleApi`) + leurs snapshots records. `chantiers/` perd les 7 classes + 5 DTOs correspondants, gagne `ChantierPortefeuilleApiImpl` (implémente le port). `achats/`, `marches/`, `rh/` gagnent chacun un `*PortefeuilleApiImpl` + la dépendance Gradle vers `socle`. `chantiers/build.gradle` perd `achats`/`marches`, garde `rh`. Test `CashFlowProjectionServiceTest` déplacé vers `socle/pilotage/service`, réécrit sur les ports mockés.

**Critères prouvés** (`CONTRAT.md`) :
- AC-11 : `PilotageController`/`CashFlowProjectionService`/`PilotageMargeService` vivent sous `socle/pilotage/`.
- AC-12 : `chantiers/build.gradle` sans `:sektor:achats` ni `:sektor:marches` ; `project(':sektor:rh')` conservé ; compile vert (worktree, `socle+marches+achats+rh+chantiers+etudes`).
- AC-13 : `socle/build.gradle` — 0 `project(':sektor:<bc>')` ; `grep -rn "import ma.nafura.(chantiers|achats|marches|rh|...)\.(domain|repository)" socle/src/main/java` → vide. Les données arrivent par 4 interfaces déclarées dans `socle/pilotage/port`, implémentées dans chaque BC, câblées par le scan Spring de `app/` (`ErpApplication` scanne tous les packages `ma.nafura.*`) — même mécanisme que `CatalogLookupApi`, sans code `app/` à écrire.
- AC-14 : `ChantiersAnalyticsController`/`ChantiersAnalyticsBucketService` sous `socle/pilotage/`.
- AC-14 bis : `ChantierKpiController`/`ChantierKpiService` sous `socle/pilotage/` ; `societeId` reste optionnel, calcule sur tout le tenant via `ChantierPortefeuilleApi`.
- AC-15 : `@RequestMapping` inchangés (`/api/v1/pilotage/cash-flow-projection`, `/marges`, `/api/v1/chantiers/analytics`, `/api/v1/chantiers/kpis`) ; mêmes paramètres, même logique de calcul (code porté à l'identique, seuls les accès repository→port ont changé de forme) ; `web/app/socle/{pilotage,dashboard,analytics}/` et `sektor/e2e/pilotage-analyses-kpis.spec.ts` non modifiés (vérifié `git status`).
- AC-16 : codes `chantiers.pilotage.read`, `chantiers.analytics.read`, `chantiers.kpis.read` conservés tels quels sur les nouveaux controllers socle. Aucun seed de rôles dans le dépôt ne référence ces codes (grep vide) — rien à mettre à jour, conforme à la note du contrat ("la seule preuve attendue est AC-15").
- AC-17 : `find chantiers/src/main/java -iname "PilotageController.java" -o -iname "CashFlowProjectionService.java" -o -iname "PilotageMargeService.java" -o -iname "ChantiersAnalyticsBucketService.java" -o -iname "ChantierKpiController.java" -o -iname "ChantierKpiService.java" -o -iname "ChantiersAnalyticsController.java"` → vide.
- Piège de nommage (constat CONTRAT.md) : le groupe de nav `chantiers.pilotage` (situations, budget) n'a pas été touché — vérifié, aucun fichier web modifié dans cette task.

**Décidé seul** :
1. **Forme du découplage** : le contrat renvoie à « même forme que `CatalogLookupApi` », mais `CatalogLookupApi` est déclarée ET implémentée côté fournisseur (catalogue), pas côté consommateur. Ici la direction est inversée (socle est consommateur des BC). J'ai suivi la phrase explicite du contrat (« interfaces déclarées dans socle, implémentées par les BC ») plutôt que la disposition exacte de l'exemple : interfaces dans `socle/pilotage/port`, implémentées par des `@Service` dans chaque BC, découvertes par le component-scan de `app/` (`ErpApplication` scanne déjà tous les `ma.nafura.*`) — donc aucun code de câblage à écrire dans `app/`, la DI Spring suffit.
2. **Snapshots plutôt que DTOs miroir des entités** : les ports renvoient des `record` minimalistes (uniquement les champs lus par les 4 services) plutôt que des copies complètes des entités `Chantier`/`SituationTravaux`/etc. Périmètre plus étroit, moins de surface à maintenir si un BC change son schéma interne.
3. **`BudgetRealiseSnapshot` pré-agrégé** : `ChantierKpiService` recevait des `BudgetLigne` bruts avant ; le nouveau port renvoie directement `realiseHt`/`reviseHt` sommés par chantier — l'agrégation reste dans `chantiers/` (qui possède le domaine budget), socle ne fait que consommer le résultat. Évite d'exposer `BudgetLigne` (classe interne chantiers) dans un port socle.
4. **Statuts métier repris en constantes littérales** dans les services socle (`"PAYEE"`, `"EN_COURS"`, etc.) faute de pouvoir importer les constantes `FactureMarche.STATUS_PAYEE` etc. (classes domain hors de portée de socle). Risque de dérive si un BC renomme un statut sans toucher socle — dette mineure, déjà présente ailleurs dans le code sous cette forme (comparaisons de chaînes de statut).
5. **`@SecuredResource(domain = "socle", …)`** sur les 3 nouveaux controllers (au lieu de `"chantiers"`) : vérifié que `domain` ne sert qu'à dériver un code par défaut quand `@RequirePermission` n'est pas posé explicitement (toujours le cas ici) — changement cosmétique, sans risque sur AC-16.

**Écarts / dette** :
- Pas de nouveau test pour `PilotageMargeService`, `ChantiersAnalyticsBucketService`, `ChantierKpiService` (aucun test n'existait avant le déplacement non plus — parité).
- Les adaptateurs `*PortefeuilleApiImpl` n'ont pas de test dédié (mapping direct entité→record, risque faible).
- Vérification runtime (démarrage Spring, appel HTTP réel, valeurs identiques à données égales) non faite — hors de portée sans lancer l'appli complète ; laissé à SEKTOR-166/QA.
- Six autres `/api/v1/<domaine>/analytics` et huit `/api/v1/<domaine>/kpis` restent non uniformisés (question ouverte de SEKTOR-163, explicitement hors périmètre).
