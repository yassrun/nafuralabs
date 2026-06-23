---
specVersion: 1
kind: api
appId: venue-catalog
resource: catalog-mappings
status: draft
basePath: /api/v1/catalog/mappings
auth: required
rateLimit: default
backendOwner: backend/domains/venue-catalog/catalog-mapping
---

# catalog-mappings Mock API

## Vue d'ensemble

Mappe un lieu canonique vers une projection exploitable par une app cible. Le mapping porte la taxonomie, les champs publies, la strategie de synchronisation et l'API de lecture consommatrice.

## Modele (vue logique)

| Champ | Type | Obligatoire | Notes |
|---|---|---|---|
| id | string | oui | identifiant de mapping |
| catalogPlaceId | string (uuid) | oui | ref vers `catalog-places` |
| appId | string | oui | `layali`, `beauty`, autre |
| targetResource | string | oui | `venue`, `salon`, `restaurant`, autre |
| status | string enum | oui | `DRAFT`, `READY`, `PUBLISHED`, `SYNC_REQUIRED`, `DISABLED` |
| projectionVersion | integer | oui | incremente a chaque publication |
| classification | object | oui | taxonomie app-specifique (`categories`, `operationalTags`, etc.) |
| projection | object | oui | payload publie vers l'app consommatrice |
| syncPolicy | string enum | oui | `MANUAL_APPROVAL`, `AUTO_IF_SAFE` |
| sourceHash | string | oui | checksum de la projection publiee |
| lastPublishedAt | datetime | non | |
| lastConsumedAt | datetime | non | renseigne plus tard via telemetry ou ack |
| diffSummary | object | non | resume des champs modifies depuis la derniere publication |
| createdAt | datetime | oui | |
| updatedAt | datetime | oui | |

## Endpoints

### GET /api/v1/catalog/mappings

- Auth : required.
- Roles : PLATFORM_ADMIN, APP_EDITOR, CATALOG_OPERATOR.
- Query params :
  | Param | Type | Description |
  |---|---|---|
  | `appId` | string | app cible |
  | `catalogPlaceId` | string | filtre par lieu canonique |
  | `status` | csv | filtre statut |
  | `targetResource` | string | `venue`, `salon`, ... |
  | `cursor`, `size` | | pagination |
- Reponse 200 : `{ items, page }`.

### GET /api/v1/catalog/mappings/:id

- Auth : required.
- Roles : PLATFORM_ADMIN, APP_EDITOR, CATALOG_OPERATOR.
- Reponse 200 : mapping complet.
- Erreurs : 404.

### POST /api/v1/catalog/mappings

- Auth : required.
- Roles : PLATFORM_ADMIN, APP_EDITOR.
- Headers : `Idempotency-Key`.
- Body :
  ```json
  {
    "catalogPlaceId": "00000000-0000-0000-0000-000000000101",
    "appId": "layali",
    "targetResource": "venue",
    "classification": {
      "categories": ["ROOFTOP", "LOUNGE"],
      "operationalTags": ["TABLE_BOOKING", "SPECIAL_NIGHT"]
    },
    "projection": {
      "slug": "sky-28-casablanca",
      "name": "Sky 28 Casablanca",
      "city": "casablanca",
      "mapUrl": "https://maps.google.com/?cid=123456789"
    },
    "syncPolicy": "MANUAL_APPROVAL"
  }
  ```
- Reponse 201 : mapping cree en `DRAFT` ou `READY` selon la completude.
- Erreurs : 409 `duplicate_candidate`, 422.

### PATCH /api/v1/catalog/mappings/:id

- Auth : required.
- Roles : PLATFORM_ADMIN, APP_EDITOR.
- Body partiel : `classification`, `projection`, `syncPolicy`, `status`.
- Regle : toute modification apres publication passe `status -> SYNC_REQUIRED` tant qu'elle n'est pas republiee.
- Reponse 200.

### POST /api/v1/catalog/mappings/:id/publish

- Auth : required.
- Roles : PLATFORM_ADMIN, APP_EDITOR.
- Headers : `Idempotency-Key`.
- Body optionnel : `{ "note": "validated for Layali import" }`.
- Effet : `READY|SYNC_REQUIRED -> PUBLISHED`, incremente `projectionVersion`, calcule `sourceHash` et expose la projection dans l'API consumer.
- Reponse 200 :
  ```json
  {
    "id": "map-101",
    "status": "PUBLISHED",
    "projectionVersion": 3,
    "publishedAt": "2026-06-16T12:30:00+01:00",
    "sourceHash": "sha256:proj-3"
  }
  ```

### GET /api/v1/catalog/apps/:appId/projections

- Auth : required.
- Roles : PLATFORM_ADMIN ou token service avec scope `catalog.consumer.read`.
- Query : `status=PUBLISHED`, `targetResource`, `since`, `cursor`, `size`.
- Reponse 200 :
  ```json
  {
    "items": [
      {
        "mappingId": "map-101",
        "catalogPlaceId": "00000000-0000-0000-0000-000000000101",
        "targetResource": "venue",
        "projectionVersion": 3,
        "sourceHash": "sha256:proj-3",
        "publishedAt": "2026-06-16T12:30:00+01:00",
        "projection": {
          "slug": "sky-28-casablanca",
          "name": "Sky 28 Casablanca",
          "categories": ["ROOFTOP", "LOUNGE"],
          "city": "casablanca",
          "address": { "line1": "Twin Center, Boulevard Zerktouni", "postalCode": "20100", "city": "casablanca", "country": "MA" },
          "geo": { "lat": 33.5872, "lng": -7.6320 },
          "mapUrl": "https://maps.google.com/?cid=123456789",
          "sourceCatalogRef": {
            "catalogPlaceId": "00000000-0000-0000-0000-000000000101",
            "provider": "GOOGLE_PLACES",
            "externalRef": "opaque"
          }
        }
      }
    ],
    "page": { "size": 20, "total": null, "cursor": null }
  }
  ```
- Erreurs : 401, 403, 422 `consumer_scope_missing`.

### POST /api/v1/catalog/mappings/:id/disable

- Auth : required.
- Roles : PLATFORM_ADMIN.
- Body : `{ "reason": "consumer rejected projection" }`.
- Effet : `DISABLED`, projection retiree des exports futurs.
- Reponse 200.

## Erreurs communes

| Code | Cas | Payload |
|---|---|---|
| 401 | non authentifie | `{ "error": "unauthorized" }` |
| 403 | role ou scope insuffisant | `{ "error": "consumer_scope_missing" }` |
| 404 | mapping inconnu | `{ "error": "not_found" }` |
| 409 | conflit de statut, slug deja reserve | `{ "error": "conflict" }` |
| 422 | validation | `{ "error": "validation", "details": [...] }` |

## Fixtures

```json
[
  {
    "id": "map-101",
    "catalogPlaceId": "00000000-0000-0000-0000-000000000101",
    "appId": "layali",
    "targetResource": "venue",
    "status": "PUBLISHED",
    "projectionVersion": 3,
    "classification": {
      "categories": ["ROOFTOP", "LOUNGE"],
      "operationalTags": ["TABLE_BOOKING", "SPECIAL_NIGHT"]
    },
    "projection": {
      "slug": "sky-28-casablanca",
      "name": "Sky 28 Casablanca",
      "tagline": "Rooftop nightlife au coeur de Casablanca",
      "city": "casablanca",
      "address": { "line1": "Twin Center, Boulevard Zerktouni", "postalCode": "20100", "city": "casablanca", "country": "MA" },
      "geo": { "lat": 33.5872, "lng": -7.6320 },
      "mapUrl": "https://maps.google.com/?cid=123456789",
      "sourceCatalogRef": { "catalogPlaceId": "00000000-0000-0000-0000-000000000101", "provider": "GOOGLE_PLACES", "externalRef": "opaque" }
    },
    "syncPolicy": "MANUAL_APPROVAL",
    "sourceHash": "sha256:proj-3",
    "lastPublishedAt": "2026-06-16T12:30:00+01:00",
    "createdAt": "2026-06-16T11:20:00+01:00",
    "updatedAt": "2026-06-16T12:30:00+01:00"
  },
  {
    "id": "map-201",
    "catalogPlaceId": "00000000-0000-0000-0000-000000000102",
    "appId": "beauty",
    "targetResource": "salon",
    "status": "PUBLISHED",
    "projectionVersion": 1,
    "classification": {
      "categories": ["HAIR_WOMEN", "HAIR_MEN", "MAKEUP"]
    },
    "projection": {
      "slug": "studio-hair-casablanca",
      "name": "Studio Hair Casablanca",
      "city": "CASABLANCA",
      "address": { "street": "12 rue d'Agadir", "district": "Maarif", "postalCode": "20100", "cityLabel": "Casablanca" },
      "location": { "lat": 33.5731, "lng": -7.5898 },
      "sourceCatalogRef": { "catalogPlaceId": "00000000-0000-0000-0000-000000000102", "provider": "GOOGLE_PLACES", "externalRef": "opaque" }
    },
    "syncPolicy": "AUTO_IF_SAFE",
    "sourceHash": "sha256:beauty-1",
    "lastPublishedAt": "2026-06-14T11:15:00+01:00",
    "createdAt": "2026-06-14T11:12:00+01:00",
    "updatedAt": "2026-06-14T11:15:00+01:00"
  }
]
```

## Contraintes pour le futur backend reel

- Le format de `projection` doit rester stable par `appId` et `targetResource` sur une version donnee.
- Les consumers doivent pouvoir faire un upsert idempotent par `mappingId` ou `sourceCatalogRef.catalogPlaceId`.
- Ne pas exposer de champ provider-specifique obligatoire dans `projection` ; tout champ lie a Google doit etre encapsule ou rendu opaque.
- Publication : transaction atomique entre incrementation de version, calcul hash et exposition exportable.

## Open questions

- Faut-il stocker les erreurs retournees par les consumers lors de leur import dans cette ressource ou dans un journal dedie ? Decision provisoire : journal dedie plus tard.
