---
specVersion: 1
kind: api
appId: layali
resource: venues
status: draft
phase: P3
basePath: /api/v1/venues
auth: optional
rateLimit: default
backendOwner: backend/domains/layali/venue
---

# venues Mock API

## Vue d'ensemble

Fiche d'un lieu (venue) orienté nightlife : nom, photos, ambiance, capacité, adresse, horaires, statut public, et résumé public des modes d'accès disponibles. Lecture publique pour la découverte ; écriture réservée au pro (`OWNER`, `ADMIN`).

## Modèle (vue logique)

| Champ | Type | Obligatoire | Notes |
|---|---|---|---|
| id | string (uuid) | oui | |
| tenantId | string | oui | = slug venue (V1, 1 tenant = 1 venue) |
| slug | string | oui | kebab-case, unique global |
| name | string | oui | |
| tagline | string | non | accroche courte (FR/AR/EN) |
| description | string | non | markdown light |
| categories | string[] | oui | `CLUB`, `LOUNGE`, `ROOFTOP`, `RESTAURANT`, `EVENT_HALL`, `FESTIVAL_SITE` |
| moods | string[] | non | `CHIC`, `FESTIVE`, `INTIMATE`, `OPEN_AIR`, `DRESS_CODE` |
| city | string | oui | enum (`casablanca`, `marrakech`, `tanger`, `rabat`, `agadir`, ...) |
| address | object | oui | `{ line1, line2, postalCode, city, country: "MA" }` |
| geo | object | non | `{ lat, lng }` |
| mapUrl | string | non | URL externe Google Maps |
| phone | string | non | E.164 |
| email | string | non | |
| capacity | integer | oui | jauge totale debout/assis |
| photos | object[] | non | `{ url, width, height, caption?, sort }` |
| openingHours | object | non | par jour `{ "mon": [{from:"19:00", to:"04:00"}] }` |
| dressCode | string | non | `CASUAL`, `SMART`, `CLUB`, `BLACK_TIE` |
| ageMin | integer | non | défaut 18 |
| acceptsOnlineBooking | boolean | oui | défaut `false` |
| acceptsOnlineTickets | boolean | oui | défaut `false` |
| accessModesDefault | string[] | oui | modes d'accès par défaut hors override d'une soirée : `TABLE`, `GUEST_LIST`, `COUNTER`, `WALK_IN` |
| operationalTags | string[] | non | tags discovery : `WALK_IN`, `GUEST_LIST`, `TABLE_BOOKING`, `COUNTER_BOOKING`, `TICKET_REQUIRED`, `SPECIAL_NIGHT` |
| accessRulesSummary | object | non | résumé public : `{ guestListApproval, counterNamedZones, qrCheckin, fallbackLookup }` |
| status | string enum | oui | `DRAFT`, `PENDING_REVIEW`, `PUBLISHED`, `SUSPENDED`, `ARCHIVED` |
| rating | object | non | `{ avg: 4.5, count: 127 }` (résumé avis) |
| createdAt | datetime | oui | |
| updatedAt | datetime | oui | |

## Endpoints

### GET /api/v1/venues

- Auth : public.
- Query :
  | Param | Type | Description |
  |---|---|---|
  | `city` | string | filtre ville |
  | `category` | csv | filtre catégorie |
  | `mood` | csv | filtre mood |
  | `accessMode` | csv | filtre mode d'accès (`table,guest_list,counter,walk_in`) |
  | `q` | string | full-text nom/tagline |
  | `sort` | string | `trending:desc`, `rating:desc`, `name:asc` |
  | `cursor`, `size` | | pagination |
- Réponse 200 :
  ```json
  {
    "items": [ /* venue résumé */ ],
    "page": { "size": 20, "total": null, "cursor": "eyJvIjoiMjAifQ==" }
  }
  ```
  Le résumé contient `id, slug, name, tagline, city, categories, moods, photos[0], capacity, rating, accessModesDefault, operationalTags, status`.

### GET /api/v1/venues/:slug

- Auth : public.
- Réponse 200 : venue complet. Si `status != PUBLISHED`, retourne 404 sauf si l'utilisateur est `OWNER`/`ADMIN` du tenant.
- Erreurs : 404.

### PATCH /api/v1/venues/:id

- Auth : required.
- Rôles : OWNER, ADMIN.
- Headers : `X-Tenant-Id`.
- Body partiel (tous champs `name`, `tagline`, `description`, `categories`, `moods`, `phone`, `email`, `address`, `geo`, `mapUrl`, `capacity`, `openingHours`, `dressCode`, `ageMin`, `acceptsOnlineBooking`, `acceptsOnlineTickets`, `accessModesDefault`, `operationalTags`, `accessRulesSummary`).
- Effet : si `status=PUBLISHED` et champs critiques modifiés (nom, capacité), audit + notification admin Nafura.
- Erreurs : 401, 403, 422, 423 (tenant suspendu).

### POST /api/v1/venues/:id/photos

- Auth : required.
- Rôles : OWNER, ADMIN.
- Content-Type : `multipart/form-data` (champ `file`, max 5 Mo, jpeg/webp uniquement).
- Effet : upload via `:platform:integrations:storage` (MinIO), ajoute la photo en fin de liste avec un `sort` incrémenté.
- Réponse 201 : `{ "id": "ph-001", "url": "https://minio.../...", "width": 1920, "height": 1080 }`.
- Erreurs : 413 (taille), 415 (type), 422.

### PATCH /api/v1/venues/:id/photos/:photoId

- Auth : required.
- Body : `{ "sort": 3, "caption": "..." }`.
- Réponse 200.

### DELETE /api/v1/venues/:id/photos/:photoId

- Auth : required.
- Réponse 204.

### POST /api/v1/venues/:id/publish

- Auth : required.
- Rôles : OWNER.
- Body vide. Bascule `status` de `DRAFT|PENDING_REVIEW` à `PUBLISHED`.
- Pré-conditions : au moins 1 photo, `address`, `geo`, `capacity` renseignés.
- Erreurs : 422 (pré-conditions).

## Erreurs communes

| Code | Cas |
|---|---|
| 401, 403, 404, 422, 423 | classiques |

## Fixtures

```json
[
  {
    "id": "00000000-0000-0000-0000-000000000010",
    "tenantId": "sky31-casablanca",
    "slug": "sky31-casablanca",
    "name": "Sky31 Casablanca",
    "tagline": "Rooftop iconique du Boulevard d'Anfa",
    "description": "Vue panoramique sur Casablanca, ambiance chic et internationale.",
    "categories": ["ROOFTOP", "LOUNGE"],
    "moods": ["CHIC", "OPEN_AIR", "DRESS_CODE"],
    "city": "casablanca",
    "address": {
      "line1": "31e étage, Twin Center",
      "postalCode": "20100",
      "city": "casablanca",
      "country": "MA"
    },
    "geo": { "lat": 33.5879, "lng": -7.6321 },
    "mapUrl": "https://maps.google.com/?q=Sky31+Casablanca",
    "phone": "+212522000111",
    "email": "contact@sky31.ma",
    "capacity": 350,
    "photos": [
      { "url": "https://media.layali.ma/v/sky31/1.jpg", "width": 1920, "height": 1080, "sort": 1 },
      { "url": "https://media.layali.ma/v/sky31/2.jpg", "width": 1920, "height": 1080, "sort": 2 }
    ],
    "openingHours": {
      "thu": [{ "from": "20:00", "to": "02:00" }],
      "fri": [{ "from": "20:00", "to": "04:00" }],
      "sat": [{ "from": "20:00", "to": "04:00" }]
    },
    "dressCode": "SMART",
    "ageMin": 21,
    "acceptsOnlineBooking": true,
    "acceptsOnlineTickets": true,
    "accessModesDefault": ["TABLE", "COUNTER"],
    "operationalTags": ["TABLE_BOOKING", "COUNTER_BOOKING", "SPECIAL_NIGHT"],
    "accessRulesSummary": {
      "guestListApproval": "MANUAL",
      "counterNamedZones": true,
      "qrCheckin": true,
      "fallbackLookup": true
    },
    "status": "PUBLISHED",
    "rating": { "avg": 4.6, "count": 218 },
    "createdAt": "2025-09-01T10:00:00+01:00",
    "updatedAt": "2026-06-01T14:32:00+01:00"
  },
  {
    "id": "00000000-0000-0000-0000-000000000011",
    "tenantId": "theatro-marrakech",
    "slug": "theatro-marrakech",
    "name": "Theatro Marrakech",
    "tagline": "Club mythique sous le théâtre du Casino",
    "categories": ["CLUB"],
    "moods": ["FESTIVE", "DRESS_CODE"],
    "city": "marrakech",
    "address": { "line1": "Casino de Marrakech, Avenue El Yarmouk", "postalCode": "40000", "city": "marrakech", "country": "MA" },
    "geo": { "lat": 31.6285, "lng": -7.9928 },
    "phone": "+212524000222",
    "capacity": 800,
    "photos": [{ "url": "https://media.layali.ma/v/theatro/1.jpg", "width": 1920, "height": 1080, "sort": 1 }],
    "openingHours": { "fri": [{"from":"23:00","to":"05:00"}], "sat": [{"from":"23:00","to":"05:00"}] },
    "dressCode": "CLUB",
    "ageMin": 21,
    "acceptsOnlineBooking": true,
    "acceptsOnlineTickets": true,
    "accessModesDefault": ["GUEST_LIST", "TABLE", "COUNTER"],
    "operationalTags": ["GUEST_LIST", "TABLE_BOOKING", "COUNTER_BOOKING", "SPECIAL_NIGHT"],
    "accessRulesSummary": {
      "guestListApproval": "AUTO",
      "counterNamedZones": false,
      "qrCheckin": true,
      "fallbackLookup": true
    },
    "status": "PUBLISHED",
    "rating": { "avg": 4.4, "count": 412 },
    "createdAt": "2025-06-12T10:00:00+01:00",
    "updatedAt": "2026-05-20T18:00:00+01:00"
  },
  {
    "id": "00000000-0000-0000-0000-000000000012",
    "tenantId": "nikki-beach-marrakech",
    "slug": "nikki-beach-marrakech",
    "name": "Nikki Beach Marrakech",
    "tagline": "Beach club de jour, lounge de nuit",
    "categories": ["LOUNGE", "RESTAURANT"],
    "moods": ["CHIC", "OPEN_AIR", "FESTIVE"],
    "city": "marrakech",
    "address": { "line1": "Circuit de la Palmeraie", "postalCode": "40000", "city": "marrakech", "country": "MA" },
    "geo": { "lat": 31.6722, "lng": -7.9701 },
    "phone": "+212524000333",
    "capacity": 600,
    "photos": [{ "url": "https://media.layali.ma/v/nikki/1.jpg", "width": 1920, "height": 1080, "sort": 1 }],
    "openingHours": {
      "wed": [{ "from": "12:00", "to": "23:00" }],
      "thu": [{ "from": "12:00", "to": "23:00" }],
      "fri": [{ "from": "12:00", "to": "01:00" }],
      "sat": [{ "from": "12:00", "to": "01:00" }],
      "sun": [{ "from": "12:00", "to": "23:00" }]
    },
    "dressCode": "SMART",
    "ageMin": 18,
    "acceptsOnlineBooking": true,
    "acceptsOnlineTickets": true,
    "accessModesDefault": ["TABLE", "GUEST_LIST", "COUNTER"],
    "operationalTags": ["TABLE_BOOKING", "GUEST_LIST", "COUNTER_BOOKING", "WALK_IN"],
    "accessRulesSummary": {
      "guestListApproval": "MANUAL",
      "counterNamedZones": true,
      "qrCheckin": true,
      "fallbackLookup": true
    },
    "status": "PUBLISHED",
    "rating": { "avg": 4.5, "count": 305 },
    "createdAt": "2025-04-10T10:00:00+01:00",
    "updatedAt": "2026-05-12T11:00:00+01:00"
  }
]
```

## Contraintes pour le futur backend réel

- Pagination : cursor-based, défaut 20, max 100.
- Tenant scope : lecture publique non scoped (filtrage par `status=PUBLISHED`) ; mutation scoped tenant.
- Cache : `GET /venues/:slug` cacheable 5 min côté CDN (clé incluant `Accept-Language`).
- Provisioning : le backend Layali peut initialiser ou mettre à jour une fiche venue depuis le service interne `venue-catalog`, mais le contrat public `venues` ne doit jamais dépendre d'un `googlePlaceId` ou d'un payload provider brut.
- SEO : champs `name`, `tagline`, `description`, `city`, premières photos exploités pour Open Graph.
- Audit : toute mutation `PATCH`, `POST /publish` audité.
- Index : `slug`, `(city, status)`, `(status, rating.avg desc)` pour les tris fréquents.
- Discovery CTA : `GET /venues/:slug` doit exposer assez de contexte public pour déterminer quels CTA afficher côté client sans endpoint privé supplémentaire.

## Open questions

- Capacité multi-zones (terrasse vs intérieur) : V2. V1 = capacité unique.
- Les tags opérationnels doivent-ils être calculés dynamiquement selon la prochaine soirée, ou refléter seulement la configuration par défaut du lieu ?
- Vérification CIN/Patente avant `PUBLISHED` : modération humaine Nafura en V1.
- Multi-langue des descriptions : champ unique côté backend ; i18n côté UI uniquement.
