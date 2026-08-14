# Sektor BTP — Spring Boot application (`:sektor:app`)

Boot module ERP. Domaine : `sektor/sources/backend/<nom>`.

## Build

```bash
# depuis sektor/
.\gradlew.bat :sektor:app:bootJar
```

## Deploy

Manifests : `sektor/deploy/k8s/` — namespace `sektor-${ENV}`.

```bash
ENV=staging bash toolchain/ops/nlops.sh release-app sektor-btp
```

Référence : [toolchain/ops/AGENTS.md](../../../../toolchain/ops/AGENTS.md).
