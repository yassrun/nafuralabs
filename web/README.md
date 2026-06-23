# Frontend Structure

The frontend is moving to CRUX-aligned terminology and structure:

- `app/platform`: cross-application technical capabilities
- `app/platform/features`: cross-application platform features (collaboration, documents, ai, foundation, administration, etc.)
- `app/platform/features`: reusable business feature UIs
- `app/applications`: app-specific composition (shell, routes, theming, domains)

Current compatibility state:
- Legacy folders (`app/core`, `app/modules`, `app/shared`) remain active.
- `app/platform/*` provides migration-friendly entry points and aliases.
- `app/features/*` is a temporary compatibility shim.
- Terminology migration is in progress:
  - canonical: `application`, `feature`
  - legacy alias (temporary): `product`, `module`
