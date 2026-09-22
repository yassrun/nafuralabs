# multi-tenant

Convenience aggregator for Layer-1 platform bricks:

- `tenancy`
- `identity`
- `authorization` (re-exports `authorization-api`)
- `scope`

## App recipes

| App type | Dependencies |
|----------|----------------|
| CRUD demo / showroom | `framework` only |
| Real multi-tenant product | `framework` + `multi-tenant` (+ feature modules) |

Features that only annotate controllers should depend on `authorization-api`, not this aggregator.
