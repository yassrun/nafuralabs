---
specVersion: 1
kind: api
appId: layali
resource: tables
status: draft
phase: P3
basePath: /api/v1/tables
auth: required
rateLimit: default
backendOwner: backend/domains/layali/table
---

# tables Mock API

## Vue d'ensemble

Plan de salle d'un venue : tables physiques avec position, capacité, minimum spend. Gestion CRUD par le pro et lecture publique pour le client lors de la réservation table.

## Modèle (vue logique)

| Champ | Type | Obligatoire | Notes |
|---|---|---|---|
| id | string (uuid) | oui | |
| tenantId | string | oui | |
| venueId | string (uuid) | oui | |
| eventId | string (uuid) | non | si lié à un event spécifique (sinon table récurrente) |
| label | string | oui | ex : `T1`, `VIP-A`, `Carré 4` |
| zone | string | non | `MAIN`, `VIP`, `TERRACE`, `STAGE_FRONT` |
| seats | integer | oui | nombre de couverts |
| minSpendMinor | integer | non | minimum de consommation en centimes MAD |
| depositMinor | integer | non | acompte requis à la réservation |
| currency | string | oui | `MAD` |
| position | object | non | `{ x, y, rotation }` pour rendu plan de salle |
| status | string enum | oui | `AVAILABLE`, `RESERVED`, `OCCUPIED`, `BLOCKED`, `ARCHIVED` |
| reservedBookingId | string (uuid) | non | si `RESERVED` ou `OCCUPIED` |
| createdAt | datetime | oui | |
| updatedAt | datetime | oui | |

## Endpoints

### GET /api/v1/tables

- Auth : optional (public si `eventId` fourni avec event `PUBLISHED`).
- Query :
  | Param | Type | Description |
  |---|---|---|
  | `venueId` ou `venueSlug` | | requis |
  | `eventId` ou `eventSlug` | | si event-specific |
  | `zone` | string | filtre zone |
  | `status` | csv | filtre statut |
  | `availableOnly` | bool | défaut `true` côté public |
- Réponse 200 :
  ```json
  {
    "items": [ /* table */ ],
    "layout": { "width": 1200, "height": 800, "backgroundUrl": "..." }
  }
  ```
- Côté public, seules `id, label, zone, seats, minSpendMinor, depositMinor, position, status` sont exposés.

### POST /api/v1/tables

- Auth : required.
- Rôles : OWNER, ADMIN.
- Headers : `X-Tenant-Id`.
- Body :
  ```json
  {
    "venueId": "00000000-0000-0000-0000-000000000010",
    "eventId": null,
    "label": "VIP-A",
    "zone": "VIP",
    "seats": 8,
    "minSpendMinor": 300000,
    "depositMinor": 100000,
    "currency": "MAD",
    "position": { "x": 320, "y": 180, "rotation": 0 }
  }
  ```
- Réponse 201.
- Erreurs : 409 `table_label_exists`, 422.

### PATCH /api/v1/tables/:id

- Auth : required.
- Body partiel. Si `status=RESERVED|OCCUPIED`, certaines mutations (`zone`, `seats`) sont bloquées (`409 table_in_use`).
- Réponse 200.

### DELETE /api/v1/tables/:id

- Auth : required.
- Effet : si jamais utilisée → hard delete ; sinon archivée (`status=ARCHIVED`).
- Réponse 204.
- Erreurs : 409 (table avec bookings actifs).

### POST /api/v1/tables/layout

- Auth : required.
- Rôles : OWNER, ADMIN.
- Body :
  ```json
  {
    "venueId": "00000000-0000-0000-0000-000000000010",
    "layout": { "width": 1200, "height": 800, "backgroundUrl": "https://media.layali.ma/v/sky31/plan.jpg" },
    "tables": [
      { "id": "tbl-001", "position": { "x": 100, "y": 100, "rotation": 0 } },
      { "id": "tbl-002", "position": { "x": 200, "y": 100, "rotation": 0 } }
    ]
  }
  ```
- Effet : sauvegarde le fond + positions en bulk (PATCH multiple atomique).
- Réponse 200.

### POST /api/v1/tables/:id/block

- Auth : required.
- Body : `{ "until": "2026-06-14T23:59:00+01:00", "reason": "Privatisation" }`.
- Effet : `status=BLOCKED` jusqu'à la date, refus de booking.
- Réponse 200.

### POST /api/v1/tables/:id/release

- Auth : required.
- Effet : `BLOCKED → AVAILABLE`.
- Réponse 200.

## Erreurs communes

| Code | Cas |
|---|---|
| 401, 403, 404, 422, 423 | classiques |
| 409 | `table_label_exists`, `table_in_use`, `table_unavailable` |

## Fixtures

```json
[
  {
    "id": "00000000-0000-0000-3000-000000000001",
    "tenantId": "sky31-casablanca",
    "venueId": "00000000-0000-0000-0000-000000000010",
    "eventId": null,
    "label": "T1",
    "zone": "MAIN",
    "seats": 4,
    "minSpendMinor": 150000,
    "depositMinor": 50000,
    "currency": "MAD",
    "position": { "x": 100, "y": 100, "rotation": 0 },
    "status": "AVAILABLE",
    "createdAt": "2025-09-15T10:00:00+01:00",
    "updatedAt": "2025-09-15T10:00:00+01:00"
  },
  {
    "id": "00000000-0000-0000-3000-000000000002",
    "tenantId": "sky31-casablanca",
    "venueId": "00000000-0000-0000-0000-000000000010",
    "eventId": "00000000-0000-0000-0000-000000000020",
    "label": "VIP-A",
    "zone": "VIP",
    "seats": 8,
    "minSpendMinor": 400000,
    "depositMinor": 150000,
    "currency": "MAD",
    "position": { "x": 320, "y": 180, "rotation": 0 },
    "status": "RESERVED",
    "reservedBookingId": "00000000-0000-0000-4000-000000000001",
    "createdAt": "2026-01-10T10:00:00+01:00",
    "updatedAt": "2026-01-20T15:00:00+01:00"
  },
  {
    "id": "00000000-0000-0000-3000-000000000003",
    "tenantId": "sky31-casablanca",
    "venueId": "00000000-0000-0000-0000-000000000010",
    "eventId": null,
    "label": "T-Terrasse-3",
    "zone": "TERRACE",
    "seats": 6,
    "minSpendMinor": 200000,
    "depositMinor": 80000,
    "currency": "MAD",
    "position": { "x": 600, "y": 480, "rotation": 90 },
    "status": "BLOCKED",
    "createdAt": "2025-09-15T10:00:00+01:00",
    "updatedAt": "2026-06-08T12:00:00+01:00"
  }
]
```

## Contraintes pour le futur backend réel

- Tenant scope obligatoire en mutation.
- Verrou pessimiste lors d'une réservation pour éviter double-attribution simultanée.
- Audit : tout changement de `status`, `position`, `minSpendMinor`.
- WebSocket : `table.reserved`, `table.released` sur `/topic/event/{eventId}/tables` (si `eventId` non null) et `/topic/venue/{venueId}/tables` (sinon).
- Cohérence : `eventId` doit appartenir au même tenant que la table.

## Open questions

- Tables modulables (assemblage à 12) : V2.
- Tarification table dynamique par jour de la semaine : V2.
- Soft block d'un client habitué (pré-réservé sans paiement) : V2.
