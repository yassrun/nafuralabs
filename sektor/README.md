# Sektor BTP (ERP)

ERP BTP. Porte : [NAFURALABS.md](../NAFURALABS.md).  
Deploy : [nafura-platform/ops/AGENTS.md](../nafura-platform/ops/AGENTS.md).

## Structure

```
sektor/
├── raster-src/               # tickets SEKTOR-*
├── ops/                      # Dockerfiles + k8s/overlays/
├── e2e/                      # preuves — racine projet, pas sources/
└── sources/
    ├── backend/              # Gradle ici
    └── web/                  # package.json ici
```

## Build

```bash
cd sources/backend && ./gradlew :sektor:app:bootJar
cd ../web && npm run build:staging   # ou build:prod pour prod
```

## Cycle de vie

```bash
make -C nafura-platform/ops dev-up  SCOPE=front|back|full APP=sektor-btp   # locaux → infra staging (sans image)
make -C nafura-platform/ops stg-up  SCOPE=front|back|full APP=sektor-btp   # build + pods staging
REGISTRY_PASS=*** make -C nafura-platform/ops prod-up SCOPE=full APP=sektor-btp   # après OK staging
```

### Mode B + Cursor QA (skip Keycloak)

Contrat agents : [`.cursor/rules/cursor-qa-browser.mdc`](../.cursor/rules/cursor-qa-browser.mdc).

Un seul compte local pour humain + agents : **`qa@nafuralabs.local`** / tenant **`qa-local`**.
**Auto-login conservé** (`start:erp:cursor` → `POST /api/public/dev/cursor-session`). Pas de mot de passe, pas Keycloak.

Au boot (`NAFURA_DEV_CURSOR_AUTH_ENABLED=true`), `QaLocalProvisioner` (Java, idempotent) crée le tenant, l’owner (`OWNER` + `SUPER_ADMIN` + `BTP_INGENIEUR`), les **users par rôle** (ingénieur, conducteur, directeur, DAF, DG, chef de chantier, magasinier) et exécute le **même preset onboarding** qu’un owner réel (`applyPreset` / `seedReferenceData`) — sans wizard UI. Un employé RH est lié à chaque identité.

Le preset **ne contient pas** le graphe métier (chantier converti, BL, approbations) : ça se fabrique dans la preuve via l’API. Ne pas activer `NAFURA_DEMO_RUNTIME_SEED`.

```bash
make -C nafura-platform/ops mode-b
# → http://127.0.0.1:4200 auto-login owner
# Stop: make -C nafura-platform/ops mode-b-stop
```

API sans browser (back déjà up via `mode-b`) :

```bash
eval "$(bash nafura-platform/ops/qa-token.sh)"                 # owner
eval "$(bash nafura-platform/ops/qa-token.sh magasinier)"      # alias IAM
curl -s -H "Authorization: Bearer $TOKEN" -H "X-Tenant-Id: $TENANT_ID" "http://localhost:8082/api/..."
```

`cursor.qa@nafuralabs.local` est **déprécié** (remappé vers `qa@…`).  
Le flag `NAFURA_DEV_CURSOR_AUTH_ENABLED` ne doit **jamais** être activé sur les pods staging/prod.

## Deploy (bas niveau)

```bash
# 1× infra sur nouveau cluster staging
KUBE_CONTEXT=docker-desktop ENV=staging bash toolchain/ops/nlops.sh bootstrap-env

# 1× premier onboard
BUILD_IMAGES=true KUBE_CONTEXT=docker-desktop ENV=staging bash toolchain/ops/nlops.sh onboard-app sektor-btp

# = make -C nafura-platform/ops stg-up SCOPE=full
BUILD_IMAGES=true KUBE_CONTEXT=docker-desktop ENV=staging bash toolchain/ops/nlops.sh release-app sektor-btp
```

## Environnements

| Env | Cluster | Namespace | Web | API |
|-----|---------|-----------|-----|-----|
| staging | Docker Desktop | `sektor-staging` | `sektor.nafuralabs.staging` | `api.sektor.nafuralabs.staging` |
| prod | OVH VPS k3s | `sektor-prod` | `sektor.nafuralabs.com` | `api.sektor.nafuralabs.com` |

Infra partagée : `nafura-infra-${ENV}`. IAM staging : `iam.nafuralabs.staging`.

Hosts local : `powershell -ExecutionPolicy Bypass -File toolchain/ops/add-staging-hosts.ps1` (admin).

## DB

`nafura_erp` sur Postgres infra partagé.
