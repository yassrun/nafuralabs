# Frontend I18n Layers

Translation loading is layered with deterministic override order:

1. `core` (platform/common UI strings)
2. `features` (feature-owned strings)
3. `domains` (domain composition strings)
4. `applications` (app branding/overrides)

Later layers override earlier keys on conflict.

## File locations

- Core:
  - `public/assets/i18n/core/<lang>.json`
- Features:
  - `public/assets/i18n/<feature-path>/<lang>.json`
- Domains:
  - `public/assets/i18n/domains/<domain-id>/<lang>.json` (recommended convention)
- Applications:
  - `public/assets/i18n/applications/<app-id>/<lang>.json`

## Runtime config

Layer declarations are configured in:

- `web/app/app.config.ts` via `TRANSLATION_LAYERS`

Loader implementation:

- `web/app/platform/core/i18n/i18n.module-loader.ts`

## CRUX policy

- Feature manifests own feature vocabulary.
- App/domain composition may add overlays without duplicating feature packs.
- App packs are optional overlays, safe when absent.

