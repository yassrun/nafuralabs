# CH-01-TECHNICAL — plier l'arbre

**Type :** `TECHNICAL`
**Cible :** BC `notification`
**Qualification :** le contrat est posé ; le code de **ce** BC vit encore sous `features/collaboration/notification`. Aucune règle ne change.

## Pourquoi

Un contexte Pact a un arbre (`ARCHI_BLUEPRINT`). Tant que le code de ce BC porte le nom de son ancien paquet, le prochain Change travaille dans le mauvais dossier.

## Aujourd'hui

- Backend `sources/backend/features/collaboration/notification/` (sources Java sous `src/main/java/ma/nafura/notification/` ; FQCN `ma.nafura.platform.collaboration.notification`).
- Include `includePlatform(":platform:features:collaboration:notification")` dans `sources/backend/settings.gradle.kts`.
- Web de ce BC, dispersé :
  - `sources/web/features/collaboration/notification/` (`index.ts` · `notification-bell.adapter.ts` · `components/notification-bell.component.ts` · `components/notification-list.component.ts` · `services/notification-api.service.ts` · `services/notification-unread.service.ts` · `services/notification-stream.service.ts` · `services/notification-bell-close.service.ts`)
  - `sources/web/features/notifications/` (`notifications.routes.ts` · `notification-center.page.ts` · `notification-item.component.ts` · `notification-center.config.ts` · `notifications-api.service.ts` · `notifications.facade.ts`)
- Consommateurs (pas de ce BC) : shell (`platform-app-shell.component.ts`) ; écran modèles e-mail `sources/web/features/administration/email-templates/` ; anatomy `lib/anatomy/…/send-email-dialog` + `entity-email-api.service.ts` ; produit (Sektor : montage des routes + cloche / centre d'alertes ERP).
- e2e déjà `e2e/notification/` ; Gradle des e2e `:platform:features:collaboration:notification` (`e2e/notification/_gradle.mjs`).

## Attendu

Le module Gradle et le web de **ce** BC vivent sous `notification`. Les packages Java, les routes HTTP et les noms de scénarios `notification-*` **ne bougent pas**.

## Coupe web (AC-2) — décidé seul

**Entre** sous `sources/web/app/notification/` : widgets embarqués + client HTTP de la boîte (`features/collaboration/notification/`) **et** écran centre + second client HTTP (`features/notifications/` — même geste que les chaînes d'approbation).

**Reste consommateur** (repointe l'import, n'entre pas) : shell · `features/administration/email-templates/` entier · anatomy `send-email-dialog` / `entity-email-api` · le produit (routes Sektor + alertes ERP).

La SPEC owns le message, la boîte, la préférence, la demande de copie. L'écran centre liste et marque lu cette boîte. Les modèles e-mail et l'envoi (`/email-templates`, `/email`) sont du transport (`not_owns` → ops). Les alertes ERP sont du produit.

## Critères d'acceptation (gelés)

- **AC-1** Le module Gradle de ce BC est `sources/backend/notification/`, inclus `:platform:notification` (`projectDir` = `notification`). L'ancien include `:platform:features:collaboration:notification` n'est plus. Les e2e lancent `:platform:notification:test` ; le dossier sources Java interne `src/main/java/ma/nafura/notification/` reste.
- **AC-2** Le web de ce BC est sous `sources/web/app/notification/` (`index.ts` · `notification-bell.adapter.ts` · `components/notification-bell.component.ts` · `components/notification-list.component.ts` · `services/notification-api.service.ts` · `services/notification-unread.service.ts` · `services/notification-stream.service.ts` · `services/notification-bell-close.service.ts` · écran centre issu de `features/notifications/`). Les anciens dossiers `sources/web/features/collaboration/notification/` et `sources/web/features/notifications/` ne sont plus.
- **AC-3** Les e2e restent sous `e2e/notification/`. Les noms `test("notification-…")` sont inchangés : `notification-deposer-et-lister` · `notification-deux-tenants` · `notification-marquer-lue` · `notification-autre-destinataire`.
- **AC-4** La suite e2e existante (`notification-*`) reste verte.
- **AC-5** Les FQCN Java `ma.nafura.platform.collaboration.notification` (dont `NotificationController` · `EmailTemplateController` · `EntityEmailController` · `ErpAlertDismissalController` · `NotificationBaselineTest`) et les routes `/api/v1/platform/collaboration/notifications` · `/api/v1/platform/email-templates` · `/api/v1/platform/email` · `/api/v1/erp/alerts` ne changent pas.

## Preuves attendues

| Scénario | État initial | AC |
|----------|--------------|----|
| `notification-plier-arbre` | backend `features/collaboration/notification` · web `features/collaboration/notification` + `features/notifications` · include `:platform:features:collaboration:notification` · e2e déjà `e2e/notification/` | AC-1, AC-2, AC-3, AC-5 |
| suite `notification-*` | inchangée (déposer / lister / deux tenants / marquer lue / autre destinataire — CH-00) | AC-4 |

`POL-TENANT-ISOLATION` · `POL-ERREUR-CODE` · `POL-PAS-METIER-PRODUIT` — inchangées (pas de patch SPEC).

## Hors périmètre

Renommer les packages · aligner le dossier `ma/nafura/notification/` sur le FQCN · refondre l'intérieur `api/domain/…` · toucher au comportement · extraire e-mail / ERP du jar · dossier `features/administration/email-templates/` (transport) · organism anatomy `lib/anatomy/…/send-email-dialog` et `entity-email-api` · shell · alertes ERP du produit · `user-settings` · autres BC (seul un `project(':platform:…')` qui nomme l'ancien include suit AC-1)
