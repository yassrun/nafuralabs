---
specVersion: 1
kind: work-package
appId: layali
wpId: wp-06-admin
title: Admin Nafura — overview, tenants, audit
status: stable
wave: 6
dependsOn: [wp-01-platform-skeleton]
filesAllowed:
  - web/app/applications/layali/zones/admin/**
  - web/app/applications/layali/components/admin/**
  - backend/domains/layali/admin/**
filesForbidden:
  - naf/src/spec/**
  - aispecs/**
  - infra/**
abstractionsRequired:
  - ":platform:core:authorization"
  - ":platform:core:identity"
  - "@platform/core/components"
abstractionsMissing: []
---

# Admin Nafura — overview, tenants, audit

## Scope

Implémenter la zone `admin` réservée au rôle `PLATFORM_ADMIN` : tableau de bord plateforme, liste tenants, détail tenant avec actions sensibles (approve, suspend, reactivate, archive, impersonate) et journal audit.

## Inputs

- Specs IA :
  - [admin-overview](../screens/admin/admin-overview.screen.md)
  - [admin-tenants](../screens/admin/admin-tenants.screen.md)
  - [admin-tenant-detail](../screens/admin/admin-tenant-detail.screen.md)
  - [tenants-admin API](../api/tenants-admin.api.md)
- Abstractions Nafura : authorization (PLATFORM_ADMIN guard), identity (création user Keycloak), impersonation token.

## Outputs attendus

- Fichiers créés ou modifiés :
  - `web/app/applications/layali/zones/admin/{overview,tenants,tenant-detail}/`
  - `web/app/applications/layali/components/admin/{kpi-card,tenant-status-badge,suspend-dialog,impersonate-dialog}/`
  - `backend/domains/layali/admin/` (controller `/api/v1/admin/*`).
- Tests :
  - E2E : PLATFORM_ADMIN crée un tenant → approve → suspend → reactivate → archive.
  - Test impersonation : token spécial, claim `impersonating_admin_user_id` présent.
  - Test 403 : un OWNER accédant à `/admin` est redirigé Forbidden.

## Étapes proposées

1. Implémenter le shell admin (`admin-shell` confirmé en wp-01).
2. Implémenter les endpoints `/admin/*` avec guard `PLATFORM_ADMIN` strict.
3. Coder l'écran overview avec KPI + chart simple + listes.
4. Coder l'écran liste tenants avec filtres et dialog création.
5. Coder le détail tenant avec barre d'actions contextuelle (selon status) + tabs (events récents, refunds, audit).
6. Coder l'impersonation : ouvre nouvel onglet `/pro` avec token spécial expirant à 1h, log audit obligatoire.
7. Vérifier que `X-Tenant-Id` n'est jamais envoyé depuis cette zone (intercepteur conditionnel).

## Critères d'acceptation

- [ ] Les écrans listés rendent les 4 états.
- [ ] Les contrats Mock API sont respectés.
- [ ] Aucune abstraction n'est réimplémentée localement.
- [ ] Seul `PLATFORM_ADMIN` accède (test 403 sur autres rôles).
- [ ] `X-Tenant-Id` n'est jamais présent sur les requêtes `/admin/*` (test négatif).
- [ ] Toute action sensible (approve/suspend/archive/impersonate) trace une entrée audit immuable.
- [ ] L'impersonation expire automatiquement à 1h et n'altère pas la session admin courante.
- [ ] Les permissions sont vérifiées avant rendu et avant mutation.

## Test plan

- E2E création tenant : `PLATFORM_ADMIN` se logue → "Nouveau tenant" → submit avec slug unique → toast succès + redirection `/admin/tenants/:slug` en `PENDING_REVIEW`.
- Approve : sur tenant `PENDING_REVIEW`, click approve → status `ACTIVE`.
- Suspend : raison obligatoire, status passe `SUSPENDED`, audit log avec acteur + raison.
- Reactivate : `SUSPENDED → ACTIVE`.
- Impersonation : depuis détail tenant, click impersonate, raison "support-1234" → nouvel onglet `/pro` accessible avec rôle `ADMIN` du tenant. Vérifier expiration token à 1h.
- Tester accès `/admin` avec un OWNER : page Forbidden.

## Out of scope

- Tab "Documents" (KYC) V2.
- 2FA obligatoire admin V2.
- Délégation sub-roles `PLATFORM_SUPPORT` V2.

## Open questions

- Liste cross-tenants des refunds : V1 inclus, V2 export CSV ?
- Notification centre admin (alertes capacités, refunds élevés) : V2.
