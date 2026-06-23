---
specVersion: 1
kind: api
appId: venue-catalog
resource: catalog-jobs
status: draft
basePath: /api/v1/catalog/jobs
auth: required
rateLimit: default
backendOwner: backend/domains/venue-catalog/catalog-job
---

# catalog-jobs Mock API

## Vue d'ensemble

Jobs asynchrones d'import et de refresh provider. Cette ressource encapsule les appels Google Places, les retries, les quotas et les statistiques de creation/mise a jour du catalogue canonique.

## Modele (vue logique)

| Champ | Type | Obligatoire | Notes |
|---|---|---|---|
| id | string (uuid) | oui | identifiant du job |
| type | string enum | oui | `GOOGLE_TEXT_SEARCH`, `GOOGLE_NEARBY_SEARCH`, `GOOGLE_DETAILS_REFRESH`, `APP_REPROJECTION` |
| provider | string | oui | `GOOGLE_PLACES`, `SYSTEM` |
| status | string enum | oui | `QUEUED`, `RUNNING`, `PARTIAL`, `SUCCEEDED`, `FAILED`, `CANCELLED` |
| request | object | oui | payload d'entree normalise |
| result | object | non | resume `{ candidatesFound, created, updated, archivedDuplicates, skipped, mappingsAffected }` |
| progress | object | non | `{ current, total, stepLabel }` |
| error | object | non | `{ code, message, retryable }` |
| requestedBy | string | oui | userId ou `SYSTEM` |
| startedAt | datetime | non | |
| finishedAt | datetime | non | |
| createdAt | datetime | oui | |

## Endpoints

### POST /api/v1/catalog/jobs/google-places-search

- Auth : required.
- Roles : PLATFORM_ADMIN, CATALOG_OPERATOR.
- Headers : `Idempotency-Key`.
- Body :
  ```json
  {
    "mode": "TEXT",
    "query": {
      "q": "rooftop casablanca",
      "countryCode": "MA",
      "cityCode": "CASABLANCA",
      "primaryCategoryHint": "NIGHTLIFE_VENUE"
    },
    "options": {
      "maxResults": 20,
      "refreshExisting": true,
      "autoCreateMappingsForApps": ["layali"]
    }
  }
  ```
- Variantes : `mode=NEARBY` avec `{ "lat": 33.58, "lng": -7.63, "radiusMeters": 3000 }`.
- Options media : `options.refreshMedia` defaut `true` sur creation ; declenche l'etape job `SYNC_MEDIA` (voir [media-pipeline.md](../media-pipeline.md)).
- Reponse 202 :
  ```json
  {
    "jobId": "00000000-0000-0000-0000-000000000301",
    "status": "QUEUED"
  }
  ```
- Erreurs : 401, 403, 409 `provider_quota_exceeded`, 422.

### POST /api/v1/catalog/jobs/google-places-refresh

- Auth : required.
- Roles : PLATFORM_ADMIN, CATALOG_OPERATOR.
- Headers : `Idempotency-Key`.
- Body :
  ```json
  {
    "catalogPlaceIds": [
      "00000000-0000-0000-0000-000000000101"
    ],
    "refreshMedia": false,
    "refreshHours": true
  }
  ```
- Reponse 202 : `{ "jobId": "00000000-0000-0000-0000-000000000302", "status": "QUEUED" }`.
- `refreshMedia: true` : re-telecharge les photos Google vers MinIO si expirees ou absentes.

### Etapes de progression (`progress.stepLabel`)

| Etape | Description |
|---|---|
| `SEARCH_PROVIDER` | Text ou Nearby Search |
| `FETCH_DETAILS` | Place Details par candidat |
| `SYNC_MEDIA` | Place Photos -> MinIO (max 5/lieu) |
| `UPSERT_PLACES` | Normalisation + dedupe + persistence |

### GET /api/v1/catalog/jobs

- Auth : required.
- Roles : PLATFORM_ADMIN, CATALOG_OPERATOR, APP_EDITOR.
- Query : `status`, `type`, `provider`, `requestedBy`, `cursor`, `size`.
- Reponse 200 : `{ items, page }`.

### GET /api/v1/catalog/jobs/:id

- Auth : required.
- Roles : PLATFORM_ADMIN, CATALOG_OPERATOR, APP_EDITOR.
- Reponse 200 : job complet avec progression et resultat.
- Erreurs : 404.

### POST /api/v1/catalog/jobs/:id/retry

- Auth : required.
- Roles : PLATFORM_ADMIN.
- Reponse 202 : nouveau job clone avec `retryOf=<id>`.
- Erreurs : 409 si job toujours `RUNNING`.

## Erreurs communes

| Code | Cas | Payload |
|---|---|---|
| 401 | non authentifie | `{ "error": "unauthorized" }` |
| 403 | role insuffisant | `{ "error": "forbidden", "missing": "catalog.job.run" }` |
| 404 | job inconnu | `{ "error": "not_found" }` |
| 409 | quota provider, conflit de retry | `{ "error": "provider_quota_exceeded" }` |
| 422 | payload invalide | `{ "error": "validation", "details": [...] }` |

## Fixtures

```json
[
  {
    "id": "00000000-0000-0000-0000-000000000301",
    "type": "GOOGLE_TEXT_SEARCH",
    "provider": "GOOGLE_PLACES",
    "status": "SUCCEEDED",
    "request": {
      "mode": "TEXT",
      "query": { "q": "rooftop casablanca", "countryCode": "MA", "cityCode": "CASABLANCA", "primaryCategoryHint": "NIGHTLIFE_VENUE" },
      "options": { "maxResults": 20, "refreshExisting": true, "autoCreateMappingsForApps": ["layali"] }
    },
    "result": { "candidatesFound": 12, "created": 5, "updated": 4, "archivedDuplicates": 1, "skipped": 2, "mappingsAffected": 3 },
    "progress": { "current": 12, "total": 12, "stepLabel": "details merged" },
    "requestedBy": "user-platform-admin-01",
    "startedAt": "2026-06-16T09:55:05+01:00",
    "finishedAt": "2026-06-16T09:57:25+01:00",
    "createdAt": "2026-06-16T09:55:02+01:00"
  },
  {
    "id": "00000000-0000-0000-0000-000000000302",
    "type": "GOOGLE_DETAILS_REFRESH",
    "provider": "GOOGLE_PLACES",
    "status": "FAILED",
    "request": { "catalogPlaceIds": ["00000000-0000-0000-0000-000000000101"], "refreshMedia": false, "refreshHours": true },
    "progress": { "current": 0, "total": 1, "stepLabel": "quota check" },
    "error": { "code": "provider_quota_exceeded", "message": "daily quota reached", "retryable": true },
    "requestedBy": "user-ops-02",
    "startedAt": "2026-06-16T11:00:00+01:00",
    "finishedAt": "2026-06-16T11:00:04+01:00",
    "createdAt": "2026-06-16T10:59:58+01:00"
  }
]
```

## Contraintes pour le futur backend reel

- Un job d'import ne doit jamais bloquer la reponse HTTP au temps du provider.
- Verrouillage idempotent : meme `Idempotency-Key` + meme payload doit retourner le meme `jobId` logique sur 24h.
- Gestion quota : backoff exponentiel sur erreurs transitoires, circuit breaker si quota atteint.
- Audit : stocker le payload d'entree nettoye, le resultat agrege et le `traceId` provider si disponible.

## Open questions

- Batch refresh nocturne par ville/app ou refresh incremental par `freshnessUntil` seulement ? Decision provisoire : incremental par `freshnessUntil`.
