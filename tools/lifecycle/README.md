# Nafura Lifecycle - Database Migrations

Lifecycle is the dedicated migration component for the platform. It builds a Liquibase changelog from SQL files found in backend modules and runs them before application backends start.

## What It Does

1. Scans SQL migration sources in:
   - `platform/backend/**/src/main/resources/db`
   - `products/<app-id>/backend/**/src/main/resources/db`
   - `tools/lifecycle/src/main/resources/db`
2. Prefers `db/changelog/**/*.sql` for a module/feature (convention: `schema/v1.0/NNN_description.sql` and `data/v1.0/...`).
3. Falls back to `db/migration/**/*.sql` only when that module has **no** changelog SQL (legacy / third-party); platform modules use changelog only.
4. Copies selected SQL files to `build/migrations/...`.
5. Generates `build/changelog/db.changelog-master.yaml` with deterministic ordering.

## Build

```bash
# From repo root
./gradlew :tools:lifecycle:collectMigrations

# App-scoped collection (Gradle deps from products/<app-id>/backend/app/build.gradle)
./gradlew :tools:lifecycle:collectMigrations -PappId=sektor-btp

# Alias erp → sektor-btp
./gradlew :tools:lifecycle:collectMigrations -PappId=erp

# Optional: print collected files
./gradlew :tools:lifecycle:listMigrations
```

When `-PappId=<app-id>` is provided, lifecycle collects migrations from every `implementation project(':…')` dependency declared in `products/<app-id>/backend/app/build.gradle`, plus the app module itself and lifecycle tool migrations.

Without `-PappId`, lifecycle scans all platform backend modules that contain SQL under `src/main/resources/db`.

## Docker Image

```bash
# From repo root
docker build -t nafura-lifecycle:dev -f tools/lifecycle/Dockerfile tools/lifecycle/
```

## Run Locally

Use the app's database name (e.g. `nafura_erp` for Sektor BTP):

```bash
# Apply migrations
docker run --rm --network host nafura-lifecycle:dev \
  --url=jdbc:postgresql://localhost:5432/nafura_erp \
  --username=nafura \
  --password=nafura \
  --changeLogFile=changelog/db.changelog-master.yaml \
  update

# Inspect status
docker run --rm --network host nafura-lifecycle:dev \
  --url=jdbc:postgresql://localhost:5432/nafura_erp \
  --username=nafura \
  --password=nafura \
  --changeLogFile=changelog/db.changelog-master.yaml \
  status
```

## Kubernetes

Migrations run as **per-app jobs** (`<app-id>-lifecycle`). Use nlops:

```bash
ENV=staging bash toolchain/ops/nlops.sh onboard-app sektor-btp

# View logs of the last lifecycle job
kubectl logs job/sektor-btp-lifecycle -f
```

## Notes

- The backend init containers wait for Liquibase metadata table `databasechangelog` before app startup.
- Cross-module SQL should be kept under:
  - `tools/lifecycle/src/main/resources/db/changelog/schema/`
