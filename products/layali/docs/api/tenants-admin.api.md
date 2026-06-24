---
specVersion: 1
kind: api
appId: layali
resource: tenants-admin
status: stable
basePath: /api/v1/admin
auth: required
rateLimit: default
backendOwner: backend/domains/layali/admin
---

# tenants-admin Mock API

## Vue d'ensemble

Endpoints d'administration plateforme Nafura pour gérer les tenants (venues) Layali : onboarding, validation, suspension, métriques globales. Réservé au rôle `PLATFORM_ADMIN`.

## Modèle (vue logique)

### Tenant (vue admin)

| Champ | Type | Notes |
|---|---|---|
| id | string | = venueSlug |
| name | string | dénormalisé venue |
| city | string | |
| ownerEmail | string | |
| status | string enum | `PENDING_REVIEW`, `ACTIVE`, `SUSPENDED`, `ARCHIVED` |
| onboardingStep | string enum | `IDENTITY`, `VENUE`, `PAYMENT`, `READY` |
| metrics | object | `{ venuesCount, eventsActive, bookings30d, tickets30d, revenueMinor30d }` |
| createdAt | datetime | |
| updatedAt | datetime | |

## Endpoints

### GET /api/v1/admin/overview

- Auth : required.
- Rôles : PLATFORM_ADMIN.
- Query : `from`, `to` (défaut 30 derniers jours).
- Réponse 200 :
  ```json
  {
    "period": { "from": "2026-05-10T00:00:00+01:00", "to": "2026-06-09T00:00:00+01:00" },
    "tenants": { "total": 187, "active": 154, "pending": 21, "suspended": 12 },
    "events": { "total": 318, "published": 240, "cancelled": 8 },
    "bookings": { "total": 4250, "confirmed": 3920, "noShow": 145 },
    "tickets": { "totalSold": 18430, "revenueMinor": 285000000, "currency": "MAD" },
    "topCities": [
      { "city": "casablanca", "tenants": 64, "revenueMinor": 122000000 },
      { "city": "marrakech", "tenants": 58, "revenueMinor": 98000000 }
    ],
    "alerts": [
      { "tenantId": "club-x-tanger", "severity": "WARN", "message": "5 refunds en 7 jours" }
    ]
  }
  ```

### GET /api/v1/admin/tenants

- Auth : required.
- Rôles : PLATFORM_ADMIN.
- Query : `status`, `city`, `q`, `cursor`, `size`.
- Réponse 200 : `{ items, page }` avec résumé tenant.

### GET /api/v1/admin/tenants/:tenantId

- Auth : required.
- Réponse 200 : tenant complet + métriques + 5 derniers events + 5 derniers refunds.

### POST /api/v1/admin/tenants

- Auth : required.
- Rôles : PLATFORM_ADMIN.
- Headers : `Idempotency-Key`.
- Body :
  ```json
  {
    "slug": "lounge-31-rabat",
    "name": "Lounge 31 Rabat",
    "city": "rabat",
    "ownerEmail": "owner@lounge31.ma",
    "ownerDisplayName": "Hamza Founder"
  }
  ```
- Effet : crée le tenant en `PENDING_REVIEW`, crée le user owner dans Keycloak via `:platform:core:identity`, envoie email d'invitation.
- Réponse 201 : tenant créé.
- Erreurs : 409 `slug_exists`, 422.

### POST /api/v1/admin/tenants/:tenantId/approve

- Auth : required.
- Body vide.
- Effet : `PENDING_REVIEW → ACTIVE`. Permet la publication du venue.
- Réponse 200.

### POST /api/v1/admin/tenants/:tenantId/suspend

- Auth : required.
- Body : `{ "reason": "Litige paiement", "until": null }`.
- Effet : `ACTIVE → SUSPENDED`. Toutes les mutations API du tenant retournent 423 `tenant_suspended`. Les bookings/tickets en cours restent valides.
- Réponse 200.

### POST /api/v1/admin/tenants/:tenantId/reactivate

- Auth : required.
- Effet : `SUSPENDED → ACTIVE`.
- Réponse 200.

### POST /api/v1/admin/tenants/:tenantId/archive

- Auth : required.
- Body : `{ "reason": "Cessation d'activité" }`.
- Effet : `ARCHIVED` (terminal). Lecture publique cachée.
- Réponse 200.

### GET /api/v1/admin/tenants/:tenantId/audit

- Auth : required.
- Query : `from`, `to`, `actor`, `action`, `cursor`, `size`.
- Réponse 200 : journal audit (mutations sensibles : changement statut, owner, paiement, refunds).

### GET /api/v1/admin/payments

- Auth : required.
- Query : `tenantId`, `from`, `to`, `status`, `provider`, `cursor`, `size`.
- Réponse 200 : liste cross-tenants des payments (pour reporting/anti-fraude).

### POST /api/v1/admin/tenants/:tenantId/impersonate

- Auth : required.
- Body : `{ "purpose": "support-ticket-1234" }`.
- Effet : crée un JWT d'imitation valable 1h avec rôle `ADMIN` du tenant, audit obligatoire.
- Réponse 200 : `{ "accessToken": "...", "expiresIn": 3600 }`.

## Erreurs communes

| Code | Cas |
|---|---|
| 401, 403, 404, 422 | classiques |
| 409 | `slug_exists`, `tenant_already_<status>` |

## Fixtures

```json
[
  {
    "id": "sky31-casablanca",
    "name": "Sky31 Casablanca",
    "city": "casablanca",
    "ownerEmail": "owner@sky31.ma",
    "status": "ACTIVE",
    "onboardingStep": "READY",
    "metrics": {
      "venuesCount": 1,
      "eventsActive": 4,
      "bookings30d": 215,
      "tickets30d": 1840,
      "revenueMinor30d": 14200000,
      "currency": "MAD"
    },
    "createdAt": "2025-09-01T10:00:00+01:00",
    "updatedAt": "2026-06-08T20:00:00+01:00"
  },
  {
    "id": "theatro-marrakech",
    "name": "Theatro Marrakech",
    "city": "marrakech",
    "ownerEmail": "owner@theatro.ma",
    "status": "ACTIVE",
    "onboardingStep": "READY",
    "metrics": {
      "venuesCount": 1,
      "eventsActive": 2,
      "bookings30d": 88,
      "tickets30d": 3200,
      "revenueMinor30d": 19500000,
      "currency": "MAD"
    },
    "createdAt": "2025-06-12T10:00:00+01:00",
    "updatedAt": "2026-06-08T20:00:00+01:00"
  },
  {
    "id": "club-x-tanger",
    "name": "Club X Tanger",
    "city": "tanger",
    "ownerEmail": "owner@clubx.ma",
    "status": "PENDING_REVIEW",
    "onboardingStep": "VENUE",
    "metrics": {
      "venuesCount": 1,
      "eventsActive": 0,
      "bookings30d": 0,
      "tickets30d": 0,
      "revenueMinor30d": 0,
      "currency": "MAD"
    },
    "createdAt": "2026-06-05T10:00:00+01:00",
    "updatedAt": "2026-06-05T10:00:00+01:00"
  }
]
```

## Contraintes pour le futur backend réel

- Tous les endpoints `/admin/*` exigent rôle `PLATFORM_ADMIN` ; absence = 403.
- `X-Tenant-Id` interdit sur `/admin/*` (rejette `400 bad_request`).
- Audit immutable : tout `approve/suspend/reactivate/archive/impersonate` journalisé avec acteur, raison, timestamp, IP.
- Impersonation : token JWT spécial avec claim `impersonating_admin_user_id` ; visible dans tous les logs downstream.
- RGPD : suppression d'un tenant `ARCHIVED` après 24 mois (job purge avec anonymisation).

## Open questions

- Filtre 2FA obligatoire pour `PLATFORM_ADMIN` : V1 ou V2 ? Décision provisoire : V2.
- Export CSV de la liste tenants : V2.
- Sous-rôles `PLATFORM_SUPPORT` (lecture seule) : V2.
