# Nafura Lifecycle - Database Migrations

Lifecycle is the dedicated migration component for the platform. It builds a Liquibase changelog from SQL files found in backend modules and runs them before application backends start.

## What It Does

1. Scans SQL migration sources in:
   - `backend/platform/*/src/main/resources/db`
   - `backend/features/*/src/main/resources/db`
   - `backend/tools/lifecycle/src/main/resources/db`
2. Prefers `db/changelog/**/*.sql` for a module/feature (convention: `schema/v1.0/NNN_description.sql` and `data/v1.0/...`).
3. Falls back to `db/migration/**/*.sql` only when that module has **no** changelog SQL (legacy / third-party); platform modules use changelog only.
4. Copies selected SQL files to `build/migrations/...`.
5. Generates `build/changelog/db.changelog-master.yaml` with deterministic ordering.

## Build

```bash
# From backend/
./gradlew :tools:lifecycle:collectMigrations

# App-scoped collection (CRUX app manifest driven)
./gradlew :tools:lifecycle:collectMigrations -PappId=<app-id>

# Optional: print collected files
./gradlew :tools:lifecycle:listMigrations
```

When `-PappId=<app-id>` is provided, lifecycle collects:
- platform migrations required by the app capabilities
- feature migrations referenced by `naf/src/spec/applications/<app-id>/**`
- lifecycle tool migrations
- optional app-local migrations under `backend/applications/<app-id>/src/main/resources/db`

## Docker Image

```bash
# From backend/
docker build -t nafura-lifecycle:dev -f tools/lifecycle/Dockerfile tools/lifecycle/
```

## Run Locally

Use the app's database name (e.g. `nafura_socle` for app `socle`):

```bash
# Apply migrations (replace nafura_socle with nafura_<app> for your app)
docker run --rm --network host nafura-lifecycle:dev \
  --url=jdbc:postgresql://localhost:5432/nafura_socle \
  --username=nafura \
  --password=nafura \
  --changeLogFile=changelog/db.changelog-master.yaml \
  update

# Inspect status
docker run --rm --network host nafura-lifecycle:dev \
  --url=jdbc:postgresql://localhost:5432/nafura_socle \
  --username=nafura \
  --password=nafura \
  --changeLogFile=changelog/db.changelog-master.yaml \
  status
```

## Kubernetes

Migrations run as **per-app jobs** (`<app-id>-lifecycle`). Use the gen runner:

```bash
# Run lifecycle (collect, build image, create job, wait) for an app
node tools/naf/gen/run.mjs lifecycle -D socle

# View logs of the last lifecycle job
kubectl logs job/socle-lifecycle -f
```

## Notes

- The backend init containers wait for Liquibase metadata table `databasechangelog` before app startup.
- Cross-module SQL should be kept under:
  - `backend/tools/lifecycle/src/main/resources/db/changelog/schema/`
