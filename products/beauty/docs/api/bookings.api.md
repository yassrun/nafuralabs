---
specVersion: 1
kind: api
appId: beauty
resource: bookings
status: draft
phase: P3
basePath: /api/v1/bookings
auth: required
rateLimit: default
backendOwner: backend/domains/beauty/booking
---

# bookings Mock API

## Vue d'ensemble

Ressource centrale du domaine : créneaux disponibles, création d'un RDV, transitions de statut (CONFIRMED → ARRIVED → COMPLETED, ou CANCELLED / NO_SHOW), lecture client (mes RDV) et pro (agenda salon).

## Modèle (vue logique)

| Champ | Type | Obligatoire | Notes |
|---|---|---|---|
| id | string (uuid) | oui | |
| reference | string | oui | code court humain, ex `BK-A4F8` |
| tenantId | string (uuid) | oui | |
| salonId | string (uuid) | oui | = tenantId V1 |
| customerId | string (uuid) | oui | |
| staffId | string (uuid) | oui | |
| serviceId | string (uuid) | oui | snapshot d'identité |
| serviceSnapshot | object | oui | `{ name, durationMinutes, priceMinor, currency }` fige le prix au moment du booking |
| startAt | datetime | oui | début, ISO 8601 timezone Africa/Casablanca |
| endAt | datetime | oui | calculé `startAt + durationMinutes + bufferAfter` |
| status | string enum | oui | `PENDING_PAYMENT` / `CONFIRMED` / `ARRIVED` / `COMPLETED` / `CANCELLED` / `NO_SHOW` |
| paymentStatus | string enum | oui | `NONE` / `PENDING` / `PAID_ONLINE` / `PAID_CASH` / `REFUNDED` / `FAILED` |
| paymentId | string (uuid) | non | référence vers payments |
| cancellationReason | string | non | si `CANCELLED` |
| cancellationBy | string enum | non | `CUSTOMER` / `SALON` / `SYSTEM` |
| notes | string | non | note libre client à la réservation |
| internalNotes | string | non | notes pro privées (jamais retournées au client) |
| reminderSentAt | datetime | non | trace SMS J-1 |
| reviewId | string (uuid) | non | référence vers reviews si avis posté |
| loyaltyPointsEarned | integer | non | rempli quand `COMPLETED` et `loyaltyEnabled` |
| createdAt | datetime | oui | |
| updatedAt | datetime | oui | |

### Transitions de statut

- `PENDING_PAYMENT` (paiement online init) → `CONFIRMED` (callback succès) | `CANCELLED` (timeout / failure).
- `CONFIRMED` → `ARRIVED` (pro marque arrivé) | `CANCELLED` | `NO_SHOW` (auto 15 min après `startAt` si pas marqué).
- `ARRIVED` → `COMPLETED` (pro marque terminé) | `CANCELLED` (rare, cas force majeure).
- `COMPLETED` → terminal. Loyalty et review possibles.
- `CANCELLED`, `NO_SHOW` → terminaux.

## Endpoints

### GET /api/v1/salons/:slug/availability

- Auth : public.
- Query :
  | Param | Type | Description |
  |---|---|---|
  | `serviceId` | uuid | requis |
  | `staffId` | uuid | optionnel ; si vide, tous staffs |
  | `date` | yyyy-MM-dd | requis |
  | `daysAhead` | int 1-14 | défaut 7, fenêtre à partir de `date` |
- Réponse 200 :
  ```json
  {
    "slots": [
      {
        "startAt": "2026-06-10T10:00:00+01:00",
        "endAt": "2026-06-10T11:00:00+01:00",
        "staffId": "staff-001",
        "available": true
      },
      {
        "startAt": "2026-06-10T11:00:00+01:00",
        "endAt": "2026-06-10T12:00:00+01:00",
        "staffId": "staff-001",
        "available": false,
        "reason": "BOOKED"
      }
    ]
  }
  ```
- Erreurs : 404 (salon/service), 422.

### POST /api/v1/bookings

- Auth : required.
- Rôles : CUSTOMER.
- Headers : `Idempotency-Key` recommandé.
- Body :
  ```json
  {
    "salonId": "00000000-0000-0000-0000-000000000001",
    "serviceId": "svc-001",
    "staffId": "staff-001",
    "startAt": "2026-06-10T10:00:00+01:00",
    "notes": "Première visite, cheveux fragiles.",
    "paymentMode": "ONLINE_CMI"
  }
  ```
  `paymentMode` ∈ `NONE_CASH_ON_SITE` (défaut), `ONLINE_CMI`, `ONLINE_STRIPE`. Si online, le booking part en `PENDING_PAYMENT` et un `paymentId` est créé en parallèle (voir [payments.api.md](payments.api.md)).
- Réponse 201 :
  ```json
  {
    "booking": { /* booking */ },
    "payment": {
      "id": "pay-001",
      "redirectUrl": "https://mock.cmi/pay/pay-001"
    }
  }
  ```
- Erreurs : 409 (créneau pris entre la lecture et la création, race), 422, 423.

### GET /api/v1/bookings/:bookingId

- Auth : required.
- Visibilité : CUSTOMER (uniquement ses bookings), OWNER/ADMIN (ceux du tenant), STAFF (ceux où il est `staffId`).
- Réponse 200.
- Erreurs : 401, 403, 404.

### GET /api/v1/me/bookings

- Auth : required.
- Rôles : CUSTOMER.
- Query :
  | Param | Description |
  |---|---|
  | `status` | filtre statut (`UPCOMING` virtuel = CONFIRMED+ARRIVED+PENDING_PAYMENT futurs, `PAST` = COMPLETED+NO_SHOW+CANCELLED) |
  | `pageSize`, `cursor` | pagination |
- Réponse 200 : `{ "items": [...], "page": {...} }`.

### GET /api/v1/pro/bookings

- Auth : required.
- Rôles : OWNER, ADMIN (vue salon), STAFF (filtré sur soi).
- Headers : `X-Tenant-Id`.
- Query :
  | Param | Description |
  |---|---|
  | `from` | datetime |
  | `to` | datetime |
  | `staffId` | filtre staff |
  | `status` | filtre |
  | `q` | texte (nom client, référence) |
  | `pageSize`, `cursor` | pagination |
- Réponse 200 : `{ "items": [...], "page": {...} }`.

### GET /api/v1/pro/bookings/agenda

- Auth : required.
- Rôles : OWNER, ADMIN, STAFF (filtré sur soi).
- Query :
  | Param | Description |
  |---|---|
  | `view` | `DAY` (défaut) / `WEEK` |
  | `date` | yyyy-MM-dd, requis |
  | `staffIds` | csv pour filtre multi-staff |
- Réponse 200 :
  ```json
  {
    "view": "DAY",
    "date": "2026-06-10",
    "staffs": [
      {
        "staffId": "staff-001",
        "displayName": "Salma I.",
        "bookings": [ /* bookings du jour */ ],
        "workingRanges": [{ "from": "09:00", "to": "18:00" }],
        "offRanges": []
      }
    ]
  }
  ```

### PATCH /api/v1/pro/bookings/:bookingId/status

- Auth : required.
- Rôles : OWNER, ADMIN, STAFF (uniquement ses bookings).
- Body : `{ "status": "ARRIVED" | "COMPLETED" | "NO_SHOW" | "CANCELLED", "reason": "..." }`.
- Effet : applique transition selon le tableau §Transitions. Si `COMPLETED` et `loyaltyEnabled`, calcule et inscrit les points.
- Réponse 200 : booking mis à jour.
- Erreurs : 409 (transition invalide), 422.

### PATCH /api/v1/pro/bookings/:bookingId

- Auth : required.
- Rôles : OWNER, ADMIN.
- Body partiel : `internalNotes`, `staffId` (replanification staff), `startAt` (replanification créneau).
- Effet : si `startAt` change, vérifie la dispo, notifie le client (SMS + email).
- Réponse 200.
- Erreurs : 409, 422.

### POST /api/v1/bookings/:bookingId/cancel

- Auth : required.
- Rôles : CUSTOMER (uniquement le sien), OWNER, ADMIN, STAFF (le sien).
- Body : `{ "reason": "..." }`.
- Effet : `status = CANCELLED`. Si payment online déjà effectué et dans fenêtre de remboursement, déclenche remboursement (voir payments).
- Réponse 200 : booking mis à jour.
- Erreurs : 409 (déjà terminé), 422.

### POST /api/v1/bookings/:bookingId/reschedule

- Auth : required.
- Rôles : CUSTOMER (le sien) ou pro.
- Body : `{ "startAt": "...", "staffId": "..." (optionnel) }`.
- Effet : crée un nouveau booking lié au précédent (`previousBookingId`), ancien passe en `CANCELLED` automatique avec `cancellationBy=CUSTOMER` ou `SALON`. En V1 simple : on mute le booking existant.
- Réponse 200 : booking mis à jour.
- Erreurs : 409 (créneau pris), 422 (hors fenêtre).

### GET /api/v1/bookings/:bookingId/ics

- Auth : required.
- Réponse 200 : `text/calendar`, fichier `.ics` avec VEVENT.

## Erreurs communes

| Code | Cas |
|---|---|
| 401, 403, 404, 423 | classiques |
| 409 | créneau pris, transition invalide |
| 422 | hors horaires d'ouverture, hors horaires staff, durée invalide |

## Fixtures

```json
[
  {
    "id": "00000000-0000-0000-4000-000000000001",
    "reference": "BK-A4F8",
    "tenantId": "00000000-0000-0000-0000-000000000001",
    "salonId": "00000000-0000-0000-0000-000000000001",
    "customerId": "00000000-0000-0000-1000-000000000001",
    "staffId": "staff-001",
    "serviceId": "svc-001",
    "serviceSnapshot": {
      "name": "Coupe femme + brushing",
      "durationMinutes": 60,
      "priceMinor": 25000,
      "currency": "MAD"
    },
    "startAt": "2026-06-10T10:00:00+01:00",
    "endAt": "2026-06-10T11:10:00+01:00",
    "status": "CONFIRMED",
    "paymentStatus": "PAID_ONLINE",
    "paymentId": "00000000-0000-0000-5000-000000000001",
    "notes": "Première visite",
    "reminderSentAt": "2026-06-09T10:00:00+01:00",
    "loyaltyPointsEarned": null,
    "createdAt": "2026-06-05T15:30:00+01:00",
    "updatedAt": "2026-06-05T15:31:00+01:00"
  },
  {
    "id": "00000000-0000-0000-4000-000000000002",
    "reference": "BK-B7K2",
    "tenantId": "00000000-0000-0000-0000-000000000003",
    "salonId": "00000000-0000-0000-0000-000000000003",
    "customerId": "00000000-0000-0000-1000-000000000002",
    "staffId": "staff-301",
    "serviceId": "svc-301",
    "serviceSnapshot": {
      "name": "Coupe homme + barbe",
      "durationMinutes": 45,
      "priceMinor": 12000,
      "currency": "MAD"
    },
    "startAt": "2026-06-08T19:00:00+01:00",
    "endAt": "2026-06-08T19:45:00+01:00",
    "status": "COMPLETED",
    "paymentStatus": "PAID_CASH",
    "loyaltyPointsEarned": 12,
    "reviewId": "rev-001",
    "createdAt": "2026-06-07T14:00:00+01:00",
    "updatedAt": "2026-06-08T19:50:00+01:00"
  },
  {
    "id": "00000000-0000-0000-4000-000000000003",
    "reference": "BK-C1Q9",
    "tenantId": "00000000-0000-0000-0000-000000000001",
    "salonId": "00000000-0000-0000-0000-000000000001",
    "customerId": "00000000-0000-0000-1000-000000000001",
    "staffId": "staff-002",
    "serviceId": "svc-003",
    "serviceSnapshot": {
      "name": "Coupe homme classique",
      "durationMinutes": 30,
      "priceMinor": 8000,
      "currency": "MAD"
    },
    "startAt": "2026-06-12T16:00:00+01:00",
    "endAt": "2026-06-12T16:30:00+01:00",
    "status": "PENDING_PAYMENT",
    "paymentStatus": "PENDING",
    "paymentId": "00000000-0000-0000-5000-000000000003",
    "createdAt": "2026-06-08T11:00:00+01:00",
    "updatedAt": "2026-06-08T11:00:00+01:00"
  }
]
```

## Contraintes pour le futur backend réel

- Pagination : cursor-based, défaut 20, max 100 sur `/pro/bookings`.
- Tenant scope : `/pro/bookings*` scopé. `/me/bookings` scopé par `customerId` du JWT. `/bookings/:id` enforce visibilité au cas par cas.
- Idempotence : `POST /bookings` clé requise pour éviter doubles RDV au double-clic.
- Audit : création, transitions de statut, replanifications, annulations.
- Conflits : verrou pessimiste ou contrainte exclusion sur `(staffId, [startAt, endAt))` pour éviter chevauchements.
- Auto no-show : job background qui marque `NO_SHOW` après 15 min de retard si pas `ARRIVED`. Configurable par salon V2.

## Open questions

- Replanification en double-créneau (annulation+création) vs mutation : décision V1 = mutation, mais on garde un `previousStartAt` audit.
- Buffer between bookings : géré via `service.bufferAfterMinutes`. Suffisant ? V2 envisager buffer staff global.
- Multi-services par RDV (coupe + couleur enchaînés sur le même créneau) : V1 = 1 service ; combo en V2.
