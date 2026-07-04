---
specVersion: 1
kind: api
appId: beauty
resource: tenants-admin
status: draft
phase: P3
basePath: /api/v1/admin
auth: required
rateLimit: strict
backendOwner: backend/domains/beauty/salon
---

# tenants-admin Mock API

## Vue d'ensemble

API d'administration plateforme Nafura. Permet à un `PLATFORM_ADMIN` de lister les tenants (salons), inspecter une fiche tenant, suspendre/réactiver, et consulter des statistiques agrégées. Aucun header `X-Tenant-Id` n'est attendu : l'admin voit tout.

## Modèle (vue logique)

### TenantSummary

| Champ | Type | Notes |
|---|---|---|
| id | string (uuid) | = tenantId |
| salonSlug | string | |
| salonName | string | |
| city | string | |
| ownerName | string | |
| ownerEmail | string | |
| ownerPhone | string | |
| status | string enum | `ACTIVE` / `SUSPENDED` / `PENDING_VERIFICATION` / `ARCHIVED` |
| publishStatus | string enum | reflet de `salon.status` : `DRAFT` / `PUBLISHED` / `SUSPENDED` |
| onboardingCompletedAt | datetime | nullable si pas encore publié |
| createdAt | datetime | |
| metrics30d | object | `{ bookings, completedBookings, revenueMinor, newCustomers }` |
| lastActivityAt | datetime | dernier event d'activité |

### TenantDetail (extends TenantSummary)

| Champ ajouté | Type | Notes |
|---|---|---|
| billing | object | `{ ribLast4, billingEmail, lastInvoiceAt }` |
| usage | object | `{ staffCount, serviceCount, totalBookingsAllTime, totalRevenueMinorAllTime }` |
| recentBookings | object[] | extrait des 10 derniers |
| recentReviews | object[] | extrait des 10 derniers |
| auditTrail | object[] | derniers events admin (suspension, activation, notes) |

### PlatformMetrics

| Champ | Type | Notes |
|---|---|---|
| period | string | `7D` / `30D` / `90D` |
| totalTenants | integer | |
| activeTenants | integer | |
| newTenants | integer | sur la période |
| totalBookings | integer | |
| completedBookings | integer | |
| noShowRate | number | 0-1 |
| totalRevenueMinor | integer | |
| topCities | object[] | `{ city, tenantCount, bookings }` |
| topCategories | object[] | `{ category, bookings }` |

## Endpoints

### GET /api/v1/admin/tenants

- Auth : required.
- Rôles : PLATFORM_ADMIN.
- Query :
  | Param | Description |
  |---|---|
  | `q` | nom salon / email owner |
  | `city` | filtre |
  | `status` | filtre |
  | `publishStatus` | filtre |
  | `sort` | `recent` (défaut) / `revenue30d` / `bookings30d` |
  | `pageSize`, `cursor` | pagination |
- Réponse 200 : `{ "items": [TenantSummary], "page": {...} }`.

### GET /api/v1/admin/tenants/:tenantId

- Auth : required.
- Réponse 200 : `TenantDetail`.
- Erreurs : 404.

### POST /api/v1/admin/tenants/:tenantId/suspend

- Auth : required.
- Body : `{ "reason": "Non-respect CGU", "notes": "Email envoyé le ..." }`.
- Effet : passe `status` du tenant à `SUSPENDED`. Les endpoints `/pro/*` du tenant renvoient 423. Les pages publiques du salon (slug) renvoient 404 ou "Salon temporairement indisponible".
- Réponse 200 : `TenantDetail` mis à jour.
- Erreurs : 409 (déjà suspendu).

### POST /api/v1/admin/tenants/:tenantId/activate

- Auth : required.
- Body : `{ "notes": "..." }`.
- Effet : repasse à `ACTIVE`.
- Réponse 200.
- Erreurs : 409 (pas en état `SUSPENDED`).

### POST /api/v1/admin/tenants/:tenantId/notes

- Auth : required.
- Body : `{ "text": "..." }`.
- Effet : ajoute une note admin à l'audit trail.
- Réponse 201.

### POST /api/v1/admin/tenants

- Auth : required.
- Rôles : PLATFORM_ADMIN.
- Body : payload d'onboarding manuel (cas migration / création par Nafura).
  ```json
  {
    "salonName": "Studio Hair Casablanca",
    "city": "CASABLANCA",
    "ownerEmail": "owner@studiohair.ma",
    "ownerFirstName": "Karim",
    "ownerLastName": "Tazi",
    "ownerPhone": "+212600999111"
  }
  ```
- Effet : provisionne un tenant `PENDING_VERIFICATION` + compte OWNER (envoi email d'activation).
- Réponse 201 : `TenantDetail`.

### GET /api/v1/admin/metrics

- Auth : required.
- Query : `period` (`7D` / `30D` / `90D`, défaut `30D`).
- Réponse 200 : `PlatformMetrics`.

## Erreurs communes

| Code | Cas |
|---|---|
| 401, 403, 404 | classiques |
| 400 | `X-Tenant-Id` interdit présent |
| 409 | transition impossible |
| 422 | validation onboarding |

## Fixtures

### Liste tenants

```json
{
  "items": [
    {
      "id": "00000000-0000-0000-0000-000000000001",
      "salonSlug": "studio-hair-casablanca",
      "salonName": "Studio Hair Casablanca",
      "city": "CASABLANCA",
      "ownerName": "Karim Tazi",
      "ownerEmail": "owner@studiohair.ma",
      "ownerPhone": "+212600999111",
      "status": "ACTIVE",
      "publishStatus": "PUBLISHED",
      "onboardingCompletedAt": "2025-09-15T10:00:00+01:00",
      "createdAt": "2025-09-01T10:00:00+01:00",
      "metrics30d": {
        "bookings": 312,
        "completedBookings": 288,
        "revenueMinor": 8240000,
        "newCustomers": 47
      },
      "lastActivityAt": "2026-06-08T19:30:00+01:00"
    },
    {
      "id": "00000000-0000-0000-0000-000000000002",
      "salonSlug": "beauty-lounge-rabat",
      "salonName": "Beauty Lounge Rabat",
      "city": "RABAT",
      "ownerName": "Nadia Cherkaoui",
      "ownerEmail": "nadia@beautylounge.ma",
      "ownerPhone": "+212661445566",
      "status": "ACTIVE",
      "publishStatus": "PUBLISHED",
      "onboardingCompletedAt": "2025-11-20T11:00:00+01:00",
      "createdAt": "2025-11-10T09:00:00+01:00",
      "metrics30d": {
        "bookings": 124,
        "completedBookings": 110,
        "revenueMinor": 4200000,
        "newCustomers": 22
      },
      "lastActivityAt": "2026-06-07T18:00:00+01:00"
    },
    {
      "id": "00000000-0000-0000-0000-000000000099",
      "salonSlug": "ghost-salon-fes",
      "salonName": "Ghost Salon Fès",
      "city": "FES",
      "ownerName": "Test Owner",
      "ownerEmail": "test@ghost.ma",
      "ownerPhone": "+212600000000",
      "status": "SUSPENDED",
      "publishStatus": "SUSPENDED",
      "onboardingCompletedAt": null,
      "createdAt": "2025-12-01T10:00:00+01:00",
      "metrics30d": { "bookings": 0, "completedBookings": 0, "revenueMinor": 0, "newCustomers": 0 },
      "lastActivityAt": "2026-01-05T10:00:00+01:00"
    }
  ],
  "page": { "size": 20, "total": 47, "cursor": null, "hasMore": false }
}
```

### PlatformMetrics 30D

```json
{
  "period": "30D",
  "totalTenants": 47,
  "activeTenants": 43,
  "newTenants": 4,
  "totalBookings": 6820,
  "completedBookings": 6201,
  "noShowRate": 0.061,
  "totalRevenueMinor": 184500000,
  "topCities": [
    { "city": "CASABLANCA", "tenantCount": 19, "bookings": 3120 },
    { "city": "RABAT", "tenantCount": 11, "bookings": 1450 },
    { "city": "MARRAKECH", "tenantCount": 8, "bookings": 1180 }
  ],
  "topCategories": [
    { "category": "HAIR_WOMEN", "bookings": 2880 },
    { "category": "HAIR_MEN", "bookings": 1620 },
    { "category": "NAILS", "bookings": 980 }
  ]
}
```

## Contraintes pour le futur backend réel

- Pagination : cursor-based.
- Tenant scope : **interdit** (`X-Tenant-Id` absent obligatoire ; présence = 400).
- Idempotence : `POST suspend` / `activate` acceptent `Idempotency-Key`.
- Audit : toute action admin auditée avec `adminUserId` et `traceId`. Stockage dans `audit_trail` du tenant.
- Notifications : suspension envoie un email automatique au owner.
- Métriques : pré-agrégées par job nightly ; lecture quasi instantanée.

## Open questions

- Suspension partielle (lecture seule pro autorisée mais pas d'écriture) : V2. V1 = bloque toute écriture + masque pages publiques.
- Archivage tenant après suspension prolongée (90 jours) : V2.
- Export CSV / KPIs avancés : V2.
