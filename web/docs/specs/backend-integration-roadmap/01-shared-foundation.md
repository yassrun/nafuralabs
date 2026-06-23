# Wave 0 — Shared Foundation

## Findings traités

Issus de `migration_plan.md` §0 et de l'inventaire mock `00-MOCK-INVENTORY.md` :

- **Class A (ready-now CRUD)** : 12 services Angular utilisent déjà `FeatureApiService` par défaut, mais 9 d'entre eux pointent vers des endpoints `/api/v1/...` qui **n'existent pas** sauf pour `item`, `stock`, `currency`.
- **App spec ERP** ne référence que 3 domaines (`item`, `stock`, `currency`) sur 11 nécessaires (item, stock, currency, partner, achats, ventes, chantiers, etudes, rh, hse, marches, approbations).
- **Pas de domaine `partner`** : les clients et fournisseurs vivent uniquement dans les mocks `VentesMockService` et `AchatsMockService`.
- **`/lookup` non systématique** : chaque page d'autocomplete a son propre code custom au lieu d'utiliser l'endpoint `/lookup` du `CrudController`.
- **RBAC permissions** : seules `item.*`, `stock.*`, `currency.*` sont déclarées dans `erp.application.json` → impossible d'autoriser un user sur `achats.bons-commande.create` aujourd'hui.

## Goal

Établir la **baseline backend** qui débloque toutes les vagues suivantes :

1. Contrats CRUD des 3 domaines existants **alignés à 100%** avec ce qu'attend `FeatureApiService` côté frontend (pagination, search, sort, lookup).
2. Domaine `partner` créé pour devenir la source unique des clients, fournisseurs, MOA et sous-traitants.
3. Application spec `erp.application.json` enrichie avec les 8 nouveaux domaines (au moins déclarés, même vides) + permissions + roleTemplates étendus.
4. Patron `/lookup` documenté et appliqué à tous les référentiels existants.
5. Convention multi-tenant systématisée (toutes les nouvelles entités héritent du même pattern).

## Source-of-truth frontend (à brancher dès Wave 0)

```
web/app/applications/erp/pages/inventory/catalogue/items/services/item-api.service.ts            ← déjà pure HTTP
web/app/applications/erp/pages/inventory/catalogue/item-prices/services/item-price-api.service.ts ← déjà pure HTTP
web/app/applications/erp/pages/inventory/configuration/item-categories/services/*.ts              ← déjà pure HTTP
web/app/applications/erp/pages/inventory/configuration/item-types/services/*.ts                   ← déjà pure HTTP
web/app/applications/erp/pages/inventory/configuration/unit-of-measures/services/*.ts             ← déjà pure HTTP
web/app/applications/erp/pages/inventory/configuration/uo-mcategories/services/*.ts               ← déjà pure HTTP
web/app/applications/erp/pages/inventory/mouvements/inventory-txes/services/inventory-tx-api.service.ts ← déjà pure HTTP
web/app/applications/erp/pages/inventory/mouvements/inventory-tx-lines/services/inventory-tx-line-api.service.ts ← déjà pure HTTP
web/app/applications/erp/pages/inventory/suivi/stock-balances/services/stock-balance-api.service.ts     ← déjà pure HTTP
web/app/applications/erp/pages/finance/configuration/currencies/services/currency-api.service.ts        ← déjà pure HTTP
web/app/applications/erp/pages/finance/configuration/exchange-rates/services/exchange-rate-api.service.ts ← déjà pure HTTP
web/app/applications/erp/pages/finance/configuration/payment-terms/services/payment-term-api.service.ts ← déjà pure HTTP
```

Ces 12 services **doivent** fonctionner dès la fin de Wave 0 sans la moindre erreur HTTP — c'est le test de non-régression de la baseline.

## Cible backend

### Domaines à toucher

```
backend/domains/item/        (existant — stabilisation + lookup)
backend/domains/stock/       (existant — stabilisation + lookup)
backend/domains/currency/    (existant — stabilisation + lookup)
backend/domains/partner/     (NOUVEAU — clients, fournisseurs, MOA, ST)
```

### Décisions de modélisation

**Decision 1 — Partner unifié ou domaines séparés ?**

> **Choix retenu :** **un seul domaine `partner`** avec une entité `Partner` polyvalente + table de jointure `partner_roles` (CLIENT, FOURNISSEUR, MOA, SOUS_TRAITANT).
>
> Justification : un sous-traitant est très souvent aussi fournisseur, un MOA peut devenir client privé. Forker `client` vs `fournisseur` créerait des doublons impossibles à dédupliquer.
>
> Conséquence pour Achats/Ventes : ils ne créent pas leur propre `Fournisseur`/`Client` — ils référencent `partnerId` + filtrent par rôle.

**Decision 2 — Tenant scoping de `partner`**

> Multi-tenant strict (chaque tenant a ses propres partenaires). Pas de partage cross-tenant en V1.

**Decision 3 — Référentiels MA**

> Les attributs ICE / IF / RC / Patente / CNSS / AMO sont des **champs sur `Partner`**, pas une entité séparée. Validation algorithmique (cf. `web/app/applications/erp/shared/validators/`) reportée côté backend.

## Tasks

### B-FND-01 — Stabiliser `item` / `stock` / `currency`

**Goal :** s'assurer que les 12 `*-api.service.ts` Class A frontend fonctionnent en bout en bout sans erreur.

**À faire :**

1. Vérifier les `basePath` Angular vs `@RequestMapping` Java pour les 12 services Class A. Aligner si écart.
2. Vérifier la forme JSON renvoyée par `CrudController.list` : `Page<T>` avec `content[]`, `totalElements`, `number`, `size`. Tester avec `FeatureApiService.getAll()`.
3. Activer l'endpoint `/lookup` pour : `Item`, `ItemCategory`, `ItemType`, `UnitOfMeasure`, `UoMCategory`, `Warehouse`, `Currency`, `PaymentTerm`. (Pas de code à écrire — c'est déjà dans `CrudController` — mais valider le label/value et que `searchFields` est cohérent.)
4. Compléter `searchFields` manquants dans les `*Service` (recherche full-text basique).
5. Lancer un smoke test e2e : `ng serve` + `./gradlew :applications:erp:bootRun` → vérifier que les 12 pages chargent sans erreur 404/500.

**Fichiers à toucher :**

```
backend/domains/item/src/main/java/ma/nafura/item/api/controller/*.java
backend/domains/item/src/main/java/ma/nafura/item/service/*.java
backend/domains/stock/src/main/java/ma/nafura/stock/api/controller/*.java
backend/domains/currency/src/main/java/ma/nafura/currency/api/controller/*.java
```

**Acceptance criteria :**

- [ ] `GET /api/v1/items?page=0&size=20` renvoie un `Page<Item>` non vide après seed.
- [ ] `GET /api/v1/items/lookup?q=cim&size=10` renvoie `{ items: [{ value: "...", label: "..." }], total: N }`.
- [ ] `GET /api/v1/items?search=cim&searchFields=code,name` filtre correctement.
- [ ] Les 12 pages frontend Class A chargent sans 404 (vérifié manuellement ou Playwright).
- [ ] `./gradlew :domains:item:build :domains:stock:build :domains:currency:build` passe.

**Effort :** 2-3 j.h

---

### B-FND-02 — Domaine `partner` (clients + fournisseurs + MOA + ST)

**Goal :** créer le domaine pivot qui servira d'origine unique des tiers pour Achats, Ventes, Chantiers et Marchés.

**Entités à créer :**

| Entité | Description |
|---|---|
| `Partner` | Tiers polyvalent (ICE, IF, RC, raison sociale, contacts, adresse) |
| `PartnerRole` | Rôle d'un partner (CLIENT, FOURNISSEUR, MOA, SOUS_TRAITANT) — table M:N |
| `PartnerContact` | Contacts d'un partner (nom, fonction, email, téléphone) |
| `PartnerAddress` | Adresses (siège, livraison, facturation) |
| `PartnerBankAccount` | RIBs (24 chiffres + clé) |

**`Partner` — champs obligatoires :**

```
id (uuid PK)
tenant_id (uuid not null)
code (varchar 30, unique per tenant)
raison_sociale (varchar 255, not null)
forme_juridique (varchar 50)
ice (varchar 15)
identifiant_fiscal (varchar 8)
registre_commerce (varchar 50)
patente (varchar 50)
cnss (varchar 20)
amo (varchar 20)
email (varchar 255)
phone (varchar 50)
website (varchar 255)
created_at, updated_at
```

**Endpoints backend :**

```
GET    /api/v1/partners                                  ← list (filtre par role via ?role=CLIENT)
GET    /api/v1/partners/lookup
GET    /api/v1/partners/{id}
POST   /api/v1/partners
PUT    /api/v1/partners/{id}
DELETE /api/v1/partners/{id}
POST   /api/v1/partners/{id}/roles   ← ajout d'un rôle
DELETE /api/v1/partners/{id}/roles/{role}
GET    /api/v1/partners/{id}/contacts
POST   /api/v1/partners/{id}/contacts
PUT    /api/v1/partners/{id}/contacts/{contactId}
DELETE /api/v1/partners/{id}/contacts/{contactId}
GET    /api/v1/partners/{id}/addresses
…
```

Filtrage par rôle : un query param `role` est ajouté à la `list()` du controller custom.

**Fichiers à créer :**

```
backend/domains/partner/build.gradle
backend/domains/partner/src/main/java/ma/nafura/partner/
  ├── api/controller/{base/,}{Partner,PartnerContact,PartnerAddress,PartnerBankAccount}Controller{,Base}.java
  ├── api/request/Partner{Create,Update}Dto.java + sous-entités
  ├── domain/model/{Partner,PartnerRole,PartnerContact,PartnerAddress,PartnerBankAccount}.java
  ├── mapper/*Mapper.java
  ├── repository/*Repository.java
  └── service/{base/*Base.java, *Service.java}
backend/domains/partner/src/main/resources/db/changelog/schema/v1.0/
  ├── 01-create-partners.xml
  ├── 02-create-partner-roles.xml
  ├── 03-create-partner-contacts.xml
  ├── 04-create-partner-addresses.xml
  └── 05-create-partner-bank-accounts.xml
```

**Seeds (changeset Liquibase `context="seed-demo"`) :**

Charger les fournisseurs de `web/app/applications/erp/achats/mock/achats-mock.service.ts` et les clients de `web/app/applications/erp/ventes/mock/ventes-mock.service.ts` pour pouvoir comparer le frontend mock vs réel.

**Acceptance criteria :**

- [ ] `GET /api/v1/partners?role=CLIENT&page=0&size=20` renvoie au moins 5 partenaires CLIENT (seeds).
- [ ] `GET /api/v1/partners?role=FOURNISSEUR` renvoie au moins 5 fournisseurs.
- [ ] Un partner peut avoir plusieurs rôles (CLIENT + FOURNISSEUR).
- [ ] Validation `IceValidator` côté backend (15 chiffres + clé) reproduisant `web/app/applications/erp/shared/validators/`.
- [ ] `./gradlew :domains:partner:build` passe.
- [ ] La migration Liquibase joue sur PostgreSQL vierge.

**Effort :** 2-3 j.h

---

### B-FND-03 — Endpoints `/lookup` standardisés

**Goal :** garantir que **tous les référentiels** des modules en place (item, stock, currency, partner) exposent `/lookup` de façon homogène.

**À faire :**

1. Auditer `web/app/applications/erp/**/*.facade.ts` qui font des appels d'autocomplete : recenser tous les patterns "charger les fournisseurs / clients / articles / dépôts" et confirmer qu'ils peuvent tous être remplacés par `getLookup()` du `FeatureApiService`.
2. Pour chaque référentiel, écrire un test JUnit `@WebMvcTest` qui appelle `/lookup?q=...&size=10` et vérifie le format `{ items: [{value, label}], total }`.
3. Aligner les `searchFields` du service Java avec les champs utilisés par le frontend (généralement `code` + `name`).

**Acceptance criteria :**

- [ ] Tous les `*Service` Java ont `searchFields` documenté.
- [ ] Tests JUnit `lookup()` ≥ 1 par entité référentielle.
- [ ] Plus aucun code custom de recherche dans les facades frontend qui font de l'autocomplete sur item/partner/currency/UoM/warehouse.

**Effort :** 1-2 j.h

---

### B-FND-04 — Enregistrer 8 nouveaux domaines dans `erp.application.json`

**Goal :** déclarer les 8 nouveaux domaines (même vides) dans le spec d'application pour que Keycloak / RBAC / navigation soient prêts dès Wave 1.

**À modifier :**

```
naf/src/spec/applications/erp/erp.application.json
```

**Ajout dans `domains[]` :**

```jsonc
"domains": [
  "item", "stock", "currency",
  "partner",
  "achats", "ventes",
  "chantiers", "etudes",
  "rh", "hse",
  "marches", "approbations"
]
```

Idem dans `defaultTenant.domains[]`.

**Ajout dans `zones[]` :**

```jsonc
{ "id": "commerce",    "label": "zones.commerce",    "order": 3 },
{ "id": "projects",    "label": "zones.projects",    "order": 4 },
{ "id": "people",      "label": "zones.people",      "order": 5 },
{ "id": "compliance",  "label": "zones.compliance",  "order": 6 },
{ "id": "contracts",   "label": "zones.contracts",   "order": 7 },
{ "id": "governance",  "label": "zones.governance",  "order": 8 }
```

**Ajout dans `navigation.domainGroups[]` :** un groupe par zone, listant ses domaines.

**Ajout dans `roleTemplates[].permissions[]` :**

```jsonc
"permissions": [
  "partner.*", "achats.*", "ventes.*",
  "chantiers.*", "etudes.*",
  "rh.*", "hse.*",
  "marches.*", "approbations.*"
]
```

(à doser selon ADMIN / MANAGER / MEMBER / VIEWER — pas tout pour tout le monde).

**Acceptance criteria :**

- [ ] `erp.application.json` validé contre le schéma (`naf/src/spec/schemas/application.schema.json`).
- [ ] Keycloak peut booter avec les nouveaux clients/rôles sans erreur.

**Effort :** 1 j.h

---

### B-FND-05 — Conventions multi-tenant + roleTemplates

**Goal :** documenter et appliquer en code la convention multi-tenant + permissions pour tous les futurs domaines.

**À faire :**

1. Documenter dans `00-ARCHITECTURE.md` §6 (déjà fait) la convention `<module>.<entity>.<action>`.
2. Créer (s'il n'existe pas) un changelog Liquibase commun à tous les domaines pour les index `tenant_id` standards.
3. Définir les 4 roleTemplates BTP métier à ajouter :
   - `BTP_DG` — toutes permissions
   - `BTP_DAF` — finance + achats + ventes + marches + read-only sur le reste
   - `BTP_CONDUCTEUR_TRAVAUX` — chantiers + rh.pointage + hse + read-only sur achats/ventes
   - `BTP_CHEF_CHANTIER` — pointage + avancements + photos + bons matières + read-only le reste
4. Mettre à jour `erp.application.json` avec ces 4 roleTemplates supplémentaires.

**Acceptance criteria :**

- [ ] Documentation conventions tenant_id présente et exemplifiée.
- [ ] 4 roleTemplates BTP ajoutés et validés.
- [ ] `ng build` + `./gradlew build` passent.

**Effort :** 2-3 j.h

## Frontend cleanup (Wave 0)

Aucune désinjection de mock obligatoire en Wave 0 — les services Class A frontend ne dépendent déjà plus des mocks. Mais il faut **vérifier** :

```bash
grep -r "MockService" web/app/applications/erp/pages/inventory/catalogue/ \
                     web/app/applications/erp/pages/finance/configuration/ \
                     2>/dev/null
# (vide attendu)
```

Si du contenu apparaît, c'est un résidu à nettoyer en parallèle de Wave 0.

## Testing

| Test | Type | Périmètre |
|---|---|---|
| `ItemServiceTest`, `StockServiceTest`, `CurrencyServiceTest` | JUnit unit | smoke CRUD |
| `PartnerControllerIntegrationTest` | `@SpringBootTest` + Testcontainers | CRUD + roles + lookup |
| `wave0-baseline.spec.ts` | Playwright e2e | charger les 12 pages Class A sans erreur |
| `partner-lookup-contract.spec.ts` | Playwright e2e | autocomplete partner depuis la page facture ventes (qui n'est pas encore migrée mais sert juste de smoke UI sur l'endpoint) |

## Dependencies

- **Aucune** — c'est la racine du graphe.

## Definition of Done — Wave 0

Cf. `00-ARCHITECTURE.md` §10. Spécifique Wave 0 :

- [ ] Les 12 pages Class A fonctionnent en mode "vraie API".
- [ ] Domaine `partner` créé, seedé, testé.
- [ ] `erp.application.json` à jour avec 11 domaines.
- [ ] Au moins 4 roleTemplates BTP fonctionnels.
- [ ] `00-PROGRESS.md` à jour.
