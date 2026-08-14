# Subscription Module

This module owns subscription plans, assignments, entitlements, and on-prem licenses.

Goals:
- Keep subscription logic independent from tenancy and authorization ownership.
- Support both SaaS and on-prem enterprise licensing.
- Allow assignment scope per app: `user`, `tenant`, or `hybrid`.

Data model highlights:
- `subscription_plan`: defines plan metadata and delivery model.
- `subscription_entitlement`: defines feature/domain/resource gates per plan.
- `subscription_assignment`: binds a plan to an owner (`user` or `tenant`).
- `on_prem_license`: stores validated on-prem license artifacts.

Notes:
- No hard foreign keys to other platform module tables by design.
- External owners are referenced by `ownerType + ownerId`.

Security integration:
- `@RequireEntitlement("domain.feature.resource.action")` enforces plan checks per endpoint.
- Entitlement owner resolution supports `AUTO`, `USER`, and `TENANT`.
- Enforcement runs after authentication and RBAC permission checks.
