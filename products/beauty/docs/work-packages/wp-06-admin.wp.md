---
specVersion: 1
kind: work-package
appId: beauty
wpId: wp-06-admin
title: Admin Nafura — overview, tenants, détail, audit, impersonation
status: stable
phase: P3
wave: 6
dependsOn: [wp-01-platform-skeleton]
filesAllowed:
  - web/app/applications/beauty/zones/admin/**
  - web/app/applications/beauty/components/admin/**
  - backend/domains/beauty/admin/**
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

# Admin Nafura — overview, tenants, détail, audit, impersonation

## Scope

Implémenter la zone `admin` réservée à `PLATFORM_ADMIN` : dashboard plateforme Beauty, liste tenants (salons), détail tenant avec actions sensibles (approve, suspend, reactivate, archive, impersonate) et journal audit.

## Inputs

- Specs IA :
  - [admin-overview](../screens/admin/admin-overview.screen.md), [admin-tenants](../screens/admin/admin-tenants.screen.md), [admin-tenant-detail](../screens/admin/admin-tenant-detail.screen.md)
  - APIs : [tenants-admin](../api/tenants-admin.api.md)
- Abstractions : authorization (PLATFORM_ADMIN guard), identity (création user Keycloak), impersonation token.

## Outputs attendus

- Fichiers créés ou modifiés :
  - `web/app/applications/beauty/zones/admin/{overview,tenants,tenant-detail}/`
  - `web/app/applications/beauty/components/admin/{kpi-card,tenant-status-badge,suspend-dialog,impersonate-dialog,audit-timeline-item}/`
  - `backend/domains/beauty/admin/` (controller `/api/v1/admin/*`).
- Tests :
  - E2E : PLATFORM_ADMIN crée tenant → approve → suspend → reactivate → archive → vérifier audit.
  - Test impersonation token (claim spécifique).
  - Test 403 sur autres rôles.

## Étapes proposées

1. Implémenter endpoints `/admin/*` avec guard `PLATFORM_ADMIN` strict.
2. Vérifier que `X-Tenant-Id` n'est jamais envoyé depuis cette zone (intercepteur conditionnel).
3. Coder overview avec KPIs + chart + listes.
4. Coder liste tenants avec dialog création (slug unique check).
5. Coder détail tenant avec barre d'actions contextuelle + tabs (bookings, refunds, audit, documents V2).
6. Coder impersonation : ouvre nouvel onglet `/pro` avec token spécial 1h + log audit obligatoire.

## Critères d'acceptation

- [ ] Les écrans listés rendent les 4 états.
- [ ] Les contrats Mock API sont respectés.
- [ ] Seul `PLATFORM_ADMIN` accède (test 403 sur OWNER, ADMIN, STAFF, CUSTOMER).
- [ ] `X-Tenant-Id` n'est jamais présent sur `/admin/*` (test négatif intercepteur).
- [ ] Toute action sensible trace une entrée audit immuable avec acteur + raison + timestamp.
- [ ] L'impersonation expire à 1h et n'altère pas la session admin courante.
- [ ] Aucune abstraction n'est réimplémentée localement.
- [ ] Les permissions sont vérifiées avant rendu et avant mutation.

## Test plan

- E2E création tenant : slug unique → toast → redirection détail `PENDING_REVIEW`.
- Approve : status `ACTIVE`.
- Suspend avec raison : status `SUSPENDED` + entrée audit.
- Reactivate : `SUSPENDED → ACTIVE`.
- Archive : terminal, autres actions désactivées.
- Impersonation depuis détail : nouvel onglet `/pro` accessible en rôle ADMIN du tenant, expiration 1h, audit présent.
- Accès `/admin` avec OWNER : page Forbidden.

## Out of scope

- Tab "Documents" KYC (V2).
- 2FA admin obligatoire (V2).
- Sous-rôle `PLATFORM_SUPPORT` (V2).

## Open questions

- Export CSV liste tenants : V2.
- Notification centre admin (alertes capacités, refunds élevés) : V2.
- Audit cross-tenants (vision globale plateforme) : V2.
