# Venue Catalog Web

Angular console for catalog operators (search / import / place review).

## Mode B (local)

```bash
# Terminal 1 — backend on :8085 (infra staging PF as needed)
make -C nafura-platform/ops dev-up SCOPE=back APP=venue-catalog
cd venue-catalog && ./gradlew.bat :venue-catalog:app:bootRun

# Terminal 2 — UI
cd venue-catalog/web
npm start
```

Open http://127.0.0.1:4210 — staging-local uses `useDevJwt` (HS256) against the local backend.

## Scripts

| Script | Description |
|---|---|
| `npm start` | `ng serve` staging-local + proxy `/api` → `127.0.0.1:8085` |
| `npm run build:staging` | Build for `catalog.nafuralabs.staging` |
| `npm run build:prod` | Build for production |

## Auth

- Client Keycloak: `venue-catalog-web` (realm `iam-portal`)
- Roles: `CATALOG_OPERATOR`, `PLATFORM_ADMIN`
- Staging-local: auto-minted HS256 JWT (`venue-catalog.dev-jwt`)
