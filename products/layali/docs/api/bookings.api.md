---
specVersion: 1
kind: api
appId: layali
resource: bookings
status: draft
phase: P3
basePath: /api/v1/bookings
auth: required
rateLimit: default
backendOwner: backend/domains/layali/booking
---

# bookings Mock API

## Vue d'ensemble

Réservation d'un mode d'accès pour un venue à une date donnée (avec ou sans event associé). Le booking n'est plus limité aux tables : il couvre aussi la guest list, le comptoir / bar spot, et les scénarios hybrides liés à une soirée spéciale.

Le booking gère le draft éventuel pré-paiement, la confirmation post-paiement ou post-validation, et le cycle de vie opérationnel pro (arrivée, no-show, annulation, refund si applicable).

## Modèle (vue logique)

| Champ | Type | Obligatoire | Notes |
|---|---|---|---|
| id | string (uuid) | oui | |
| reference | string | oui | code court `BKG-A4F8` |
| tenantId | string | oui | venue tenant |
| venueId | string (uuid) | oui | |
| eventId | string (uuid) | non | event associé, sinon réservation venue récurrente |
| serviceNightId | string (uuid) | non | configuration de la soirée ou règles du soir si présentes |
| accessMode | string enum | oui | `TABLE`, `GUEST_LIST`, `COUNTER`, `HYBRID` |
| accessResourceType | string enum | non | `TABLE`, `COUNTER_ZONE`, `ENTRY_QUOTA` |
| accessResourceId | string (uuid) | non | ressource ciblée par le booking ; `tableId` en V1 pour les tables |
| accessResourceLabel | string | non | snapshot lisible côté ops, ex. `VIP-A`, `Bar central`, `Guest list standard` |
| tableId | string (uuid) | non | conservé en compatibilité V1 quand `accessMode=TABLE` ou `HYBRID` |
| tableLabel | string | non | snapshot table si applicable |
| customerId | string (uuid) | oui | |
| customerName | string | oui | snapshot |
| customerPhone | string | oui | snapshot E.164 |
| customerEmail | string | non | snapshot |
| groupSize | integer | oui | nombre de personnes |
| arrivalAt | datetime | oui | début créneau |
| occasion | string enum | oui | `STANDARD`, `BIRTHDAY`, `OTHER` |
| celebrantName | string | non | si `occasion=BIRTHDAY` |
| specialNight | boolean | oui | snapshot du contexte commercial du soir |
| requiresApproval | boolean | oui | utile pour guest list / certains cas comptoir |
| approvalStatus | string enum | oui | `NOT_REQUIRED`, `PENDING`, `APPROVED`, `REJECTED` |
| depositMinor | integer | non | acompte payé |
| minSpendMinor | integer | non | minimum consommation rappelé |
| currency | string | oui | `MAD` |
| linkedTicketOrderId | string (uuid) | non | si le booking est relié à un ticket order obligatoire |
| paymentStatus | string enum | oui | `NONE`, `PENDING`, `PAID`, `REFUNDED`, `FAILED` |
| paymentId | string (uuid) | non | |
| status | string enum | oui | `DRAFT`, `PENDING`, `CONFIRMED`, `ARRIVED`, `NO_SHOW`, `CANCELLED` |
| qrCode | string | non | payload signé (présent si `CONFIRMED`) |
| internalNotes | string | non | notes pro privées |
| customerNotes | string | non | demandes spéciales client |
| createdAt | datetime | oui | |
| updatedAt | datetime | oui | |

### Règles métier principales

- `accessMode=TABLE` : réservation de table classique, `tableId` et `tableLabel` généralement présents.
- `accessMode=GUEST_LIST` : pas de table obligatoire ; validation humaine possible avant confirmation.
- `accessMode=COUNTER` : réservation de comptoir ou bar spot ; pas de table physique requise, et `accessResourceId` peut rester vide si le lieu gère le comptoir en quota global.
- `accessMode=HYBRID` : réservation incluant une table ou une zone et des conditions supplémentaires liées à la soirée, par exemple ticket obligatoire.
- `specialNight=true` : le booking hérite de règles spécifiques au soir concerné.
- `occasion=BIRTHDAY` : l'information doit être visible et filtrable côté pro.

### Transitions de statut

- `DRAFT` → `PENDING` (payment initié ou demande soumise) → `CONFIRMED` (callback paiement OK ou validation manuelle) | `CANCELLED` (timeout 15 min / échec / rejet).
- `CONFIRMED` → `ARRIVED` (check-in QR ou marquage manuel) | `NO_SHOW` (auto 90 min après `arrivalAt` si non scanné ou non marqué) | `CANCELLED` (annulation client/pro).
- `ARRIVED`, `NO_SHOW`, `CANCELLED` → terminaux.

## Endpoints

### POST /api/v1/bookings/draft

- Auth : optional (anonyme → forcé d'auth avant paiement).
- Headers : `Idempotency-Key` recommandé.
- Body :
  ```json
  {
    "venueId": "00000000-0000-0000-0000-000000000010",
    "eventId": "00000000-0000-0000-0000-000000000020",
    "serviceNightId": "00000000-0000-0000-8000-000000000020",
    "accessMode": "TABLE",
    "accessResourceType": "TABLE",
    "accessResourceId": "00000000-0000-0000-3000-000000000002",
    "tableId": "00000000-0000-0000-3000-000000000002",
    "groupSize": 6,
    "arrivalAt": "2026-02-14T21:00:00+01:00",
    "occasion": "BIRTHDAY",
    "celebrantName": "Sara",
    "customerNotes": "Anniversaire, prévoir gâteau"
  }
  ```
- Effet : crée un draft (TTL 15 min). Si une ressource d'accès est allouée, pose un verrou souple sur cette ressource ; pour les tables, cela correspond à `RESERVED` temporaire.
- Réponse 201 :
  ```json
  {
    "draftId": "00000000-0000-0000-4000-000000000010",
    "expiresAt": "2026-02-14T21:15:00+01:00",
    "accessMode": "TABLE",
    "approvalStatus": "NOT_REQUIRED",
    "depositMinor": 150000,
    "minSpendMinor": 400000,
    "currency": "MAD"
  }
  ```
- Erreurs : 409 `table_unavailable`, `access_unavailable`, 422.

### GET /api/v1/bookings/draft/:draftId

- Auth : optional (besoin de la `Idempotency-Key` initiale ou du JWT propriétaire).
- Réponse 200 : draft complet avec snapshot du mode d'accès, montants, et état de validation éventuel.
- Erreurs : 404, 410 (expiré).

### POST /api/v1/bookings

- Auth : required.
- Rôles : CUSTOMER.
- Headers : `Idempotency-Key` requis.
- Body : `{ "draftId": "...", "paymentId": "..." }` quand un paiement a été initié, ou `{ "draftId": "..." }` quand aucun paiement n'est requis (paiement initié séparément via [payments.api.md](payments.api.md)).
- Effet :
  - si paiement requis, à la réception du webhook paiement OK, le draft devient `CONFIRMED` et un `qrCode` signé est généré via `:platform:integrations:qr` ;
  - si validation manuelle requise, le booking peut rester `PENDING` avec `approvalStatus=PENDING` jusqu'à décision pro ;
  - si un ticket est exigé par la soirée, le booking peut référencer `linkedTicketOrderId`.
- Réponse 201 : booking complet avec `qrCode`.
- Erreurs : 409 `payment_pending`, `approval_pending`, 410 (draft expiré), 422.

### GET /api/v1/bookings

- Auth : required.
- Comportements selon `scope` :
  - `scope=mine` (défaut CUSTOMER) : ses bookings.
  - `scope=tenant` (pro) : bookings du tenant ; `X-Tenant-Id` requis.
- Query :
  | Param | Description |
  |---|---|
  | `status` | csv filtres (`pending,confirmed,arrived,no-show,cancelled`) |
  | `accessMode` | csv filtres (`table,guest_list,counter,hybrid`) |
  | `occasion` | filtre (`standard,birthday,other`) |
  | `approvalStatus` | filtre (`pending,approved,rejected`) |
  | `from`, `to` | fenêtre `arrivalAt` |
  | `q` | recherche nom, email, téléphone, ref QR (pro uniquement) |
  | `cursor`, `size` | pagination |
- Réponse 200 : `{ items, page }`.

### GET /api/v1/bookings/:id

- Auth : required.
- Visibilité : propriétaire du booking, ou pro du tenant (OWNER, ADMIN, BAR_MANAGER en lecture, HOST en check-in only).
- Réponse 200.
- Erreurs : 401, 403, 404.

### PATCH /api/v1/bookings/:id/cancel

- Auth : required.
- Rôles : CUSTOMER (le sien, dans la fenêtre d'annulation), OWNER, ADMIN.
- Body : `{ "reason": "..." }`.
- Effet : `CONFIRMED → CANCELLED`. Si paiement réalisé et règles de refund satisfaites, déclenche refund. Si une ressource d'accès était retenue, elle est relâchée.
- Réponse 200 : booking mis à jour.
- Erreurs : 409 (terminal), 422 (hors fenêtre).

### PATCH /api/v1/bookings/:id

- Auth : required.
- Rôles : OWNER, ADMIN.
- Body partiel : `internalNotes`, `accessResourceId`, `tableId` (changement de table le jour J), `arrivalAt` (replanification d'horaire), `approvalStatus`.
- Réponse 200.

### POST /api/v1/bookings/:id/approve

- Auth : required.
- Rôles : OWNER, ADMIN, HOST.
- Effet : `approvalStatus=PENDING → APPROVED`. Si aucun paiement supplémentaire n'est requis, le booking peut passer à `CONFIRMED`.
- Réponse 200.

### POST /api/v1/bookings/:id/reject

- Auth : required.
- Rôles : OWNER, ADMIN, HOST.
- Body : `{ "reason": "Capacite atteinte" }`.
- Effet : `approvalStatus=PENDING → REJECTED`, puis `status=CANCELLED`.
- Réponse 200.

### POST /api/v1/bookings/:id/mark-arrived

- Auth : required.
- Rôles : OWNER, ADMIN, HOST.
- Effet : `CONFIRMED → ARRIVED`. Émet `booking.arrived`. Le marquage manuel doit rester possible même sans scan QR.
- Réponse 200.

### POST /api/v1/bookings/:id/mark-no-show

- Auth : required.
- Rôles : OWNER, ADMIN.
- Effet : `CONFIRMED → NO_SHOW`. Politique de remboursement déterminée par le venue.
- Réponse 200.

## Erreurs communes

| Code | Cas |
|---|---|
| 401, 403, 404, 422, 423 | classiques |
| 409 | `table_unavailable`, `access_unavailable`, transition invalide, `payment_pending`, `approval_pending` |
| 410 | draft expiré |

## Fixtures

```json
[
  {
    "id": "00000000-0000-0000-4000-000000000001",
    "reference": "BKG-A4F8",
    "tenantId": "sky31-casablanca",
    "venueId": "00000000-0000-0000-0000-000000000010",
    "eventId": "00000000-0000-0000-0000-000000000020",
    "serviceNightId": "00000000-0000-0000-8000-000000000020",
    "accessMode": "TABLE",
    "accessResourceType": "TABLE",
    "accessResourceId": "00000000-0000-0000-3000-000000000002",
    "accessResourceLabel": "VIP-A",
    "tableId": "00000000-0000-0000-3000-000000000002",
    "tableLabel": "VIP-A",
    "customerId": "00000000-0000-0000-1000-000000000001",
    "customerName": "Sara Bennani",
    "customerPhone": "+212600111222",
    "customerEmail": "sara@example.ma",
    "groupSize": 6,
    "arrivalAt": "2026-02-14T21:00:00+01:00",
    "occasion": "BIRTHDAY",
    "celebrantName": "Sara",
    "specialNight": true,
    "requiresApproval": false,
    "approvalStatus": "NOT_REQUIRED",
    "depositMinor": 150000,
    "minSpendMinor": 400000,
    "currency": "MAD",
    "paymentStatus": "PAID",
    "paymentId": "00000000-0000-0000-5000-000000000001",
    "status": "CONFIRMED",
    "qrCode": "LAYALI:BKG:A4F8:sig=mocksignature1",
    "customerNotes": "Anniversaire, prévoir gâteau",
    "createdAt": "2026-01-20T15:00:00+01:00",
    "updatedAt": "2026-01-20T15:05:00+01:00"
  },
  {
    "id": "00000000-0000-0000-4000-000000000002",
    "reference": "BKG-B7K2",
    "tenantId": "theatro-marrakech",
    "venueId": "00000000-0000-0000-0000-000000000011",
    "eventId": null,
    "serviceNightId": null,
    "accessMode": "GUEST_LIST",
    "accessResourceType": "ENTRY_QUOTA",
    "accessResourceId": "00000000-0000-0000-8100-000000000010",
    "accessResourceLabel": "Guest list standard",
    "tableId": null,
    "tableLabel": null,
    "customerId": "00000000-0000-0000-1000-000000000002",
    "customerName": "Youssef El Idrissi",
    "customerPhone": "+212600333444",
    "groupSize": 4,
    "arrivalAt": "2026-06-13T23:30:00+01:00",
    "occasion": "STANDARD",
    "celebrantName": null,
    "specialNight": false,
    "requiresApproval": true,
    "approvalStatus": "APPROVED",
    "depositMinor": null,
    "minSpendMinor": null,
    "currency": "MAD",
    "linkedTicketOrderId": null,
    "paymentStatus": "NONE",
    "paymentId": null,
    "status": "ARRIVED",
    "qrCode": "LAYALI:BKG:B7K2:sig=mocksignature2",
    "createdAt": "2026-06-10T18:00:00+01:00",
    "updatedAt": "2026-06-13T23:35:00+01:00"
  },
  {
    "id": "00000000-0000-0000-4000-000000000003",
    "reference": "BKG-C1Q9",
    "tenantId": "sky31-casablanca",
    "venueId": "00000000-0000-0000-0000-000000000010",
    "eventId": null,
    "serviceNightId": "00000000-0000-0000-8000-000000000030",
    "accessMode": "HYBRID",
    "accessResourceType": "TABLE",
    "accessResourceId": "00000000-0000-0000-3000-000000000001",
    "accessResourceLabel": "T1",
    "tableId": "00000000-0000-0000-3000-000000000001",
    "tableLabel": "T1",
    "customerId": "00000000-0000-0000-1000-000000000001",
    "customerName": "Sara Bennani",
    "customerPhone": "+212600111222",
    "groupSize": 4,
    "arrivalAt": "2026-06-20T22:00:00+01:00",
    "occasion": "STANDARD",
    "celebrantName": null,
    "specialNight": true,
    "requiresApproval": false,
    "approvalStatus": "NOT_REQUIRED",
    "depositMinor": 50000,
    "minSpendMinor": 150000,
    "currency": "MAD",
    "linkedTicketOrderId": "00000000-0000-0000-6000-000000000015",
    "paymentStatus": "PENDING",
    "paymentId": "00000000-0000-0000-5000-000000000003",
    "status": "PENDING",
    "createdAt": "2026-06-09T16:00:00+01:00",
    "updatedAt": "2026-06-09T16:00:00+01:00"
  },
  {
    "id": "00000000-0000-0000-4000-000000000004",
    "reference": "BKG-D5M8",
    "tenantId": "sky31-casablanca",
    "venueId": "00000000-0000-0000-0000-000000000010",
    "eventId": null,
    "serviceNightId": null,
    "accessMode": "COUNTER",
    "accessResourceType": "COUNTER_ZONE",
    "accessResourceId": null,
    "accessResourceLabel": "Bar principal",
    "tableId": null,
    "tableLabel": null,
    "customerId": "00000000-0000-0000-1000-000000000003",
    "customerName": "Imane Alaoui",
    "customerPhone": "+212600777888",
    "customerEmail": "imane@example.ma",
    "groupSize": 3,
    "arrivalAt": "2026-06-22T22:30:00+01:00",
    "occasion": "STANDARD",
    "celebrantName": null,
    "specialNight": false,
    "requiresApproval": false,
    "approvalStatus": "NOT_REQUIRED",
    "depositMinor": null,
    "minSpendMinor": 90000,
    "currency": "MAD",
    "linkedTicketOrderId": null,
    "paymentStatus": "NONE",
    "paymentId": null,
    "status": "CONFIRMED",
    "qrCode": "LAYALI:BKG:D5M8:sig=mocksignature4",
    "customerNotes": "Pres du DJ si possible",
    "createdAt": "2026-06-12T19:00:00+01:00",
    "updatedAt": "2026-06-12T19:05:00+01:00"
  }
]
```

## Contraintes pour le futur backend réel

- Pagination : cursor-based, défaut 20, max 100.
- Tenant scope : `/bookings?scope=tenant` impose `X-Tenant-Id`.
- Idempotence : `POST /bookings/draft` et `POST /bookings` exigent `Idempotency-Key`.
- Audit : tout changement de statut.
- QR : généré via `:platform:integrations:qr` avec signature HMAC, key rotation 90 jours. Payload : `{ bookingId, venueId, eventId?, exp }`.
- Auto no-show : job background scrute les bookings `CONFIRMED` dont `arrivalAt + 90min < now` et bascule en `NO_SHOW`.
- WebSocket : `booking.created`, `booking.cancelled`, `booking.arrived` sur `/topic/tenant/{tenantId}/bookings`.
- Lookup ops : recherche rapide par `customerName`, `customerPhone`, `reference`, et QR pour supporter le host même en fallback manuel.
- Compatibilité V1 : `tableId` reste supporté pour les flows table existants, mais ne doit plus être considéré comme obligatoire pour tout booking.
- Comptoir V1 : `accessMode=COUNTER` doit supporter les deux variantes, quota global sans ressource nommée ou zone comptoir ciblée via `accessResourceType=COUNTER_ZONE`.

## Open questions

- Fenêtre d'annulation : par défaut 48h avant `arrivalAt`. Personnalisable par venue en V2.
- Guest list : validation manuelle par défaut ou auto-confirmation selon le lieu ?
- Comptoir / bar spot : modélisation en quota ou ressource positionnée ?
- Hybrid booking : création conjointe booking + ticket order ou chaînage explicite entre les deux ?
- Bookings groupés (plusieurs tables collées) : V2.
