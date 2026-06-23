# Sektor BTP — Spring Boot application (`:sektor:app`)

Boot module for the ERP. Domain logic lives in `products/sektor-btp/backend/modules/*`.

## Build

```bash
cd C:\nf\nafuralabs
.\gradlew.bat :sektor:app:bootJar
```

## Deploy (K8s)

Manifests: `products/sektor-btp/deploy/k8s/` (namespace `nafura-sektor`).

```bash
ENV=staging bash toolchain/ops/nlops.sh onboard-app sektor-btp   # first time
ENV=staging bash toolchain/ops/nlops.sh deploy sektor-btp        # releases
```

Shared infra (Postgres, Keycloak, MinIO) is under `infra/k8s/` — bootstrap once per env via `bootstrap-env`, not per product deploy.

See [toolchain/ops/README.md](../../../toolchain/ops/README.md).
