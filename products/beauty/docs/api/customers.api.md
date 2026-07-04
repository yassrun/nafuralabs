---
specVersion: 1
kind: api
appId: beauty
resource: customers
status: draft
phase: P3
basePath: /api/v1/customers
auth: required
rateLimit: default
backendOwner: backend/domains/beauty/customer
---

# customers Mock API

## Vue d'ensemble

Deux vues distinctes :
1. **Self** (`/me/*`) : le client gère son propre profil, ses préférences, son historique.
2. **Pro** (`/pro/customers/*`) : le salon voit la liste de ses clients (= ceux qui ont au moins 1 booking dans ce tenant), avec historique consolidé.

Le profil global utilisateur est dans `auth.api.md` ; ici on parle de la projection métier "client d'un salon".

## Modèle (vue logique)

### CustomerProfile (vue self)

| Champ | Type | Notes |
|---|---|---|
| id | string (uuid) | = userId |
| firstName | string | |
| lastName | string | |
| phone | string E.164 | |
| email | string | nullable |
| locale | string | |
| photoUrl | string | nullable |
| notificationPreferences | object | `{ sms, email, reminderHoursBefore }` |
| stats | object | `{ totalBookings, completedBookings, favoriteSalonId }` |

### SalonCustomer (vue pro)

| Champ | Type | Notes |
|---|---|---|
| id | string (uuid) | = userId |
| firstName | string | |
| lastName | string | |
| phone | string | masqué selon politique tenant |
| email | string | optionnel |
| firstSeenAt | datetime | |
| lastSeenAt | datetime | |
| totalBookings | integer | dans ce tenant |
| completedBookings | integer | |
| cancelledBookings | integer | |
| noShowBookings | integer | |
| totalSpentMinor | integer | en MAD, ce tenant uniquement |
| loyaltyPoints | integer | ce tenant |
| tags | string[] | tags libres (VIP, allergie, etc.) ajoutés par le pro |
| notes | string | notes pro privées |
| lastBooking | object | extrait du dernier booking |

## Endpoints

### GET /api/v1/me

- Voir [auth.api.md](auth.api.md#GET-/api/v1/auth/me).

### GET /api/v1/me/profile-extended

- Auth : required.
- Rôles : CUSTOMER.
- Réponse 200 : `CustomerProfile` complet avec stats.

### PATCH /api/v1/me

- Voir [auth.api.md](auth.api.md#PATCH-/api/v1/auth/me).

### DELETE /api/v1/me

- Auth : required.
- Rôles : CUSTOMER.
- Effet : soft delete avec anonymisation (RGPD/loi 09-08). Les bookings du tenant deviennent anonymes (`firstName=Anonyme`, `lastName=null`, `phone=null`) mais restent pour les stats salon.
- Réponse 204.
- Erreurs : 409 (RDV futur en cours).

### POST /api/v1/me/photo

- Auth : required.
- Body : multipart `file`.
- Réponse 200 : `{ "photoUrl": "..." }`.

### GET /api/v1/pro/customers

- Auth : required.
- Rôles : OWNER, ADMIN, STAFF (filtre auto sur ses clients).
- Headers : `X-Tenant-Id`.
- Query :
  | Param | Description |
  |---|---|
  | `q` | nom, téléphone partiel |
  | `tag` | filtre par tag |
  | `sort` | `lastSeen` (défaut), `totalSpent`, `totalBookings` |
  | `pageSize`, `cursor` | pagination |
- Réponse 200 : `{ "items": [SalonCustomer], "page": {...} }`.

### GET /api/v1/pro/customers/:customerId

- Auth : required.
- Réponse 200 : SalonCustomer + dernières 20 bookings + total loyalty.
- Erreurs : 404 (pas client de ce tenant).

### PATCH /api/v1/pro/customers/:customerId

- Auth : required.
- Rôles : OWNER, ADMIN, STAFF (uniquement `tags` et `notes` sur ses clients).
- Body partiel : `tags`, `notes`.
- Réponse 200.

### GET /api/v1/pro/customers/:customerId/bookings

- Auth : required.
- Réponse 200 : `{ "items": [bookings du customer dans ce tenant], "page": {...} }`.

## Erreurs communes

| Code | Cas |
|---|---|
| 401, 403, 404, 423 | classiques |
| 409 | suppression refusée (booking futur) |
| 422 | validation profil |

## Fixtures

### Vue self (`/me/profile-extended`)

```json
{
  "id": "00000000-0000-0000-1000-000000000001",
  "firstName": "Sara",
  "lastName": "Bennani",
  "phone": "+212600111222",
  "email": "sara.b@example.com",
  "locale": "fr",
  "photoUrl": "https://mock.minio/beauty/users/sara.jpg",
  "notificationPreferences": {
    "sms": true,
    "email": true,
    "reminderHoursBefore": 24
  },
  "stats": {
    "totalBookings": 8,
    "completedBookings": 6,
    "favoriteSalonId": "00000000-0000-0000-0000-000000000001"
  }
}
```

### Vue pro (`/pro/customers`)

```json
{
  "items": [
    {
      "id": "00000000-0000-0000-1000-000000000001",
      "firstName": "Sara",
      "lastName": "Bennani",
      "phone": "+212600111222",
      "email": "sara.b@example.com",
      "firstSeenAt": "2025-10-12T15:00:00+01:00",
      "lastSeenAt": "2026-05-28T14:00:00+01:00",
      "totalBookings": 6,
      "completedBookings": 5,
      "cancelledBookings": 1,
      "noShowBookings": 0,
      "totalSpentMinor": 165000,
      "loyaltyPoints": 165,
      "tags": ["VIP", "coloration"],
      "notes": "Préfère Salma. Allergie ammoniaque.",
      "lastBooking": {
        "id": "00000000-0000-0000-4000-000000000010",
        "startAt": "2026-05-28T14:00:00+01:00",
        "serviceName": "Coupe femme + brushing",
        "status": "COMPLETED"
      }
    },
    {
      "id": "00000000-0000-0000-1000-000000000002",
      "firstName": "Youssef",
      "lastName": "El Idrissi",
      "phone": "+212600333444",
      "email": null,
      "firstSeenAt": "2026-06-08T19:00:00+01:00",
      "lastSeenAt": "2026-06-08T19:00:00+01:00",
      "totalBookings": 1,
      "completedBookings": 1,
      "cancelledBookings": 0,
      "noShowBookings": 0,
      "totalSpentMinor": 12000,
      "loyaltyPoints": 12,
      "tags": [],
      "notes": null,
      "lastBooking": {
        "id": "00000000-0000-0000-4000-000000000002",
        "startAt": "2026-06-08T19:00:00+01:00",
        "serviceName": "Coupe homme + barbe",
        "status": "COMPLETED"
      }
    }
  ],
  "page": { "size": 20, "total": 142, "cursor": null, "hasMore": false }
}
```

## Contraintes pour le futur backend réel

- Tenant scope : `/pro/customers*` scopé. La projection est calculée à partir des bookings du tenant.
- Idempotence : peu d'écritures, mais `PATCH` accepte `Idempotency-Key`.
- Audit : update tags/notes pro audité.
- Anonymisation : suppression self déclenche un job qui purge PII dans les bookings ; les stats sont préservées.
- Confidentialité : un STAFF ne voit pas les notes pro globales d'un autre staff (V2 affine), V1 = notes partagées à tout le pro.

## Open questions

- Téléphone masqué pour STAFF ? V1 = visible (besoin opérationnel : appeler le client en cas de retard).
- Tags partagés vs personnels par staff : V1 partagés ; V2 séparation.
- Export CSV de la liste clients : V2.
