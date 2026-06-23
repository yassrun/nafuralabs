# Platform Features

Reusable platform feature modules shared across applications.

Structure:
- `foundation/*`: shared foundational business capabilities (`geo`, `measurement`, `financial`).
- `business/*`: core business capabilities (`item`, `inventory`, `partner`).
- `administration/*`: control-plane capabilities (`tenant-admin`, `subscription`).
- `configuration/*`: configuration capabilities (`settings`, `sysconfig`).

Application-specific composition (pages/routes/facades) must remain under:
- `web/app/applications/<app-id>/...`
