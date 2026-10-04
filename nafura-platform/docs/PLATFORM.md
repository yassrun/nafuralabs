# Plateforme Nafura — construire un BC

> Ce qu’un BC déclare, ce que la plateforme en fait. Exemple complet et à jour : `platform-host/bcs/demo`.
> Architecture : [ARCHITECTURE.md](ARCHITECTURE.md) · écrans : [UI.md](UI.md) · lancer : [ops/README.md](../ops/README.md).

## Ajouter un BC à un produit

1. `bcs/<nom>/bc.manifest.json` (id `bc.<nom>`) et `bcs/<nom>/backend/build.gradle` = `apply from: '…/nafura-platform/gradle/nafura-bc.gradle'`.
2. L’id dans `app.nafura.json` `spec.businessContexts`. Gradle compose `bcs/<nom>/backend` en `:bc-<nom>` ; le web génère la liste des BCs (`business-contexts.generated.ts`, ignoré par git).
3. `bcs/<nom>/web/index.ts` : `export default` un `HostBusinessContext` (manifeste, routes, routes des records).
4. Backend : une `@AutoConfiguration` (`@ComponentScan @EntityScan @EnableJpaRepositories`) listée dans `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`.

Rien d’autre dans le produit : les garde-fous (`npm run architecture:check`) refusent tout fichier hors configuration, points d’entrée et BCs, et toute mention du nom du produit hors `app.nafura.json`.

## Manifestes

| Fichier | Contient | Schéma |
|---|---|---|
| `app.nafura.json` | `metadata.id`, `spec.product` (`name`, `mark`, `logo`), `spec.runtime` (`tenancy`, `defaultRoute`), `spec.shell`, `spec.businessContexts`, `spec.capabilities.disabled`, `spec.roles`, `spec.customRoles`, `spec.i18n`, `spec.local` (ports, utilisateurs lab), `spec.deploy.<env>` (`host`, `owners`) | `sources/web/platform/schemas/app.nafura.schema.json` |
| `bc.manifest.json` | `label`, `icon`, `routesPrefix`, `permissions`, `defaultRoles`, `notifications`, `navigation`, `requires`, `screens` (écrans spécifiques : `id`, `label`, `reason`) | `sources/web/platform/schemas/bc.manifest.schema.json` |

Les deux sont validés au build (web) et lus au démarrage (backend). Pas de second format.

## Données et API : le record

Une entité métier = `extends TenantEntity` (id, organisation, audit) + Bean Validation. Son API REST :

```java
@RestController
@RequestMapping("/api/v1/<bc>/suppliers")
@SecuredResource(domain = "<bc>", feature = "purchasing", resource = "supplier")
class SupplierController extends RecordController<Supplier> { … }
```

`RecordController` donne : liste paginée (`page` à partir de 0, `size` plafonné à 500 et renvoyé tel qu’appliqué), triée, recherchée (`q`) et filtrée (`?champ=valeur`, égalité), `/options` pour les listes de choix, lecture, création, modification, suppression. Permissions : `<domain>.<feature>.<resource>.{read,create,update,delete}` selon la méthode HTTP. Champs dérivés en lecture : `@Formula`.

Une action de fiche qui n’est pas une transition est un endpoint du même contrôleur (`POST /{id}/<action>`, `@RequirePermission`). La fiche déclare `result: 'record'` quand la réponse est la fiche à ouvrir (une copie, par exemple) : l’écran navigue vers son id.

Les pièces jointes et les notes d’un record enregistré par un `RecordController` utilisent la permission de ce record (lecture pour voir, mise à jour pour ajouter ou supprimer), pas `collaboration.*.*`. La clé d’entité envoyée est `lifecycle.entity`, sinon le dernier segment du mapping. Un type d’entité inconnu du registre garde la permission du contrôleur collaboration.

Ne pas écrire de service CRUD, de DTO de liste ou de pagination à la main.

## Cycle de vie et approbations

`lifecycleResource()` → `resources/lifecycle/<record>.json` : états (libellé, ton), `initial`, `editable`, transitions (`from`, `to`, `permission`, `requires`, `approval { role, when, title, approved, rejected }`, `system`, `notify`). La plateforme expose `/lifecycle`, `/{id}/transitions`, `POST /{id}/transitions/{id}` et refuse ce que le JSON interdit (403, 409, 422 avec les champs manquants). Une approbation passe par la boîte unique `/approvals` ; sa décision tire la transition de sortie. Le web dessine le statut et les actions depuis ce JSON.

`notify` sur une transition : `{ "event": "<id déclaré>", "to": … }`. `to` vaut `createdBy`, `field:<champ>` (UUID d’utilisateur) ou `permission:<id>` (les membres qui ont cette permission — jamais un rôle). L’acteur d’une transition utilisateur n’est pas prévenu ; une issue `system` (approuver, rejeter) prévient quand même `createdBy`. La capability `notifications` coupée : les règles sont ignorées, un avertissement est écrit au démarrage. Un événement non déclaré, un champ inconnu ou une permission non déclarée empêche le démarrage. Le lien est `entityType` + `entityId` ; le web le résout avec `HostBusinessContext.records`.

## Notifications

Le BC déclare ses événements dans `bc.manifest.json` → `notifications` : `id` (sous son préfixe, comme une permission), `label` (écran de préférences), `title` (`{champ}` du record), `channels` (défaut, parmi `in_app`, `email`, `sms`), `mandatory` (l’utilisateur ne peut pas couper). Les événements de la plateforme (approbation, mention, affectation) sont dans `META-INF/nafura/platform/notifications.json` du module `notification`.

Un seul chemin : règle (`notify`, mention, affectation…) → `NotificationRouter` → canaux retenus → `NotificationChannel` (`in_app`, `email` ; un canal déclaré sans implémentation est ignoré, avertissement au démarrage). Canaux retenus : défaut du manifeste → organisation (coupe ou ajoute) → utilisateur (coupe, sauf `mandatory` ; n’ajoute jamais). API : `GET|PUT /api/v1/platform/collaboration/notification-preferences` (utilisateur courant), `…/organisation` (permission `administration.notifications.configure`).

## Permissions et rôles

- Le BC déclare chaque permission dans son manifeste, sous son préfixe (`<bc>.`). Le code vérifie des permissions (`@SecuredResource`, `@RequirePermission`, `permission` dans les configurations d’écran), **jamais des rôles** (garde-fou).
- Rôles, quatre sources : plateforme (`OWNER`, `ORG_ADMIN`, `ORG_MEMBER`), `defaultRoles` du BC, `spec.roles` du produit (`includes: ["bc.x:ROLE"]`), rôles créés par l’organisation (seulement des permissions connues que l’admin possède).
- Activer ou couper un BC pour une organisation : écran Domaines (code = id du BC sans `bc.`). Coupé, ses permissions sont refusées à tous.

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
- `$ref` : l’id d’un record de l’organisation trouvé par ses champs (exactement un). `"$transitions": ["submit"]` : le record passe par son cycle de vie comme un utilisateur.
- Créé seulement si la clé manque ; jamais modifié ; rejoué seulement si le fichier change. Un jeu invalide bloque le démarrage avec le fichier et le record en cause.

## Connexion et organisation

- `GET /api/public/auth/config` : mode de connexion de l’environnement. `GET /api/v1/me/session` : qui, quelle organisation. `GET /api/v1/me/permissions` : permissions effectives et domaines coupés.
- `tenancy: single` : l’organisation (clé = id du produit) et ses propriétaires (`spec.deploy.<env>.owners`, rôle `OWNER`) sont créés au démarrage. Les propriétaires invitent et attribuent le reste dans l’application.

## Capabilities

Catalogue : `nafura-platform/capabilities.json` (id, modules Gradle, `requires`). Core : `foundation`, `lab`, `access`. Retirer : `spec.capabilities.disabled` (refusé si une capability gardée ou un BC la requiert). Ajouter une capability = décision plateforme (nouveau module, entrée au catalogue, test `testWithout-<cap>`), jamais depuis un produit.

## Vérifier

```bash
cd nafura-platform/sources/web && npm run -s architecture:check          # manifestes, schémas, garde-fous produit, run.mjs
cd nafura-platform/sources/backend && ./gradlew :platform:host-tests:test --no-daemon --max-workers=1
#   host-tests : la plateforme complète + le BC fixture host-tests/probe-bc (rôles, permissions, seeding)
#   variantes : ./gradlew :platform:host-tests:testWithout-<cap>
```

JDK : `JAVA_HOME=<repo>/deps/jdk-25*`. Arrêter `java.exe` et `postgres.exe` restés en mémoire avant une campagne de tests.
