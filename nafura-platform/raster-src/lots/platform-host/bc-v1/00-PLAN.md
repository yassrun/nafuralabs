# bc-v1 — un BC prototype, ses rôles, son menu, sur les vraies migrations

**But :** prouver sur `platform-host` que tous les concepts tiennent avant de toucher Sektor : un BC monté par son manifeste, ses rôles et ceux du produit seedés par la plateforme, les permissions appliquées, le menu filtré, le schéma issu des migrations.

## Critères

- **AC-1** Contrat rôles : `app.nafura.json` `spec.roles` (`includes: ["bc.x:ROLE"]` | `permissions`) ; validateur web (référence inconnue, permission non déclarée, code dupliqué) et schémas JSON.
- **AC-2** Seed : `iam` `DeclaredRolesSeeder` lit `nafura/app.nafura.json` + `META-INF/nafura/bc/*.json`, synchronise `role_permission` (ajouts et retraits), idempotent.
- **AC-3** BC `platform-host/bcs/demo` : backend (`nafura-bc.gradle`, auto-configuration propre, SQL), web (`HostBusinessContext { manifest, routes }`), composé par `spec.businessContexts` sans code host.
- **AC-4** Migrations locales : changelog généré depuis le classpath composé (`gradle/nafura-migrations.gradle`, mêmes ordre et ids que `ops/lifecycle`), Liquibase + `ddl-auto: validate` en lab.
- **AC-5** Menu : items de nav avec `permission`, shell filtré par `/api/auth/me/permissions` ; chaque permission de nav existe côté backend (garde-fou).
- **AC-6** Garde-fous : code BC sans API/code de rôle ; écrans sans import eager ; on/off web par capability.

## Livraison

- Backend : `host-tests` (4 plateforme + 3 rôles + 5 permissions) verts sur migrations réelles ; suite plateforme 203 tests verts. Preuve négative : l'ancien filtre fait échouer `PermissionEnforcementHostTest`.
- Jar packagé `platform-host` (`java -jar`) : 47 changesets, 0 rejoué au 2e démarrage ; preuve HTTP 10/10 (201/200/403/400/204 selon rôle).
- Navigateur : `DEMO_LEAD`/`DEMO_VIEWER` voient « Démo › Notes » sans administration ; `READER` ne voit pas Démo et reçoit « Accès refusé » ; `SUPER_ADMIN` voit tout.
- Web : `architecture:check` 68 tests.

## Bugs plateforme corrigés en route

- `@RequirePermission` ignoré sans `@SecuredResource` : écriture des paramètres tenant, fournisseurs IA, abonnement, identité ouverts à tout authentifié.
- `ScheduledJobController` sans aucune protection (déclenchement de job par tout authentifié).
- Tables sans migration : `geo` (4), `webhook_config_events` (l'entité n'écrivait jamais `webhook_configs.events NOT NULL`).
- `bootJar` sort `META-INF/**` de l'app hors classpath : ressources produit sous `nafura/`.
- BC compilé sans `-parameters` (`@PathVariable` en 400).
- Rôles vides ⇒ joker bootstrap `*` pour tout authentifié : disparaît dès qu'un rôle est déclaré.
- Notifications : boîte personnelle, n'exige plus de permission (service filtré par destinataire).
- `host-screens` importait le centre de notifications en eager (fuite on/off web).
