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
  - `spec.deploy.<env>.operators` — comptes de l’**opérateur** du produit (super-administration de toutes les organisations), à la place de `owners` qui n’a de sens qu’en `single`.
- API (réutiliser l’existant, compléter seulement ce qui manque) :
  - `GET /api/v1/me/organizations` — organisations de l’utilisateur ;
  - création d’une organisation par l’opérateur : nom, clé, administrateur invité → organisation créée, données `reference` des BCs appliquées, invitation envoyée ;
  - suspension d’une organisation : ses membres ne peuvent plus se connecter à elle (403 explicite).
- Web :
  - après connexion, organisation active = la seule, sinon la dernière utilisée, sinon un sélecteur ;
  - menu d’organisation (`spec.shell.tenantMenu`) pour changer d’organisation ;
  - `hostAuthInterceptor` (ou un intercepteur de la même famille dans `platform/host-auth`) ajoute l’en-tête d’organisation à chaque appel de l’API du produit ;
  - **console opérateur** : écrans plateforme « Organisations » (liste, création, suspension) et « Utilisateurs » (tous), visibles avec une permission plateforme dédiée (ex. `platform.operator.*`), jamais par un rôle codé.
- Single reste le défaut et ne change pas de comportement.

## Comportement et sécurité

- Isolation : aucune donnée d’une organisation n’est lisible depuis une autre (tous les `RecordController` filtrent déjà par `tenantId` : à couvrir par un host-test multi).
- Un utilisateur sans appartenance à l’organisation demandée : 403 (pas 404, pas de fuite d’existence au-delà).
- Les permissions sont **par organisation** (un utilisateur peut être admin ici et lecteur là).
- Seeding `demo` : seulement en lab/staging, pour les organisations créées dans ces environnements.

## Démo

- `platform-host/app.nafura.json` : **ne pas** basculer la démo en multi par défaut si cela casse les scénarios existants ; préférer une seconde configuration de lancement lab multi, ou basculer la démo et adapter `scenario-api.sh` — **choisir et justifier**.
- Deux organisations lab (« Organisation A », « Organisation B ») ; `lead@host.local` dans les deux avec des rôles différents ; `admin@host.local` opérateur.
- `scenario-api.sh` : créer un fournisseur dans A, le lire depuis B → 404 ; utilisateur de A seulement qui appelle B → 403 ; l’opérateur crée une organisation C → ses catégories `reference` existent.
- host-test : `MultiTenancyHostTest` (isolation, appartenance, seeding à la création).

## Critères d’acceptation

- [ ] Deux organisations lab, sélecteur d’organisation dans le menu, données isolées.
- [ ] L’opérateur crée une organisation ; son administrateur reçoit l’invitation (lab : lien visible dans le journal) ; les données de référence sont là.
- [ ] Une organisation suspendue refuse l’accès à ses membres.
- [ ] Les produits `single` (dont la démo actuelle) ne changent pas.

## Documentation

`docs/ARCHITECTURE.md` règle 6 (Organisation) et tableau des écarts ; `docs/PLATFORM.md` § « Connexion et organisation » ; `ops/README.md` si le lancement lab change ; `ROADMAP.md` n°6.

## Décisions ouvertes

- Nom et forme du rôle « opérateur » (permission plateforme `platform.operator.*` recommandée) et sa source en lab/cluster (`spec.deploy.<env>.operators`).
- Démo : bascule en multi ou seconde configuration — **recommandation** : basculer la démo en multi, car la démo doit exercer toute la plateforme (règle 9), et garder un host-test qui vérifie le mode single sur la fixture `probe-bc`.
- Inscription libre d’une organisation (`POST /api/tenants`) : ouverte ou réservée à l’opérateur — **recommandation** : réservée à l’opérateur par défaut, ouverture par option d’`app.nafura.json`.
