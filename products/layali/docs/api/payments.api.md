---
specVersion: 1
kind: api
appId: layali
resource: payments
status: draft
phase: P3
basePath: /api/v1/payments
auth: required
rateLimit: default
backendOwner: backend/domains/layali/payment
---

# payments Mock API

## Vue d'ensemble

Orchestration des paiements via `:platform:integrations:payment` (adapters CMI par défaut, Stripe en fallback). Initiation depuis un draft booking/ticket, redirection 3DS, callback signé, refunds.

## Modèle (vue logique)

| Champ | Type | Obligatoire | Notes |
|---|---|---|---|
| id | string (uuid) | oui | |
| reference | string | oui | `PAY-A4F8` |
| tenantId | string | oui | venue tenant |
| target | object | oui | `{ kind: "BOOKING"|"TICKET_ORDER", id, reference }` |
| customerId | string (uuid) | oui | |
| provider | string enum | oui | `CMI`, `STRIPE` |
| amountMinor | int | oui | |
| currency | string | oui | `MAD` |
| status | string enum | oui | `PENDING`, `AUTHORIZED`, `CAPTURED`, `FAILED`, `CANCELLED`, `REFUNDED`, `PARTIAL_REFUNDED` |
| failureReason | string | non | code provider |
| redirectUrl | string | non | URL 3DS / page provider |
| receiptUrl | string | non | URL téléchargeable post-paiement |
| refunds | object[] | non | `[{ amountMinor, reason, refundedAt, providerRefundId }]` |
| createdAt | datetime | oui | |
| updatedAt | datetime | oui | |

## Endpoints

### POST /api/v1/payments/initiate

- Auth : required.
- Headers : `Idempotency-Key` requis.
- Body :
  ```json
  {
    "target": { "kind": "BOOKING", "draftId": "00000000-0000-0000-4000-000000000010" },
    "provider": "CMI",
    "returnUrl": "https://layali.ma/venues/sky31-casablanca/book/confirm",
    "cancelUrl": "https://layali.ma/venues/sky31-casablanca/book/payment"
  }
  ```
  `target.kind` ∈ `BOOKING`, `TICKET_ORDER`. Le serveur valide la cohérence avec le draft.
- Réponse 201 :
  ```json
  {
    "paymentId": "00000000-0000-0000-5000-000000000001",
    "reference": "PAY-A4F8",
    "redirectUrl": "https://mock.cmi/pay/PAY-A4F8",
    "amountMinor": 150000,
    "currency": "MAD",
    "expiresAt": "2026-02-14T20:15:00+01:00"
  }
  ```
- Erreurs : 422 (draft invalide / expiré), 503 `unavailable` (provider down), 409 (draft déjà payé).

### GET /api/v1/payments/:paymentId

- Auth : required.
- Visibilité : propriétaire (customer) ou pro du tenant.
- Réponse 200 : payment complet.
- Erreurs : 401, 403, 404.

### POST /api/v1/payments/:paymentId/cancel

- Auth : required.
- Effet : annule un `PENDING` (utilisateur a quitté la page 3DS).
- Réponse 200.
- Erreurs : 409 (déjà capturé).

### POST /api/v1/payments/:paymentId/refund

- Auth : required.
- Rôles : OWNER, ADMIN, PLATFORM_ADMIN.
- Body : `{ "amountMinor": 100000, "reason": "Annulation event" }`.
- Effet : full ou partial refund via provider, met à jour `status` (`REFUNDED` ou `PARTIAL_REFUNDED`).
- Réponse 202 (refund async côté provider).
- Erreurs : 409 (statut incompatible), 422 (montant > restant).

### GET /api/v1/payments/summary

- Auth : required.
- Rôles : OWNER, ADMIN.
- Headers : `X-Tenant-Id`.
- Query : `from`, `to` (défaut 7 derniers jours).
- Réponse 200 :
  ```json
  {
    "from": "2026-06-02T00:00:00+01:00",
    "to": "2026-06-09T00:00:00+01:00",
    "currency": "MAD",
    "totals": {
      "capturedMinor": 1840000,
      "refundedMinor": 60000,
      "netMinor": 1780000,
      "countSuccess": 47,
      "countFailed": 5
    },
    "byDay": [
      { "date": "2026-06-08", "capturedMinor": 320000, "countSuccess": 8 }
    ],
    "byProvider": [
      { "provider": "CMI", "capturedMinor": 1500000 },
      { "provider": "STRIPE", "capturedMinor": 280000 }
    ]
  }
  ```

### POST /api/v1/payments/webhook/cmi

- Auth : signature HMAC dans `X-Signature` (clé partagée provider).
- Body : payload signé du provider CMI.
- Effet : met à jour le payment, déclenche les transitions sur booking/ticket (`CONFIRMED`).
- Réponse 200 : `{ "received": true }`.
- Idempotence : `eventId` du provider stocké pour dédup.

### POST /api/v1/payments/webhook/stripe

- Idem CMI mais format Stripe (`Stripe-Signature`).

## Erreurs communes

| Code | Cas |
|---|---|
| 401, 403, 404, 422 | classiques |
| 409 | `payment_already_captured`, `draft_already_paid` |
| 503 | `unavailable` (provider down) |

## Fixtures

```json
[
  {
    "id": "00000000-0000-0000-5000-000000000001",
    "reference": "PAY-A4F8",
    "tenantId": "sky31-casablanca",
    "target": { "kind": "BOOKING", "id": "00000000-0000-0000-4000-000000000001", "reference": "BKG-A4F8" },
    "customerId": "00000000-0000-0000-1000-000000000001",
    "provider": "CMI",
    "amountMinor": 150000,
    "currency": "MAD",
    "status": "CAPTURED",
    "redirectUrl": null,
    "receiptUrl": "https://media.layali.ma/receipts/PAY-A4F8.pdf",
    "refunds": [],
    "createdAt": "2026-01-20T15:00:00+01:00",
    "updatedAt": "2026-01-20T15:05:00+01:00"
  },
  {
    "id": "00000000-0000-0000-5000-000000000010",
    "reference": "PAY-Z9P3",
    "tenantId": "sky31-casablanca",
    "target": { "kind": "TICKET_ORDER", "id": "00000000-0000-0000-6000-000000000001", "reference": "TKT-Z9P3" },
    "customerId": "00000000-0000-0000-1000-000000000001",
    "provider": "STRIPE",
    "amountMinor": 60000,
    "currency": "MAD",
    "status": "CAPTURED",
    "receiptUrl": "https://media.layali.ma/receipts/PAY-Z9P3.pdf",
    "refunds": [],
    "createdAt": "2026-01-22T12:00:00+01:00",
    "updatedAt": "2026-01-22T12:05:00+01:00"
  },
  {
    "id": "00000000-0000-0000-5000-000000000003",
    "reference": "PAY-C1Q9",
    "tenantId": "sky31-casablanca",
    "target": { "kind": "BOOKING", "id": "00000000-0000-0000-4000-000000000003", "reference": "BKG-C1Q9" },
    "customerId": "00000000-0000-0000-1000-000000000001",
    "provider": "CMI",
    "amountMinor": 50000,
    "currency": "MAD",
    "status": "PENDING",
    "redirectUrl": "https://mock.cmi/pay/PAY-C1Q9",
    "createdAt": "2026-06-09T16:00:00+01:00",
    "updatedAt": "2026-06-09T16:00:00+01:00"
  }
]
```

## Contraintes pour le futur backend réel

- Aucune carte stockée côté Layali : tokenisation provider uniquement.
- Idempotence : `POST /payments/initiate` exige `Idempotency-Key` (24h).
- Webhook : signature HMAC SHA256 vérifiée systématiquement, retry exponentiel côté provider.
- Audit : toute initiation, capture, refund, échec.
- Reconciliation : job nightly compare payments `PENDING > 1h` et purge / marque `FAILED`.
- Receipts : générés via service templating + stockés MinIO `layali-receipts`.

## Open questions

- Capture immédiate vs autorisation différée : V1 = capture immédiate au callback.
- Split payment (acompte + balance jour J) : V2.
- Garantie de paiement table sans débit (`AUTHORIZED` longue durée) : V2.
