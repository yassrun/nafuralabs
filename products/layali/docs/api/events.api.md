---
specVersion: 1
kind: api
appId: layali
resource: events
status: review
basePath: /api/v1/events
auth: optional
rateLimit: default
backendOwner: backend/domains/layali/event
---

# events Mock API

## Vue d'ensemble

Événements organisés par un venue : soirée régulière ou soirée spéciale. Cycle de vie `DRAFT → PUBLISHED → CLOSED|CANCELLED`. Un event peut porter plusieurs modes d'accès en parallèle : billetterie, table, guest list, comptoir, ou règles hybrides.

## Modèle (vue logique)

| Champ | Type | Obligatoire | Notes |
|---|---|---|---|
| id | string (uuid) | oui | |
| tenantId | string | oui | venue tenant |
| venueId | string (uuid) | oui | |
| venueSlug | string | oui | dénormalisé pour la lecture |
| slug | string | oui | unique global, kebab-case |
| title | string | oui | |
| subtitle | string | non | |
| description | string | non | markdown light |
| categories | string[] | non | `CLUB_NIGHT`, `CONCERT`, `FESTIVAL`, `PRIVATE`, `THEME` |
| poster | object | non | `{ url, width, height }` photo principale |
| gallery | object[] | non | photos supplémentaires |
| startAt | datetime | oui | début, ISO 8601 |
| endAt | datetime | oui | fin |
| doorsAt | datetime | non | ouverture des portes |
| specialNight | boolean | oui | si l'event surcharge les règles d'accès habituelles du lieu |
| accessModes | string[] | oui | `TICKET`, `TABLE`, `GUEST_LIST`, `COUNTER`, `HYBRID` |
| ticketing | object | non | `{ enabled, categories: TicketCategory[] }` |
| tables | object | non | `{ enabled, depositMinor, currency, minSpendMinor }` |
| guestList | object | non | `{ enabled, approvalMode, qrEnabled, groupSizeMax }` |
| counter | object | non | `{ enabled, approvalMode, minSpendMinor?, depositMinor?, currency? }` |
| entryPolicy | object | non | `{ ticketRequired, checkInMode, fallbackLookup, arrivalCutoffAt? }` |
| capacity | integer | non | jauge (peut différer de venue.capacity) |
| status | string enum | oui | `DRAFT`, `PUBLISHED`, `CLOSED`, `CANCELLED` |
| publishedAt | datetime | non | |
| dressCode | string | non | override venue |
| ageMin | integer | non | override venue |
| seoMeta | object | non | `{ title, description, ogImageUrl }` |
| trending | object | non | `{ score, rank }` calculé |
| createdAt | datetime | oui | |
| updatedAt | datetime | oui | |

### TicketCategory

```json
{
  "code": "STD",
  "label": "Standard",
  "priceMinor": 25000,
  "currency": "MAD",
  "quota": 200,
  "remaining": 142,
  "soldOut": false,
  "perOrderMax": 6
}
```

## Endpoints

### GET /api/v1/events

- Auth : public.
- Query :
  | Param | Type | Description |
  |---|---|---|
  | `city` | string | filtre via venue.city |
  | `from`, `to` | date | fenêtre (défaut from=today, to=+30j) |
  | `category` | csv | |
  | `mood` | csv | filtre venue.moods |
  | `accessMode` | csv | filtre mode d'accès (`ticket,table,guest_list,counter,hybrid`) |
  | `priceMax` | int (MAD) | filtre billet le moins cher |
  | `venueSlug` | string | events d'un venue particulier |
  | `sort` | string | `startAt:asc` (défaut), `trending:desc`, `priceAsc` |
  | `cursor`, `size` | | pagination |
- Réponse 200 : `{ items, page }`. Items contiennent résumé : `id, slug, title, venueSlug, venueName, poster, startAt, endAt, categories, lowestPriceMinor, specialNight, accessModes, status`.

### GET /api/v1/events/:slug

- Auth : public.
- Réponse 200 : event complet. Si `status != PUBLISHED`, 404 sauf pro du tenant.
- Erreurs : 404.

### GET /api/v1/events/:id

- Auth : required (pro).
- Rôles : OWNER, ADMIN.
- Headers : `X-Tenant-Id`.
- Renvoie l'event y compris en `DRAFT`.

### POST /api/v1/events

- Auth : required.
- Rôles : OWNER, ADMIN.
- Headers : `X-Tenant-Id`, `Idempotency-Key`.
- Body :
  ```json
  {
    "title": "Saint-Valentin Rooftop",
    "startAt": "2026-02-14T20:00:00+01:00",
    "endAt": "2026-02-15T04:00:00+01:00",
    "doorsAt": "2026-02-14T19:30:00+01:00",
    "specialNight": true,
    "accessModes": ["TICKET", "TABLE", "GUEST_LIST"],
    "categories": ["THEME"],
    "capacity": 300,
    "ticketing": {
      "enabled": true,
      "categories": [
        { "code": "STD", "label": "Standard", "priceMinor": 30000, "currency": "MAD", "quota": 250, "perOrderMax": 6 },
        { "code": "VIP", "label": "VIP", "priceMinor": 60000, "currency": "MAD", "quota": 50, "perOrderMax": 4 }
      ]
    },
    "tables": { "enabled": true, "depositMinor": 100000, "minSpendMinor": 200000, "currency": "MAD" },
    "guestList": { "enabled": true, "approvalMode": "MANUAL", "qrEnabled": true, "groupSizeMax": 8 },
    "counter": { "enabled": false, "approvalMode": "MANUAL" },
    "entryPolicy": { "ticketRequired": false, "checkInMode": "QR_OR_LOOKUP", "fallbackLookup": true }
  }
  ```
- Réponse 201 : event créé en `DRAFT`.
- Erreurs : 422.

### PATCH /api/v1/events/:id

- Auth : required.
- Rôles : OWNER, ADMIN.
- Body partiel. Si `status=PUBLISHED`, les champs `startAt`/`endAt` ne peuvent être modifiés qu'en avance horaire de moins de 4h. Au-delà, il faut `CANCELLED` + nouvel event.
- Réponse 200.
- Erreurs : 409 `event_published_lock`, 422.

### POST /api/v1/events/:id/publish

- Auth : required.
- Rôles : OWNER, ADMIN.
- Body vide. Bascule `DRAFT → PUBLISHED`. Pré-conditions : `poster` présent, `startAt > now`, au moins un canal (`ticketing.enabled`, `tables.enabled`, `guestList.enabled` ou `counter.enabled`).
- Émet message WebSocket `event.published` sur `/topic/venue/{venueId}/events`.
- Réponse 200 : event publié.
- Erreurs : 422.

### POST /api/v1/events/:id/close

- Auth : required.
- Body vide. Bascule `PUBLISHED → CLOSED` (ventes arrêtées, restent visibles publiquement).
- Émet `event.closed`.
- Réponse 200.

### POST /api/v1/events/:id/cancel

- Auth : required.
- Rôles : OWNER (ADMIN demande validation).
- Body : `{ "reason": "Annulation force majeure" }`.
- Effet : `CANCELLED` + déclenche refunds via `:platform:integrations:payment` (mode auto si CMI, manuel sinon — voir [payments.api.md](payments.api.md)).
- Réponse 202 (refunds en cours).

### GET /api/v1/events/:slug/availability

- Auth : public.
- Réponse 200 :
  ```json
  {
    "eventId": "00000000-0000-0000-0000-000000000020",
    "categories": [
      { "code": "STD", "remaining": 142, "soldOut": false },
      { "code": "VIP", "remaining": 4, "soldOut": false }
    ],
    "tablesRemaining": 7
  }
  ```
- Mise à jour temps réel via topic `/topic/event/{eventId}/availability`.

## Erreurs communes

| Code | Cas |
|---|---|
| 401, 403, 404, 422, 423 | classiques |
| 409 | `event_sold_out`, `event_published_lock`, `event_already_cancelled` |

## Fixtures

```json
[
  {
    "id": "00000000-0000-0000-0000-000000000020",
    "tenantId": "sky31-casablanca",
    "venueId": "00000000-0000-0000-0000-000000000010",
    "venueSlug": "sky31-casablanca",
    "slug": "sky31-saint-valentin-2026",
    "title": "Saint-Valentin Rooftop",
    "subtitle": "Dîner + DJ international",
    "description": "Une nuit chic pour les amoureux.",
    "categories": ["THEME"],
    "poster": { "url": "https://media.layali.ma/e/sky31-stval.jpg", "width": 1200, "height": 1600 },
    "startAt": "2026-02-14T20:00:00+01:00",
    "endAt": "2026-02-15T04:00:00+01:00",
    "doorsAt": "2026-02-14T19:30:00+01:00",
    "specialNight": true,
    "accessModes": ["TICKET", "TABLE", "GUEST_LIST"],
    "ticketing": {
      "enabled": true,
      "categories": [
        { "code": "STD", "label": "Standard", "priceMinor": 30000, "currency": "MAD", "quota": 250, "remaining": 142, "soldOut": false, "perOrderMax": 6 },
        { "code": "VIP", "label": "VIP", "priceMinor": 60000, "currency": "MAD", "quota": 50, "remaining": 4, "soldOut": false, "perOrderMax": 4 }
      ]
    },
    "tables": { "enabled": true, "depositMinor": 100000, "minSpendMinor": 200000, "currency": "MAD" },
    "guestList": { "enabled": true, "approvalMode": "MANUAL", "qrEnabled": true, "groupSizeMax": 8 },
    "counter": { "enabled": false, "approvalMode": "MANUAL" },
    "entryPolicy": { "ticketRequired": false, "checkInMode": "QR_OR_LOOKUP", "fallbackLookup": true },
    "capacity": 300,
    "dressCode": "SMART",
    "ageMin": 21,
    "status": "PUBLISHED",
    "publishedAt": "2026-01-10T12:00:00+01:00",
    "trending": { "score": 92, "rank": 1 },
    "createdAt": "2026-01-05T10:00:00+01:00",
    "updatedAt": "2026-06-08T20:00:00+01:00"
  },
  {
    "id": "00000000-0000-0000-0000-000000000021",
    "tenantId": "theatro-marrakech",
    "venueId": "00000000-0000-0000-0000-000000000011",
    "venueSlug": "theatro-marrakech",
    "slug": "theatro-summer-rave-2026",
    "title": "Summer Rave Theatro",
    "categories": ["CLUB_NIGHT"],
    "poster": { "url": "https://media.layali.ma/e/theatro-rave.jpg", "width": 1200, "height": 1600 },
    "startAt": "2026-06-13T23:00:00+01:00",
    "endAt": "2026-06-14T05:00:00+01:00",
    "specialNight": true,
    "accessModes": ["TICKET", "TABLE", "COUNTER", "HYBRID"],
    "ticketing": {
      "enabled": true,
      "categories": [
        { "code": "STD", "label": "Standard", "priceMinor": 20000, "currency": "MAD", "quota": 500, "remaining": 0, "soldOut": true, "perOrderMax": 6 }
      ]
    },
    "tables": { "enabled": true, "depositMinor": 200000, "minSpendMinor": 500000, "currency": "MAD" },
    "guestList": { "enabled": false, "approvalMode": "MANUAL", "qrEnabled": true, "groupSizeMax": 0 },
    "counter": { "enabled": true, "approvalMode": "AUTO", "minSpendMinor": 120000, "depositMinor": 0, "currency": "MAD" },
    "entryPolicy": { "ticketRequired": true, "checkInMode": "QR_OR_LOOKUP", "fallbackLookup": true },
    "capacity": 800,
    "status": "PUBLISHED",
    "publishedAt": "2026-05-01T12:00:00+01:00",
    "createdAt": "2026-04-25T10:00:00+01:00",
    "updatedAt": "2026-06-12T22:00:00+01:00"
  },
  {
    "id": "00000000-0000-0000-0000-000000000022",
    "tenantId": "nikki-beach-marrakech",
    "venueId": "00000000-0000-0000-0000-000000000012",
    "venueSlug": "nikki-beach-marrakech",
    "slug": "nikki-pool-day-15",
    "title": "Pool Day Sunset",
    "categories": ["THEME"],
    "poster": { "url": "https://media.layali.ma/e/nikki-pool.jpg", "width": 1200, "height": 1600 },
    "startAt": "2025-08-15T14:00:00+01:00",
    "endAt": "2025-08-15T23:00:00+01:00",
    "specialNight": false,
    "accessModes": ["TABLE", "COUNTER"],
    "ticketing": { "enabled": false, "categories": [] },
    "tables": { "enabled": true, "depositMinor": 150000, "minSpendMinor": 300000, "currency": "MAD" },
    "guestList": { "enabled": false, "approvalMode": "MANUAL", "qrEnabled": false, "groupSizeMax": 0 },
    "counter": { "enabled": true, "approvalMode": "MANUAL", "minSpendMinor": 100000, "depositMinor": 50000, "currency": "MAD" },
    "entryPolicy": { "ticketRequired": false, "checkInMode": "LOOKUP_ONLY", "fallbackLookup": true },
    "capacity": 400,
    "status": "CLOSED",
    "createdAt": "2025-07-01T10:00:00+01:00",
    "updatedAt": "2025-08-16T08:00:00+01:00"
  }
]
```

## Contraintes pour le futur backend réel

- Trending : score recalculé toutes les 15 min sur fenêtre 7 jours (vues, bookings, tickets vendus).
- Tenant scope : mutation toujours `X-Tenant-Id`.
- Audit : toute transition de statut, publish, cancel.
- Cohérence : `endAt > startAt`, `doorsAt < startAt + 1h`.
- WebSocket : `event.published`, `event.closed`, `event.cancelled` envoyés sur `/topic/venue/{venueId}/events` et `/topic/event/{eventId}/availability` pour les changements de stock.
- Discovery CTA : `GET /events/:slug` doit permettre au front de calculer la pile de CTA sans logique métier cachée côté UI.

## Open questions

- Évènements récurrents (chaque vendredi) : V2 via template. V1 = un event par occurrence.
- Une soirée spéciale doit-elle toujours être portée par `event`, ou un concept `serviceNight` distinct doit-il apparaître plus tard côté backend ?
- Pré-vente avec releases : V2.
- Tarification dynamique (early-bird) : V2.
