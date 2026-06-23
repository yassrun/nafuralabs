---
specVersion: 1
kind: api
appId: venue-catalog
resource: catalog-places
status: draft
basePath: /api/v1/catalog/places
auth: required
rateLimit: default
backendOwner: backend/domains/venue-catalog/catalog-place
---

# catalog-places Mock API

## Vue d'ensemble

Ressource canonique des lieux collectes depuis Google Places ou d'autres sources. Elle stocke un modele normalise, le niveau de confiance, la fraicheur, les doublons potentiels et l'etat de revue avant toute projection vers une app consommatrice.

## Modele (vue logique)

| Champ | Type | Obligatoire | Notes |
|---|---|---|---|
| id | string (uuid) | oui | identifiant canonique stable |
| canonicalName | string | oui | nom retenu apres normalisation |
| status | string enum | oui | `DRAFT`, `ENRICHED`, `REVIEWED`, `REJECTED`, `ARCHIVED` |
| countryCode | string | oui | ISO-3166-1 alpha-2, V1 `MA` |
| cityCode | string | oui | enum normalise `CASABLANCA`, `RABAT`, `MARRAKECH`, `TANGIER`, `FES`, `AGADIR`, `OTHER` |
| primaryCategory | string | oui | `NIGHTLIFE_VENUE`, `SOCIAL_DINING`, `SALON`, `SPA`, `BARBERSHOP`, `OTHER` |
| providerTypes | string[] | non | types Google Places ou equivalents source |
| address | object | oui | `{ line1, district, postalCode, cityLabel, countryCode }` |
| geo | object | oui | `{ lat, lng }` WGS84 |
| contact | object | non | `{ phoneE164, websiteUrl, mapUrl }` |
| openingHours | object[] | non | vue normalisee par jour |
| providerRating | object | non | `{ average, count, priceLevel, businessStatus }` |
| attributes | object | non | flags normalises `{ servesAlcohol, reservable, wheelchairAccessible, takeout }` |
| media | object[] | non | voir §Modele media (MinIO, URL signee) |
| sourceRecords | object[] | oui | `{ provider, externalId, fetchedAt, freshnessUntil, rawChecksum }` |
| quality | object | oui | `{ completenessScore, freshnessScore, confidenceScore, manualReviewRequired, duplicateCandidateIds[] }` |
| projectionSummary | object[] | non | resume des apps derivees `{ appId, targetResource, mappingId, status }` |
| audit | object | non | `{ createdBy, approvedBy, archivedBy }` |
| createdAt | datetime | oui | |
| updatedAt | datetime | oui | |

### Modele media

Photos Google cachees dans MinIO. Specification complete : [media-pipeline.md](../media-pipeline.md).

| Champ | Type | Notes |
|---|---|---|
| id | uuid | |
| source | string | `GOOGLE_PLACES` en V1 |
| url | string | URL signee MinIO, regeneree si TTL < 5 min |
| width | integer | |
| height | integer | |
| attributionText | string | obligatoire a l'affichage |
| authorName | string | non, auteur Google si disponible |
| reusable | boolean | `false` pour Google |
| expiresAt | datetime | fin TTL cache (30j par defaut) |
| sortOrder | integer | 0 = photo couverture |

Contraintes :
- max 5 medias `ACTIVE` par lieu a l'import
- jamais d'URL `places.googleapis.com` dans l'API
- `storageKey` et `providerPhotoRef` restent internes (non exposes API)

## Endpoints

### GET /api/v1/catalog/places

- Auth : required.
- Roles : PLATFORM_ADMIN, CATALOG_OPERATOR, APP_EDITOR.
- Query params :
  | Param | Type | Description |
  |---|---|---|
  | `q` | string | recherche texte sur `canonicalName`, adresse et source labels |
  | `cityCode` | string | filtre ville normalisee |
  | `primaryCategory` | string | filtre categorie canonique |
  | `status` | csv | filtre statut |
  | `provider` | string | `GOOGLE_PLACES`, `MANUAL`, `CSV_PARTNER` |
  | `needsReview` | boolean | seulement les fiches a revue manuelle |
  | `unmappedAppId` | string | lieux sans mapping publie pour une app |
  | `cursor`, `size` | | pagination |
- Reponse 200 :
  ```json
  {
    "items": [
      {
        "id": "00000000-0000-0000-0000-000000000101",
        "canonicalName": "Sky 28 Casablanca",
        "status": "ENRICHED",
        "cityCode": "CASABLANCA",
        "primaryCategory": "NIGHTLIFE_VENUE",
        "address": { "line1": "Twin Center, Bd Zerktouni", "district": "Maarif", "cityLabel": "Casablanca", "countryCode": "MA" },
        "quality": { "completenessScore": 0.88, "freshnessScore": 0.92, "confidenceScore": 0.81, "manualReviewRequired": true, "duplicateCandidateIds": [] },
        "projectionSummary": [
          { "appId": "layali", "targetResource": "venue", "mappingId": "map-101", "status": "READY" }
        ],
        "updatedAt": "2026-06-16T10:00:00+01:00"
      }
    ],
    "page": { "size": 20, "total": null, "cursor": "eyJvIjoiMjAifQ==" }
  }
  ```
- Erreurs : 401, 403, 422.

### GET /api/v1/catalog/places/:id

- Auth : required.
- Roles : PLATFORM_ADMIN, CATALOG_OPERATOR, APP_EDITOR.
- Reponse 200 : fiche complete canonique avec `sourceRecords` et `media`.
- Erreurs : 404.

### PATCH /api/v1/catalog/places/:id

- Auth : required.
- Roles : PLATFORM_ADMIN, CATALOG_OPERATOR.
- Body partiel : `canonicalName`, `primaryCategory`, `address`, `contact`, `openingHours`, `attributes`, `media`, `quality.manualReviewRequired`.
- Contraintes : `sourceRecords` et `providerRating` sont read-only hors pipeline provider.
- Reponse 200 : fiche mise a jour.
- Erreurs : 401, 403, 409 (`duplicate_candidate`), 422.

### POST /api/v1/catalog/places/:id/approve

- Auth : required.
- Roles : PLATFORM_ADMIN, CATALOG_OPERATOR.
- Body vide ou `{ "note": "verified against provider details" }`.
- Effet : `ENRICHED|DRAFT -> REVIEWED` si `quality.completenessScore >= 0.7` et pas de doublon bloqueur.
- Reponse 200 : `{ "status": "REVIEWED" }`.
- Erreurs : 409 `projection_not_ready`, 422.

### POST /api/v1/catalog/places/:id/archive

- Auth : required.
- Roles : PLATFORM_ADMIN.
- Body : `{ "reason": "duplicate_of:00000000-0000-0000-0000-000000000102" }`.
- Effet : `ARCHIVED`, les mappings non publies sont bloques.
- Reponse 200.

## Erreurs communes

| Code | Cas | Payload |
|---|---|---|
| 401 | non authentifie | `{ "error": "unauthorized" }` |
| 403 | role insuffisant | `{ "error": "forbidden", "missing": "catalog.update" }` |
| 404 | lieu inconnu | `{ "error": "not_found" }` |
| 409 | doublon probable, statut incompatible | `{ "error": "duplicate_candidate" }` |
| 422 | validation | `{ "error": "validation", "details": [...] }` |

## Fixtures

```json
[
  {
    "id": "00000000-0000-0000-0000-000000000101",
    "canonicalName": "Sky 28 Casablanca",
    "status": "ENRICHED",
    "countryCode": "MA",
    "cityCode": "CASABLANCA",
    "primaryCategory": "NIGHTLIFE_VENUE",
    "providerTypes": ["bar", "restaurant", "night_club"],
    "address": {
      "line1": "Twin Center, Boulevard Zerktouni",
      "district": "Maarif",
      "postalCode": "20100",
      "cityLabel": "Casablanca",
      "countryCode": "MA"
    },
    "geo": { "lat": 33.5872, "lng": -7.6320 },
    "contact": {
      "phoneE164": "+212522000111",
      "websiteUrl": "https://sky28.ma",
      "mapUrl": "https://maps.google.com/?cid=123456789"
    },
    "openingHours": [
      { "weekday": "THURSDAY", "ranges": [{ "from": "20:00", "to": "02:00" }] },
      { "weekday": "FRIDAY", "ranges": [{ "from": "20:00", "to": "04:00" }] }
    ],
    "providerRating": { "average": 4.5, "count": 318, "priceLevel": 3, "businessStatus": "OPERATIONAL" },
    "attributes": { "servesAlcohol": true, "reservable": true, "wheelchairAccessible": false, "takeout": false },
    "media": [
      {
        "id": "med-101",
        "source": "GOOGLE_PLACES",
        "url": "https://storage.nafura.ma/venue-catalog-media/google/00000000-0000-0000-0000-000000000101/a3f2c8d1.jpg?X-Amz-Signature=...",
        "width": 1600,
        "height": 900,
        "attributionText": "Photo: Google",
        "authorName": null,
        "reusable": false,
        "expiresAt": "2026-07-16T09:55:00+01:00",
        "sortOrder": 0
      }
    ],
    "sourceRecords": [
      { "provider": "GOOGLE_PLACES", "externalId": "ChIJ-abc123", "fetchedAt": "2026-06-16T09:55:00+01:00", "freshnessUntil": "2026-07-16T09:55:00+01:00", "rawChecksum": "sha256:1" }
    ],
    "quality": { "completenessScore": 0.88, "freshnessScore": 0.92, "confidenceScore": 0.81, "manualReviewRequired": true, "duplicateCandidateIds": [] },
    "projectionSummary": [
      { "appId": "layali", "targetResource": "venue", "mappingId": "map-101", "status": "READY" }
    ],
    "createdAt": "2026-06-16T09:55:02+01:00",
    "updatedAt": "2026-06-16T10:00:00+01:00"
  },
  {
    "id": "00000000-0000-0000-0000-000000000102",
    "canonicalName": "Studio Hair Casablanca",
    "status": "REVIEWED",
    "countryCode": "MA",
    "cityCode": "CASABLANCA",
    "primaryCategory": "SALON",
    "providerTypes": ["beauty_salon", "hair_care"],
    "address": {
      "line1": "12 rue d'Agadir",
      "district": "Maarif",
      "postalCode": "20100",
      "cityLabel": "Casablanca",
      "countryCode": "MA"
    },
    "geo": { "lat": 33.5731, "lng": -7.5898 },
    "contact": { "phoneE164": "+212522445566", "websiteUrl": null, "mapUrl": "https://maps.google.com/?cid=987654321" },
    "providerRating": { "average": 4.6, "count": 142, "priceLevel": 2, "businessStatus": "OPERATIONAL" },
    "media": [],
    "sourceRecords": [
      { "provider": "GOOGLE_PLACES", "externalId": "ChIJ-salon45", "fetchedAt": "2026-06-14T11:00:00+01:00", "freshnessUntil": "2026-07-14T11:00:00+01:00", "rawChecksum": "sha256:2" }
    ],
    "quality": { "completenessScore": 0.91, "freshnessScore": 0.95, "confidenceScore": 0.94, "manualReviewRequired": false, "duplicateCandidateIds": [] },
    "projectionSummary": [
      { "appId": "beauty", "targetResource": "salon", "mappingId": "map-201", "status": "PUBLISHED" }
    ],
    "createdAt": "2026-06-14T11:00:01+01:00",
    "updatedAt": "2026-06-14T11:10:00+01:00"
  }
]
```

## Contraintes pour le futur backend reel

- Les payloads provider bruts sont stockes hors contrat public, avec retention courte et checksum exploitable.
- Le service doit empecher toute exposition directe d'un `googlePlaceId` dans les APIs consommees par Layali ou Beauty.
- Dedupe : verifier sur `(canonicalName normalize, geo rounded, cityCode, primaryCategory)` puis demander revue humaine si la confiance < 0.85.
- `manualReviewRequired=true` tant qu'une fiche source n'a pas contact, geo ou categorie fiable.

## Open questions

- Strategie de fusion de deux fiches deja mappees vers deux apps differentes : fusion automatique interdite en V1.
