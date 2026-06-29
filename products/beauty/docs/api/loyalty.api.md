---
specVersion: 1
kind: api
appId: beauty
resource: loyalty
status: draft
phase: P3
basePath: /api/v1/loyalty
auth: required
rateLimit: default
backendOwner: backend/domains/beauty/loyalty
---

# loyalty Mock API

## Vue d'ensemble

Programme de fidélité simple V1 : chaque salon ayant activé la fidélité accorde X points par 10 MAD dépensés sur un booking `COMPLETED`. Les points sont par couple `(salon, customer)` (pas de pool global plateforme). Le salon configure son taux et ses paliers de récompense (libres, non débitables automatiquement V1).

## Modèle (vue logique)

### LoyaltyProgram (par salon)

| Champ | Type | Notes |
|---|---|---|
| salonId | string (uuid) | = tenantId |
| enabled | boolean | |
| pointsPerTenMad | number | défaut 1 (1 point / 10 MAD) |
| welcomePoints | integer | défaut 0, octroyés au premier booking honoré |
| tiers | object[] | paliers : `{ id, name, threshold, perkText }` |
| termsUrl | string | nullable, lien CGU programme |
| updatedAt | datetime | |

### CustomerLoyalty (par customer × salon)

| Champ | Type | Notes |
|---|---|---|
| salonId | string (uuid) | |
| customerId | string (uuid) | |
| points | integer | solde courant |
| lifetimePoints | integer | cumul historique |
| currentTier | object | nullable, palier actuel snapshot |
| nextTier | object | nullable, palier suivant + points manquants |
| history | object[] | dernières transactions |

### LoyaltyTransaction

| Champ | Type | Notes |
|---|---|---|
| id | string (uuid) | |
| salonId | string | |
| customerId | string | |
| bookingId | string | nullable (transaction manuelle) |
| type | enum | `EARN` / `MANUAL_ADD` / `MANUAL_REMOVE` / `EXPIRE` |
| points | integer | signé (positif EARN, négatif REMOVE) |
| reason | string | nullable |
| createdAt | datetime | |
| createdBy | string | userId |

## Endpoints

### GET /api/v1/me/loyalty

- Auth : required.
- Rôles : CUSTOMER.
- Query : `salonId` (optionnel) ; si absent, retourne tous les programmes auxquels le client participe.
- Réponse 200 :
  ```json
  {
    "items": [
      {
        "salonId": "00000000-0000-0000-0000-000000000001",
        "salonName": "Studio Hair Casablanca",
        "salonSlug": "studio-hair-casablanca",
        "points": 165,
        "lifetimePoints": 165,
        "currentTier": { "id": "silver", "name": "Silver", "threshold": 100, "perkText": "-10% sur le brushing" },
        "nextTier": { "id": "gold", "name": "Gold", "threshold": 300, "pointsToGo": 135, "perkText": "-15% global" }
      }
    ]
  }
  ```

### GET /api/v1/me/loyalty/:salonId/transactions

- Auth : required.
- Réponse 200 : liste paginée des transactions du client dans ce salon.

### GET /api/v1/pro/loyalty/program

- Auth : required.
- Rôles : OWNER, ADMIN.
- Headers : `X-Tenant-Id`.
- Réponse 200 : `LoyaltyProgram` du tenant.

### PATCH /api/v1/pro/loyalty/program

- Auth : required.
- Rôles : OWNER.
- Body partiel :
  ```json
  {
    "enabled": true,
    "pointsPerTenMad": 1,
    "welcomePoints": 50,
    "tiers": [
      { "id": "silver", "name": "Silver", "threshold": 100, "perkText": "-10% sur le brushing" },
      { "id": "gold", "name": "Gold", "threshold": 300, "perkText": "-15% global" }
    ],
    "termsUrl": "https://studiohair.ma/fidelite"
  }
  ```
- Réponse 200 : programme mis à jour.
- Effet : activation rétroactive ? V1 = non, points cumulés à partir de l'activation.

### GET /api/v1/pro/loyalty/customers

- Auth : required.
- Rôles : OWNER, ADMIN.
- Query :
  | Param | Description |
  |---|---|
  | `q` | recherche client |
  | `minPoints`, `maxPoints` | filtres |
  | `tierId` | filtre palier |
  | `pageSize`, `cursor` | pagination |
- Réponse 200 : `{ "items": [{ customer + points + tier }], "page": {...} }`.

### POST /api/v1/pro/loyalty/transactions

- Auth : required.
- Rôles : OWNER, ADMIN.
- Body :
  ```json
  {
    "customerId": "00000000-0000-0000-1000-000000000001",
    "points": 20,
    "type": "MANUAL_ADD",
    "reason": "Geste commercial"
  }
  ```
- Effet : ajoute / retire des points manuellement.
- Réponse 201 : transaction.
- Erreurs : 422 (point < 0 sur MANUAL_ADD, solde insuffisant sur MANUAL_REMOVE).

### GET /api/v1/pro/loyalty/transactions

- Auth : required.
- Query : `customerId`, `type`, `from`, `to`, `pageSize`, `cursor`.
- Réponse 200 : liste paginée.

## Erreurs communes

| Code | Cas |
|---|---|
| 401, 403, 404, 423 | classiques |
| 409 | programme désactivé (toute écriture refusée) |
| 422 | validation |

## Fixtures

### Programme tenant 1

```json
{
  "salonId": "00000000-0000-0000-0000-000000000001",
  "enabled": true,
  "pointsPerTenMad": 1,
  "welcomePoints": 50,
  "tiers": [
    { "id": "silver", "name": "Silver", "threshold": 100, "perkText": "-10% sur le brushing" },
    { "id": "gold", "name": "Gold", "threshold": 300, "perkText": "-15% global" },
    { "id": "platinum", "name": "Platinum", "threshold": 1000, "perkText": "1 brushing offert / mois" }
  ],
  "termsUrl": "https://studiohair.ma/fidelite",
  "updatedAt": "2026-05-01T10:00:00+01:00"
}
```

### Solde client × salon

```json
{
  "items": [
    {
      "salonId": "00000000-0000-0000-0000-000000000001",
      "salonName": "Studio Hair Casablanca",
      "salonSlug": "studio-hair-casablanca",
      "points": 165,
      "lifetimePoints": 215,
      "currentTier": { "id": "silver", "name": "Silver", "threshold": 100, "perkText": "-10% sur le brushing" },
      "nextTier": { "id": "gold", "name": "Gold", "threshold": 300, "pointsToGo": 135, "perkText": "-15% global" }
    },
    {
      "salonId": "00000000-0000-0000-0000-000000000003",
      "salonName": "Barber House Marrakech",
      "salonSlug": "barber-house-marrakech",
      "points": 12,
      "lifetimePoints": 12,
      "currentTier": null,
      "nextTier": { "id": "regular", "name": "Habitué", "threshold": 50, "pointsToGo": 38, "perkText": "5% sur la coupe" }
    }
  ]
}
```

### Transactions

```json
[
  {
    "id": "ltx-001",
    "salonId": "00000000-0000-0000-0000-000000000001",
    "customerId": "00000000-0000-0000-1000-000000000001",
    "bookingId": "00000000-0000-0000-4000-000000000010",
    "type": "EARN",
    "points": 25,
    "reason": "Booking COMPLETED 250 MAD",
    "createdAt": "2026-05-28T17:00:00+01:00",
    "createdBy": "system"
  },
  {
    "id": "ltx-002",
    "salonId": "00000000-0000-0000-0000-000000000001",
    "customerId": "00000000-0000-0000-1000-000000000001",
    "type": "MANUAL_ADD",
    "points": 20,
    "reason": "Geste commercial après attente",
    "createdAt": "2026-05-29T10:00:00+01:00",
    "createdBy": "00000000-0000-0000-3000-000000000001"
  }
]
```

## Contraintes pour le futur backend réel

- Tenant scope : `/pro/loyalty*` scopé. `/me/loyalty*` scopé au customer du JWT.
- Idempotence : POST transactions accepte `Idempotency-Key` (anti-double-crédit).
- Audit : toute transaction audited (qui, pourquoi, quand).
- Cumul : `EARN` calculé automatiquement quand `booking.status = COMPLETED` et `loyaltyEnabled = true`. Recalcul rétroactif sur changement de programme : non en V1.
- Expiration : V1 = pas d'expiration. V2 expiration N mois.

## Open questions

- Conversion automatique points → remise en caisse : V1 = non (manuelle par le pro, perk libellé seulement). V2 envisager.
- Multi-salon d'un même propriétaire : un seul programme partagé entre les salons du même tenant ? V1 = oui (1 tenant = 1 programme).
- Welcome points : appliqués au 1er booking ou à la création du compte client par le salon ? V1 = 1er booking COMPLETED.
