# Sektor BTP (ERP)

ERP BTP migré depuis `nf/nafura`. Guide monorepo : [docs/README.md](../../docs/README.md).

## Structure

```
sektor-btp/
├── backend/
│   ├── app/              # Spring Boot (:sektor:app)
│   └── modules/          # 13 domaines BTP (:sektor:item, :sektor:stock, …)
├── web/app/              # UI Angular (@applications/erp paths → ./app)
├── deploy/k8s/           # overlays staging | prod, namespace nafura-sektor
├── sektor-btp.application.json   # référence lifecycle (à remplacer par code)
└── docs/
```

## Build backend

```bash
cd C:\nf\nafuralabs
.\gradlew.bat :sektor:app:bootJar
```

## Build frontend

```bash
cd C:\nf\nafuralabs\web
npm install
npm run build:prod
```

## Deploy (staging)

```bash
ENV=staging bash toolchain/ops/nlops.sh infra-up
bash toolchain/ops/nlops.sh provision-db sektor-btp   # DB: nafura_erp
bash toolchain/ops/nlops.sh migrate sektor-btp
bash toolchain/ops/nlops.sh deploy sektor-btp
```

## Environnements

| Env | Cluster | Namespace app |
|-----|---------|-----------------|
| staging | K8s local | `nafura-sektor` |
| prod | GKE | `nafura-sektor` |

Infra partagée : `nafura-infra` (postgres, keycloak, minio, redis).

## DB

Nom conservé pour compatibilité prod : **`nafura_erp`**.
