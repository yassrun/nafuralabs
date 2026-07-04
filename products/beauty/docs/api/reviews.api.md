---
specVersion: 1
kind: api
appId: beauty
resource: reviews
status: draft
phase: P3
basePath: /api/v1/reviews
auth: optional
rateLimit: default
backendOwner: backend/domains/beauty/review
---

# reviews Mock API

## Vue d'ensemble

Avis et notes post-RDV. Un avis est attaché à un booking `COMPLETED`. Le salon peut répondre, modérer (masquer un avis injurieux après validation Nafura). Lecture publique pour la fiche salon.

## Modèle (vue logique)

| Champ | Type | Obligatoire | Notes |
|---|---|---|---|
| id | string (uuid) | oui | |
| bookingId | string (uuid) | oui | unique : un seul avis par booking |
| tenantId | string (uuid) | oui | |
| salonId | string (uuid) | oui | |
| customerId | string (uuid) | oui | |
| customerDisplay | object | oui | `{ firstName, lastInitial }` pour affichage public |
| serviceName | string | oui | snapshot |
| staffId | string (uuid) | non | facultatif côté UI |
| staffDisplayName | string | non | snapshot |
| rating | integer 1-5 | oui | |
| comment | string | non | max 500 chars |
| photos | string[] | non | URLs MinIO (V2) — V1 ignore |
| status | string enum | oui | `PUBLISHED` / `HIDDEN_PENDING_MODERATION` / `REMOVED` |
| salonResponse | object | non | `{ text, respondedAt, respondedBy }` |
| createdAt | datetime | oui | |
| updatedAt | datetime | oui | |

## Endpoints

### GET /api/v1/salons/:slug/reviews

- Auth : public.
- Query :
  | Param | Description |
  |---|---|
  | `minRating` | filtre minimum |
  | `withComment` | `true` n'affiche que ceux avec texte |
  | `sort` | `recent` (défaut) / `helpful` (V2) |
  | `pageSize`, `cursor` | pagination |
- Réponse 200 : `{ "items": [reviews (status=PUBLISHED uniquement)], "page": {...} }`.
- Erreurs : 404.

### POST /api/v1/reviews

- Auth : required.
- Rôles : CUSTOMER.
- Body :
  ```json
  {
    "bookingId": "00000000-0000-0000-4000-000000000002",
    "rating": 5,
    "comment": "Service impeccable, je recommande !"
  }
  ```
- Effet : crée l'avis si booking `COMPLETED` et pas déjà noté. Status par défaut `PUBLISHED`.
- Réponse 201.
- Erreurs : 409 (déjà noté), 422 (booking pas terminé), 403 (pas son booking).

### PATCH /api/v1/reviews/:reviewId

- Auth : required.
- Rôles : CUSTOMER (le sien) dans les 48h, sinon refus.
- Body partiel : `rating`, `comment`.
- Réponse 200.
- Erreurs : 409 (hors fenêtre).

### DELETE /api/v1/reviews/:reviewId

- Auth : required.
- Rôles : CUSTOMER (le sien, dans 48h).
- Effet : soft delete (status = `REMOVED`).
- Réponse 204.

### POST /api/v1/pro/reviews/:reviewId/respond

- Auth : required.
- Rôles : OWNER, ADMIN.
- Body : `{ "text": "Merci Sara, à très vite !" }`.
- Effet : ajoute / remplace `salonResponse`.
- Réponse 200.
- Erreurs : 422 (texte vide ou trop long, 500 chars max).

### POST /api/v1/pro/reviews/:reviewId/flag

- Auth : required.
- Rôles : OWNER, ADMIN.
- Body : `{ "reason": "abusive" | "spam" | "off_topic", "details": "..." }`.
- Effet : passe `status` à `HIDDEN_PENDING_MODERATION` côté public, escalade vers PLATFORM_ADMIN.
- Réponse 200.
- Erreurs : 409 (déjà flag).

### GET /api/v1/pro/reviews

- Auth : required.
- Rôles : OWNER, ADMIN.
- Query :
  | Param | Description |
  |---|---|
  | `status` | filtre |
  | `minRating`, `maxRating` | filtres |
  | `respondedOnly` | bool |
  | `pageSize`, `cursor` | pagination |
- Réponse 200 : `{ "items": [...], "page": {...}, "summary": { "average": 4.6, "count": 142, "distribution": {...} } }`.

### POST /api/v1/admin/reviews/:reviewId/decision

- Auth : required.
- Rôles : PLATFORM_ADMIN.
- Body : `{ "decision": "RESTORE" | "REMOVE", "notes": "..." }`.
- Effet : tranche un avis flagué.
- Réponse 200.

## Erreurs communes

| Code | Cas |
|---|---|
| 401, 403, 404, 423 | classiques |
| 409 | déjà noté, déjà flag, hors fenêtre 48h |
| 422 | validation (rating hors 1-5, comment > 500) |

## Fixtures

```json
[
  {
    "id": "rev-001",
    "bookingId": "00000000-0000-0000-4000-000000000002",
    "tenantId": "00000000-0000-0000-0000-000000000003",
    "salonId": "00000000-0000-0000-0000-000000000003",
    "customerId": "00000000-0000-0000-1000-000000000002",
    "customerDisplay": { "firstName": "Youssef", "lastInitial": "E." },
    "serviceName": "Coupe homme + barbe",
    "staffId": "staff-301",
    "staffDisplayName": "Hassan B.",
    "rating": 5,
    "comment": "Service impeccable, je recommande !",
    "status": "PUBLISHED",
    "salonResponse": {
      "text": "Merci Youssef, à très vite !",
      "respondedAt": "2026-06-09T10:00:00+01:00",
      "respondedBy": "owner@barberhouse.ma"
    },
    "createdAt": "2026-06-08T20:30:00+01:00",
    "updatedAt": "2026-06-09T10:00:00+01:00"
  },
  {
    "id": "rev-002",
    "bookingId": "00000000-0000-0000-4000-000000000010",
    "tenantId": "00000000-0000-0000-0000-000000000001",
    "salonId": "00000000-0000-0000-0000-000000000001",
    "customerId": "00000000-0000-0000-1000-000000000001",
    "customerDisplay": { "firstName": "Sara", "lastInitial": "B." },
    "serviceName": "Coupe femme + brushing",
    "staffId": "staff-001",
    "staffDisplayName": "Salma I.",
    "rating": 4,
    "comment": "Très bonne coupe, un peu d'attente à l'arrivée.",
    "status": "PUBLISHED",
    "createdAt": "2026-05-28T17:00:00+01:00",
    "updatedAt": "2026-05-28T17:00:00+01:00"
  },
  {
    "id": "rev-003",
    "bookingId": "00000000-0000-0000-4000-000000000011",
    "tenantId": "00000000-0000-0000-0000-000000000001",
    "salonId": "00000000-0000-0000-0000-000000000001",
    "customerId": "00000000-0000-0000-1000-000000000099",
    "customerDisplay": { "firstName": "Anonyme", "lastInitial": "" },
    "serviceName": "Coloration racines",
    "rating": 1,
    "comment": "Pas du tout pro, jamais plus.",
    "status": "HIDDEN_PENDING_MODERATION",
    "createdAt": "2026-06-01T19:00:00+01:00",
    "updatedAt": "2026-06-02T08:00:00+01:00"
  }
]
```

## Contraintes pour le futur backend réel

- Pagination : cursor-based.
- Tenant scope : `/pro/reviews*` scopé. Public reviews via `slug`.
- Idempotence : POST review accepte `Idempotency-Key`.
- Audit : création, modification, réponse, flag, décision admin tous audités.
- Anti-fraude : un avis sans booking COMPLETED associé est rejeté ; cooldown 24h entre une note basse et un nouvel avis du même client sur le même salon.
- Le score moyen salon (`salons.api.md`) est dérivé des reviews `PUBLISHED`.

## Open questions

- Photos dans les avis : V2.
- Réponse staff individuelle vs salon : V1 salon uniquement.
- Notation par staff vs par service : V1 = avis global du RDV (couvre service + staff). Disaggrégation V2.
