# ERP lookup → listing shortcuts

Select fields that load reference data (`lookupKey`) show an **eye** shortcut to open the related **listing** in a new tab.

## Resolution order

1. `referenceRoute` or `listRoute` on the field config (explicit override)
2. `ERP_LOOKUP_LIST_ROUTES[lookupKey]` in `erp-lookup-list-routes.ts`
3. No button if no route is defined

## Where it is wired

| Component | Usage |
|-----------|--------|
| `nf-select` | `lookupKey="clients"` or `listRoute="/ventes/clients"` |
| `nf-entity-detail` | Auto from `lookupKey` / `referenceRoute` / `listRoute` |

## Example keys

- **clients** → `/ventes/clients`
- **chantiers** → `/chantiers`
- **fournisseurs** → `/achats/fournisseurs`
- **items** → `/inventory/catalogue/items`
- **employes** → `/rh/employes`

See `erp-lookup-list-routes.ts` for the full map.
