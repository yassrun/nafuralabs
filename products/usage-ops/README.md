# usage-ops

Console Nafura ops pour monitorer la consommation **AI (LLM)** et **storage (MinIO / documents)** par tenant, cross-produit.

## Périmètre V1

- Audience : super-admin Nafura ops uniquement
- Dashboard fleet + détail tenant
- Quotas soft (seuils WARN / BREACH) + alertes email — **sans** blocage upload/LLM
- Produits fédérés : `sektor-btp`, `build-intelligence`

## Architecture

Chaque produit expose `/api/v1/platform/usage/**` (module platform `administration/usage`).
`usage-ops` agrège via HTTP (JWT super-admin forwardé) et stocke quotas/alertes dans `nafura_usage_ops`.

## Auth

Login Keycloak (PKCE) via client public `usage-ops-web`, realm `iam-portal`.

Compte ops seedé :

- email : `super.admin@nafuralabs.com`
- rôle realm : `SUPER_ADMIN`
- mot de passe initial realm : `ChangeMe@123!` (souvent temporary → Keycloak force le reset)

## Local

```bash
./gradlew :usage-ops:app:bootJar
# UI : products/usage-ops/web/dist (servie via nginx image ou fichier local)
```

Config (`application.yml`) :

- `USAGE_OPS_SEKTOR_BASE_URL` (défaut `http://localhost:8082`)
- `USAGE_OPS_BI_BASE_URL` (défaut `http://localhost:8086`)
- `USAGE_OPS_ALERT_RECIPIENTS` (emails séparés par virgule)

Port backend : **8087**.

## Deploy

```bash
BUILD_IMAGES=true KUBE_CONTEXT=docker-desktop ENV=staging \
  bash toolchain/ops/nlops.sh onboard-app usage-ops
```

Staging host : `http://usage-ops.nafuralabs.staging`

## APIs ops

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/ops/tenants` | Union tenants produits |
| GET | `/api/v1/ops/usage/overview` | Fleet usage |
| GET | `/api/v1/ops/usage/tenants/{id}` | Détail tenant |
| GET/POST/PUT/DELETE | `/api/v1/ops/quotas` | Soft quotas CRUD |
| GET | `/api/v1/ops/alerts` | Alertes actives |
| POST | `/api/v1/ops/alerts/dismiss` | Dismiss |
| POST | `/api/v1/ops/alerts/evaluate` | Évalue seuils (forward JWT) |
