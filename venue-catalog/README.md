# Venue Catalog

Service interne de collecte, normalisation et revue de lieux (Google Places → catalogue canonique → Layali, Beauty, …).

**Statut :** backend wp-01 implémenté (Spring Boot modular monolith).

Porte du workspace : [NAFURALABS.md](../NAFURALABS.md).

## Build backend

```bash
cd C:\nf\nafuralabs
docker compose -f venue-catalog/docker-compose.yml up -d
cd venue-catalog/sources/backend && .\gradlew.bat :venue-catalog:app:bootJar
java -jar sources/backend/app/build/libs/venue-catalog-0.1.0-SNAPSHOT.jar
```

Variables utiles : `GOOGLE_PLACES_API_KEY`, `POSTGRES_HOST=localhost`, `POSTGRES_DB=nafura_venue_catalog`, `REDIS_HOST=localhost`, `REDIS_PORT=6380`.

## Stack cible

| Composant | Version |
|-----------|---------|
| Java | 21 |
| Spring Boot | 3.4.x (aligné nafuralabs) |
| PostgreSQL | 16 (`nafura_venue_catalog`) |
| Redis | 7 (jobs) |
| MinIO | bucket `venue-catalog-media` |

## Documentation

| Doc | Sujet |
|-----|-------|
| [docs/app.md](docs/app.md) | Vision, personas, périmètre |
| [docs/backend-spring-boot.md](docs/backend-spring-boot.md) | Architecture backend, modules Gradle |
| [docs/media-pipeline.md](docs/media-pipeline.md) | Photos Google → MinIO |
| [docs/collection-campaigns.md](docs/collection-campaigns.md) | Campagnes import Maroc |
| [docs/architecture.svg](docs/architecture.svg) | Diagramme |
| [docs/api/](docs/api/) | Contrats REST |
| [docs/work-packages/wp-01-google-places-foundation.wp.md](docs/work-packages/wp-01-google-places-foundation.wp.md) | Premier livrable |

## Structure cible (pas encore scaffoldée)

```
venue-catalog/
├── docs/
├── sources/backend/   # :venue-catalog:* (app + modules)
├── sources/web/       # admin Angular
└── ops/k8s/
```


## K8s (futur)

- Namespace : `venue-catalog-${ENV}`
- DB : `nafura_venue_catalog` sur Postgres `nafura-infra-${ENV}`
- Envs : `staging` | `prod` uniquement
