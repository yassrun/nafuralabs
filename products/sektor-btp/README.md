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

**Bootstrap infra** — une seule fois sur un nouveau cluster staging :

```bash
ENV=staging bash toolchain/ops/nlops.sh bootstrap-env
```

**Premier déploiement Sektor** sur cet env :

```bash
ENV=staging bash toolchain/ops/nlops.sh onboard-app sektor-btp
```

**Releases suivantes** (infra déjà en place) :

```bash
ENV=staging bash toolchain/ops/nlops.sh deploy sektor-btp
```

Ou : `make deploy APP=sektor-btp ENV=staging`

## Environnements

| Env | Cluster | Namespace app |
|-----|---------|-----------------|
| staging | K8s local | `nafura-sektor` |
| prod | GKE | `nafura-sektor` |

Infra partagée : `nafura-infra` (postgres, keycloak, minio, redis).

## Hostnames

| Env | Web | API |
|-----|-----|-----|
| staging | [sektor.nafuralabs.staging](http://sektor.nafuralabs.staging) | `api.sektor.nafuralabs.staging` |
| prod | [sektor.nafuralabs.com](https://sektor.nafuralabs.com) | `api.sektor.nafuralabs.com` |

Ajouter dans `/etc/hosts` (staging local) : `127.0.0.1 sektor.nafuralabs.staging api.sektor.nafuralabs.staging`

## DB

Nom conservé pour compatibilité prod : **`nafura_erp`**.
