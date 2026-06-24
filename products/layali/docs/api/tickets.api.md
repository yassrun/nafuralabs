---
specVersion: 1
kind: api
appId: layali
resource: tickets
status: stable
basePath: /api/v1/tickets
auth: required
rateLimit: default
backendOwner: backend/domains/layali/ticket
---

# tickets Mock API

## Vue d'ensemble

Billetterie d'un event : achat d'une ou plusieurs places via un ticket order, génération QR par billet, transitions check-in. Une commande (`TicketOrder`) regroupe N tickets (`Ticket`).

## Modèles (vue logique)

### TicketOrder

| Champ | Type | Obligatoire | Notes |
|---|---|---|---|
| id | string (uuid) | oui | |
| reference | string | oui | `TKT-A4F8` |
| tenantId | string | oui | |
| eventId | string (uuid) | oui | |
| customerId | string (uuid) | oui | |
| customerName | string | oui | snapshot |
| customerEmail | string | oui | snapshot |
| customerPhone | string | oui | snapshot |
| items | object[] | oui | `[{ categoryCode, quantity, unitPriceMinor }]` |
| totalMinor | int | oui | |
| currency | string | oui | `MAD` |
| paymentId | string (uuid) | non | |
| paymentStatus | string enum | oui | `PENDING`, `PAID`, `REFUNDED`, `FAILED` |
| status | string enum | oui | `DRAFT`, `PENDING`, `CONFIRMED`, `REFUNDED`, `CANCELLED` |
| tickets | Ticket[] | non | générés une fois `CONFIRMED` |
| createdAt | datetime | oui | |
| updatedAt | datetime | oui | |

### Ticket

| Champ | Type | Notes |
|---|---|---|
| id | string (uuid) | |
| orderId | string (uuid) | |
| eventId | string (uuid) | |
| categoryCode | string | snapshot |
| seatLabel | string | nullable (V1 places libres) |
| qrCode | string | payload signé |
| status | string enum | `VALID`, `CHECKED_IN`, `REVOKED`, `REFUNDED` |
| checkedInAt | datetime | nullable |
| checkedInByUserId | string | nullable |

## Endpoints

### GET /api/v1/tickets/availability

- Auth : public.
- Query : `eventSlug` ou `eventId` requis.
- Réponse 200 :
  ```json
  {
    "eventId": "00000000-0000-0000-0000-000000000020",
    "categories": [
      { "code": "STD", "label": "Standard", "priceMinor": 30000, "currency": "MAD", "remaining": 142, "soldOut": false, "perOrderMax": 6 },
      { "code": "VIP", "label": "VIP", "priceMinor": 60000, "currency": "MAD", "remaining": 4, "soldOut": false, "perOrderMax": 4 }
    ]
  }
  ```
- Mise à jour temps réel via topic `/topic/event/{eventId}/availability`.

### POST /api/v1/tickets/orders/draft

- Auth : optional.
- Headers : `Idempotency-Key` recommandé.
- Body :
  ```json
  {
    "eventId": "00000000-0000-0000-0000-000000000020",
    "items": [
      { "categoryCode": "STD", "quantity": 2 },
      { "categoryCode": "VIP", "quantity": 1 }
    ],
    "customerName": "Sara Bennani",
    "customerEmail": "sara@example.ma",
    "customerPhone": "+212600111222"
  }
  ```
- Effet : réserve un quota de places dans chaque catégorie (TTL 10 min), calcule `totalMinor`.
- Réponse 201 :
  ```json
  {
    "draftId": "00000000-0000-0000-6000-000000000010",
    "expiresAt": "2026-02-14T20:10:00+01:00",
    "totalMinor": 120000,
    "currency": "MAD"
  }
  ```
- Erreurs : 409 `event_sold_out`, 422 (quantity > perOrderMax).

### GET /api/v1/tickets/orders/draft/:draftId

- Auth : optional (besoin de la clé idempotency ou JWT propriétaire).
- Réponse 200 : draft complet.
- Erreurs : 404, 410 (expiré).

### POST /api/v1/tickets/orders

- Auth : required.
- Headers : `Idempotency-Key` requis.
- Body : `{ "draftId": "...", "paymentId": "..." }`.
- Effet : sur callback paiement OK, génère les `Ticket[]` avec QR codes signés via `:platform:integrations:qr`.
- Réponse 201 : `TicketOrder` complet + `tickets[]`.
- Erreurs : 410 (draft expiré), 409 `payment_pending`.

### GET /api/v1/tickets/orders/:id

- Auth : required.
- Visibilité : propriétaire ou pro du tenant.
- Réponse 200.

### GET /api/v1/tickets/orders

- Auth : required.
- Comportement selon `scope=mine` (CUSTOMER) ou `scope=tenant` (pro avec `X-Tenant-Id`).
- Query : `eventId`, `status`, `from`, `to`, `q`, `cursor`, `size`.

### GET /api/v1/tickets

- Auth : required.
- Comportement selon `scope=mine` ou `scope=tenant`.
- Query : `eventId`, `status` (`valid,checked-in,revoked`), `cursor`, `size`.
- Réponse 200 : liste `Ticket[]` (lecture pour le contrôle d'accès, ou pour `customer-tickets`).

### POST /api/v1/tickets/orders/:id/refund

- Auth : required.
- Rôles : OWNER, ADMIN ou PLATFORM_ADMIN.
- Body : `{ "amountMinor": 120000, "reason": "Annulation event" }` (full ou partial).
- Effet : déclenche refund via `:platform:integrations:payment` ; tickets passent `REFUNDED`.
- Réponse 202.

### POST /api/v1/tickets/:id/resend

- Auth : required.
- Effet : renvoie email + SMS au client avec le QR.
- Réponse 202.

## Erreurs communes

| Code | Cas |
|---|---|
| 401, 403, 404, 422, 423 | classiques |
| 409 | `event_sold_out`, `payment_pending`, `category_quota_insufficient` |
| 410 | draft expiré |

## Fixtures

```json
[
  {
    "id": "00000000-0000-0000-6000-000000000001",
    "reference": "TKT-Z9P3",
    "tenantId": "sky31-casablanca",
    "eventId": "00000000-0000-0000-0000-000000000020",
    "customerId": "00000000-0000-0000-1000-000000000001",
    "customerName": "Sara Bennani",
    "customerEmail": "sara@example.ma",
    "customerPhone": "+212600111222",
    "items": [
      { "categoryCode": "STD", "quantity": 2, "unitPriceMinor": 30000 }
    ],
    "totalMinor": 60000,
    "currency": "MAD",
    "paymentId": "00000000-0000-0000-5000-000000000010",
    "paymentStatus": "PAID",
    "status": "CONFIRMED",
    "tickets": [
      {
        "id": "00000000-0000-0000-7000-000000000001",
        "orderId": "00000000-0000-0000-6000-000000000001",
        "eventId": "00000000-0000-0000-0000-000000000020",
        "categoryCode": "STD",
        "seatLabel": null,
        "qrCode": "LAYALI:TKT:Z9P3:1:sig=mocksig1",
        "status": "VALID",
        "checkedInAt": null
      },
      {
        "id": "00000000-0000-0000-7000-000000000002",
        "orderId": "00000000-0000-0000-6000-000000000001",
        "eventId": "00000000-0000-0000-0000-000000000020",
        "categoryCode": "STD",
        "seatLabel": null,
        "qrCode": "LAYALI:TKT:Z9P3:2:sig=mocksig2",
        "status": "VALID",
        "checkedInAt": null
      }
    ],
    "createdAt": "2026-01-22T12:00:00+01:00",
    "updatedAt": "2026-01-22T12:05:00+01:00"
  },
  {
    "id": "00000000-0000-0000-6000-000000000002",
    "reference": "TKT-X2L4",
    "tenantId": "theatro-marrakech",
    "eventId": "00000000-0000-0000-0000-000000000021",
    "customerId": "00000000-0000-0000-1000-000000000002",
    "customerName": "Youssef El Idrissi",
    "customerEmail": "youssef@example.ma",
    "customerPhone": "+212600333444",
    "items": [ { "categoryCode": "STD", "quantity": 1, "unitPriceMinor": 20000 } ],
    "totalMinor": 20000,
    "currency": "MAD",
    "paymentId": "00000000-0000-0000-5000-000000000011",
    "paymentStatus": "PAID",
    "status": "CONFIRMED",
    "tickets": [
      {
        "id": "00000000-0000-0000-7000-000000000010",
        "orderId": "00000000-0000-0000-6000-000000000002",
        "eventId": "00000000-0000-0000-0000-000000000021",
        "categoryCode": "STD",
        "seatLabel": null,
        "qrCode": "LAYALI:TKT:X2L4:1:sig=mocksig10",
        "status": "CHECKED_IN",
        "checkedInAt": "2026-06-13T23:45:00+01:00",
        "checkedInByUserId": "00000000-0000-0000-2000-000000000003"
      }
    ],
    "createdAt": "2026-05-15T10:00:00+01:00",
    "updatedAt": "2026-06-13T23:45:00+01:00"
  }
]
```

## Contraintes pour le futur backend réel

- Pagination : cursor-based, défaut 20, max 100.
- Idempotence : `POST /tickets/orders/draft` et `POST /tickets/orders` exigent `Idempotency-Key`.
- Audit : création, payment, refund, check-in, revoke.
- QR : payload `{ orderRef, ticketSeq, eventId, exp }` signé HMAC, key rotation 90 jours.
- Stock : décrément atomique au draft, restauration à expiration ou refund.
- WebSocket : `event.availability.updated` envoyé après tout changement de stock.

## Open questions

- Tickets nominatifs (CIN visible sur QR) : V2.
- Revente entre utilisateurs : V2 ou V3.
- Print-at-home PDF vs Apple/Google Wallet : V1 = PDF + lien web, Wallet V2.
