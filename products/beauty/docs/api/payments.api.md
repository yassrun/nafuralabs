---
specVersion: 1
kind: api
appId: beauty
resource: payments
status: stable
basePath: /api/v1/payments
auth: required
rateLimit: default
backendOwner: backend/domains/beauty/payment
---

# payments Mock API

## Vue d'ensemble

Gère les paiements liés aux bookings : initiation (online CMI/Stripe ou cash sur place), callbacks providers, remboursements, encaissement cash côté pro. S'appuie sur l'abstraction `:platform:integrations:payment`.

## Modèle (vue logique)

| Champ | Type | Obligatoire | Notes |
|---|---|---|---|
| id | string (uuid) | oui | |
| bookingId | string (uuid) | oui | |
| tenantId | string (uuid) | oui | |
| customerId | string (uuid) | oui | |
| provider | string enum | oui | `CMI` / `STRIPE` / `CASH` |
| status | string enum | oui | `INITIATED` / `REDIRECTED` / `SUCCEEDED` / `FAILED` / `REFUNDED` / `PARTIAL_REFUND` / `CANCELLED` |
| amountMinor | integer | oui | en centimes MAD |
| currency | string | oui | `MAD` |
| providerRef | string | non | référence externe CMI / Stripe |
| redirectUrl | string | non | présent quand `provider != CASH` et `status=INITIATED` ou `REDIRECTED` |
| failureReason | string | non | si `FAILED` |
| refundedAmountMinor | integer | non | cumul remboursé |
| capturedAt | datetime | non | quand `SUCCEEDED` ou `PAID_CASH` validé |
| refundedAt | datetime | non | |
| createdAt | datetime | oui | |
| updatedAt | datetime | oui | |

### Transitions

- `INITIATED` → `REDIRECTED` (URL provider obtenue) → `SUCCEEDED` | `FAILED` | `CANCELLED`.
- `SUCCEEDED` → `PARTIAL_REFUND` | `REFUNDED`.
- `CASH` : init = `INITIATED` → `SUCCEEDED` à l'encaissement pro.

## Endpoints

### POST /api/v1/payments

> Note : appelé en interne par `POST /api/v1/bookings` si `paymentMode != NONE_CASH_ON_SITE`. Endpoint séparé exposé pour re-tenter un paiement échoué.

- Auth : required.
- Rôles : CUSTOMER (paiement client).
- Headers : `Idempotency-Key` requis.
- Body :
  ```json
  {
    "bookingId": "00000000-0000-0000-4000-000000000003",
    "provider": "CMI",
    "returnUrl": "https://beauty.nafura.ma/booking/00000000-0000-0000-4000-000000000003/confirm",
    "cancelUrl": "https://beauty.nafura.ma/booking/00000000-0000-0000-4000-000000000003/payment?cancelled=1"
  }
  ```
- Effet : crée un paiement, demande au provider une URL de redirection.
- Réponse 201 :
  ```json
  {
    "id": "00000000-0000-0000-5000-000000000003",
    "bookingId": "00000000-0000-0000-4000-000000000003",
    "provider": "CMI",
    "status": "REDIRECTED",
    "amountMinor": 8000,
    "currency": "MAD",
    "redirectUrl": "https://mock.cmi/pay/00000000-0000-0000-5000-000000000003"
  }
  ```
- Erreurs : 409 (booking déjà payé), 422.

### GET /api/v1/payments/:paymentId

- Auth : required.
- Visibilité : CUSTOMER (le sien), OWNER/ADMIN (du tenant).
- Réponse 200.

### POST /api/v1/payments/:paymentId/callbacks/cmi

- Auth : signature CMI (header `X-Cmi-Signature`).
- Body : payload CMI (mock simplifié) `{ "status": "SUCCESS"|"FAILED", "providerRef": "CMI-XXXX" }`.
- Effet : met à jour le payment ; si `SUCCESS`, déclenche transition booking `PENDING_PAYMENT → CONFIRMED`.
- Réponse 200 : `{ "ok": true }`.
- Erreurs : 400 (signature invalide), 404.

### POST /api/v1/payments/:paymentId/callbacks/stripe

- Mêmes principes que CMI, signature `Stripe-Signature`, payload mock `{ "type": "payment_intent.succeeded" | "payment_intent.payment_failed", "data": { "providerRef": "pi_xxx" } }`.

### POST /api/v1/pro/payments/:paymentId/cash-confirm

- Auth : required.
- Rôles : OWNER, ADMIN, STAFF (uniquement ses bookings).
- Effet : marque un paiement `CASH` comme `SUCCEEDED`. Utilisé quand le client paie en caisse.
- Réponse 200.
- Erreurs : 409 (déjà `SUCCEEDED` ou `REFUNDED`).

### POST /api/v1/pro/payments/:paymentId/refund

- Auth : required.
- Rôles : OWNER, ADMIN.
- Body : `{ "amountMinor": 8000, "reason": "annulation tardive" }`.
- Effet : si online, demande remboursement au provider. Si cash, marque comptablement remboursé (la mécanique cash est manuelle).
- Réponse 200 : payment mis à jour.
- Erreurs : 409 (déjà remboursé / status incompatible), 422 (montant > capturé).

### GET /api/v1/pro/payments

- Auth : required.
- Rôles : OWNER, ADMIN.
- Query : `from`, `to`, `provider`, `status`, `pageSize`, `cursor`.
- Réponse 200 : `{ "items": [...], "page": {...}, "totals": { "succeededMinor": 123000, "refundedMinor": 5000 } }`.

## Erreurs communes

| Code | Cas |
|---|---|
| 401, 403, 404 | classiques |
| 409 | déjà payé / remboursé / status incompatible |
| 422 | montant invalide |
| 502 | erreur provider (CMI/Stripe injoignable) |

## Fixtures

```json
[
  {
    "id": "00000000-0000-0000-5000-000000000001",
    "bookingId": "00000000-0000-0000-4000-000000000001",
    "tenantId": "00000000-0000-0000-0000-000000000001",
    "customerId": "00000000-0000-0000-1000-000000000001",
    "provider": "CMI",
    "status": "SUCCEEDED",
    "amountMinor": 25000,
    "currency": "MAD",
    "providerRef": "CMI-2026-06-05-ABCD",
    "capturedAt": "2026-06-05T15:31:30+01:00",
    "createdAt": "2026-06-05T15:30:10+01:00",
    "updatedAt": "2026-06-05T15:31:30+01:00"
  },
  {
    "id": "00000000-0000-0000-5000-000000000002",
    "bookingId": "00000000-0000-0000-4000-000000000002",
    "tenantId": "00000000-0000-0000-0000-000000000003",
    "customerId": "00000000-0000-0000-1000-000000000002",
    "provider": "CASH",
    "status": "SUCCEEDED",
    "amountMinor": 12000,
    "currency": "MAD",
    "capturedAt": "2026-06-08T19:50:00+01:00",
    "createdAt": "2026-06-08T19:00:00+01:00",
    "updatedAt": "2026-06-08T19:50:00+01:00"
  },
  {
    "id": "00000000-0000-0000-5000-000000000003",
    "bookingId": "00000000-0000-0000-4000-000000000003",
    "tenantId": "00000000-0000-0000-0000-000000000001",
    "customerId": "00000000-0000-0000-1000-000000000001",
    "provider": "CMI",
    "status": "REDIRECTED",
    "amountMinor": 8000,
    "currency": "MAD",
    "redirectUrl": "https://mock.cmi/pay/00000000-0000-0000-5000-000000000003",
    "createdAt": "2026-06-08T11:00:10+01:00",
    "updatedAt": "2026-06-08T11:00:10+01:00"
  }
]
```

## Contraintes pour le futur backend réel

- Tenant scope : `/pro/payments*` scopé. Callbacks providers signés, pas de tenant header (ils sont publics, sécurisés par signature).
- Idempotence : `POST /payments` exige `Idempotency-Key` (anti-double-débit). Callbacks dédupliqués par `providerRef`.
- Audit : toute mutation (INITIATED, transitions, refund) auditée. Stockage chiffré du `providerRef` recommandé.
- Provider abstraction : `:platform:integrations:payment` expose `initiate(...)`, `refund(...)`, `verifyCallback(...)` par adapter.
- CASH : pas d'appel provider, juste comptable. Marquage `SUCCEEDED` par le pro à l'encaissement.

## Open questions

- Capture vs autorisation CMI : V1 = capture immédiate. Cas d'usage "no-show fee" (auto-capture après no-show sur acompte) repoussé V2.
- Remboursement partiel CMI : supporté par CMI ? À vérifier avec finance. Sinon fallback = remboursement total + nouvelle facturation manuelle.
- Pourboire (tip) : V2.
