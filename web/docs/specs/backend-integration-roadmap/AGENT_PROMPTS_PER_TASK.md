# Prompts agents — **un prompt par tâche backend (B-XX-NN)**

> **Usage :** copier-coller le prompt correspondant à la tâche dans une nouvelle session agent.
> **Source de vérité :** `web/docs/specs/backend-integration-roadmap/00-PROGRESS.md`.
> **Audit d'origine :** `web/migration_plan.md` + `web/docs/specs/backend-integration-roadmap/00-MOCK-INVENTORY.md`.

---

## Règles communes (préfixe à coller en tête de **chaque** prompt si besoin)

```text
Règles projet :
- Repo : monorepo Nafura. Backend dans `backend/`, frontend Angular dans `web/`.
- Workspace agent : `backend/` pour le code Java + `web/` pour la désinjection mock.
- AVANT de coder : lire OBLIGATOIREMENT
  - `web/docs/specs/backend-integration-roadmap/00-ARCHITECTURE.md` (patterns socle, layout, conventions)
  - `web/docs/specs/backend-integration-roadmap/00-PROGRESS.md` (statut courant — ne pas refaire ce qui est `[x]`)
  - le fichier de spec de la wave concernée (`0X-<module>.md`)
- PAS de générateur. Tout le code Java est écrit à la main en suivant le pattern de `backend/domains/item/`.
- Socle obligatoire :
  - `extends CrudController<UUID, TEntity, TCreateDto, TUpdateDto>` pour les contrôleurs
  - `extends JpaCrudService<UUID, TEntity, TCreateDto, TUpdateDto>` pour les services
  - `extends TenantScopedRepository<UUID, TEntity>` pour les repositories
- Layout : `backend/domains/<module>/src/main/java/ma/nafura/<module>/{api/controller,api/request,domain/model,mapper,repository,service}/`.
- Multi-tenant strict : champ `tenant_id` obligatoire sur toute entité métier.
- Aucune logique métier dans le contrôleur ; tout dans le service custom.
- Tests JUnit obligatoires pour chaque endpoint custom.
- Désinjection mock progressive : pour chaque entité backend livrée, mettre à jour le ou les `*-api.service.ts` et `*.facade.ts` frontend concernés.
- Mettre à jour `00-PROGRESS.md` à la fin (statut + colonne evidence + date + agent).
- Conventions Angular existantes :
  - Devise affichée : `| mad` (jamais `| currency`).
  - i18n : pas de FR/EN inline ; toutes les clés via `TranslateService`.
  - Multi-tenant frontend : filtrer par `currentSocieteId` si applicable.
- Ne pas casser les modules déjà migrés (`[x]` dans `00-PROGRESS.md`).
- Après chaque tâche : `./gradlew :domains:<module>:build` + `./gradlew :applications:erp:bootRun` + `ng build` doivent passer.
```

---

# Wave 0 — Shared Foundation

## B-FND-01 — Stabilisation `item` / `stock` / `currency`

```text
Tu es l'agent en charge de la tâche B-FND-01.

Spec : `web/docs/specs/backend-integration-roadmap/01-shared-foundation.md` (section B-FND-01).
Wave : 0 (foundation). Aucune dépendance.

Goal : garantir que les 12 services `*-api.service.ts` Class A frontend (déjà pure HTTP) fonctionnent réellement contre le backend `item` / `stock` / `currency` existants.

Livrables :
1. Audit des `basePath` Angular vs `@RequestMapping` Java pour les 12 services Class A listés dans la spec.
2. Vérification du format `Page<T>` (content / totalElements) renvoyé par `CrudController.list` : test contractuel avec `FeatureApiService`.
3. Activation et test de l'endpoint `/lookup` pour : Item, ItemCategory, ItemType, UnitOfMeasure, UoMCategory, Warehouse, Currency, PaymentTerm.
4. Compléter les `searchFields` manquants dans chaque `*Service`.
5. Smoke test e2e : `ng serve` + `./gradlew :applications:erp:bootRun` → vérifier que les 12 pages frontend chargent sans erreur 404/500.
6. Mise à jour `00-PROGRESS.md` ligne B-FND-01.

Fichiers à toucher :
- `backend/domains/item/src/main/java/ma/nafura/item/api/controller/*.java`
- `backend/domains/item/src/main/java/ma/nafura/item/service/*.java`
- `backend/domains/stock/src/main/java/ma/nafura/stock/api/controller/*.java`
- `backend/domains/currency/src/main/java/ma/nafura/currency/api/controller/*.java`
- `web/app/applications/erp/pages/inventory/catalogue/{items,item-prices}/services/`
- `web/app/applications/erp/pages/inventory/configuration/{item-categories,item-types,unit-of-measures,uo-mcategories}/services/`
- `web/app/applications/erp/pages/inventory/mouvements/{inventory-txes,inventory-tx-lines}/services/`
- `web/app/applications/erp/pages/inventory/suivi/stock-balances/services/`
- `web/app/applications/erp/pages/finance/configuration/{currencies,exchange-rates,payment-terms}/services/`

Tests : unitaire `LookupResponse` format + Playwright smoke `wave0-baseline.spec.ts`.
```

---

## B-FND-02 — Domaine `partner` (clients + fournisseurs + MOA + ST)

```text
Tu es l'agent en charge de la tâche B-FND-02.

Spec : `web/docs/specs/backend-integration-roadmap/01-shared-foundation.md` (section B-FND-02).
Wave : 0. Dépendance : B-FND-01 stable.

Goal : créer le domaine pivot `backend/domains/partner` qui sert d'origine unique aux tiers (clients, fournisseurs, MOA, sous-traitants) pour toutes les futures waves.

Décision validée : 1 seule entité `Partner` polyvalente + jointure `partner_roles` (CLIENT, FOURNISSEUR, MOA, SOUS_TRAITANT). Multi-tenant strict.

Livrables :
1. Créer `backend/domains/partner/build.gradle` (alignée sur `backend/domains/item/build.gradle`).
2. Créer le layout standard :
   - `domain/model/{Partner,PartnerRole,PartnerContact,PartnerAddress,PartnerBankAccount}.java`
   - `repository/*Repository.java extends TenantScopedRepository`
   - `service/{base/,}{Partner,PartnerContact,PartnerAddress,PartnerBankAccount}Service{,Base}.java`
   - `api/controller/{base/,}*Controller{,Base}.java`
   - `api/request/Partner{Create,Update}Dto.java` + sous-entités
   - `mapper/*Mapper.java` (MapStruct)
3. Migrations Liquibase `src/main/resources/db/changelog/schema/v1.0/0[1-5]-create-*.xml`.
4. Endpoints custom :
   - `POST /api/v1/partners/{id}/roles`, `DELETE /api/v1/partners/{id}/roles/{role}`
   - Endpoints sous-entités contacts / addresses / bank-accounts
   - Filtrage `?role=CLIENT|FOURNISSEUR|MOA|SOUS_TRAITANT` sur la `list`.
5. Validation `IceValidator` (15 chiffres + clé) côté backend portant l'algo de `web/app/applications/erp/shared/validators/`.
6. Seeds Liquibase `context="seed-demo"` : reprendre les fournisseurs de `web/app/applications/erp/achats/mock/achats-mock.service.ts` et les clients de `web/app/applications/erp/ventes/mock/ventes-mock.service.ts`.
7. `./gradlew :domains:partner:build` passe + `./gradlew :applications:erp:bootRun` démarre avec le nouveau domaine.

Tests : unitaire `IceValidatorTest`, intégration `PartnerControllerIntegrationTest` (`@SpringBootTest` + Testcontainers).

Aucune désinjection frontend dans cette tâche — c'est l'objet des Waves 2 (Achats, Ventes) qui consommeront `partner`.

Mettre à jour `00-PROGRESS.md` ligne B-FND-02.
```

---

## B-FND-03 — Endpoints `/lookup` standardisés

```text
Tu es l'agent en charge de la tâche B-FND-03.

Spec : `web/docs/specs/backend-integration-roadmap/01-shared-foundation.md` (section B-FND-03).
Wave : 0. Dépendance : B-FND-01 + B-FND-02 stables.

Goal : garantir que tous les référentiels (item, stock, currency, partner) exposent l'endpoint `/lookup` de façon homogène (format { items: [{ value, label }], total }).

Livrables :
1. Auditer `web/app/applications/erp/**/*.facade.ts` pour recenser les patterns d'autocomplete (charger fournisseurs / clients / articles / dépôts / devises).
2. Pour chaque référentiel, ajouter un test JUnit `@WebMvcTest` `lookup()` qui valide format + tri + pagination.
3. Aligner les `searchFields` Java avec les champs réellement utilisés par le frontend (généralement `code` + `name`).
4. Documenter dans une note les `labelField` / `valueField` par défaut.

Fichiers à toucher :
- `backend/domains/{item,stock,currency,partner}/src/main/java/ma/nafura/*/service/*Service.java`
- `backend/domains/{item,stock,currency,partner}/src/test/java/.../**LookupTest.java`

Tests : 1 `lookup()` JUnit par entité référentielle ; smoke Playwright autocomplete depuis un formulaire métier existant.

Mettre à jour `00-PROGRESS.md` ligne B-FND-03.
```

---

## B-FND-04 — Enregistrer 8 nouveaux domaines dans `erp.application.json`

```text
Tu es l'agent en charge de la tâche B-FND-04.

Spec : `web/docs/specs/backend-integration-roadmap/01-shared-foundation.md` (section B-FND-04).
Wave : 0. Indépendant.

Goal : enrichir `naf/src/spec/applications/erp/erp.application.json` pour déclarer les 8 nouveaux domaines (partner, achats, ventes, chantiers, etudes, rh, hse, marches, approbations) — même si leur code n'existe pas encore.

Livrables :
1. Ajouter dans `domains[]` et `defaultTenant.domains[]` les 9 nouveaux domaines.
2. Ajouter dans `zones[]` les zones `commerce`, `projects`, `people`, `compliance`, `contracts`, `governance`.
3. Ajouter dans `navigation.domainGroups[]` un groupe par zone listant ses domaines.
4. Étendre les `roleTemplates[].permissions[]` avec les nouvelles permissions (`partner.*`, `achats.*`, etc.) en dosant selon ADMIN / MANAGER / MEMBER / VIEWER.
5. Validation contre `naf/src/spec/schemas/application.schema.json`.
6. Smoke : Keycloak doit booter avec les nouveaux clients/rôles.

Fichier à toucher :
- `naf/src/spec/applications/erp/erp.application.json`

Aucun code Java ni Angular à modifier dans cette tâche.

Mettre à jour `00-PROGRESS.md` ligne B-FND-04.
```

---

## B-FND-05 — Conventions multi-tenant + roleTemplates BTP

```text
Tu es l'agent en charge de la tâche B-FND-05.

Spec : `web/docs/specs/backend-integration-roadmap/01-shared-foundation.md` (section B-FND-05).
Wave : 0. Dépendance : B-FND-04.

Goal : appliquer en code la convention multi-tenant systématique + ajouter 4 roleTemplates métier BTP.

Livrables :
1. Documenter dans `00-ARCHITECTURE.md` §6 la convention `<module>.<entity>.<action>` (déjà initiée — vérifier la cohérence avec les permissions ajoutées en B-FND-04).
2. Ajouter 4 roleTemplates BTP dans `erp.application.json` : `BTP_DG`, `BTP_DAF`, `BTP_CONDUCTEUR_TRAVAUX`, `BTP_CHEF_CHANTIER` avec les permissions précises listées dans la spec.
3. Vérifier que `TenantScopedRepository` filtre bien par `tenant_id` pour les 3 domaines existants + `partner`.

Tests : intégration `MultiTenantIsolationTest` qui vérifie qu'un tenant A ne voit pas les partners du tenant B.

Mettre à jour `00-PROGRESS.md` ligne B-FND-05.
```

---

# Wave 1 — Inventory

## B-INV-01 — Articles BTP + désinjection `InventoryMockService`

```text
Tu es l'agent en charge de la tâche B-INV-01.

Spec : `web/docs/specs/backend-integration-roadmap/02-inventory.md` (section B-INV-01).
Wave : 1. Dépendance : Wave 0 complete.

Goal : étendre l'entité `Item` avec les champs BTP spécifiques + désinjecter `InventoryMockService` des pages catalogue/articles.

Livrables :
1. Ajouter colonnes à `Item` : `posteBudgetId`, `familleArticleId`, `isPerissable`, `emplacementParDefautId`, `abcClass`, `prixMoyenPondere`.
2. Migration Liquibase `backend/domains/item/src/main/resources/db/changelog/schema/v1.0/02-extend-items.xml`.
3. Endpoint custom : `POST /api/v1/items/{id}/recalc-pmp` (recalcul prix moyen pondéré).
4. Désinjection mock :
   - `web/app/applications/erp/pages/inventory/catalogue/articles/services/article-api.service.ts` → pure HTTP
   - `web/app/applications/erp/pages/inventory/catalogue/articles/services/article.facade.ts` → retire `inject(InventoryMockService)`
   - 5 composants `web/app/applications/erp/inventory/components/{inventaire,perte,reception,retour,transfert}-lines-editor/` → consommer `ItemApiService.getLookup(...)` au lieu du mock.

Acceptance criteria :
- [ ] `GET /api/v1/items` renvoie les articles avec les champs BTP.
- [ ] `grep "InventoryMockService" web/app/applications/erp/pages/inventory/catalogue/` → vide.
- [ ] La page `/inventory/catalogue/articles` charge en HTTP réel.

Tests : `ItemPmpRecalculationServiceTest` + smoke `inventory-articles.e2e.spec.ts`.

Mettre à jour `00-PROGRESS.md` ligne B-INV-01.
```

---

## B-INV-02 — Dépôts (warehouses)

```text
Tu es l'agent en charge de la tâche B-INV-02.

Spec : `web/docs/specs/backend-integration-roadmap/02-inventory.md` (section B-INV-02).
Wave : 1.

Goal : créer l'entité `Warehouse` (dépôt) typée CENTRAL / CHANTIER / TRANSIT.

Livrables :
1. Layout standard sous `backend/domains/stock/src/main/java/ma/nafura/stock/` (Warehouse model + repo + service + controller + dto + mapper).
2. Migration Liquibase `02-create-warehouses.xml`.
3. Filtrage `?type=CENTRAL|CHANTIER|TRANSIT` et `?chantierId=` sur la `list`.
4. Désinjection : `web/app/applications/erp/pages/inventory/configuration/depots/services/location-config.facade.ts` → consomme `/api/v1/warehouses`.

Tests : `WarehouseServiceTest` + smoke Playwright sur la page `/inventory/configuration/depots`.

Mettre à jour `00-PROGRESS.md` ligne B-INV-02.
```

---

## B-INV-03 — Stock balances (lookup + agrégat)

```text
Tu es l'agent en charge de la tâche B-INV-03.

Spec : `web/docs/specs/backend-integration-roadmap/02-inventory.md` (section B-INV-03).
Wave : 1. Dépendance : B-INV-01 + B-INV-02.

Goal : exposer le stock courant par article × dépôt × lot via une vue PostgreSQL ou une table dénormalisée (V1 = vue).

Livrables :
1. Vue SQL `stock_balances_view` calculée sur `stock_movement_lines` VALIDES.
2. Endpoints :
   - `GET /api/v1/stock-balances?warehouseId=&itemId=&page=&size=`
   - `GET /api/v1/stock-balances/lookup`
   - `GET /api/v1/stock-balances/aggregate-by-item?itemIds=...`
3. Désinjection : `web/app/applications/erp/pages/inventory/suivi/etat-stock/services/etat-stocks.facade.ts` + `valorisation.facade.ts`.

Tests : `StockBalanceServiceTest` (somme mouvements VALIDES) + smoke `/inventory/suivi/etat-stock`.

Mettre à jour `00-PROGRESS.md` ligne B-INV-03.
```

---

## B-INV-04 — Mouvements stock + transition VALIDER

```text
Tu es l'agent en charge de la tâche B-INV-04.

Spec : `web/docs/specs/backend-integration-roadmap/02-inventory.md` (section B-INV-04).
Wave : 1. Dépendance : B-INV-03.

Goal : entités `StockMovement` + `StockMovementLine` avec workflow BROUILLON → SOUMIS → VALIDE / ANNULE.

Livrables :
1. Entités + DTOs + repo + service + controller selon pattern socle.
2. Migration Liquibase `03-create-stock-movements.xml` + `04-create-stock-movement-lines.xml`.
3. Endpoints custom :
   - `POST /api/v1/stock-movements/{id}/submit`
   - `POST /api/v1/stock-movements/{id}/validate` (impact `stock_balances`)
   - `POST /api/v1/stock-movements/{id}/cancel`
4. Désinjection :
   - `web/app/applications/erp/pages/inventory/mouvements/inventory-txes/services/inventory-tx.facade.ts`
   - `web/app/applications/erp/pages/inventory/mouvements/sorties/services/sortie.facade.ts`
   - 5 composants `*-lines-editor` (reception, sortie, transfert, inventaire, perte, retour).

Tests : `StockMovementWorkflowTest` + `inventory-movement.e2e.spec.ts` (réception → validate → balance).

Mettre à jour `00-PROGRESS.md` ligne B-INV-04.
```

---

## B-INV-05 — Réservations stock chantier

```text
Tu es l'agent en charge de la tâche B-INV-05.

Spec : `web/docs/specs/backend-integration-roadmap/02-inventory.md` (section B-INV-05).
Wave : 1. Dépendance : B-INV-04.

Goal : entité `StockReservation` qui décrémente le stock disponible apparent + auto-libération à expiration + consommation FIFO par sortie.

Livrables :
1. Entité `StockReservation` + DTOs + CRUD socle.
2. Endpoint custom : `POST /api/v1/stock-reservations/{id}/release`.
3. Job `@Scheduled(cron = "0 0 * * * *")` auto-libère les réservations expirées.
4. Logique : à la validation d'un `StockMovement` type SORTIE pour un chantier, consommer FIFO les réservations actives du même chantier.
5. Désinjection : `web/app/applications/erp/pages/inventory/reservations/` + `magasin-chantier.page.ts`.

Tests : `StockReservationFifoTest` + `auto-release-job.test.ts`.

Mettre à jour `00-PROGRESS.md` ligne B-INV-05.
```

---

## B-INV-06 — Magasin chantier digital (read model)

```text
Tu es l'agent en charge de la tâche B-INV-06.

Spec : `web/docs/specs/backend-integration-roadmap/02-inventory.md` (section B-INV-06).
Wave : 1. Dépendance : B-INV-05.

Goal : endpoint d'agrégat `GET /api/v1/chantiers/{id}/magasin` retournant stock + mouvements récents + valorisation pour 1 chantier.

Livrables :
1. Service `MagasinChantierReadService` dans `backend/domains/stock`.
2. Endpoint exposé par un contrôleur `ChantierMagasinController` mappé `/api/v1/chantiers/{id}/magasin`.
3. Désinjection : `web/app/applications/erp/pages/inventory/magasin-chantier/magasin-chantier.page.ts`.

Tests : `MagasinChantierReadServiceTest` (valorisation cohérente avec `stock_balances`).

Mettre à jour `00-PROGRESS.md` ligne B-INV-06.
```

---

## B-INV-07 — Matériel & équipements (V1)

```text
Tu es l'agent en charge de la tâche B-INV-07.

Spec : `web/docs/specs/backend-integration-roadmap/02-inventory.md` (section B-INV-07).
Wave : 1. Dépendance : B-INV-01.

Goal : V1 limitée — entités `Materiel` + `MaterielAffectation` (fiche engin + affectations chantier). Maintenance/carburant/contrôles sont reportés (backlog).

Livrables :
1. Entités `Materiel` + `MaterielAffectation` + CRUD socle.
2. Endpoints transitions affectation : `POST /api/v1/materiel-affectations/{id}/clore`.
3. Désinjection :
   - `web/app/applications/erp/pages/inventory/catalogue/materiel/services/materiel-api.service.ts` → pure HTTP
   - `web/app/applications/erp/pages/inventory/catalogue/materiel/materiel-detail/materiel-detail.page.ts`
4. Pages `pages/inventory/materiel/{affectations,fiche-360}/` consomment HTTP réel.
5. Pages maintenance/carburant/controles/locations/planning/pointage : marquer `@deprecated` + sticker "V2".

Tests : `MaterielServiceTest` + smoke `/inventory/catalogue/materiel`.

Mettre à jour `00-PROGRESS.md` ligne B-INV-07.
```

---

# Wave 1 — Finance

## B-FIN-01 — Devises + taux change

```text
Tu es l'agent en charge de la tâche B-FIN-01.

Spec : `web/docs/specs/backend-integration-roadmap/03-finance.md` (section B-FIN-01).
Wave : 1.

Goal : stabiliser les 3 services Class A finance déjà pure HTTP + désinjecter `FinanceConfigMockService` des pages devises / taux-change.

Livrables :
1. Vérifier les 3 endpoints `/api/v1/currencies`, `/api/v1/exchange-rates`, `/api/v1/payment-terms` du domaine `backend/domains/currency`.
2. Décision UX (PO) : garder `pages/finance/devises` (FR) et déprécier `pages/finance/configuration/currencies`.
3. Désinjection :
   - `web/app/applications/erp/pages/finance/devises/services/devise-api.service.ts` → pure HTTP
   - `web/app/applications/erp/pages/finance/taux-change/services/taux-change-api.service.ts` + `.facade.ts`

Mettre à jour `00-PROGRESS.md` ligne B-FIN-01.
```

---

## B-FIN-02 — Conditions paiement + modes règlement

```text
Tu es l'agent en charge de la tâche B-FIN-02.

Spec : `web/docs/specs/backend-integration-roadmap/03-finance.md` (section B-FIN-02).
Wave : 1. Dépendance : B-FIN-01.

Goal : créer le nouveau domaine `backend/domains/finance` avec sa première entité `PaymentMode` + assurer `PaymentTerm` existant fonctionne en HTTP réel.

Livrables :
1. Créer le domaine `backend/domains/finance/` (build.gradle + layout standard).
2. Entité `PaymentMode` (VIREMENT, CHEQUE, ESPECES, EFFET, CARTE).
3. Migration Liquibase `01-create-payment-modes.xml`.
4. Désinjection `pages/finance/conditions-paiement/services/condition-paiement-api.service.ts`.

Tests : `PaymentModeServiceTest`.

Mettre à jour `00-PROGRESS.md` ligne B-FIN-02.
```

---

## B-FIN-03 — Plan comptable + journaux

```text
Tu es l'agent en charge de la tâche B-FIN-03.

Spec : `web/docs/specs/backend-integration-roadmap/03-finance.md` (section B-FIN-03).
Wave : 1. Dépendance : B-FIN-02.

Goal : entités `ChartOfAccount` + `AccountingJournal` + `JournalEntry` + `JournalEntryLine` avec contrôle d'équilibre serveur-side.

Livrables :
1. 4 entités + CRUD socle.
2. Endpoints custom :
   - `POST /api/v1/journal-entries/{id}/post` (transition BROUILLON → POSTE, irréversible)
   - `GET /api/v1/balance?from=...&to=...` (balance comptable)
3. Validation `équilibre débit = crédit` lors de la création/MAJ d'écriture.
4. Seeds : plan comptable CGNC MA standard + 5 journaux (AC, BQ, OD, CA, VE).
5. Désinjection :
   - `web/app/applications/erp/pages/finance/journaux/**` (4 fichiers)
   - `web/app/applications/erp/pages/finance/plans-comptables/services/plan-comptable.facade.ts`
   - `web/app/applications/erp/pages/finance/balance/balance.page.ts`

Tests : `JournalEntryEquilibreTest` + `BalanceComptableTest`.

Mettre à jour `00-PROGRESS.md` ligne B-FIN-03.
```

---

## B-FIN-04 — Règlements clients & fournisseurs

```text
Tu es l'agent en charge de la tâche B-FIN-04.

Spec : `web/docs/specs/backend-integration-roadmap/03-finance.md` (section B-FIN-04).
Wave : 1. Dépendance : B-FIN-03.

Goal : entité `Reglement` (ENCAISSEMENT_CLIENT / PAIEMENT_FOURNISSEUR) avec génération auto d'écriture comptable.

Livrables :
1. Entité + DTOs + CRUD socle.
2. Endpoint custom `POST /api/v1/reglements/{id}/comptabiliser`.
3. Désinjection : `web/app/applications/erp/pages/finance/reglements/**` (2 fichiers).

Tests : `ReglementComptabilisationServiceTest`.

Mettre à jour `00-PROGRESS.md` ligne B-FIN-04.
```

---

## B-FIN-05 — Lettrage écritures

```text
Tu es l'agent en charge de la tâche B-FIN-05.

Spec : `web/docs/specs/backend-integration-roadmap/03-finance.md` (section B-FIN-05).
Wave : 1. Dépendance : B-FIN-04.

Goal : entité `Lettrage` avec code séquentiel (AAA, AAB, ...) liant N lignes 411/401 dont le solde est zéro.

Livrables :
1. Entité + service + endpoints `POST /api/v1/lettrage`, `GET /api/v1/lettrage/non-lettrees`, `POST /lettrage/auto-match`, `DELETE /lettrage/{code}` (délettrage), `GET /lettrage/{code}/export.csv`.
2. Validation server-side : somme(débit) - somme(crédit) = 0 sur les lignes lettrées.
3. Désinjection : `web/app/applications/erp/pages/finance/lettrage/lettrage.page.ts`.

Tests : `LettrageServiceTest` (auto-match + délettrage + cas partiels).

Mettre à jour `00-PROGRESS.md` ligne B-FIN-05.
```

---

## B-FIN-06 — Rapprochement bancaire (import OFX/CSV)

```text
Tu es l'agent en charge de la tâche B-FIN-06.

Spec : `web/docs/specs/backend-integration-roadmap/03-finance.md` (section B-FIN-06).
Wave : 1. Dépendance : B-FIN-04.

Goal : entités `BankAccount` + `BankStatement` + `BankStatementLine` + import OFX/CSV + matching auto avec écritures comptables.

Livrables :
1. Entités + CRUD socle.
2. Endpoint `POST /api/v1/bank-statements/import` (multipart OFX/CSV).
3. Endpoints `POST /bank-statement-lines/{id}/match` + `/auto-match`.
4. Désinjection : `web/app/applications/erp/pages/finance/rapprochement/rapprochement.page.ts`.

Tests : `BankStatementImportTest` (OFX + CSV formats) + `AutoMatchServiceTest`.

Mettre à jour `00-PROGRESS.md` ligne B-FIN-06.
```

---

## B-FIN-07 — Effets de commerce + virements

```text
Tu es l'agent en charge de la tâche B-FIN-07.

Spec : `web/docs/specs/backend-integration-roadmap/03-finance.md` (section B-FIN-07).
Wave : 1. Dépendance : B-FIN-04.

Goal : entités `EffetCommerce` + `Virement` + génération XML banques MA (AWB/BMCE/CIH/BP).

Livrables :
1. Entités + CRUD socle.
2. Endpoints workflow effets : `/remise-encaissement`, `/escompte`, `/impaye`.
3. Endpoint virements `POST /virements/{id}/generate-xml?banque=AWB|BMCE|CIH|BP`.
4. Désinjection : `pages/finance/effets/effets-commerce.page.ts` + `pages/finance/virements/**` (3 fichiers).

Tests : `VirementXmlGeneratorTest` (1 cas par banque MA).

Mettre à jour `00-PROGRESS.md` ligne B-FIN-07.
```

---

## B-FIN-08 — Caisses chantier

```text
Tu es l'agent en charge de la tâche B-FIN-08.

Spec : `web/docs/specs/backend-integration-roadmap/03-finance.md` (section B-FIN-08).
Wave : 1. Dépendance : B-FIN-04.

Goal : entités `Caisse` (CENTRALE / CHANTIER) + `CaisseMouvement` avec solde calculé server-side.

Livrables :
1. Entités + CRUD socle + endpoint `GET /api/v1/caisses/{id}/solde`.
2. Désinjection : `pages/finance/caisses/**` (5 fichiers) + `pages/finance/caisses-chantier/caisses-chantier.page.ts`.

Tests : `CaisseSoldeServiceTest`.

Mettre à jour `00-PROGRESS.md` ligne B-FIN-08.
```

---

# Wave 2 — Achats

## B-ACH-01 — Demandes d'achat (DA) + transitions

```text
Tu es l'agent en charge de la tâche B-ACH-01.

Spec : `web/docs/specs/backend-integration-roadmap/04-achats.md` (section B-ACH-01).
Wave : 2. Dépendances : Wave 0 (partner) + Wave 1 (item).

Goal : créer le domaine `backend/domains/achats` avec sa première entité `DemandeAchat` + lignes + workflow.

Livrables :
1. Créer le domaine `backend/domains/achats/` (build.gradle + layout standard).
2. Entités `DemandeAchat` + `DemandeAchatLigne`.
3. Workflow BROUILLON → SOUMIS → APPROUVE → CONVERTIE (+ REJETE, ANNULE).
4. Endpoints custom : `/submit`, `/approve`, `/reject`, `/convert-to-ao`.
5. Désinjection :
   - `web/app/applications/erp/pages/achats/demandes/services/demande-api.service.ts` → pure HTTP
   - `web/app/applications/erp/pages/achats/demandes/services/demande.facade.ts` → retire `inject(AchatsMockService)`
6. Adapter `pages/achats/fournisseurs/services/fournisseur-api.service.ts` pour consommer `/api/v1/partners?role=FOURNISSEUR` (alias).

Tests : `DemandeAchatWorkflowTest` + smoke Playwright.

Mettre à jour `00-PROGRESS.md` ligne B-ACH-01.
```

---

## B-ACH-02 — Appels d'offres achat + offres fournisseurs

```text
Tu es l'agent en charge de la tâche B-ACH-02.

Spec : `web/docs/specs/backend-integration-roadmap/04-achats.md` (section B-ACH-02).
Wave : 2. Dépendance : B-ACH-01.

Goal : entités `AppelOffreAchat` + `AppelOffreLigne` + `OffreFournisseur` + `OffreFournisseurLigne` + scoring server-side.

Livrables :
1. 4 entités + CRUD socle + transitions AO (BROUILLON → PUBLIE → CLOTURE → ATTRIBUE).
2. Endpoints custom : `/publish`, `/clore-reception`, `/attribuer/{offreFournisseurId}`, `GET /comparatif`, `POST /scoring/recompute`.
3. Service `AoScoringService` portant la logique de `web/app/applications/erp/achats/services/matching.service.ts` (prix /50, délai /15, qualité /15, historique /10, art187 /10).
4. Désinjection :
   - `pages/achats/appels-offres/services/ao-api.service.ts` + `.facade.ts`
   - `pages/achats/appels-offres/ao-comparatif/ao-comparatif.page.ts`

Tests : `AoScoringServiceTest` (matrice fournisseurs × critères).

Mettre à jour `00-PROGRESS.md` ligne B-ACH-02.
```

---

## B-ACH-03 — Bons de commande achat + réceptions

```text
Tu es l'agent en charge de la tâche B-ACH-03.

Spec : `web/docs/specs/backend-integration-roadmap/04-achats.md` (section B-ACH-03).
Wave : 2. Dépendances : B-ACH-02 + Wave 1 Inventory (StockMovement).

Goal : entités `BonCommande` + `BonCommandeLigne` + `Reception` + `ReceptionLigne` avec génération auto de mouvement stock à la réception.

Livrables :
1. 4 entités + CRUD socle.
2. Workflow BC : BROUILLON → SOUMIS → APPROUVE → ENVOYE → RECU_PARTIEL → RECU_TOTAL (+ ANNULE).
3. Endpoints : `/submit`, `/approve`, `/send`, `/cancel`, `POST /bons-commande/{id}/receptions`, `GET /bons-commande/{id}/receptions`.
4. Logique : création `Reception` déclenche `StockMovement` type RECEPTION.
5. Désinjection : `pages/achats/commandes/services/bc-api.service.ts` + `.facade.ts`.

Tests : `BonCommandeWorkflowTest` + `ReceptionImpactStockTest`.

Mettre à jour `00-PROGRESS.md` ligne B-ACH-03.
```

---

## B-ACH-04 — Contrats fournisseurs + Art. 187

```text
Tu es l'agent en charge de la tâche B-ACH-04.

Spec : `web/docs/specs/backend-integration-roadmap/04-achats.md` (section B-ACH-04).
Wave : 2. Dépendance : B-ACH-01.

Goal : entités `ContratFournisseur` (générique) + `ContratSousTraitance` (avec champs MA Art. 187 CGI).

Livrables :
1. 2 entités + CRUD socle + transitions `/sign` et `/terminate`.
2. Champs ST : `art187_declare`, `art187_valide_moa`, `retenue_garantie_taux`, `paiement_direct_moa`.
3. Endpoint `GET /api/v1/achats/contrats/{id}/situations`.
4. Désinjection : `pages/achats/contrats/services/contrat-api.service.ts` + `.facade.ts`.

Tests : `ContratSousTraitanceArt187Test`.

Mettre à jour `00-PROGRESS.md` ligne B-ACH-04.
```

---

## B-ACH-05 — Catalogue articles fournisseur

```text
Tu es l'agent en charge de la tâche B-ACH-05.

Spec : `web/docs/specs/backend-integration-roadmap/04-achats.md` (section B-ACH-05).
Wave : 2. Dépendance : B-ACH-03.

Goal : entité `CatalogueFournisseur` (prix négocié article × fournisseur) + pré-remplissage prix BC.

Livrables :
1. Entité + CRUD socle + endpoint `POST /api/v1/achats/catalogues/import-excel`.
2. Logique BC : à la création de ligne BC, le service backend pré-remplit `prixUnitaire` depuis le catalogue si match (article + fournisseur).

Tests : `CatalogueFournisseurServiceTest` (import + pré-remplissage).

Mettre à jour `00-PROGRESS.md` ligne B-ACH-05.
```

---

## B-ACH-06 — Attestations légales

```text
Tu es l'agent en charge de la tâche B-ACH-06.

Spec : `web/docs/specs/backend-integration-roadmap/04-achats.md` (section B-ACH-06).
Wave : 2. Dépendance : B-ACH-04.

Goal : entité `AttestationFournisseur` (8 types : CNSS, FISCALE, AMO, RC, IF, ICE, PATENTE, RIB) + job de recalcul statuts.

Livrables :
1. Entité + CRUD socle + endpoint `GET /api/v1/partners/{id}/attestations-status` (agrégat 8 chips).
2. Job `@Scheduled(cron = "0 0 1 * * *")` recalcule `status` quotidiennement.
3. Règle blocage règlement (configurable) : si CNSS + FISCALE EXPIRE → endpoint paiement refuse.

Tests : `AttestationStatusJobTest` + `BlocageReglementTest`.

Mettre à jour `00-PROGRESS.md` ligne B-ACH-06.
```

---

## B-ACH-07 — 3-way matching BC ↔ BL ↔ FactureFournisseur

```text
Tu es l'agent en charge de la tâche B-ACH-07.

Spec : `web/docs/specs/backend-integration-roadmap/04-achats.md` (section B-ACH-07).
Wave : 2. Dépendances : B-ACH-03 + Wave 1 Finance.

Goal : entités `FactureFournisseur` + `FactureFournisseurLigne` + `MatchingReception` avec 3-way matching automatique et tolérances configurables.

Livrables :
1. 3 entités + CRUD socle.
2. Service `MatchingService` (port Java de `web/app/applications/erp/achats/services/matching.service.ts`).
3. Endpoints : `POST /factures-fournisseurs/{id}/matching/recompute`, `POST /validate` (refuse si ECART_BLOQUE), `POST /comptabiliser`.
4. Tolérances configurables (±2% prix, ±5% qté).
5. Désinjection : `pages/finance/factures-fournisseurs/**` (2 fichiers) + `web/app/applications/erp/achats/services/matching.service.ts` (orchestrateur frontend pur).

Tests : `MatchingServiceTest` (cas dans tolérance, hors tolérance, partiels) + Playwright `3-way-matching.e2e.spec.ts`.

Mettre à jour `00-PROGRESS.md` ligne B-ACH-07.
```

---

# Wave 2 — Ventes

## B-VEN-01 — Clients (alias Partner CLIENT)

```text
Tu es l'agent en charge de la tâche B-VEN-01.

Spec : `web/docs/specs/backend-integration-roadmap/05-ventes.md` (section B-VEN-01).
Wave : 2. Dépendance : Wave 0 (partner).

Goal : refactorer le `ClientApiService` frontend pour consommer `/api/v1/partners?role=CLIENT` au lieu du mock.

Livrables :
1. Si nécessaire, étendre `FeatureApiService` côté `@lib/anatomy` pour supporter `defaultQuery` (params automatiques à toutes les requêtes).
2. Refactorer `web/app/applications/erp/pages/ventes/clients/services/client-api.service.ts` pour utiliser `basePath = '/api/v1/partners'` + `defaultQuery = { role: 'CLIENT' }`.

Tests : smoke `/ventes/clients` charge en HTTP réel.

Mettre à jour `00-PROGRESS.md` ligne B-VEN-01.
```

---

## B-VEN-02 — Offres commerciales + transitions

```text
Tu es l'agent en charge de la tâche B-VEN-02.

Spec : `web/docs/specs/backend-integration-roadmap/05-ventes.md` (section B-VEN-02).
Wave : 2. Dépendance : B-VEN-01.

Goal : créer le domaine `backend/domains/ventes` avec entités `Offre` + `OffreLigne` + workflow + calculs server-side.

Livrables :
1. Créer le domaine `backend/domains/ventes/` (build.gradle + layout).
2. Entités `Offre` + `OffreLigne` + CRUD socle.
3. Workflow BROUILLON → SOUMIS → ACCEPTE → CONVERTI (+ REJETE, ANNULE).
4. Endpoints : `/submit`, `/accept`, `/reject`, `/cancel`, `/convert-to-bcc`, `GET /pdf`.
5. Calculs server-side : HT, TVA, TTC, joursValidite.
6. Désinjection : `pages/ventes/offres/services/offre-api.service.ts` + `.facade.ts`.

Tests : `OffreCalculatorTest` + `OffreWorkflowTest`.

Mettre à jour `00-PROGRESS.md` ligne B-VEN-02.
```

---

## B-VEN-03 — Bons de commande clients

```text
Tu es l'agent en charge de la tâche B-VEN-03.

Spec : `web/docs/specs/backend-integration-roadmap/05-ventes.md` (section B-VEN-03).
Wave : 2. Dépendance : B-VEN-02.

Goal : entités `BonCommandeClient` + `BonCommandeClientLigne` + workflow.

Livrables :
1. 2 entités + CRUD socle + transitions `/confirm`, `/convert-to-facture`.
2. Désinjection : `pages/ventes/bons-commandes-clients/services/bcc-api.service.ts` + `.facade.ts`.

Tests : `BccWorkflowTest`.

Mettre à jour `00-PROGRESS.md` ligne B-VEN-03.
```

---

## B-VEN-04 — Factures clients (calculs MA server-side)

```text
Tu es l'agent en charge de la tâche B-VEN-04.

Spec : `web/docs/specs/backend-integration-roadmap/05-ventes.md` (section B-VEN-04).
Wave : 2. Dépendances : B-VEN-03 + Wave 1 Finance.

Goal : entité `FactureClient` avec calculs financiers MA (HT, TVA, TTC, RG, RAS 5% marchés publics) descendus côté backend.

Livrables :
1. Entité + CRUD socle + workflow BROUILLON → SOUMISE → VALIDEE → PAYEE.
2. Champs préparatoires e-facture DGI : `hash_efacture`, `qr_code_data`.
3. Endpoints : `/submit`, `/validate`, `/cancel`, `/comptabiliser`, `/recalc-totals`, `GET /pdf`, `GET /qr-data`, `GET /en-retard?days=30`.
4. Logique RAS : si `marche_id` présent + marché public → `montant_ras = HT × 5%`, compte 4453.
5. Désinjection : `pages/ventes/factures/services/facture-api.service.ts` + `.facade.ts`.

Tests : `FactureCalculatorTest` (10+ cas), `RasMarchePublicTest`, `FactureWorkflowTest`.

Mettre à jour `00-PROGRESS.md` ligne B-VEN-04.
```

---

## B-VEN-05 — Avoirs

```text
Tu es l'agent en charge de la tâche B-VEN-05.

Spec : `web/docs/specs/backend-integration-roadmap/05-ventes.md` (section B-VEN-05).
Wave : 2. Dépendance : B-VEN-04.

Goal : entités `Avoir` + `AvoirLigne` (notes de crédit liées à facture origine).

Livrables :
1. 2 entités + CRUD socle + transitions `/validate`, `/comptabiliser` (écriture inverse).
2. Désinjection : `pages/ventes/avoirs/services/avoir-api.service.ts` + `.facade.ts`.

Tests : `AvoirComptabilisationServiceTest`.

Mettre à jour `00-PROGRESS.md` ligne B-VEN-05.
```

---

## B-VEN-06 — Retenues de garantie

```text
Tu es l'agent en charge de la tâche B-VEN-06.

Spec : `web/docs/specs/backend-integration-roadmap/05-ventes.md` (section B-VEN-06).
Wave : 2. Dépendance : B-VEN-04.

Goal : entité `RetenueGarantie` qui agrège les RG par marché et suit la restitution.

Livrables :
1. Entité + CRUD socle + endpoint `POST /retenues-garantie/{id}/restituer?montant=...` + `GET /synthese?clientId=...`.
2. Désinjection : `pages/ventes/retenues-garantie/retenues-garantie-mock.facade.ts` → nouveau `retenues-garantie.facade.ts`.

Tests : `RetenueGarantieCumulServiceTest`.

Mettre à jour `00-PROGRESS.md` ligne B-VEN-06.
```

---

# Wave 3 — Chantiers

## B-CHA-01 — Aggregate `Chantier` + status

```text
Tu es l'agent en charge de la tâche B-CHA-01.

Spec : `web/docs/specs/backend-integration-roadmap/06-chantiers.md` (section B-CHA-01).
Wave : 3. Dépendances : Wave 0 (partner) + Wave 2 (ventes pour conversions).

Goal : créer le domaine `backend/domains/chantiers` avec l'aggregate root `Chantier`.

Livrables :
1. Créer le domaine `backend/domains/chantiers/`.
2. Entité `Chantier` + CRUD socle + transitions de statut (`/demarrer`, `/suspendre`, `/reprendre`, `/reception-provisoire`, `/reception-definitive`, `/clore`).
3. Seeds Liquibase `context="seed-demo"` reprenant `SEED_CHANTIERS` Round 1 (6 chantiers `ch-001` → `ch-006`).
4. Désinjection :
   - `pages/chantiers/chantiers-listing/chantiers-listing.page.ts`
   - `pages/chantiers/chantier-detail/chantier-detail.page.ts` (incidemment fix Round 2 M-CHA-01 "Chantier introuvable")
   - `pages/chantiers/create/chantier-create.page.ts`

Tests : `ChantierWorkflowTest` + Playwright `chantiers-listing → detail (6 seeds) → wizard création`.

Mettre à jour `00-PROGRESS.md` ligne B-CHA-01.
```

---

## B-CHA-02 — Lots / phases / postes budgétaires

```text
Tu es l'agent en charge de la tâche B-CHA-02.

Spec : `web/docs/specs/backend-integration-roadmap/06-chantiers.md` (section B-CHA-02).
Wave : 3. Dépendance : B-CHA-01.

Goal : entités `Lot` + `PosteBudgetaire` (hiérarchie 2 niveaux).

Livrables :
1. 2 entités + CRUD socle.
2. Endpoints imbriqués `/api/v1/chantiers/{id}/lots`, `/api/v1/lots/{id}/postes-budgetaires`.

Tests : `LotHierarchyTest`.

Mettre à jour `00-PROGRESS.md` ligne B-CHA-02.
```

---

## B-CHA-03 — Budget chantier (prévi / révisé / réalisé)

```text
Tu es l'agent en charge de la tâche B-CHA-03.

Spec : `web/docs/specs/backend-integration-roadmap/06-chantiers.md` (section B-CHA-03).
Wave : 3. Dépendance : B-CHA-02.

Goal : entité `BudgetChantier` + `BudgetLigne` + read model `BudgetRealisation`.

Livrables :
1. 2 entités + CRUD socle.
2. Read model agrégeant les sources :
   - `realise_matieres` = somme `StockMovement` SORTIE par poste (Wave 1 Inventory)
   - `realise_mo` = somme `Pointage` × taux (Wave 4 RH si déjà migré, sinon stub)
   - `realise_st` = somme situations ST validées (Wave 2 Achats)
3. Endpoints : `GET /chantiers/{id}/budget`, `/budget/realisation`, `/budget/marges`, `POST /budget/refresh-realisation`.
4. Fix obligatoire : bug Round 2 M-CHA-15 (marges `3.250 %` dupliquées par 100).

Tests : `BudgetMargesServiceTest` (correction du bug `3.250 %`).

Mettre à jour `00-PROGRESS.md` ligne B-CHA-03.
```

---

## B-CHA-04 — Avancements physiques

```text
Tu es l'agent en charge de la tâche B-CHA-04.

Spec : `web/docs/specs/backend-integration-roadmap/06-chantiers.md` (section B-CHA-04).
Wave : 3. Dépendance : B-CHA-02.

Goal : entité `AvancementPhysique` (saisie chef chantier).

Livrables :
1. Entité + CRUD socle.
2. Endpoints : `POST /chantiers/{id}/avancements` (multi-lignes), `POST /avancements/{id}/valider`, `GET /chantiers/{id}/avancements/dernier`.
3. Désinjection : `pages/chantiers/avancements/services/avancement-api.service.ts` + `.facade.ts`.

Tests : `AvancementServiceTest`.

Mettre à jour `00-PROGRESS.md` ligne B-CHA-04.
```

---

## B-CHA-05 — Situations + génération depuis avancements

```text
Tu es l'agent en charge de la tâche B-CHA-05.

Spec : `web/docs/specs/backend-integration-roadmap/06-chantiers.md` (section B-CHA-05).
Wave : 3. Dépendances : B-CHA-04 + Wave 2 Ventes.

Goal : entité `SituationTravaux` + génération auto depuis avancements validés + conversion en `FactureClient`.

Livrables :
1. Entité `SituationTravaux` + lignes.
2. Endpoint `POST /chantiers/{id}/situations/generate?numero=N` (brouillon depuis avancements).
3. Workflow BROUILLON → SOUMISE → ACCEPTE_MOA → CONVERTI (FactureClient type SITUATION).
4. Désinjection : `pages/chantiers/situations/services/situation-api.service.ts` + `.facade.ts`.

Tests : `SituationGenerationServiceTest` (calcul depuis avancements).

Mettre à jour `00-PROGRESS.md` ligne B-CHA-05.
```

---

## B-CHA-06 — Sous-traitance chantier

```text
Tu es l'agent en charge de la tâche B-CHA-06.

Spec : `web/docs/specs/backend-integration-roadmap/06-chantiers.md` (section B-CHA-06).
Wave : 3. Dépendances : B-CHA-01 + Wave 2 Achats (ContratSousTraitance).

Goal : entité `SousTraitanceChantier` qui lie Chantier ↔ Contrat ST.

Livrables :
1. Entité + CRUD socle + endpoint `GET /chantiers/{id}/sous-traitances/synthese`.
2. Désinjection : `pages/chantiers/sous-traitance/sous-traitance-listing/sous-traitance-listing.page.ts`.

Tests : `SousTraitanceSyntheseServiceTest`.

Mettre à jour `00-PROGRESS.md` ligne B-CHA-06.
```

---

## B-CHA-07 — Documents + journal + attachements (e-signature)

```text
Tu es l'agent en charge de la tâche B-CHA-07.

Spec : `web/docs/specs/backend-integration-roadmap/06-chantiers.md` (section B-CHA-07).
Wave : 3. Dépendance : B-CHA-01.

Goal : entités `DocumentChantier` + `JournalChantier` + `AttachementChantier` + workflow e-signature MOE/MOA avec token JWT.

Livrables :
1. 3 entités + CRUD socle.
2. Workflow attachement BROUILLON → EN_ATTENTE_MOE → SIGNE_MOE → EN_ATTENTE_MOA → SIGNE_MOA → CLOS.
3. Endpoints publics signature : `GET /api/v1/sign/{token}`, `POST /api/v1/sign/{token}` (canvas base64 + IP + UA).
4. Token JWT `audience=sign` valide 7 jours.
5. Désinjection : `pages/chantiers/attachements/**`, `pages/chantiers/documents/documents-listing/documents-listing.page.ts`.

Tests : `AttachementSignatureWorkflowTest` + `JwtTokenSignatureTest`.

Mettre à jour `00-PROGRESS.md` ligne B-CHA-07.
```

---

## B-CHA-08 — Photos géolocalisées

```text
Tu es l'agent en charge de la tâche B-CHA-08.

Spec : `web/docs/specs/backend-integration-roadmap/06-chantiers.md` (section B-CHA-08).
Wave : 3. Dépendance : B-CHA-01.

Goal : entité `PhotoChantier` (lat/lng/EXIF/zone + URL stockage signée).

Livrables :
1. Entité + endpoints `POST` multipart, `GET /photos/{id}/url` (URL signée objet stockage MinIO).
2. Pas de désinjection mock spécifique (photos sont nouvelles).

Tests : `PhotoUploadServiceTest`.

Mettre à jour `00-PROGRESS.md` ligne B-CHA-08.
```

---

## B-CHA-09 — Read model `ChantierSummary`

```text
Tu es l'agent en charge de la tâche B-CHA-09.

Spec : `web/docs/specs/backend-integration-roadmap/06-chantiers.md` (section B-CHA-09).
Wave : 3. Dépendances : B-CHA-03 + B-CHA-04 + autres modules.

Goal : endpoint d'agrégat `GET /api/v1/chantiers/{id}/summary` consolidant equipe, budget, avancement, finance, achats, stock, RH, HSE, alertes.

Livrables :
1. Service `ChantierSummaryService` orchestrant des appels internes aux autres services backend.
2. Endpoint REST.
3. Préparer le contrat JSON pour les 12 onglets fiche chantier (Round 2 M-CHA-03).

Tests : `ChantierSummaryServiceTest` (chaque section indépendante).

Mettre à jour `00-PROGRESS.md` ligne B-CHA-09.
```

---

## B-CHA-10 — Désinjection finale `ChantiersMockService`

```text
Tu es l'agent en charge de la tâche B-CHA-10.

Spec : `web/docs/specs/backend-integration-roadmap/06-chantiers.md` (section B-CHA-10).
Wave : 3. Dépendance : B-CHA-01..B-CHA-09.

Goal : finir la désinjection de tous les mocks chantier (`ChantiersMockService`, `AttachementMockService`, `AvancementMockService`, `DocumentsMockService`, `SousTraitanceMockService`, `PlanningMockFacade`).

Livrables :
1. Refactorer les pages listing/detail/create pour passer par `ChantierFacade`.
2. Fix de la régression Round 2 M-CHA-01 ("Chantier introuvable") confirmé sur 6 chantiers SEED.
3. Vérification finale `grep` :
```
grep -rE "inject\((ChantiersMockService|AttachementMockService|AvancementMockService|DocumentsMockService|SousTraitanceMockService|PlanningMockFacade)\)" web/app/applications/erp/pages/chantiers/ → vide
```

Tests : Playwright `chantiers-flow.e2e.spec.ts` complet.

Mettre à jour `00-PROGRESS.md` ligne B-CHA-10.
```

---

# Wave 3 — Études

## B-ETU-01 — Bibliothèque prix + ouvrages

```text
Tu es l'agent en charge de la tâche B-ETU-01.

Spec : `web/docs/specs/backend-integration-roadmap/07-etudes.md` (section B-ETU-01).
Wave : 3. Dépendance : Wave 0.

Goal : créer le domaine `backend/domains/etudes` avec entités `Ouvrage` + `BibliothequePrix` + import Excel.

Livrables :
1. Créer le domaine `backend/domains/etudes/`.
2. Entités + CRUD socle + endpoint `POST /etudes/ouvrages/import-excel`.
3. Désinjection : `pages/etudes/bibliotheque-prix/services/ouvrage-api.service.ts`.

Tests : `OuvrageImportExcelTest`.

Mettre à jour `00-PROGRESS.md` ligne B-ETU-01.
```

---

## B-ETU-02 — Métrés

```text
Tu es l'agent en charge de la tâche B-ETU-02.

Spec : `web/docs/specs/backend-integration-roadmap/07-etudes.md` (section B-ETU-02).
Wave : 3. Dépendance : B-ETU-01.

Goal : entités `Metre` + `MetreLigne`.

Livrables :
1. 2 entités + CRUD socle + endpoints imbriqués lignes.
2. Désinjection : `pages/etudes/metres/services/metre-api.service.ts` + `etudes/components/metre-table-editor/`.

Tests : `MetreServiceTest`.

Mettre à jour `00-PROGRESS.md` ligne B-ETU-02.
```

---

## B-ETU-03 — DPGF (LOT > SOUS_LOT > ARTICLE)

```text
Tu es l'agent en charge de la tâche B-ETU-03.

Spec : `web/docs/specs/backend-integration-roadmap/07-etudes.md` (section B-ETU-03).
Wave : 3. Dépendance : B-ETU-02.

Goal : entités `DPGF` + `NoeudDPGF` (auto-référente — hiérarchie 3 niveaux) + génération depuis métré + agrégation totaux.

Livrables :
1. 2 entités + CRUD socle.
2. Endpoint `POST /etudes/dpgf?fromMetreId=...` (création depuis métré).
3. Endpoint `GET /etudes/dpgf/{id}/arbre` (arbre complet) + `GET /totaux` (rollup LOT).
4. Endpoint `GET /etudes/dpgf/{id}/pdf`.
5. Désinjection : `etudes/components/dpgf-editor/` + `pages/etudes/metres/metre-dpgf/metre-dpgf.page.ts`.

Tests : `DPGFAgregationServiceTest` (rollup LOT).

Mettre à jour `00-PROGRESS.md` ligne B-ETU-03.
```

---

## B-ETU-04 — DPU + composants

```text
Tu es l'agent en charge de la tâche B-ETU-04.

Spec : `web/docs/specs/backend-integration-roadmap/07-etudes.md` (section B-ETU-04).
Wave : 3. Dépendance : B-ETU-01.

Goal : entités `PrixDPU` + `ComposantDPU` avec calcul déboursé sec → PV serveur-side.

Logique :
```
debourse_sec = somme(composants.qte * composants.prix_unitaire)
prix_vente_ht = debourse_sec * (1 + frais_generaux_pct) * (1 + marge_pct)
```

Livrables :
1. 2 entités + CRUD socle.
2. Endpoint `POST /etudes/dpu/{id}/recompute`.
3. Endpoint `POST /etudes/dpu/{id}/versions` (snapshot version).

Tests : `DPUCalculatorTest` (DS / FG / marge).

Mettre à jour `00-PROGRESS.md` ligne B-ETU-04.
```

---

## B-ETU-05 — Appels d'offres clients

```text
Tu es l'agent en charge de la tâche B-ETU-05.

Spec : `web/docs/specs/backend-integration-roadmap/07-etudes.md` (section B-ETU-05).
Wave : 3. Dépendance : B-ETU-03.

Goal : entité `AppelOffreClient` (AOC).

Livrables :
1. Entité + CRUD socle + transitions `/marquer-gagne`, `/marquer-perdu`, `/convert-to-chantier`.
2. Désinjection : `pages/etudes/appels-offres-clients/services/aoc-api.service.ts` + `.facade.ts`.

Tests : `AocConvertToChantierServiceTest` (intégration Wave 3 Chantiers).

Mettre à jour `00-PROGRESS.md` ligne B-ETU-05.
```

---

## B-ETU-06 — Devis (génération DPGF + versioning + calculs)

```text
Tu es l'agent en charge de la tâche B-ETU-06.

Spec : `web/docs/specs/backend-integration-roadmap/07-etudes.md` (section B-ETU-06).
Wave : 3. Dépendances : B-ETU-03 + B-ETU-04.

Goal : entité `Devis` + génération depuis DPGF + versioning.

Livrables :
1. Entité + CRUD socle + `POST /etudes/devis/from-dpgf?dpgfId=...` + `/versions` + `/marquer-gagne` (lance création Chantier).
2. Désinjection :
   - `pages/etudes/devis/services/devis-api.service.ts` + `.facade.ts`
   - `pages/etudes/devis/devis-from-dpgf/devis-from-dpgf.page.ts`

Tests : `DevisGenerationServiceTest` + `DevisVersioningTest`.

Mettre à jour `00-PROGRESS.md` ligne B-ETU-06.
```

---

# Wave 4 — RH

## B-RH-01 — Employés

```text
Tu es l'agent en charge de la tâche B-RH-01.

Spec : `web/docs/specs/backend-integration-roadmap/08-rh.md` (section B-RH-01).
Wave : 4. Dépendance : Wave 0.

Goal : créer le domaine `backend/domains/rh` avec entité `Employe` + validation MA (CIN, CNSS, AMO, IF).

Livrables :
1. Créer le domaine `backend/domains/rh/`.
2. Entité `Employe` + CRUD socle.
3. Validateurs CIN MA, CNSS, AMO, IF côté backend.
4. Désinjection : `pages/rh/employes/services/employe-api.service.ts` + `.facade.ts`.

Tests : `EmployeMaValidatorTest`.

Mettre à jour `00-PROGRESS.md` ligne B-RH-01.
```

---

## B-RH-02 — Pointage chantier (batch + multi-pointage)

```text
Tu es l'agent en charge de la tâche B-RH-02.

Spec : `web/docs/specs/backend-integration-roadmap/08-rh.md` (section B-RH-02).
Wave : 4. Dépendances : B-RH-01 + Wave 3 Chantiers.

Goal : entités `PointageBatch` + `Pointage` permettant la saisie batch offline-friendly + idempotence par `clientId`.

Livrables :
1. 2 entités + CRUD socle.
2. Endpoints : `POST /rh/pointage-batches`, `POST /pointage-batches/{id}/valider`, `GET /chantiers/{id}/pointages/synthese?from=...&to=...`.
3. Idempotence : `clientId` UUID généré côté mobile → réponse 409 si déjà existant.
4. Désinjection : `pages/rh/pointage/services/pointage-mock.service.ts` → renommer `pointage-api.service.ts` (pure HTTP) ; `pages/rh/pointage/pointage-listing/`, `pointage-saisie/`, `pointage-validation/`.

Tests : `PointageBatchIdempotenceTest` + Playwright `mobile-pointage-offline-sync.spec.ts`.

Mettre à jour `00-PROGRESS.md` ligne B-RH-02.
```

---

## B-RH-03 — Congés

```text
Tu es l'agent en charge de la tâche B-RH-03.

Spec : `web/docs/specs/backend-integration-roadmap/08-rh.md` (section B-RH-03).
Wave : 4. Dépendance : B-RH-01.

Goal : entités `Conge` + `CongeSolde` (1,5j/mois MA) + jours ouvrés exclus weekend + fériés MA.

Livrables :
1. 2 entités + CRUD socle + transitions `/submit`, `/approve`, `/reject`.
2. Job mensuel `@Scheduled` qui crédite chaque employé actif.
3. Service `JoursFeriesMaService` utilisé pour calcul jours ouvrés.
4. Désinjection : `pages/rh/conges/services/conge-api.service.ts` + `.facade.ts`.

Tests : `CongeSoldeJobTest` + `JoursFeriesMaServiceTest`.

Mettre à jour `00-PROGRESS.md` ligne B-RH-03.
```

---

## B-RH-04 — Planning équipes (read model)

```text
Tu es l'agent en charge de la tâche B-RH-04.

Spec : `web/docs/specs/backend-integration-roadmap/08-rh.md` (section B-RH-04).
Wave : 4. Dépendance : B-RH-02.

Goal : endpoint d'agrégat `/api/v1/rh/planning` consolidant pointages, congés validés, affectations matériel.

Livrables :
1. Service `PlanningEquipesReadService`.
2. Endpoint REST + pagination par employé.
3. Désinjection : `pages/rh/planning-equipes/planning-equipes.page.ts`.

Tests : `PlanningEquipesReadServiceTest`.

Mettre à jour `00-PROGRESS.md` ligne B-RH-04.
```

---

## B-RH-05 — Fiches de paie

```text
Tu es l'agent en charge de la tâche B-RH-05.

Spec : `web/docs/specs/backend-integration-roadmap/08-rh.md` (section B-RH-05).
Wave : 4. Dépendance : B-RH-01.

Goal : entités `FichePaie` + `LignePaie` + service `PaieEngineService` portant les calculs MA (CNSS, AMO, IGR, IPE, CIMR cadres).

Livrables :
1. 2 entités + CRUD socle.
2. Service `PaieEngineService` portant la logique de `web/app/applications/erp/rh/services/paie-engine.service.ts`.
3. Endpoint `POST /rh/fiches-paie/generate?mois=2026-05&societeId=...` (batch).
4. Endpoints déclarations : `GET /rh/declarations/damancom-xml`, `/igr-etat-9421`, `/etat-1208`, `/retenue-source`.
5. Désinjection : `pages/rh/paie/**` (services + 4 pages déclarations).

Tests : `PaieEngineServiceTest` (10+ cas : CDI cadre, CDI non-cadre, HS, congés, ...).

Mettre à jour `00-PROGRESS.md` ligne B-RH-05.
```

---

## B-RH-06 — Heures supplémentaires

```text
Tu es l'agent en charge de la tâche B-RH-06.

Spec : `web/docs/specs/backend-integration-roadmap/08-rh.md` (section B-RH-06).
Wave : 4. Dépendances : B-RH-02 + B-RH-05.

Goal : entité `HeureSupplementaire` avec barèmes MA (HS25/50/100).

Livrables :
1. Entité + CRUD socle.
2. Détection auto depuis `Pointage` à la validation du batch (>44h/sem, nuit, dimanche, férié).
3. Endpoint `GET /rh/heures-sup/synthese?employeId=&from=&to=`.

Tests : `HeureSupBaremeTest` (HS25/50/100).

Mettre à jour `00-PROGRESS.md` ligne B-RH-06.
```

---

## B-RH-07 — Frais déplacement

```text
Tu es l'agent en charge de la tâche B-RH-07.

Spec : `web/docs/specs/backend-integration-roadmap/08-rh.md` (section B-RH-07).
Wave : 4. Dépendance : B-RH-01.

Goal : entité `FraisDeplacement` (INDEMNITE_KM / PANIER_REPAS / HEBERGEMENT) + workflow.

Livrables :
1. Entité + CRUD socle + transitions `/submit`, `/approve`, `/reject`, `/integrer-paie`.

Tests : `FraisDeplacementWorkflowTest`.

Mettre à jour `00-PROGRESS.md` ligne B-RH-07.
```

---

## B-RH-08 — Contrats + habilitations

```text
Tu es l'agent en charge de la tâche B-RH-08.

Spec : `web/docs/specs/backend-integration-roadmap/08-rh.md` (section B-RH-08).
Wave : 4. Dépendance : B-RH-01.

Goal : entités `Contrat` + `Habilitation` + `Formation`.

Livrables :
1. 3 entités + CRUD socle.
2. Endpoints `POST /rh/contrats/{id}/sign-canvas`, `GET /rh/contrats/{id}/pdf`.
3. Endpoint `GET /rh/habilitations/expirant?days=30`.
4. Logique blocage : `Habilitation.date_expiration < now()` empêche `MaterielAffectation` (Wave 1 Inventory).

Tests : `HabilitationBlocageAffectationTest`.

Mettre à jour `00-PROGRESS.md` ligne B-RH-08.
```

---

# Wave 4 — HSE

## B-HSE-01 — Incidents + CNSS DAT

```text
Tu es l'agent en charge de la tâche B-HSE-01.

Spec : `web/docs/specs/backend-integration-roadmap/09-hse.md` (section B-HSE-01).
Wave : 4. Dépendances : Wave 3 Chantiers + Wave 4 RH.

Goal : créer le domaine `backend/domains/hse` avec entités `Incident` + témoins + actions correctives + workflow + déclaration CNSS DAT.

Livrables :
1. Créer le domaine `backend/domains/hse/`.
2. Entités `Incident` + `IncidentTemoin` + `IncidentAction` + CRUD socle.
3. Workflow OUVERT → INVESTIGATION → CLOS + endpoint `/declarer-cnss-dat` (XML CNSS DAT + alerte 48h).
4. Job alerte 48h post-incident type AT/MP.
5. Désinjection : `pages/hse/incidents/services/incident-api.service.ts` + `.facade.ts` + `pages/hse/incidents/incident-detail/`.
6. Fix Round 2 Task 10.0 : ajouter alias route `/qualite` ↔ `/hse` côté Angular routing.

Tests : `IncidentCnssDatServiceTest` + `IncidentAlerte48hJobTest`.

Mettre à jour `00-PROGRESS.md` ligne B-HSE-01.
```

---

## B-HSE-02 — Non-conformités + CAPA

```text
Tu es l'agent en charge de la tâche B-HSE-02.

Spec : `web/docs/specs/backend-integration-roadmap/09-hse.md` (section B-HSE-02).
Wave : 4. Dépendance : B-HSE-01.

Goal : entités `NonConformite` + `Capa` (Corrective + Preventive Action).

Livrables :
1. 2 entités + CRUD socle + transitions `/assigner`, `/traiter`, `/verifier`, `/cloturer`.
2. Endpoint `POST /hse/non-conformites/{id}/capa`.
3. Désinjection : `pages/hse/non-conformites/services/nc-api.service.ts` + `.facade.ts`.

Tests : `NcWorkflowTest`.

Mettre à jour `00-PROGRESS.md` ligne B-HSE-02.
```

---

## B-HSE-03 — Inspections + audits

```text
Tu es l'agent en charge de la tâche B-HSE-03.

Spec : `web/docs/specs/backend-integration-roadmap/09-hse.md` (section B-HSE-03).
Wave : 4. Dépendance : Wave 3 Chantiers.

Goal : entités `Inspection` + `AuditHse` + `AuditHseLigne` + templates.

Livrables :
1. 3 entités + CRUD socle.
2. Endpoint `POST /hse/audits/{id}/cloturer` qui génère NC depuis lignes "non".
3. Désinjection : `pages/hse/inspections/services/inspection-api.service.ts` + `.facade.ts`.

Tests : `AuditClotureGenerateNcTest`.

Mettre à jour `00-PROGRESS.md` ligne B-HSE-03.
```

---

## B-HSE-04 — Formations HSE

```text
Tu es l'agent en charge de la tâche B-HSE-04.

Spec : `web/docs/specs/backend-integration-roadmap/09-hse.md` (section B-HSE-04).
Wave : 4. Dépendance : Wave 4 RH (Employe).

Goal : entité `FormationHse`.

Livrables :
1. Entité + CRUD socle + endpoint `/expirant?days=30`.
2. Désinjection : `pages/hse/formations/services/formation-api.service.ts` + `.facade.ts`.

Mettre à jour `00-PROGRESS.md` ligne B-HSE-04.
```

---

## B-HSE-05 — EPI dotation

```text
Tu es l'agent en charge de la tâche B-HSE-05.

Spec : `web/docs/specs/backend-integration-roadmap/09-hse.md` (section B-HSE-05).
Wave : 4. Dépendances : RH + Wave 1 Inventory.

Goal : entité `EpiDotation` + trigger sortie stock.

Livrables :
1. Entité + CRUD socle + endpoint `/expirant?days=30`.
2. Trigger : attribution `EpiDotation` génère `StockMovement` type SORTIE.

Tests : `EpiDotationStockSortieTest`.

Mettre à jour `00-PROGRESS.md` ligne B-HSE-05.
```

---

## B-HSE-06 — PPSPS + PHS

```text
Tu es l'agent en charge de la tâche B-HSE-06.

Spec : `web/docs/specs/backend-integration-roadmap/09-hse.md` (section B-HSE-06).
Wave : 4. Dépendance : Wave 3 Chantiers.

Goal : entités `Ppsps` + `PpspsSection` (8 sections types) + `Phs`.

Livrables :
1. 3 entités + CRUD socle + endpoints PDF + versioning.
2. Désinjection : `pages/hse/ppsps/ppsps-listing.page.ts` + `pages/hse/phs/phs-listing.page.ts`.

Mettre à jour `00-PROGRESS.md` ligne B-HSE-06.
```

---

## B-HSE-07 — Visites médicales

```text
Tu es l'agent en charge de la tâche B-HSE-07.

Spec : `web/docs/specs/backend-integration-roadmap/09-hse.md` (section B-HSE-07).
Wave : 4. Dépendance : Wave 4 RH.

Goal : entité `VisiteMedicale` + blocage pointage si INAPTE.

Livrables :
1. Entité + CRUD socle + endpoint `/echeances?days=60`.
2. Logique : `resultat = INAPTE` → blocage `Pointage` employé.
3. Désinjection : `pages/hse/visites-medicales/visites-medicales-listing.page.ts` + `pages/hse/services/hse-visite-medicale-planning.service.ts`.

Tests : `BlocagePointageInapteTest`.

Mettre à jour `00-PROGRESS.md` ligne B-HSE-07.
```

---

## B-HSE-08 — Registres légaux

```text
Tu es l'agent en charge de la tâche B-HSE-08.

Spec : `web/docs/specs/backend-integration-roadmap/09-hse.md` (section B-HSE-08).
Wave : 4. Dépendance : Wave 3 Chantiers.

Goal : entité `RegistreLegal` (type + obligations + dernière mise à jour).

Livrables :
1. Entité + CRUD socle.
2. Désinjection : `pages/hse/registres-legaux/registres-legaux.page.ts`.

Mettre à jour `00-PROGRESS.md` ligne B-HSE-08.
```

---

## B-HSE-09 — DUER

```text
Tu es l'agent en charge de la tâche B-HSE-09.

Spec : `web/docs/specs/backend-integration-roadmap/09-hse.md` (section B-HSE-09).
Wave : 4. Dépendance : Wave 3 Chantiers.

Goal : entités `Duer` + `DuerRisque` (matrice 5×5).

Livrables :
1. 2 entités + CRUD socle + endpoint `GET /hse/duer/{id}/pdf`.
2. Désinjection : `pages/hse/duer/duer-listing.page.ts`.

Mettre à jour `00-PROGRESS.md` ligne B-HSE-09.
```

---

## B-HSE-10 — Read model `HseKpi` (TF1/TF2/TG/Bird)

```text
Tu es l'agent en charge de la tâche B-HSE-10.

Spec : `web/docs/specs/backend-integration-roadmap/09-hse.md` (section B-HSE-10).
Wave : 4. Dépendance : B-HSE-01.

Goal : endpoint `GET /api/v1/hse/kpis?from=...&to=...&chantierId=...` retournant TF1/TF2/TG/joursSansAccident/pyramideBird.

Livrables :
1. Service `HseKpiService` (formules MA standard).
2. Endpoint REST.
3. Désinjection : `pages/hse/tableau-bord-hse/tableau-bord-hse.page.ts`.

Tests : `HseKpiServiceTest` (formules TF1 = AT*1M/heures, TF2, TG).

Mettre à jour `00-PROGRESS.md` ligne B-HSE-10.
```

---

# Wave 5 — Marchés, Approbations, Dashboard

## B-MAR-01 — Contrats marché + BPU

```text
Tu es l'agent en charge de la tâche B-MAR-01.

Spec : `web/docs/specs/backend-integration-roadmap/10-marches.md` (section B-MAR-01).
Wave : 5. Dépendances : Wave 2 Ventes + Wave 3 Chantiers.

Goal : créer le domaine `backend/domains/marches` avec entités `ContratMarche` + `ContratMarcheLigne` (BPU/PUF/PGF).

Livrables :
1. Créer le domaine `backend/domains/marches/`.
2. 2 entités + CRUD socle + transitions `/notifier`, `/cloturer`.
3. Désinjection :
   - `pages/marches/contrats/contrat-detail/contrat-detail.page.ts`
   - `pages/marches/contrats/contrat-listing/contrat-listing.page.ts`
4. Créer côté frontend `pages/marches/contrats/services/contrat-marche-api.service.ts` (n'existait pas).
5. Bonus : fusion sidebar "Marchés BTP" / "Marchés & Facturation" (Round 2 Task 07.0).

Tests : `ContratMarcheWorkflowTest`.

Mettre à jour `00-PROGRESS.md` ligne B-MAR-01.
```

---

## B-MAR-02 — Avenants (workflow + propagation impact)

```text
Tu es l'agent en charge de la tâche B-MAR-02.

Spec : `web/docs/specs/backend-integration-roadmap/10-marches.md` (section B-MAR-02).
Wave : 5. Dépendance : B-MAR-01.

Goal : entité `Avenant` + workflow + service de propagation impact (budget + délai + cautions).

Livrables :
1. Entité + CRUD socle + transitions `/soumettre-moa`, `/signer`, `/propager-impact`, `/annuler`.
2. Endpoint `GET /avenants/{id}/impact-simulation` (preview).
3. Service `AvenantPropagationService` qui met à jour `Chantier.montant_ht`, `Chantier.duree_mois`, `BudgetChantier.montant_revise`.
4. Désinjection : `pages/marches/avenants/**`.

Tests : `AvenantPropagationServiceTest`.

Mettre à jour `00-PROGRESS.md` ligne B-MAR-02.
```

---

## B-MAR-03 — Cautions bancaires

```text
Tu es l'agent en charge de la tâche B-MAR-03.

Spec : `web/docs/specs/backend-integration-roadmap/10-marches.md` (section B-MAR-03).
Wave : 5. Dépendance : B-MAR-01.

Goal : entité `Caution` (PROVISOIRE/DEFINITIVE/RG/AVANCE) + alertes expiration + workflow renouvellement/mainlevée.

Livrables :
1. Entité + CRUD socle + transitions `/renouveler`, `/demander-mainlevee`, `/mainlever`.
2. Endpoint `GET /marches/cautions/expirant?days=30`.
3. Job J-30 / J-7 alertes.
4. Désinjection : `pages/marches/cautions/caution-listing/caution-listing.page.ts`.

Tests : `CautionExpirationAlerteTest`.

Mettre à jour `00-PROGRESS.md` ligne B-MAR-03.
```

---

## B-MAR-04 — Factures marché + DGD

```text
Tu es l'agent en charge de la tâche B-MAR-04.

Spec : `web/docs/specs/backend-integration-roadmap/10-marches.md` (section B-MAR-04).
Wave : 5. Dépendances : B-MAR-01 + Wave 2 Ventes.

Goal : entité `FactureMarche` + entité `Dgd` (Décompte Général Définitif) avec calcul net à payer server-side.

Livrables :
1. 2 entités + CRUD socle.
2. Endpoint `POST /marches/contrats/{id}/dgd/generate` (auto post réception définitive).
3. Workflow DGD : BROUILLON → SOUMIS_MOA → NOTIFIE → PAYE.
4. Calcul net à payer = cumul_situations + cumul_revisions - cumul_rg - cumul_penalites - cumul_avances.
5. Désinjection : `pages/marches/factures/**` + `pages/marches/dgd/dgd-listing.page.ts`.

Tests : `DgdCalculatorTest`.

Mettre à jour `00-PROGRESS.md` ligne B-MAR-04.
```

---

## B-MAR-05 — Révisions prix (formule K)

```text
Tu es l'agent en charge de la tâche B-MAR-05.

Spec : `web/docs/specs/backend-integration-roadmap/10-marches.md` (section B-MAR-05).
Wave : 5. Dépendance : B-MAR-01.

Goal : entités `RevisionPrix` + `IndiceBtp` + service calcul formule K.

Livrables :
1. 2 entités + CRUD socle.
2. Endpoint `POST /marches/revisions-prix/calculer` (calcul K pour 1 période).
3. Endpoint `POST /marches/indices-btp/import-csv` (mensuel ANP/HCP).
4. Désinjection : `pages/marches/revisions-prix/revisions-prix.page.ts`.

Tests : `RevisionPrixFormuleKTest` (avec valeurs ANP/HCP de référence).

Mettre à jour `00-PROGRESS.md` ligne B-MAR-05.
```

---

## B-MAR-06 — Pénalités

```text
Tu es l'agent en charge de la tâche B-MAR-06.

Spec : `web/docs/specs/backend-integration-roadmap/10-marches.md` (section B-MAR-06).
Wave : 5. Dépendance : B-MAR-01.

Goal : entité `Penalite` (retard, qualité, autre).

Livrables :
1. Entité + CRUD socle + endpoint `/valider` (intègre au DGD).
2. Désinjection : `pages/marches/penalites/penalites.page.ts`.

Mettre à jour `00-PROGRESS.md` ligne B-MAR-06.
```

---

## B-MAR-07 — Ordres de service

```text
Tu es l'agent en charge de la tâche B-MAR-07.

Spec : `web/docs/specs/backend-integration-roadmap/10-marches.md` (section B-MAR-07).
Wave : 5. Dépendance : B-MAR-01.

Goal : entité `OrdreService` (COMMENCEMENT/ARRET/REPRISE/MODIFICATION/NOTIFICATION).

Livrables :
1. Entité + CRUD socle + endpoint `/notifier` + `GET /pdf`.
2. Logique : OS d'arrêt → `Chantier.status = SUSPENDU`.
3. Désinjection : `pages/marches/os/os-listing.page.ts`.

Tests : `OsArretChantierSuspenduTest`.

Mettre à jour `00-PROGRESS.md` ligne B-MAR-07.
```

---

## B-MAR-08 — Réceptions provisoire / définitive

```text
Tu es l'agent en charge de la tâche B-MAR-08.

Spec : `web/docs/specs/backend-integration-roadmap/10-marches.md` (section B-MAR-08).
Wave : 5. Dépendance : Wave 3 Chantiers.

Goal : entités `Reception` + `ReserveReception` + trigger DGD à réception définitive.

Livrables :
1. 2 entités + CRUD socle.
2. Endpoints `/reception-provisoire`, `/reception-definitive`, `/reserves`, `/lever`.
3. Trigger : réception définitive → `POST /marches/contrats/{id}/dgd/generate` automatique (B-MAR-04).

Tests : `ReceptionDefinitiveGenerateDgdTest`.

Mettre à jour `00-PROGRESS.md` ligne B-MAR-08.
```

---

## B-APR-01 — Approval workflow engine

```text
Tu es l'agent en charge de la tâche B-APR-01.

Spec : `web/docs/specs/backend-integration-roadmap/11-approbations.md` (section B-APR-01).
Wave : 5. Dépendance : Wave 0.

Goal : créer le domaine `backend/domains/approbations` avec le moteur de workflow entity-agnostic.

Livrables :
1. Créer le domaine `backend/domains/approbations/`.
2. Entités : `ApprovalWorkflow`, `ApprovalCondition`, `EtapeWorkflow`, `ApprovateurConfig`, `ApprovalRequest`.
3. Service `ApprovalEngineService` (sélection workflow + avancement étape + série/parallèle + quorum).
4. Endpoints : `POST /approbations/requests`, `POST /approve`, `/reject`, `/demande-complement`, `/commenter`, `/deleguer/{userId}`.
5. Seeds : 5 workflows (BC standard, BC>500K, Congés, Paie, Virement).
6. Désinjection : `pages/approbations/components/submit-approval-button/`.

Tests : `ApprovalEngineServiceTest` (sélection + avancement + escalade + délégation).

Mettre à jour `00-PROGRESS.md` ligne B-APR-01.
```

---

## B-APR-02 — Approval request + events + hash chain

```text
Tu es l'agent en charge de la tâche B-APR-02.

Spec : `web/docs/specs/backend-integration-roadmap/11-approbations.md` (section B-APR-02).
Wave : 5. Dépendance : B-APR-01.

Goal : entité `ApprovalEvent` avec hash chaîné SHA-256 (audit trail intégrité).

Livrables :
1. Entité `ApprovalEvent` (action, user, timestamp, payload, previous_hash, hash).
2. Endpoints : `GET /requests/{id}/events`, `/verify-integrity`, `/audit.pdf`.
3. Désinjection : `pages/approbations/inbox/inbox.page.ts`.

Tests : `ApprovalEventChainTest` (hash chain + détection altération).

Mettre à jour `00-PROGRESS.md` ligne B-APR-02.
```

---

## B-APR-03 — Délégation + escalade SLA

```text
Tu es l'agent en charge de la tâche B-APR-03.

Spec : `web/docs/specs/backend-integration-roadmap/11-approbations.md` (section B-APR-03).
Wave : 5. Dépendance : B-APR-02.

Goal : entité `DelegationApprobation` + job d'escalade.

Livrables :
1. Entité + CRUD socle.
2. Job quotidien : scan `ApprovalRequest` dépassant `escalade_apres_jours` → notification N+1 + event ESCALADE.
3. À chaque assignation : vérifier délégation active → réassigner.

Tests : `DelegationServiceTest` + `EscaladeServiceTest`.

Mettre à jour `00-PROGRESS.md` ligne B-APR-03.
```

---

## B-APR-04 — Matrice pouvoirs

```text
Tu es l'agent en charge de la tâche B-APR-04.

Spec : `web/docs/specs/backend-integration-roadmap/11-approbations.md` (section B-APR-04).
Wave : 5. Dépendance : B-APR-02.

Goal : entité `MatricePouvoir` qui configure seuils approbateurs (par société/division/chantier).

Livrables :
1. Entité + CRUD socle.
2. Intégration au moteur `ApprovalEngineService` : la matrice est un input à la sélection workflow.

Tests : `MatricePouvoirServiceTest`.

Mettre à jour `00-PROGRESS.md` ligne B-APR-04.
```

---

## B-DSH-01 — Read model `DashboardKpi`

```text
Tu es l'agent en charge de la tâche B-DSH-01.

Spec : `web/docs/specs/backend-integration-roadmap/12-dashboard-analytics.md` (section B-DSH-01).
Wave : 5. Dépendances : toutes Waves précédentes.

Goal : chaque domaine expose un endpoint `/kpis` pour les tuiles du dashboard.

Livrables :
1. Endpoints : `/chantiers/kpis`, `/ventes/kpis`, `/achats/kpis`, `/finance/kpis`, `/rh/kpis`, `/hse/kpis`, `/stock/kpis`, `/marches/kpis`.
2. Frontend : `DashboardFacade.loadAllKpis()` orchestre les 8 appels parallèles.
3. Désinjection : `pages/dashboard/dashboard.page.ts`.

Tests : `DashboardKpiServiceTest` (1 par domaine, valeurs sur seeds).

Mettre à jour `00-PROGRESS.md` ligne B-DSH-01.
```

---

## B-DSH-02 — Read model `AnalyticsBucket` (multi-axes)

```text
Tu es l'agent en charge de la tâche B-DSH-02.

Spec : `web/docs/specs/backend-integration-roadmap/12-dashboard-analytics.md` (section B-DSH-02).
Wave : 5. Dépendances : toutes Waves précédentes.

Goal : chaque domaine expose un endpoint `/analytics` retournant des buckets multi-axes (TCD).

Livrables :
1. Pattern : `GET /api/v1/<module>/analytics?dimensions=...&metrics=...&from=...&to=...`.
2. Endpoints implémentés sur les 6 domaines analytique (chantiers, ventes, achats, rh, hse, finance).
3. Désinjection :
   - `pages/analytics/tableau-{achats,chantiers,financier,hse,rh}/` (5 pages)
   - `pages/pilotage-analyses/services/pilotage-analyses-data.service.ts`

Tests : `AnalyticsBucketServiceTest` par domaine.

Mettre à jour `00-PROGRESS.md` ligne B-DSH-02.
```

---

## B-DSH-03 — Read model `CashFlowProjection` (dynamique)

```text
Tu es l'agent en charge de la tâche B-DSH-03.

Spec : `web/docs/specs/backend-integration-roadmap/12-dashboard-analytics.md` (section B-DSH-03).
Wave : 5. Dépendances : Finance + Chantiers + Ventes.

Goal : endpoint `GET /api/v1/pilotage/cash-flow-projection?from=...&to=...&societeId=...` avec projection dynamique (corrige le bug Round 2 M-PIL-05 — plateau constant).

Livrables :
1. Service `CashFlowProjectionService` calculant chaque mois :
   - Encaissements = situations attendues - RG immobilisée + échéances factures
   - Décaissements = factures fournisseurs + salaires + charges + traites
2. Endpoint REST.
3. Désinjection :
   - `pages/pilotage/services/cash-flow-projection.service.ts`
   - `pages/pilotage/services/pilotage-chantier-marges.service.ts`
   - `pages/pilotage-analyses/services/pilotage-analyses-data.service.ts`
4. Validation finale : `grep MockService` sur tout `web/app/applications/erp/` (hors specs) → vide.

Tests : `CashFlowProjectionServiceTest` (non-linéarité + cohérence sur seeds).

Mettre à jour `00-PROGRESS.md` ligne B-DSH-03.
```

---

## Tableau d'orchestration des dépendances (résumé)

> Voir `00-PRIORITIES.md` pour le planning sprint par sprint complet.

| Wave | Tâches | Pré-requis |
|---|---|---|
| **Wave 0** | B-FND-01 → 05 | — |
| **Wave 1 Inv** | B-INV-01 → 07 | Wave 0 |
| **Wave 1 Fin** | B-FIN-01 → 08 | Wave 0 |
| **Wave 2 Ach** | B-ACH-01 → 07 | Wave 0 + Inv + Fin |
| **Wave 2 Ven** | B-VEN-01 → 06 | Wave 0 + Inv + Fin |
| **Wave 3 Cha** | B-CHA-01 → 10 | Wave 0 + Wave 2 |
| **Wave 3 Etu** | B-ETU-01 → 06 | Wave 0 + Inv + Cha |
| **Wave 4 RH** | B-RH-01 → 08 | Wave 0 + Cha |
| **Wave 4 HSE** | B-HSE-01 → 10 | Cha + RH |
| **Wave 5 Mar** | B-MAR-01 → 08 | Ven + Cha |
| **Wave 5 Apr** | B-APR-01 → 04 | Wave 0 (engine indépendant) |
| **Wave 5 Dsh** | B-DSH-01 → 03 | Toutes précédentes |

---

## Anti-patterns à éviter (rappel)

- ❌ Recréer un générateur "léger" → tout est écrit à la main.
- ❌ Logique métier dans le contrôleur → toujours dans le service custom.
- ❌ Endpoint custom pour ce qui rentre dans CRUD socle → utiliser le socle.
- ❌ Domaine backend pour Dashboard/Analytics → read endpoints multi-domaines, pas de domaine dédié.
- ❌ Migrer un seul `*-api.service.ts` du module sans désinjecter les autres pages → état hybride mock/réel.
- ❌ Démarrer Wave N avant que Wave N-1 soit `[~]` → cassure.
- ❌ Toucher l'UX/UI Angular pendant la migration → la roadmap ne change rien à l'UX.

---

## Mise à jour du fichier

| Date | Auteur | Changement |
|------|--------|------------|
| 2026-05-13 | — | Création — 78 prompts agent (1 par tâche backend) basés sur `migration_plan.md` + audit codebase. |
