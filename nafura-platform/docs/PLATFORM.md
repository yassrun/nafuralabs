# Plateforme Nafura — construire un BC

> Ce qu’un BC déclare, ce que la plateforme en fait. Exemple complet et à jour : `platform-host/bcs/demo`.
> Architecture : [ARCHITECTURE.md](ARCHITECTURE.md) · écrans : [UI.md](UI.md) · lancer : [ops/README.md](../ops/README.md).

## Ajouter un BC à un produit

1. `bcs/<nom>/bc.manifest.json` (id `bc.<nom>`) et `bcs/<nom>/backend/build.gradle` = `apply from: '…/nafura-platform/gradle/nafura-bc.gradle'`.
2. L’id dans `app.nafura.json` `spec.businessContexts`. Gradle compose `bcs/<nom>/backend` en `:bc-<nom>` ; le web génère la liste des BCs (`business-contexts.generated.ts`, ignoré par git).
3. `bcs/<nom>/web/index.ts` : `export default` un `HostBusinessContext` (manifeste, routes). Il est chargé **à la première visite** du BC : le module généré n’importe au démarrage que les manifestes (`LazyHostBusinessContext`), pour que les archétypes et leurs dépendances ne pèsent pas sur la première page. Les liens vers une fiche (approbations, notifications, audit) se déclarent dans le manifeste : `spec.records` (`{ "demo.purchase-request": "/demo/purchase-requests/{id}" }`, sous `routesPrefix`, avec `{id}`).
4. Backend : une `@AutoConfiguration` (`@ComponentScan @EntityScan @EnableJpaRepositories`) listée dans `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`.

Rien d’autre dans le produit : les garde-fous (`npm run architecture:check`) refusent tout fichier hors configuration, points d’entrée et BCs, et toute mention du nom du produit hors `app.nafura.json`.

## Manifestes

| Fichier | Contient | Schéma |
|---|---|---|
| `app.nafura.json` | `metadata.id`, `spec.product` (`name`, `mark`, `logo`), `spec.runtime` (`tenancy`, `defaultRoute`), `spec.shell`, `spec.businessContexts`, `spec.capabilities.disabled`, `spec.roles`, `spec.customRoles`, `spec.i18n`, `spec.local` (ports, utilisateurs lab), `spec.deploy.<env>` (`host`, `owners`) | `sources/web/platform/schemas/app.nafura.schema.json` |
| `bc.manifest.json` | `label`, `icon`, `routesPrefix`, `records` (liens vers les fiches par type d’entité), `permissions`, `defaultRoles`, `notifications`, `navigation`, `requires`, `screens` (écrans spécifiques : `id`, `label`, `reason`) | `sources/web/platform/schemas/bc.manifest.schema.json` |

Les deux sont validés au build (web) et lus au démarrage (backend). Pas de second format.

## Données et API : le record

Une entité métier = `extends TenantEntity` (id, organisation, audit) + Bean Validation. Son API REST :

```java
@RestController
@RequestMapping("/api/v1/<bc>/suppliers")
@SecuredResource(domain = "<bc>", feature = "purchasing", resource = "supplier")
class SupplierController extends RecordController<Supplier> { … }
```

`RecordController` donne : liste paginée (`page` à partir de 0, `size` plafonné à 500 et renvoyé tel qu’appliqué), triée (`sort=champ:asc` répétable : `sort=neededBy:asc&sort=amount:desc` — deux-points, pas de virgule : Spring découperait `champ,asc` en deux valeurs ; propriété `sortable`), recherchée (`q`) et filtrée (`filter`, grammaire ci-dessous), `/options` pour les listes de choix, `/properties`, `/aggregate`, lecture, création, modification, suppression. Permissions : `<domain>.<feature>.<resource>.{read,create,update,delete}` selon la méthode HTTP. Champs dérivés en lecture : `@Formula`.

### Le descripteur du record

`recordResource()` → `resources/records/<record>.json`, un seul fichier par record : ses propriétés, sa recherche et, s’il en a un, son cycle de vie.

```json
{
  "entity": "demo.supplier",
  "search": ["code", "name", "contacts.name"],
  "properties": {
    "name": { "label": "Raison sociale", "filterable": true, "sortable": true },
    "categoryId": { "label": "Catégorie", "type": "relation", "target": "demo.category", "display": "categoryName", "filterable": true },
    "contacts": { "label": "Contacts", "type": "relations", "target": "demo.supplier-contact", "via": "supplierId", "filterable": true }
  }
}
```

- Seules les propriétés déclarées sont exposées (`GET /properties` : type, libellé, filtrable, triable, valeurs d’un `status` / `select`, API de la cible d’une relation). Type déduit du champ quand il est omis : texte → `text`, nombre → `number`, date → `date`, booléen → `boolean`, `status` → `status` (états du cycle de vie). Le BC précise `label`, `money` (+ `currency`), `select` (+ `options`), `relation` (N-1 : `target`, `display`), `relations` (1-N : `target`, `via`, sans champ propre), `person`, `filterable`, `sortable`.
- `search` : champs texte de `q` (contient, sans casse), ou `<relation>.<propriété texte de la cible>`.
- Une propriété sans champ, un type incompatible, une cible ou un `via` inconnu, un chemin de recherche faux empêchent le démarrage (fichier et propriété nommés).
- `GET /aggregate?sum=…&avg=…&count=…` : sur tout le résultat filtré (même `filter` et `q` que la liste).

### La grammaire des filtres

`filter` (JSON) : un critère `{ "<propriété>": { "<opérateur>": valeur } }`, ou `{ "and" | "or": [ … ] }`, deux niveaux au plus.

| Type | Opérateurs |
|---|---|
| `text` | `is`, `isNot`, `contains`, `startsWith`, `empty` |
| `number`, `money` | `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `between`, `empty` |
| `date` | `is`, `before`, `after`, `between`, `empty` — dates relatives `today`, `today±Nd`, `startOfMonth`, dans le fuseau de l’organisation |
| `status`, `select` | `is`, `isNot`, `in`, `notIn` |
| `relation` | `is`, `in`, `empty`, `where` (sous-filtre sur la cible) |
| `relations` | `any`, `none` (sous-filtre sur la cible), `empty` |
| `person` | `is`, `in`, `empty` — valeur `me` |
| `boolean` | `is` |

Une relation se traverse une fois (`{ "contacts": { "any": { "name": { "contains": "Benali" } } } }`), sur les propriétés filtrables de la cible, toujours dans l’organisation ; il faut la permission de lecture de la cible (403 sinon) et une audience externe ne traverse pas. Propriété non filtrable, opérateur hors type, imbrication trop profonde : 400.

Une action de fiche qui n’est pas une transition est un endpoint du même contrôleur (`POST /{id}/<action>`, `@RequirePermission`). La fiche déclare `result: 'record'` quand la réponse est la fiche à ouvrir (une copie, par exemple) : l’écran navigue vers son id.

Les pièces jointes, les notes et la timeline d’activité d’un record enregistré par un `RecordController` utilisent la permission de ce record (lecture pour voir, mise à jour pour ajouter ou supprimer pièces/notes), pas `collaboration.*.*`. La clé d’entité envoyée est `lifecycle.entity`, sinon le dernier segment du mapping. Un type d’entité inconnu du registre garde la permission du contrôleur collaboration. La timeline lit `GET /api/v1/platform/collaboration/audit/timeline` avec `@HostRecordGate` (même contrat que commentaires / pièces jointes).

Ne pas écrire de service CRUD, de DTO de liste ou de pagination à la main.

### Logique métier du record

Le contrôleur porte la logique du record par cinq méthodes protégées, jamais en redéfinissant un endpoint (`create`, `update`, `delete`, `list`, `get`… : une redéfinition empêche le démarrage, parce qu'elle contournerait le contrôle d'édition, l'audit ou ces règles).

| Méthode | Quand | Effet |
|---|---|---|
| `validate(record, previous)` | après Bean Validation | champ → message ; non vide : 422, `fieldErrors` comme Bean Validation, rien n'est enregistré |
| `beforeSave(record, previous)` | après `validate` | valeurs calculées, normalisation |
| `afterSave(saved, previous)` | après l'enregistrement et l'audit | effets (total d'un parent, lignes) ; une exception annule tout |
| `beforeDelete(record)` | après le contrôle d'édition | `throw RecordRuleException.refused("…")` : 409 `RECORD_REFUSED`, la raison est affichée telle quelle |
| `readOnlyFields()` | création et modification | champs jamais écrits par le corps de la requête (empreinte, secret, valeur calculée) |

- `previous` est une copie détachée du record enregistré, `null` à la création. Tout se passe dans la transaction de la requête.
- `RecordRuleException.fields(Map)` (422) ou `refused(raison)` (409) peut être levée de n'importe laquelle de ces méthodes.
- Les données initiales passent par `validate`, `beforeSave` et `afterSave` (avec `previous` à `null`) : un jeu qui enfreint une règle bloque le démarrage, fichier et record nommés.
- La liste et la fiche affichent la raison d'un refus ou les erreurs de champ, avec leurs libellés.
- Exemples : BC démo (`SupplierController` : code en majuscules, suppression refusée s'il a des demandes ; `PurchaseRequestController` : justification obligatoire au-delà de 20 000).

`@Auditable(entityType, trackedFields)` sur l’entité : chaque création, modification, suppression et transition passe dans `audit_events` (capability `cap.audit`). Si seuls les champs tracked changent et que c’est uniquement `status`, l’action émise est `status_change` (sinon `update`). La fiche lit la timeline via une section `kind: 'audit'` ([UI.md](UI.md)) ; le journal admin (`administration.audit.read`) liste tous les événements et « Voir l’entité » résout l’URL via `HostBusinessContext.records`, comme les notifications. Détail, contrat et roadmap : [capabilities/audit.md](capabilities/audit.md).

## Cycle de vie et approbations

Dans le descripteur du record (`records/<record>.json`) : états (libellé, ton), `initial`, `editable`, transitions (`from`, `to`, `permission`, `requires`, `approval { role, when, title, approved, rejected }`, `system`, `notify`). La plateforme expose `/lifecycle`, `/{id}/transitions`, `POST /{id}/transitions/{id}` et refuse ce que le JSON interdit (403, 409, 422 avec les champs manquants). Une approbation passe par la boîte unique `/approvals` ; sa décision tire la transition de sortie. Le web dessine le statut et les actions depuis ce JSON.

`notify` sur une transition : `{ "event": "<id déclaré>", "to": … }`. `to` vaut `createdBy`, `field:<champ>` (UUID d’utilisateur) ou `permission:<id>` (les membres qui ont cette permission — jamais un rôle). L’acteur d’une transition utilisateur n’est pas prévenu ; une issue `system` (approuver, rejeter) prévient quand même `createdBy`. La capability `notifications` coupée : les règles sont ignorées, un avertissement est écrit au démarrage. Un événement non déclaré, un champ inconnu ou une permission non déclarée empêche le démarrage. Le lien est `entityType` + `entityId` ; le web le résout avec `HostBusinessContext.records`.

## Notifications

Capability `cap.notifications` : un seul chemin (manifeste / `notify` → `NotificationRouter` → canaux `in_app` / `email`), préférences org/user, inbox, cloche SSE, digest, e-mail absolu + from produit. **État détaillé, contrat et roadmap** : [capabilities/notifications.md](capabilities/notifications.md).

Rappel court : le BC déclare les événements dans `bc.manifest.json` → `notifications` ; `notify` sur une transition ne prévient pas l’acteur (sauf issue `system`). API prefs `GET|PUT …/notification-preferences` (+ `/organisation`). UI : `/notifications`, Mes paramètres / Paramètres organisation → Notifications.

## Permissions et rôles

- Le BC déclare chaque permission dans son manifeste, sous son préfixe (`<bc>.`). Le code vérifie des permissions (`@SecuredResource`, `@RequirePermission`, `permission` dans les configurations d’écran), **jamais des rôles** (garde-fou).
- Rôles, quatre sources : plateforme (`OWNER`, `ORG_ADMIN`, `ORG_MEMBER`), `defaultRoles` du BC, `spec.roles` du produit (`includes: ["bc.x:ROLE"]`), rôles créés par l’organisation (seulement des permissions connues que l’admin possède).
- Activer ou couper un BC pour une organisation : écran Domaines (code = id du BC sans `bc.`). Coupé, ses permissions sont refusées à tous.
- Membres et invitations (capability `cap.iam`) : résumé, contrat et roadmap → [capabilities/iam.md](capabilities/iam.md). UI admin : listing + détail config-driven (`nf-entity-detail`) ; acceptation publique `/invite/accept`.

## Schéma

SQL dans `backend/src/main/resources/db/changelog/schema/v1.0/NNN_<sujet>.sql` (`CREATE TABLE IF NOT EXISTS`, `tenant_id UUID NOT NULL`, index sur `tenant_id`). Le changelog du produit est généré depuis les modules composés ; les entités sont validées contre lui (`ddl-auto: validate`). Lab mode : on corrige le schéma cible, pas de migrations défensives.

## Données initiales

`backend/src/main/resources/META-INF/nafura/seed/<nom>.json` :

```json
{
  "id": "<bc>.categories",
  "kind": "reference",
  "after": [],
  "entities": [
    { "entity": "DemoCategory", "key": ["code"], "records": [
      { "code": "IT", "name": "Informatique" },
      { "code": "IT-HW", "name": "Matériel", "parentId": { "$ref": "DemoCategory", "code": "IT" } }
    ] }
  ]
}
```

- `reference` : partout, prod comprise. `demo` : lab et staging seulement.
- `scope` : `organization` (défaut, une copie par organisation) ou `product` (un jeu pour le produit, entité `ProductEntity`, lecture seule pour les organisations). Pas d’autre format.
- `$ref` : l’id d’un record de l’organisation trouvé par ses champs (exactement un). `"$transitions": ["submit"]` : le record passe par son cycle de vie comme un utilisateur.
- Créé seulement si la clé manque ; jamais modifié ; rejoué seulement si le fichier change. Un jeu invalide bloque le démarrage avec le fichier et le record en cause.

## Connexion et organisation

- `GET /api/public/auth/config` : mode de connexion de l’environnement. `GET /api/v1/me/session` : qui, quelle organisation, quelle audience. `GET /api/v1/me/organizations` : appartenances (`id`, `key`, `slug`, `audience`, `roles`) ; l’opérateur (`platform.operator.*`) y voit toutes les organisations, même sans appartenance. `GET /api/v1/me/permissions` : permissions effectives et domaines coupés.
- `tenancy: single` : l’organisation (clé = id du produit) et ses propriétaires (`spec.deploy.<env>.owners`, rôle `OWNER`) sont créés au démarrage. Les propriétaires invitent et attribuent le reste dans l’application.
- `tenancy: multi` : `spec.local.organizations` au démarrage lab. Une appartenance lab est une clé, ou `{ key, role?, audience? }` pour un rôle différent par organisation. `POST /api/tenants` (nom, clé, e-mail de l’administrateur) est réservé à `platform.operator.*` quand `spec.runtime.signup` vaut `operator` ; `open` l’ouvre. La création applique les seeds `reference` de portée organisation et journalise l’invitation. `POST /api/tenants/{id}/suspend` et `/resume` exigent `platform.operator.organizations.update`. Une organisation `SUSPENDED` répond 403 à ses membres.
- L’opérateur est un e-mail de `spec.deploy.<env>.operators` (lab, staging ou prod selon le profil). La permission `platform.operator.*` est ajoutée à sa requête ; `*` et `platform.*` ne la couvrent pas. Un rôle qui la déclare empêche le démarrage.

## Pages publiques

Un BC déclare `spec.public.endpoints` (`GET /api/public/<bc>/…`) et `spec.public.submissions` (`POST`). Seuls ces chemins d’un BC connu sont ouverts sans jeton ; le reste de `/api/public/<bc>/` reste fermé. Les chemins de la plateforme (`/api/public/lab`, invitations) ne sont pas un BC.

`@PublicEndpoint(scope = AGGREGATED | ORGANISATION)` sur le contrôleur. `AGGREGATED` ne filtre pas par organisation. L’URL d’une organisation est son slug (`/p/{slug}/…`), jamais son UUID.

`@PublicField` liste les champs renvoyés. Sans annotation, le champ est absent. `@Confidential` sur un booléen du record le retire entier tant qu’il est vrai (absent de la liste, 404 par id). Un record non publié (`published()` du contrôleur) est absent de la liste et 404 par id.

## Audience externe

L’audience est celle de l’appartenance active (`members` par défaut), portée par la session et le sélecteur d’organisation. Une audience autre que `members` ne lit et n’écrit, via `RecordController`, que les records dont le champ annoté `@OwnedBy` vaut l’utilisateur courant. Pas d’annotation : aucun record. Jamais `createdBy`.

`@Erasure` sur l’entité déclare `ANONYMIZE`, `DELETE` (défaut) ou `RETAIN` (durée `until`). L’exécution de l’effacement et le lien de connexion par e-mail restent à brancher.

## Données hors organisation

`@SharesWith(entity, link, fields)` sur l’entité de liaison. `fields` vide : rien n’est partagé. Au démarrage, `EntityScopeGuard` recense ces annotations et refuse une entité `ma.nafura.bc` qui n’étend ni `TenantEntity`, ni `OwnedEntity`, ni `ProductEntity`. Le consentement versionné (date, version des champs, retrait) n’est pas encore enregistré.

## Capabilities

Catalogue : `nafura-platform/capabilities.json` (id, modules Gradle, `requires`). Core : `foundation`, `lab`, `access`. Retirer : `spec.capabilities.disabled` (refusé si une capability gardée ou un BC la requiert). Ajouter une capability = décision plateforme (nouveau module, entrée au catalogue, test `testWithout-<cap>`), jamais depuis un produit.

## Vérifier

```bash
node <produit>/ops/run.mjs check   # les trois ci-dessous, avec le JDK et le Node du projet
cd nafura-platform/sources/web && npm run -s architecture:check          # manifestes, schémas, garde-fous produit, run.mjs
cd <produit>/sources/web && npm run -s build:dev                          # types et templates
cd nafura-platform/sources/backend && ./gradlew :platform:host-tests:test --no-daemon --max-workers=1
#   host-tests : la plateforme complète + le BC fixture host-tests/probe-bc (rôles, permissions, seeding)
#   variantes : ./gradlew :platform:host-tests:testWithout-<cap>
```

JDK : `JAVA_HOME=<repo>/deps/jdk-25*`. Arrêter `java.exe` et `postgres.exe` restés en mémoire avant une campagne de tests.
