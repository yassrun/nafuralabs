# 01 — Liste unique

> Revue 2026-10-07, doublon D1. Taille **L** (front + back). Dépend de [05](05-crud-unique.md) pour les séquences de numérotation.
> Reprend et détaille le chantier « Listes : la suite » de `ROADMAP.md`.

## État (2026-10-08)

- **Lot 1 livré** : clés d'API et webhooks sont des `RecordController` (`records/api-key.json`, `records/webhook.json`), affichés par `nf-listing-page`.
  - Permissions : `administration.integrations.{api-keys,webhooks}.{read,create,update,delete}`, couvertes par `administration.*` des rôles plateforme.
  - Clé d'API : émise par `beforeSave` (quota, permissions limitées à l'émetteur, empreinte) ; `plainKey` renvoyée une seule fois ; `keyHash` jamais sérialisé ; `POST /{id}/revoke` ; suppression refusée tant que la clé est active ; état calculé (`@Formula`).
  - Webhook : secret en écriture seule, gardé si vide en modification ; quota ; envois supprimés avec le webhook ; dernier envoi calculé.
  - Migrations : `authorization/005_api_keys_record.sql`, `webhook/003_webhook_configs_record.sql`.
  - Tests : `PermissionEnforcementHostTest` (création, révocation, suppression, secret).
- **Lot 2 livré** : séquences de numérotation → `nf-listing-page` + `ListingPageConfig` (`numbering-sequences.listing.ts`) ; aperçu et libellé de réinitialisation en `@Formula` (`preview`, `resetLabel`).
- **Lot 3 livré** : modèles d'impression et modèles d'e-mail → `RecordController` (`records/document-template.json`, `records/email-template.json`) + `nf-listing-page` (`templates.listing.ts`, `email-templates.listing.ts`).
  - Permissions : `administration.documents.templates.{read,create,update,delete}` et `administration.documents.templates.editBody` ; `administration.notifications.email-templates.{read,create,update,delete}`.
  - Impression : `DocumentTemplate` étend `TenantEntity` ; libellé de type en `@Formula` (`typeLabel`) ; endpoints spéciaux (preview, render, variables…) conservés sur `TemplateController`.
  - E-mail : `tenant_id` nullable pour les modèles système ; `RecordController.includeSharedTenantRows()` expose aussi les lignes `tenant_id IS NULL` (sans dupliquer les seeds par tenant).
  - Migrations : `impression/.../004_document_templates_record.sql`, `notification/.../006_email_templates_record.sql`.
- **Lot 4 livré** : workflows d'approbation → `RecordController` (`records/workflow-template.json`) + `workflows.listing.ts` ; activer / désactiver en actions de ligne (`POST /{id}/activate|deactivate`) ; permissions `administration.approvals.workflows.{read,create,update,delete}` ; migration `approbation/.../003_workflow_templates_record.sql`.
- **Lot 0 + lot 6 livrés** : `ReadOnlyRecordController<E>` dans `core/framework/record` (liste, `/options`, `/properties`, `/aggregate`, `GET /{id}` ; pas de create/update/delete). `RecordController` en hérite.
  - Journal d'audit : `AuditLogController` + `records/audit-event.json` + `audit.listing.ts` ; permission `administration.audit.log.read` ; migration `audit/.../003_audit_events_record.sql` ; fiche `/administration/audit/:id` (export CSV non repris — écart).
  - Tâches planifiées : table `scheduled_jobs` synchronisée depuis le registre + `ScheduledJobController` + `records/scheduled-job.json` + `scheduled-jobs.listing.ts` ; permissions `administration.operations.scheduled-jobs.{read,update}` (déclencher = `update`) ; migration `framework/.../008_create_scheduled_jobs.sql` ; détail par clé inchangé (`/by-key/{key}/…`).
- **Lot 5 livré** : membres et rôles → façades `/api/v1/platform/admin/{members,roles}` + `nf-listing-page` ; invite = action de liste ; fiches → [02](02-fiche-unique.md).
- **Lot 7 (partiel)** : `platform/listing/legacy/` et `LegacyListingPageComponent` supprimés. Allowlist ConfigDrivenListing plateforme vide.
- Reste hors lot : la page de détail d'un webhook (historique des envois) est encore une page propre sur `nf-listing-flat`. L'outil de l'agent IA (`AgentPermissionChecker`) vérifie encore `administration.api-keys.write` (schéma propre à l'IA, à reprendre avec la cap IA).

## Objectif

Tous les écrans de liste de la plateforme passent par `nf-listing-page` et le `ListingPageConfig` de `platform/listing/`. Il ne reste alors qu'une seule liste, pour la plateforme comme pour les BCs.

## Besoin

- Il existe trois listes :
  - `nf-listing-page` (host) ;
  - `nf-entity-listing` + `ConfigDrivenListingPage`, avec leur propre `ListingPageConfig` (`lib/anatomy/types/index.ts:2121`, construit par `buildListingConfig`) ;
  - `LegacyListingPageComponent`.
- Les écrans d'administration n'ont donc ni les vues, ni la grammaire de filtre, ni les filtres rapides des écrans de BC.
- Un BC qui prend un écran plateforme pour modèle copie l'ancien format (colonnes, `transform`, `permissionPrefix`).

## Existant

| Écran | Archétype | Endpoint | Record côté serveur ? |
|---|---|---|---|
| Workflows d'approbation | `nf-listing-page` | `/api/v1/platform/collaboration/workflow/templates` | oui (`workflow-template.json`) |
| Membres | `ConfigDrivenListingPage` | `/api/tenants/{tenantId}/…` | non |
| Modèles d'impression | `nf-listing-page` | `/api/v1/platform/templates` | oui |
| Journal d'audit | `nf-listing-page` | `/api/v1/platform/collaboration/audit/log` | oui (`audit-event.json`, lecture seule) |
| Modèles d'e-mail | `nf-listing-page` | `/api/v1/platform/email-templates` | oui |
| Rôles | `ConfigDrivenListingPage` | `/api/tenants/{tenantId}/roles` | non |
| Tâches planifiées | `nf-listing-page` | `/api/v1/platform/admin/scheduled-jobs` | oui (`scheduled-job.json`, lecture seule) |
| Clés d'API | `nf-listing-page` | `/api/v1/platform/admin/api-keys` | oui |
| Webhooks | `nf-listing-page` | `/api/v1/platform/admin/webhooks` | oui |
| Séquences de numérotation | `nf-listing-page` | `/api/v1/numbering-sequences` | oui |

- `nf-listing-page` attend un endpoint `RecordController` : lignes paginées, `/properties`, `/aggregate`, `/lifecycle`.
- Seuls `RecordController` et le BC de test `ProbeRecordsApi` en héritent dans `nafura-platform/sources/backend`.

## Contrat

Un lot par écran, ou par groupe d'écrans du même module. Chaque lot est livrable seul.

### Lot 0 — Liste en lecture seule sur une ressource qui n'est pas une entité

À décider avant les lots du journal d'audit et des tâches planifiées (voir Décisions ouvertes). Option recommandée : un `ReadOnlyRecordController<V>` dans `core/framework/record`, qui expose la liste, `/properties` et `/aggregate` à partir d'un `RecordRepository` en lecture seule (vue SQL ou projection). Il n'expose ni création, ni modification, ni suppression. Le descripteur `records/<record>.json` reste le même.

### Lots 1 à 6 — Écrans

Pour chaque écran :

1. **Serveur** : la ressource devient un `RecordController` (ou `ReadOnlyRecordController`), avec un descripteur `records/<record>.json` (propriétés filtrables et triables, recherche). Les permissions suivent `<domain>.<feature>.<resource>.{read,create,update,delete}` : renommer les `…write` actuels. Les actions qui ne sont pas du CRUD restent des endpoints du même contrôleur (`POST /{id}/<action>`, `@RequirePermission`).
2. **Web** : un `ListingPageConfig` de `platform/listing/` (vues, `quickFilters`, `actions` avec `form` / `request` / `reveal`), route `{ component: ListingPageComponent, data: { listing } }`.
3. Supprimer la page, la config `buildListingConfig`, les colonnes et les filtres de l'ancien format.

| Lot | Écrans | Points d'attention |
|---|---|---|
| 1 | Webhooks, clés d'API | Clé et secret jamais sérialisés ; création de la clé et révocation = endpoints dédiés ; `reveal` pour le secret affiché une fois ; statut « expiré » calculé (`@Formula`) |
| 2 | Séquences de numérotation | Après [05](05-crud-unique.md) |
| 3 | Modèles d'impression, modèles d'e-mail | |
| 4 | Workflows d'approbation | Bascule actif / inactif = action de ligne |
| 5 | Membres, rôles | Inviter = action de liste avec formulaire (pas `create`) ; la fiche relève de [02](02-fiche-unique.md) |
| 6 | Journal d'audit, tâches planifiées | Lot 0 d'abord |

### Lot 7 — Suppression

- Supprimer `platform/listing/legacy/` et retirer `LegacyListingPageComponent` de la liste blanche d'`architecture:check`.
- `nf-entity-listing`, `ConfigDrivenListingPage` et l'ancien `ListingPageConfig` restent tant que Sektor les utilise ([04](04-heritage-sektor.md)). `architecture:check` interdit tout nouvel import depuis `platform/`, `features/`, `app/` et `bcs/`.

## Règles

- Aucune option nouvelle dans `ListingPageConfig` sans la décrire ici d'abord. Si un écran a besoin d'une colonne calculée, on passe par une propriété du descripteur (`@Formula`), pas par un `transform` côté web.
- Libellés : clés i18n de la plateforme (`administration.*`), comme aujourd'hui.
- Pas de changement fonctionnel visible hormis l'apparence commune (vues, filtres).

## Vérification (à chaque lot)

1. `node platform-host/ops/run.mjs check`.
2. `node platform-host/ops/run.mjs lab`, ouvrir l'écran migré :
   - en `admin@host.local` : liste, recherche, filtre libre, tri, pagination, chaque action ;
   - en `reader@host.local` : aucune action d'écriture visible, et un 403 sur l'API si on force l'appel.
3. Largeur mobile.

## Critères d'acceptation

- [ ] Les 10 écrans sont des `ListingPageConfig` de `platform/listing/`.
- [ ] Chaque endpoint expose `/properties`.
- [ ] `platform/listing/legacy/` est supprimé.
- [ ] Aucun import de `ConfigDrivenListingPage`, `nf-entity-listing` ou `buildListingConfig` hors `lib/anatomy` et Sektor (garde-fou).
- [ ] Permissions en `read/create/update/delete` partout ; les `defaultRoles` des manifestes sont mis à jour.

## Documentation

- `docs/UI.md` : retirer le paragraphe « Temporaire : … `LegacyListingPageComponent` ».
- `docs/ARCHITECTURE.md` (État et écarts) et `ROADMAP.md` : retirer les deux puces correspondantes.
- `docs/PLATFORM.md` : `ReadOnlyRecordController` si le lot 0 est retenu.

## Décisions

1. **Lot 0 — livré** : `ReadOnlyRecordController<E extends TenantEntity>` dans `core/framework/record` ; `RecordController` en hérite. Même descripteur `records/<record>.json` ; expose liste, `/options`, `/properties`, `/aggregate`, `GET /{id}` ; pas de create/update/delete.
2. **Ouverte — Membres** : record (`membership` du tenant) ou vue Keycloak + appartenance ? Conditionne le lot 5 ; chevauche [02](02-fiche-unique.md) pour les fiches.
