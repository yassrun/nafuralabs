# Spring Application Base Template

This template is used to scaffold `backend/applications/<app>` modules.

Use:

```bash
node tools/naf/gen/create-application.mjs --app <app-id> [--port 8084]
```

The scaffold command reads CRUX manifests from:
- `naf/src/spec/applications/<app-id>/<app-id>.application.json`
- `naf/src/spec/applications/<app-id>/domains/*.domain.json`

Platform dependencies and security defaults are derived from
`application.capabilities` in the application manifest.
Datasource defaults are derived from
`application.components.backend.database` in the application manifest.

And generates:
- Backend app skeleton under `backend/applications/<app-id>/`
- Compatibility manifest copies under `backend/applications/<app-id>/src/main/resources/`
- `backend/settings.gradle` include entry: `:applications:<app-id>`
- Kubernetes backend manifests under `infra/k8s/base/`:
  - `<app-id>-backend-deployment.yaml`
  - `<app-id>-backend-service.yaml`
- Kubernetes wiring updates:
  - `infra/k8s/base/kustomization.yaml` resources
  - `infra/k8s/overlays/apps/<app-id>/kustomization.yaml` app overlay
  - `infra/k8s/overlays/dev-infra/kustomization.yaml` infra baseline
  - `infra/k8s/overlays/prod/kustomization.yaml` image tag entry
- PostgreSQL init DB registration in `infra/k8s/base/infra-postgres.yaml` when `components.backend.database.mode = "app"`
- Frontend application route composition files:
  - `web/app/applications/<app-id>/routes/<app-id>.routes.generated.ts`
  - `web/app/applications/routes.generated.ts`

