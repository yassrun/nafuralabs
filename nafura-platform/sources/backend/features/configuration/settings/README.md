# Platform Settings Module

This module provides standardized settings management for all applications.

Core concepts:
- `setting_definition`: canonical metadata for a setting key.
- `setting_definition_scope`: supported scopes per key.
- `setting_value`: runtime values stored by scope.

Scope precedence used by resolver:
1. `TENANT_USER`
2. `USER`
3. `TENANT`
4. `APPLICATION`
5. definition default value

Design note:
- Tenant/user integration is optional.
- No foreign keys to tenancy or identity tables.
- Works in mono-tenant and multi-tenant apps.
