# Frontend Platform

Technical, cross-application frontend modules live here.

Canonical subfolders:
- `lib`: reusable UI/design system primitives.
- `core`: platform runtime, security, tenancy, navigation, i18n, layout, and shared infrastructure.
- `features`: reusable platform feature modules grouped by capability family:
  - `collaboration`: notification, doc-manager, audit, comment, workflow, tagging
  - `documents`: doc-extractor
  - `ai`: llm-provider, ai-conversation, ai-agent-runtime
  - `foundation`: shared foundational capabilities (`geo`, `measurement`, `financial`)
  - `business`: operational business capabilities (`item`, `inventory`, `partner`)
  - `administration`: control-plane capabilities (`tenant-admin`, `subscription`)
  - `configuration`: configuration capabilities (`settings`, `sysconfig`)

Business features are now owned under `web/app/platform/features`.
