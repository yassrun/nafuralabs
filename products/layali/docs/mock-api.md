---
specVersion: 1
kind: mock-api
appId: layali
status: draft
phase: P2
basePath: /api/v1
authHeader: Authorization
tenantHeader: X-Tenant-Id
---

# Layali — Conventions Mock API

> **Phase P2/P3** — hors Client Walkthrough (P1). En P1, voir [fixtures.md](fixtures.md) et `mobile/src/prototypeData.ts`.

## 1. Base URL et versionnage

- Base URL : `/api/v1`.
- Versionnage : préfixe d'URL (`/v1`, `/v2`...). Pas de version par header.
- Toutes les ressources sont au pluriel kebab-case (`venues`, `events`, `tables`, `bookings`, `tickets`, `check-ins`).

## 2. Authentification

- Header obligatoire (sauf endpoints publics) : `Authorization: Bearer <jwt>`.
- Token issu de Keycloak realm `nafura`, clients `layali-web-customer`, `layali-web-pro`, `layali-web-admin`.
- Endpoints publics (sans header) : `GET /venues`, `GET /venues/:slug`, `GET /events`, `GET /events/:slug`, `POST /auth/login`, `POST /auth/register`, `POST /auth/otp/request`, `POST /auth/otp/verify`.
- Endpoints à `auth: optional` : peuvent enrichir la réponse si auth présente (ex. `isFavorite` sur `GET /venues`).

## 3. Tenancy

- Header obligatoire pour les routes pro : `X-Tenant-Id: <venue-slug>` (ex : `sky31-casablanca`).
- En l'absence ou en cas d'incohérence avec le sous-domaine, retour `409 tenant_mismatch`.
- Côté client, le tenant est implicite (résolu via la ressource consultée). Pas de header `X-Tenant-Id` requis.
- Côté admin Nafura : pas de `X-Tenant-Id` ; un paramètre `tenantId` est porté dans l'URL si nécessaire.

## 4. Pagination

- Cursor-based, taille par défaut 20, max 100.
- Query params : `cursor` (opaque), `size` (int).
- Réponse :
  ```json
  {
    "items": [],
    "page": { "size": 20, "total": null, "cursor": null }
  }
  ```
- `total` est nullable (les listes longues n'exposent pas de total exact pour des raisons de perf).

## 5. Tri et filtres

- Tri : `sort=<field>:<asc|desc>`. Tris autorisés listés par ressource.
- Filtres : query params nommés (`city=casablanca`, `from=2026-06-12`, `priceMax=500`). Pas de DSL complexe en V1.

## 6. Idempotence

- Header `Idempotency-Key: <uuid>` sur les POST/PATCH critiques (création booking, ticket, paiement, refund).
- Le serveur conserve la clé 24h et renvoie la même réponse.

## 7. Format des erreurs

Toutes les erreurs suivent le format JSON :

```json
{
  "error": "<code>",
  "message": "<message lisible côté dev (FR par défaut)>",
  "details": [{ "field": "name", "message": "required" }],
  "traceId": "<uuid>"
}
```

Codes standardisés :

| HTTP | error | Quand |
|---|---|---|
| 400 | `bad_request` | requête malformée |
| 401 | `unauthorized` | token absent / invalide |
| 403 | `forbidden` | rôle / permission insuffisant |
| 404 | `not_found` | ressource inexistante |
| 409 | `conflict` | conflit d'état (sold out, double-scan, tenant mismatch...) |
| 422 | `validation` | échec validation champ |
| 429 | `rate_limited` | trop d'appels |
| 500 | `internal` | erreur serveur |
| 503 | `unavailable` | dépendance externe down (paiement) |

Sous-codes utiles (champ `error`) :
- `tenant_mismatch`, `tenant_suspended`
- `event_sold_out`, `table_unavailable`, `slot_unavailable`
- `payment_failed`, `payment_pending`, `payment_refused`
- `qr_invalid_signature`, `qr_expired`, `qr_already_used`, `qr_unknown_venue`

## 8. Conventions de fixtures

- Chaque `.api.md` fournit au minimum 2 à 3 fixtures JSON réalistes.
- Les IDs UUID v4 sont stables (séries `00000000-0000-0000-0000-0000000000XX`) pour faciliter les références croisées.
- Les venues fixtures incluent au moins : `sky31-casablanca`, `theatro-marrakech`, `nikki-beach-marrakech`.
- Les events fixtures couvrent : un événement publié à venir, un événement sold-out, un événement passé.
- Les fixtures sont chargées par le mock-server au démarrage et persistées en mémoire.

## 9. Simulation de latence

- Le mock-server applique un delay artificiel configurable :
  - p50 : 80 ms
  - p95 : 250 ms
  - jitter aléatoire ±30 %
- Les endpoints `POST /payments/initiate` simulent un délai supplémentaire de 600–1200 ms.
- Un query param `__delay=<ms>` permet de forcer un delay en dev.

## 10. WebSocket / STOMP — Topics realtime

### 10.1 Endpoint

- URL : `/ws` (HTTP upgrade), broker STOMP.
- Auth : token JWT passé en query param `token` ou en frame `CONNECT` header `Authorization`.
- Tenant : header STOMP `X-Tenant-Id` au CONNECT (validé contre le token).

### 10.2 Topics standardisés

| Topic | Audience | Description |
|---|---|---|
| `/topic/venue/{venueId}/events` | public | publication/fermeture d'événements d'un venue |
| `/topic/event/{eventId}/availability` | public | mise à jour billetterie (places restantes par catégorie) |
| `/topic/event/{eventId}/tables` | public + pro | mise à jour disponibilité tables pour la soirée |
| `/topic/event/{eventId}/checkin` | pro (`HOST`, `ADMIN`, `OWNER`) | flux des check-ins (compteur en salle) |
| `/topic/tenant/{tenantId}/bookings` | pro (`ADMIN`, `OWNER`) | nouvelle réservation table reçue |
| `/topic/tenant/{tenantId}/alerts` | pro (`ADMIN`, `OWNER`) | alertes capacité, sold-out imminent |

Les topics publics n'exigent pas d'auth ; le broker filtre néanmoins par `tenantId` côté ACL.

### 10.3 Format des messages

Tout message JSON respecte :

```json
{
  "type": "<event-type>",
  "version": 1,
  "occurredAt": "2026-06-12T22:43:11.412Z",
  "tenantId": "sky31-casablanca",
  "payload": { }
}
```

Exemples de `type` :
- `event.availability.updated`
- `event.published`, `event.closed`
- `table.reserved`, `table.released`
- `checkin.recorded`, `checkin.rejected`
- `booking.created`, `booking.cancelled`
- `alert.capacity-threshold`

### 10.4 Exemples de fixtures STOMP

```json
{
  "type": "event.availability.updated",
  "version": 1,
  "occurredAt": "2026-06-12T20:01:55.000Z",
  "tenantId": "sky31-casablanca",
  "payload": {
    "eventId": "00000000-0000-0000-0000-000000000010",
    "categories": [
      { "code": "STD", "remaining": 142, "soldOut": false },
      { "code": "VIP", "remaining": 4, "soldOut": false },
      { "code": "TBL", "remaining": 0, "soldOut": true }
    ]
  }
}
```

```json
{
  "type": "checkin.recorded",
  "version": 1,
  "occurredAt": "2026-06-12T22:43:11.412Z",
  "tenantId": "sky31-casablanca",
  "payload": {
    "eventId": "00000000-0000-0000-0000-000000000010",
    "totalIn": 312,
    "lastTicketRef": "TKT-0001234"
  }
}
```

```json
{
  "type": "alert.capacity-threshold",
  "version": 1,
  "occurredAt": "2026-06-12T22:55:00.000Z",
  "tenantId": "sky31-casablanca",
  "payload": {
    "eventId": "00000000-0000-0000-0000-000000000010",
    "threshold": 0.9,
    "ratio": 0.92
  }
}
```

### 10.5 Conventions agent côté web

- Le client `@platform/core/realtime` souscrit, dédupe et expose un Observable scoped tenant.
- Reconnect automatique avec backoff exponentiel (1s, 2s, 4s, 8s, max 30s).
- En cas de coupure, l'écran qui dépend du topic doit refetcher l'état via REST (`GET /events/:id/availability`) à la reconnexion.

## 11. Internationalisation des messages

- Les messages d'erreur côté API sont en `fr` par défaut.
- Une clé `errorCode` (= valeur du champ `error`) est exploitable côté web pour traduire (`layali.errors.<code>`).

## 12. Webhooks paiement

- Endpoint d'entrée Layali : `POST /api/v1/payments/webhook/cmi` et `POST /api/v1/payments/webhook/stripe`.
- Signature : header `X-Signature` HMAC SHA256 (clé déclarée dans `:platform:integrations:payment`).
- Idempotence : `eventId` du provider stocké en table de déduplication.

## 13. Open questions

- Faut-il exposer un endpoint GraphQL pour la home (volume de requêtes parallèles) ? Décision provisoire : non, REST suffit en V1.
- Format `total` paginated : exact ou estimé ? Décision provisoire : `null` sauf demande explicite via `withTotal=true`.
- Reprise de session WebSocket après crash mobile : last-event-id ou refetch ? Décision provisoire : refetch via REST suffit pour V1.
