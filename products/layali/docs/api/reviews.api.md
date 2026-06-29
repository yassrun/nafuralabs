---
specVersion: 1
kind: api
appId: layali
resource: reviews
status: draft
phase: P3
basePath: /api/v1/reviews
auth: optional
rateLimit: default
backendOwner: backend/domains/layali/review
---

# reviews Mock API

## Vue d'ensemble

Avis post-soirée laissés par les clients sur un venue ou un event spécifique. Modération pro (cacher, répondre) et plateforme (suspension en cas d'abus).

## Modèle (vue logique)

| Champ | Type | Obligatoire | Notes |
|---|---|---|---|
| id | string (uuid) | oui | |
| tenantId | string | oui | |
| venueId | string (uuid) | oui | |
| eventId | string (uuid) | non | si avis sur un event particulier |
| customerId | string (uuid) | oui | |
| customerDisplayName | string | oui | snapshot |
| rating | int | oui | 1-5 |
| title | string | non | |
| body | string | oui | 10-1000 chars |
| visitDate | date | non | nullable, déduit du booking si lié |
| sourceBookingId | string | non | nullable |
| sourceTicketOrderId | string | non | nullable |
| status | string enum | oui | `PUBLISHED`, `HIDDEN_PENDING_MODERATION`, `REMOVED` |
| reply | object | non | `{ body, repliedByUserId, repliedAt }` |
| flags | object[] | non | `[{ userId, reason, flaggedAt }]` |
| createdAt | datetime | oui | |
| updatedAt | datetime | oui | |

## Endpoints

### GET /api/v1/reviews

- Auth : public.
- Query :
  | Param | Description |
  |---|---|
  | `venueSlug` ou `venueId` | requis (ou `eventSlug`/`eventId`) |
  | `minRating` | filtre |
  | `withReply` | bool |
  | `sort` | `recent` (défaut), `helpful`, `rating:desc`, `rating:asc` |
  | `cursor`, `size` | |
- Réponse 200 : `{ items, page, summary: { avg, count, distribution: { "5": 120, "4": 60, ... } } }`.
- Filtres `status=PUBLISHED` uniquement côté public.

### GET /api/v1/reviews/:id

- Auth : public.
- Réponse 200 : avis complet (sans flags côté public).

### POST /api/v1/reviews

- Auth : required.
- Rôles : CUSTOMER.
- Headers : `Idempotency-Key` recommandé.
- Body :
  ```json
  {
    "venueId": "00000000-0000-0000-0000-000000000010",
    "eventId": null,
    "rating": 5,
    "title": "Soirée mémorable",
    "body": "Service impeccable, ambiance au top.",
    "sourceBookingId": "00000000-0000-0000-4000-000000000001"
  }
  ```
- Pré-conditions : avoir un booking `ARRIVED` ou un ticket `CHECKED_IN` pour ce venue/event, dans les 30 jours.
- Réponse 201 : review en `PUBLISHED` (sauf détection automatique de contenu → `HIDDEN_PENDING_MODERATION`).
- Erreurs : 403 `no_visit_proof`, 409 `review_already_exists`, 422.

### PATCH /api/v1/reviews/:id

- Auth : required.
- Rôles : auteur (dans les 7 jours).
- Body partiel : `rating`, `title`, `body`.
- Réponse 200.

### DELETE /api/v1/reviews/:id

- Auth : required.
- Rôles : auteur (jusqu'à H+24), ou PLATFORM_ADMIN.
- Effet : `status=REMOVED`, conservé pour audit.
- Réponse 204.

### POST /api/v1/reviews/:id/reply

- Auth : required.
- Rôles : OWNER, ADMIN.
- Headers : `X-Tenant-Id` (doit correspondre au tenant de l'avis).
- Body : `{ "body": "Merci Sara, à bientôt !" }`.
- Réponse 201 : review avec `reply` rempli.
- Erreurs : 409 (déjà répondu).

### PATCH /api/v1/reviews/:id/reply

- Auth : required.
- Rôles : OWNER, ADMIN.
- Body : `{ "body": "..." }`.
- Réponse 200.

### POST /api/v1/reviews/:id/flag

- Auth : required.
- Body : `{ "reason": "OFFENSIVE" | "SPAM" | "FAKE" | "OTHER", "message": "..." }`.
- Effet : ajoute un flag ; si seuil dépassé (3 flags uniques), passe en `HIDDEN_PENDING_MODERATION`.
- Réponse 204.

### POST /api/v1/reviews/:id/moderate

- Auth : required.
- Rôles : PLATFORM_ADMIN.
- Body : `{ "decision": "PUBLISH" | "REMOVE", "note": "..." }`.
- Réponse 200.

## Erreurs communes

| Code | Cas |
|---|---|
| 401, 403, 404, 422 | classiques |
| 403 | `no_visit_proof` |
| 409 | `review_already_exists`, `reply_already_exists` |

## Fixtures

```json
[
  {
    "id": "00000000-0000-0000-9100-000000000001",
    "tenantId": "sky31-casablanca",
    "venueId": "00000000-0000-0000-0000-000000000010",
    "eventId": null,
    "customerId": "00000000-0000-0000-1000-000000000001",
    "customerDisplayName": "Sara B.",
    "rating": 5,
    "title": "Soirée mémorable",
    "body": "Service impeccable, vue magique, je recommande.",
    "visitDate": "2026-02-14",
    "sourceBookingId": "00000000-0000-0000-4000-000000000001",
    "status": "PUBLISHED",
    "reply": {
      "body": "Merci Sara, à très vite !",
      "repliedByUserId": "00000000-0000-0000-2000-000000000001",
      "repliedAt": "2026-02-16T11:00:00+01:00"
    },
    "createdAt": "2026-02-15T09:00:00+01:00",
    "updatedAt": "2026-02-16T11:00:00+01:00"
  },
  {
    "id": "00000000-0000-0000-9100-000000000002",
    "tenantId": "theatro-marrakech",
    "venueId": "00000000-0000-0000-0000-000000000011",
    "eventId": "00000000-0000-0000-0000-000000000021",
    "customerId": "00000000-0000-0000-1000-000000000002",
    "customerDisplayName": "Youssef E.",
    "rating": 4,
    "title": "Bonne soirée mais file d'attente",
    "body": "Excellent DJ. La file à l'entrée était longue, prévoir d'arriver tôt.",
    "visitDate": "2026-06-13",
    "sourceTicketOrderId": "00000000-0000-0000-6000-000000000002",
    "status": "PUBLISHED",
    "createdAt": "2026-06-14T11:00:00+01:00",
    "updatedAt": "2026-06-14T11:00:00+01:00"
  }
]
```

## Contraintes pour le futur backend réel

- Anti-spam : limite 1 review / (venue|event) / customer.
- Détection auto : pattern simple (mots interdits, longueur, fréquence) ; passage par modération humaine en cas de score haut.
- Audit : création, edit, reply, flag, moderation.
- Notification : push notification au venue pour nouvel avis (V2), email V1.
- Cache : `GET /reviews?venueSlug=...` cacheable 60s côté CDN.

## Open questions

- Photos jointes à l'avis : V2.
- Réponse pro publique vs privée : V1 = publique uniquement.
- Vérification "visite réelle" obligatoire ou facultative : V1 = obligatoire (`sourceBookingId` ou `sourceTicketOrderId`).
