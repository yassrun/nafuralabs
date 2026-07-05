# Sektor BTP — Spring Boot application (`:sektor:app`)

Boot module ERP. Domaine : `products/sektor-btp/backend/modules/*`.

## Build

```bash
.\gradlew.bat :sektor:app:bootJar
```

## Deploy

Manifests : `products/sektor-btp/deploy/k8s/` — namespace `sektor-${ENV}`.

```bash
ENV=staging bash toolchain/ops/nlops.sh release-app sektor-btp
```

Référence : [toolchain/ops/AGENTS.md](../../../../toolchain/ops/AGENTS.md).
