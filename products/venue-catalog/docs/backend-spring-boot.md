---
specVersion: 1
kind: technical-spec
appId: venue-catalog
docId: backend-spring-boot
name: Backend Spring Boot — Venue Catalog
status: draft
language: fr
---

# Backend Spring Boot — Venue Catalog

Specification technique du service `venue-catalog-backend` : modular monolith Spring Boot 3, persistance PostgreSQL, cache jobs Redis, medias Google Places via MinIO.

Voir aussi :
- [architecture.svg](architecture.svg)
- [media-pipeline.md](media-pipeline.md)
- [collection-campaigns.md](collection-campaigns.md)

## 1. Stack

| Composant | Choix | Version cible |
|---|---|---|
| Runtime | Java | 21 |
| Framework | Spring Boot | 3.4.x (aligné nafuralabs / Sektor) |
| Build | Gradle (Kotlin DSL) | 8.x |
| API | Spring Web MVC + validation | — |
| Persistance | Spring Data JPA + Flyway | — |
| Base | PostgreSQL | 16 |
| Cache / locks jobs | Redis | 7 |
| Object storage | MinIO via `:platform:features:collaboration:doc-manager` | — |
| Auth | Keycloak resource server (JWT) | realm `nafura` |
| Observabilite | Actuator + Micrometer + OpenTelemetry | — |
| Tests | JUnit 5, Testcontainers, MockWebServer (Google) | — |

## 2. Structure Gradle

Racine monorepo : `nf/nafuralabs/` — modules sous `products/venue-catalog/backend/`.

```
products/venue-catalog/
├── docs/                         # specs produit (ce dossier)
├── backend/
│   ├── app/                      # :venue-catalog:app — Spring Boot bootJar
│   └── modules/
│       ├── api/                  # controllers REST, DTOs
│       ├── source-adapter/       # Google Places client
│       ├── catalog-place/
│       ├── catalog-job/
│       ├── catalog-mapping/      # wp-02
│       ├── publish-gateway/      # wp-02
│       └── compliance/           # media policy, attribution
├── web/                          # admin Angular (optionnel wp-01)
├── deploy/k8s/                   # namespace nafura-venue-catalog
└── Dockerfile
```

### Dependances entre modules

```
:venue-catalog:app → api → catalog-job, catalog-place, catalog-mapping, publish-gateway
catalog-job → source-adapter, catalog-place, compliance
catalog-place → compliance
source-adapter → :platform:integrations:google-places
* → :platform:core:authorization, :platform:core:identity
compliance → :platform:features:collaboration:doc-manager
```

Regle : **aucun domaine ne depend de `api`**. Les controllers appellent des use cases exposes par les domaines.

## 3. Architecture hexagonale par domaine

Chaque module domaine suit :

```
domain/
  model/          # aggregates, value objects, enums
  port/in/        # use cases (interfaces)
  port/out/       # repositories, providers (interfaces)
application/
  service/        # implementation use cases
adapter/
  persistence/    # JPA entities, repositories
  rest/           # optionnel si DTO local
```

Le module `api` contient uniquement les adapters REST et la conversion DTO <-> domaine.

## 4. Module bootstrap

### Responsabilites

- `@SpringBootApplication` unique
- Scan des beans `com.nafura.venuecatalog.**`
- Configuration `application.yml` / profils `local`, `staging`, `prod`
- Security filter chain Keycloak
- Flyway migrations (`classpath:db/migration`)
- Scheduling (`@EnableScheduling`) pour purge media TTL

### Configuration cle (`application.yml`)

```yaml
venue-catalog:
  timezone: Africa/Casablanca
  dedupe:
    geo-round-decimals: 4
    confidence-review-threshold: 0.85
  media:
    max-photos-per-place: 5
    fetch-max-width-px: 1600
  jobs:
    idempotency-ttl-hours: 24
    inter-request-delay-ms: 2000

spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/venue_catalog
  data:
    redis:
      host: localhost
      port: 6379

nafura:
  storage:
    bucket: venue-catalog-media
    public-read-signed-url-ttl-minutes: 60
  google-places:
    api-key: ${GOOGLE_PLACES_API_KEY}
    field-masks:
      search: places.id,places.displayName,places.formattedAddress,places.location,places.types,places.primaryType,places.businessStatus
      details: id,displayName,formattedAddress,addressComponents,location,types,primaryType,businessStatus,nationalPhoneNumber,websiteUri,googleMapsUri,regularOpeningHours,rating,userRatingCount,priceLevel,photos,accessibilityOptions,reservable,servesBeer,servesWine,servesCocktails,outdoorSeating,liveMusic
```

## 5. Module api — controllers V1 (wp-01)

| Controller | Base path | Roles |
|---|---|---|
| `CatalogPlacesController` | `/api/v1/catalog/places` | PLATFORM_ADMIN, CATALOG_OPERATOR, APP_EDITOR |
| `CatalogJobsController` | `/api/v1/catalog/jobs` | PLATFORM_ADMIN, CATALOG_OPERATOR (+ read APP_EDITOR) |
| `HealthController` | `/actuator/health` | public |

Contrats : [catalog-places.api.md](api/catalog-places.api.md), [catalog-jobs.api.md](api/catalog-jobs.api.md).

### Cross-cutting API

- `SecurityFilter` : JWT Keycloak, extraction roles
- `IdempotencyFilter` : header `Idempotency-Key` sur `POST /jobs/*`
- `GlobalExceptionHandler` : format erreur [mock-api.md](mock-api.md)
- Validation Jakarta sur request DTOs

## 6. Module source-adapter

### Port sortant `PlaceProviderPort`

```java
public interface PlaceProviderPort {
  SearchResult searchText(TextSearchQuery query);
  SearchResult searchNearby(NearbySearchQuery query);
  PlaceDetails fetchDetails(String providerPlaceId, FieldMask mask);
  byte[] fetchPhoto(String photoResourceName, int maxWidthPx);
}
```

Implementation : `GooglePlacesAdapter` delegue a `:platform:integrations:google-places`.

### Responsabilites

- Appels Text Search, Nearby Search, Place Details, Place Photos
- Retry exponentiel sur 429/5xx
- Mapping reponse Google -> `RawPlaceCandidate`, `RawPlaceDetails`
- **Ne pas** persister ; retourne des objets domaine neutres

## 7. Module catalog-job

### Aggregate `CatalogJob`

Aligne sur [catalog-jobs.api.md](api/catalog-jobs.api.md).

### Use cases wp-01

| Use case | Declencheur |
|---|---|
| `StartGooglePlacesSearchJob` | `POST /jobs/google-places-search` |
| `StartGooglePlacesRefreshJob` | `POST /jobs/google-places-refresh` |
| `GetJob`, `ListJobs` | GET |

### Orchestration async

1. Controller cree job `QUEUED`, retourne `202`
2. `JobRunner` (platform) ou `@Async` + Redis lock consomme le job
3. Etapes avec `progress.stepLabel` :
   - `SEARCH_PROVIDER`
   - `FETCH_DETAILS` (pour chaque candidat)
   - `SYNC_MEDIA` (si `refreshMedia=true` ou creation)
   - `UPSERT_PLACES`
4. Termine en `SUCCEEDED`, `PARTIAL` ou `FAILED`

Idempotence : cle `(Idempotency-Key, jobType, payloadHash)` en Redis 24h.

## 8. Module catalog-place

### Aggregate `CatalogPlace`

Table `catalog_places` + tables liees.

### Use cases wp-01

| Use case | Description |
|---|---|
| `UpsertFromProvider` | Normalise `RawPlaceDetails`, dedupe, INSERT/UPDATE |
| `ListPlaces`, `GetPlace` | Lecture admin |
| `PatchPlace` | wp-02 |
| `ApprovePlace`, `ArchivePlace` | wp-02 |

### Normalisation

| Champ Google | Champ canonique |
|---|---|
| `displayName` | `canonicalName` |
| `types` / `primaryType` | `providerTypes[]` + `primaryCategory` (regles mapping) |
| `addressComponents` | `address` |
| `location` | `geo` |
| `regularOpeningHours` | `openingHours[]` |
| `nationalPhoneNumber` | `contact.phoneE164` |
| `websiteUri` | `contact.websiteUrl` |
| `googleMapsUri` | `contact.mapUrl` |
| `rating`, etc. | `providerRating` |

### Dedupe

Cle logique : `(normalize(canonicalName), round(geo,4), cityCode, primaryCategory)`.

Si match partiel -> `quality.duplicateCandidateIds[]`, `manualReviewRequired=true`.

## 9. Module compliance (wp-01 scope media)

Voir [media-pipeline.md](media-pipeline.md).

- `MediaComplianceService` : valide import photo Google
- `MediaRetentionScheduler` : purge objets MinIO expires
- Attribution obligatoire sur toute URL servie

## 10. Schema PostgreSQL (wp-01)

### `catalog_places`

| Colonne | Type | Notes |
|---|---|---|
| id | UUID PK | |
| canonical_name | VARCHAR(255) | |
| status | VARCHAR(32) | DRAFT, ENRICHED, ... |
| country_code | CHAR(2) | |
| city_code | VARCHAR(32) | |
| primary_category | VARCHAR(64) | |
| provider_types | JSONB | |
| address | JSONB | |
| geo | JSONB | `{lat,lng}` |
| contact | JSONB | |
| opening_hours | JSONB | |
| provider_rating | JSONB | |
| attributes | JSONB | |
| quality | JSONB | |
| created_at, updated_at | TIMESTAMPTZ | |

### `catalog_place_media`

| Colonne | Type | Notes |
|---|---|---|
| id | UUID PK | |
| catalog_place_id | UUID FK | |
| source | VARCHAR(32) | `GOOGLE_PLACES` |
| storage_key | VARCHAR(512) | cle MinIO |
| public_url | TEXT | URL signee ou CDN |
| width, height | INT | |
| attribution_text | VARCHAR(255) | |
| reusable | BOOLEAN | defaut `false` |
| provider_photo_ref | VARCHAR(255) | ref Google opaque |
| expires_at | TIMESTAMPTZ | TTL cache |
| sort_order | SMALLINT | |
| created_at | TIMESTAMPTZ | |

### `catalog_place_source_records`

| Colonne | Type | Notes |
|---|---|---|
| id | UUID PK | |
| catalog_place_id | UUID FK | |
| provider | VARCHAR(32) | |
| external_id | VARCHAR(128) | google place id — jamais expose consumer |
| fetched_at | TIMESTAMPTZ | |
| freshness_until | TIMESTAMPTZ | |
| raw_checksum | VARCHAR(128) | |

### `catalog_jobs`

| Colonne | Type | Notes |
|---|---|---|
| id | UUID PK | |
| type | VARCHAR(64) | |
| provider | VARCHAR(32) | |
| status | VARCHAR(32) | |
| request | JSONB | |
| result | JSONB | |
| progress | JSONB | |
| error | JSONB | |
| requested_by | VARCHAR(128) | |
| idempotency_key | VARCHAR(128) UNIQUE nullable | |
| started_at, finished_at | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ | |

### `provider_raw_payloads` (optionnel wp-01)

Retention 30 jours, JSONB compresse, acces admin audit seulement.

## 11. Redis

| Cle | Usage | TTL |
|---|---|---|
| `catalog:job:lock:{jobId}` | verrou execution | 30 min |
| `catalog:idempotency:{key}` | reponse job duplique | 24 h |
| `catalog:google:quota:backoff` | pause imports si 429 | variable |

## 12. Securite

- Tous endpoints `/api/v1/catalog/**` sauf health : JWT requis
- Roles extraits du claim Keycloak `realm_access.roles`
- Pas de `googlePlaceId` dans les reponses publiques futures (wp-02 consumer)
- URLs MinIO : signees, TTL court (60 min defaut)

## 13. Tests wp-01

| Niveau | Cible |
|---|---|
| Unit | normalisation, dedupe, mapping horaires, media policy |
| Integration | Testcontainers PG + Redis + MinIO ; MockWebServer Google |
| API | MockMvc controllers, contrats api.md |
| E2E manuel | import campagne `rooftop casablanca` |

## 14. Livrables wp-01

- [ ] App Spring Boot demarrable localement (Docker Compose : PG, Redis, MinIO)
- [ ] Flyway V1 migrations
- [ ] Endpoints jobs + places conformes api.md
- [ ] Pipeline media Google -> MinIO (max 5 photos/lieu)
- [ ] Ecran admin Angular `catalog-search` connecte au backend reel
- [ ] Import campagne Casa Beauty (pack pilote) operationnel

## 15. Hors scope wp-01

- `catalog-mapping`, `publish-gateway` (wp-02)
- Ecran `catalog-place-review` complet
- Projection consumer Layali/Beauty
