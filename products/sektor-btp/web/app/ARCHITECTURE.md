# Web workspace (Sektor)

Point d’entrée Angular pour **Sektor BTP**.

| Rôle | Emplacement |
|------|-------------|
| Bootstrap (`main.ts`, `app.config`) | `web/src/`, `web/app/` |
| Platform UI / shell | `platform/web/` → `@platform/*`, `@core/*`, `@lib/*`, `@features/*` |
| Métier ERP | `web/app/features/<domaine>/` → `@app/features/*` |
| Shell / shared app | `web/app/shell/`, `web/app/shared/`, `web/app/config/` |

## Features

Chaque domaine vit sous `app/features/<domaine>/` :

```
features/<domaine>/
├── <domaine>.routes.ts
├── models/          # optionnel (API models domaine)
├── services/        # optionnel
├── components/      # optionnel
└── pages/           # écrans, facades, configs listing/detail
```

Stock (ex-inventory) : `features/stock/` — routes URL `/stock/...`.

Guide monorepo : [docs/AGENTS.md](../../../../docs/AGENTS.md).
