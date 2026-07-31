# Frontend Platform

Technical, cross-application frontend modules. **No product métier** (ERP/BTP) — that lives under `products/<app>/`.

| Folder | Role |
|--------|------|
| `lib/` | Design system / anatomy primitives (`@lib/*`) |
| `core/` | Runtime: security, tenancy, navigation, i18n, layouts, shell chrome (`@core/*`) |
| `features/` | Reusable platform capabilities (`@features/*`): administration, collaboration, documents engine, AI UI, approvals, notifications, configuration, app-settings, user-settings |

Product UI (Sektor, etc.): `products/<app-id>/web/app/`.

Dependency rule: **application → platform only** (never the reverse). See [docs/AGENTS.md](../../docs/AGENTS.md) and [docs/PLATFORM_IMPORTS.md](../../docs/PLATFORM_IMPORTS.md).
