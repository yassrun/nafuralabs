# 09 — Tenancy multi

## Objectif

Un produit déclaré `spec.runtime.tenancy: "multi"` sert **plusieurs organisations** isolées dans un même déploiement : création d’une organisation (avec ses données de référence), invitation de son administrateur, choix de l’organisation active dans le web, console de l’opérateur du produit.

## Besoin

Tout produit SaaS. `ROADMAP.md` n°6 ; `ARCHITECTURE.md` « État et écarts » : « `tenancy: multi` dans le web du host — à faire ».

## Existant

- Manifeste : `app.nafura.schema.json` — `spec.runtime.tenancy: single | multi`. `core/lab/.../ApplicationManifestEnvironment.java` le traduit en `nafura.security.tenant.mode`.
- Backend multi déjà présent : `core/authorization/.../TenantContextFilter.java` (organisation lue dans l’en-tête `X-Tenant-Id` ou l’URL, validée, appartenance vérifiée via `TenantMembership`), `POST /api/tenants` (création en libre-service, sans contexte d’organisation), modules `core/tenancy`, `core/multi-tenant`, `identite/iam` (invitations : `InvitationAcceptService`, `InvitationPublicController`).
- Single : `core/lab/.../SingleScopeBootstrap.java` crée l’organisation et ses propriétaires au démarrage.
- Seeding : `core/lab/.../seed/SeedRunner.java` — appliqué à « chaque organisation » d’après `PLATFORM.md` ; vérifier qu’il sait le faire **à la création** d’une organisation et pas seulement au démarrage.
- Web : `platform/host-auth/` (session, intercepteur), `core/tenant/tenant.context.ts`, `core/http/tenant-header.interceptor.ts` (utilisé par Sektor, pas par le host).
- Démo : `platform-host/app.nafura.json` en `single`.

## Contrat

- `app.nafura.json` :
  - `spec.runtime.tenancy: "multi"` ;
  - `spec.local.users[].organizations?: string[]` — organisations lab auxquelles un utilisateur lab appartient (clés) ; `spec.local.organizations: [{ key, name }]` créées au démarrage en lab ;
  - `spec.deploy.<env>.operators` — comptes de l’**opérateur** du produit (super-administration de toutes les organisations), à la place de `owners` qui n’a de sens qu’en `single` ;
  - `spec.runtime.signup: "operator" | "open"` — qui peut appeler `POST /api/tenants`. Défaut `operator`. Ce n’est pas un booléen.
- API (réutiliser l’existant, compléter seulement ce qui manque) :
  - `GET /api/v1/me/organizations` — organisations de l’utilisateur ;
  - création d’une organisation par l’opérateur : nom, clé, administrateur invité → organisation créée, données `reference` des BCs appliquées, invitation envoyée ;
  - suspension d’une organisation : ses membres ne peuvent plus se connecter à elle (403 explicite).
- Web :
  - après connexion, organisation active = la seule, sinon la dernière utilisée, sinon un sélecteur ;
  - menu d’organisation (`spec.shell.tenantMenu`) pour changer d’organisation ;
  - `hostAuthInterceptor` (ou un intercepteur de la même famille dans `platform/host-auth`) ajoute l’en-tête d’organisation à chaque appel de l’API du produit ;
  - **console opérateur** : écrans plateforme « Organisations » (liste, création, suspension) et « Utilisateurs » (tous), visibles avec la permission `platform.operator.*`.
- Single reste le défaut et ne change pas de comportement.

## Comportement et sécurité

- Isolation : aucune donnée d’une organisation n’est lisible depuis une autre (tous les `RecordController` filtrent déjà par `tenantId` : à couvrir par un host-test multi).
- Un utilisateur sans appartenance à l’organisation demandée : 403 (pas 404, pas de fuite d’existence au-delà).
- Les permissions sont **par organisation** (un utilisateur peut être admin ici et lecteur là).
- `platform.operator.*` ne s’obtient que par la liste `spec.deploy.<env>.operators`. Les jokers des rôles (`*` d’`OWNER`, `platform.*` d’`ORG_ADMIN`) ne la couvrent jamais. Un rôle qui déclare cette permission empêche le démarrage.
- `POST /api/tenants` est réservé à l’opérateur quand `spec.runtime.signup` vaut `operator` (le défaut). `open` l’ouvre à l’inscription libre.
- Seeding `demo` : seulement en lab/staging, pour les organisations créées dans ces environnements.

## Démo

- `platform-host/app.nafura.json` bascule en `multi`. Les scénarios existants sont adaptés. Un host-test garde le mode `single` sur la fixture `probe-bc`.
- Deux organisations lab (« Organisation A », « Organisation B ») ; `lead@host.local` dans les deux avec des rôles différents ; `admin@host.local` opérateur.
- `scenario-api.sh` : créer un fournisseur dans A, le lire depuis B → 404 ; utilisateur de A seulement qui appelle B → 403 ; l’opérateur crée une organisation C → ses catégories `reference` existent.
- host-test : `MultiTenancyHostTest` (isolation, appartenance, seeding à la création).

## Critères d’acceptation

- [ ] Deux organisations lab, sélecteur d’organisation dans le menu, données isolées.
- [ ] L’opérateur crée une organisation ; son administrateur reçoit l’invitation (lab : lien visible dans le journal) ; les données de référence sont là.
- [ ] Une organisation suspendue refuse l’accès à ses membres.
- [ ] La démo tourne en `multi`. Le host-test de `probe-bc` prouve que le mode `single` ne change pas.

## Documentation

`docs/ARCHITECTURE.md` règle 6 (Organisation) et tableau des écarts ; `docs/PLATFORM.md` § « Connexion et organisation » ; `ops/README.md` si le lancement lab change ; `ROADMAP.md` n°6.

## Décisions (2026-10-04)

- L’opérateur est la permission `platform.operator.*`. Sa liste vient de `spec.deploy.<env>.operators`.
- Cette permission ne s’obtient que par la liste du déploiement. Les jokers des rôles (`*` d’`OWNER`, `platform.*` d’`ORG_ADMIN`) ne la couvrent jamais. Un rôle qui la déclare empêche le démarrage.
- La démo passe en `multi`. Un host-test garde le mode `single` sur `probe-bc`.
- `POST /api/tenants` est réservé à l’opérateur par défaut. L’option `spec.runtime.signup: "operator" | "open"` peut l’ouvrir. Ce n’est pas un booléen.

## État (2026-10-04)

Livré : permission opérateur hors des jokers, refus de démarrage si un rôle la déclare, démo `multi` (org A / B, admin opérateur, lead avec un rôle par organisation), `POST /api/tenants` et suspend/resume, seeding à la création, sélecteur d’organisation unique, en-tête `X-Tenant-Id`, host-test `single` sur `probe-bc`, isolation dans `scenario-api.sh`. L’invitation lab est une ligne de journal et une appartenance `INVITED`.

Reste : écrans de console « Organisations » et « Utilisateurs » (pas d’archétype de records plateforme pour les tenants ; l’API tient le contrat). Le jeton `lab-{id}` n’est pas branché sur `InvitationAcceptService`.
