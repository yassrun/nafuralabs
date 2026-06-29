---
specVersion: 1
kind: api
appId: layali
resource: checkins
status: draft
phase: P3
basePath: /api/v1/checkins
auth: required
rateLimit: high
backendOwner: backend/domains/layali/checkin
---

# checkins Mock API

## Vue d'ensemble

Vérification des accès à la porte (booking ou ticket) : scan QR quand disponible, lookup manuel par nom/téléphone/référence en fallback, validation HMAC, anti-double-scan, et broadcast realtime du compteur d'entrée. Endpoints optimisés pour latence p95 < 150 ms.

## Modèle (vue logique)

| Champ | Type | Notes |
|---|---|---|
| id | string (uuid) | |
| tenantId | string | |
| venueId | string (uuid) | |
| eventId | string (uuid) | nullable (booking sans event) |
| target | object | `{ kind: "BOOKING"|"TICKET", id, reference }` |
| status | string enum | `ACCEPTED`, `REJECTED` |
| rejectReason | string | code (`qr_invalid_signature`, `qr_expired`, `qr_already_used`, `qr_unknown_venue`, `event_not_started`, `event_ended`) |
| scannedByUserId | string | rôle `HOST`/`ADMIN`/`OWNER` |
| scannedAt | datetime | |
| deviceId | string | identifiant scanner |
| source | string enum | `QR`, `LOOKUP_MANUAL` |

## Endpoints

### POST /api/v1/checkins/verify

- Auth : required.
- Rôles : HOST, ADMIN, OWNER.
- Headers : `X-Tenant-Id`, `Idempotency-Key`.
- Body :
  ```json
  {
    "qrPayload": "LAYALI:TKT:Z9P3:1:sig=...",
    "deviceId": "door-scanner-01",
    "eventId": "00000000-0000-0000-0000-000000000020"
  }
  ```
- Effet : valide la signature HMAC via `:platform:integrations:qr`, marque le target comme `CHECKED_IN` (ticket) ou `ARRIVED` (booking), incrémente le compteur, broadcast `checkin.recorded`.
- Réponse 200 (succès) :
  ```json
  {
    "status": "ACCEPTED",
    "target": {
      "kind": "TICKET",
      "id": "00000000-0000-0000-7000-000000000001",
      "reference": "TKT-Z9P3:1",
      "categoryCode": "STD",
      "customerName": "Sara Bennani"
    },
    "counter": { "totalIn": 312, "eventCapacity": 800 }
  }
  ```
- Réponse 200 (rejet) :
  ```json
  {
    "status": "REJECTED",
    "rejectReason": "qr_already_used",
    "lastCheckedInAt": "2026-06-13T23:30:00+01:00",
    "scannedBy": "Mehdi Host"
  }
  ```
- Réponse HTTP toujours 200 (le rejet est une réponse métier, pas une erreur HTTP, pour faciliter l'UX scanner).
- Erreurs HTTP : 401, 403, 422 (payload malformé).

### POST /api/v1/checkins/lookup

- Auth : required.
- Rôles : HOST, ADMIN, OWNER.
- Headers : `X-Tenant-Id`.
- Body :
  ```json
  {
    "query": "+212600111222",
    "eventId": "00000000-0000-0000-0000-000000000020",
    "limit": 10
  }
  ```
- Effet : recherche rapide dans les tickets et bookings du tenant par nom, téléphone, référence booking/ticket, avec priorité aux accès du soir courant.
- Réponse 200 :
  ```json
  {
    "items": [
      {
        "kind": "BOOKING",
        "id": "00000000-0000-0000-4000-000000000001",
        "reference": "BKG-A4F8",
        "customerName": "Sara Bennani",
        "customerPhone": "+212600111222",
        "accessMode": "TABLE",
        "occasion": "BIRTHDAY",
        "status": "CONFIRMED",
        "approvalStatus": "NOT_REQUIRED",
        "arrivalAt": "2026-02-14T21:00:00+01:00"
      }
    ]
  }
  ```
- Erreurs HTTP : 401, 403, 422.

### POST /api/v1/checkins/accept-manual

- Auth : required.
- Rôles : HOST, ADMIN, OWNER.
- Headers : `X-Tenant-Id`, `Idempotency-Key`.
- Body :
  ```json
  {
    "targetKind": "BOOKING",
    "targetId": "00000000-0000-0000-4000-000000000001",
    "deviceId": "door-scanner-01",
    "eventId": "00000000-0000-0000-0000-000000000020"
  }
  ```
- Effet : marque le target comme `CHECKED_IN` (ticket) ou `ARRIVED` (booking) après confirmation manuelle par l'hôte, incrémente le compteur, broadcast `checkin.recorded`.
- Réponse 200 : même forme que `POST /checkins/verify`, avec `source=LOOKUP_MANUAL`.
- Erreurs HTTP : 401, 403, 404, 409, 422.

### GET /api/v1/checkins

- Auth : required.
- Rôles : OWNER, ADMIN, HOST (lecture des siens), PLATFORM_ADMIN (cross-venues).
- Headers : `X-Tenant-Id`.
- Query : `eventId`, `from`, `to`, `status`, `cursor`, `size`.
- Réponse 200 : liste de check-ins (pour audit et journal de porte).

### GET /api/v1/checkins/counter

- Auth : required.
- Rôles : OWNER, ADMIN, HOST.
- Query : `eventId` requis.
- Réponse 200 :
  ```json
  {
    "eventId": "00000000-0000-0000-0000-000000000020",
    "totalIn": 312,
    "totalCapacity": 800,
    "byCategory": [
      { "code": "STD", "in": 200, "capacity": 500 },
      { "code": "VIP", "in": 8, "capacity": 50 }
    ],
    "lastUpdatedAt": "2026-06-13T23:55:00+01:00"
  }
  ```

### POST /api/v1/checkins/sync

- Auth : required.
- Rôles : HOST, ADMIN.
- Body :
  ```json
  {
    "deviceId": "door-scanner-01",
    "scans": [
      { "qrPayload": "LAYALI:TKT:...", "scannedAt": "2026-06-13T23:45:00+01:00", "idempotencyKey": "uuid-1" },
      { "qrPayload": "LAYALI:TKT:...", "scannedAt": "2026-06-13T23:45:10+01:00", "idempotencyKey": "uuid-2" }
    ]
  }
  ```
- Effet : resync depuis le mode offline du scanner. Traite chaque scan idempotamment, ordonné par `scannedAt`.
- Réponse 200 : tableau de résultats `[{ status, target, rejectReason? }]` aligné sur l'index.

## Erreurs (rejet métier dans `rejectReason`)

| Code | Cas |
|---|---|
| `qr_invalid_signature` | HMAC mismatch ou clé inconnue |
| `qr_expired` | `exp` du payload dépassé |
| `qr_already_used` | déjà scanné (anti-double-scan) |
| `qr_unknown_venue` | tenant mismatch (payload pointe vers un autre venue) |
| `event_not_started` | scan avant `doorsAt - 30min` |
| `event_ended` | scan après `endAt + 2h` |
| `booking_cancelled` | booking annulé entre-temps |
| `ticket_refunded` | ticket remboursé |
| `lookup_not_found` | aucun résultat exploitable pour le lookup |

## Erreurs HTTP communes

| Code | Cas |
|---|---|
| 401, 403, 422, 423 | classiques |

## Fixtures

```json
[
  {
    "id": "00000000-0000-0000-8000-000000000001",
    "tenantId": "theatro-marrakech",
    "venueId": "00000000-0000-0000-0000-000000000011",
    "eventId": "00000000-0000-0000-0000-000000000021",
    "target": { "kind": "TICKET", "id": "00000000-0000-0000-7000-000000000010", "reference": "TKT-X2L4:1" },
    "status": "ACCEPTED",
    "scannedByUserId": "00000000-0000-0000-2000-000000000003",
    "scannedAt": "2026-06-13T23:45:00+01:00",
    "deviceId": "door-scanner-01",
    "source": "QR"
  },
  {
    "id": "00000000-0000-0000-8000-000000000002",
    "tenantId": "theatro-marrakech",
    "venueId": "00000000-0000-0000-0000-000000000011",
    "eventId": "00000000-0000-0000-0000-000000000021",
    "target": { "kind": "TICKET", "id": "00000000-0000-0000-7000-000000000010", "reference": "TKT-X2L4:1" },
    "status": "REJECTED",
    "rejectReason": "qr_already_used",
    "scannedByUserId": "00000000-0000-0000-2000-000000000003",
    "scannedAt": "2026-06-13T23:46:30+01:00",
    "deviceId": "door-scanner-01",
    "source": "QR"
  }
]
```

## Contraintes pour le futur backend réel

- Latence : p95 < 150 ms ; cache local de la liste blanche au moment de l'event start (`PUBLISHED` + lookup hot path Redis).
- Anti-double-scan : verrou atomique sur `(targetKind, targetId)` (lock Redis ou contrainte unique DB).
- Mode offline : le client scanner met les scans en queue locale et `POST /checkins/sync` au resync. Conflits = premier scan accepté gagne, suivant marqué `qr_already_used`.
- HMAC : key rotation 90 jours, deux clés actives en parallèle pendant 24h pour transitions sans interruption.
- WebSocket : `checkin.recorded` (status=ACCEPTED) et `checkin.rejected` sur `/topic/event/{eventId}/checkin`.
- Audit : tous les scans (acceptés ou rejetés) journalisés 6 mois minimum.
- Lookup manuel : recherche indexée sur `(tenantId, eventId?, reference, customerName, customerPhone)` pour rester exploitable même en file de porte.

## Open questions

- Mode "auto-approve" en cas de défaillance HMAC (panne backend) avec resync ultérieur : V2.
- Le lookup manuel doit-il retourner aussi les `NO_SHOW` récents en lecture seule pour aider l'hôte à expliquer un refus ?
- Multi-scanner par event avec round-robin : V1 = chaque scanner indépendant.
- Photo du porteur côté ticket VIP : V2.
