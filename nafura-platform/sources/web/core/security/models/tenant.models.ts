/**
 * Tenant Models
 *
 * Multi-tenant types for the authentication system.
 */

import { Role, Permission } from './user.models';

// ─────────────────────────────────────────────────────────────────────────────
// Tenant Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tenant status.
 */
export type TenantStatus = 'active' | 'suspended' | 'inactive';

/**
 * Tenant entity.
 */
export interface Tenant {
  /** Unique tenant identifier */
  id: string;

  /** Tenant name */
  name: string;

  /** URL-safe slug */
  slug: string;

  /** Tenant status */
  status: TenantStatus;

  /** Enabled feature IDs (canonical) */
  enabledFeatures: string[];

  /**
   * Enabled module IDs (legacy alias).
   * @deprecated Use enabledFeatures.
   */
  enabledModules: string[];

  /** Feature flags */
  features: Record<string, boolean | string | number>;

  /** Branding configuration */
  branding?: TenantBranding;

  /** Metadata */
  createdAt: string;
  updatedAt: string;
}

/**
 * Tenant branding.
 */
export interface TenantBranding {
  primaryColor?: string;
  logoUrl?: string;
  faviconUrl?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tenant Membership Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * User's membership in a tenant.
 */
export interface TenantMembership {
  /** Tenant information */
  tenant: Tenant;

  /** User's roles in this tenant */
  roles: Role[];

  /** Computed: all permissions from roles */
  permissions: Permission[];

  /** Is default tenant for user */
  isDefault: boolean;

  /** Membership status */
  status: 'active' | 'invited' | 'suspended';

  /** Join date */
  joinedAt: string;
}

/**
 * Tenant context for current session.
 */
export interface TenantContext {
  /** Current tenant */
  tenant: Tenant;

  /** User's roles in tenant */
  roles: string[];

  /** User's permissions in tenant */
  permissions: Set<Permission>;

  /** Enabled features (canonical) */
  enabledFeatures: Set<string>;

  /**
   * Enabled modules (legacy alias).
   * @deprecated Use enabledFeatures.
   */
  enabledModules: Set<string>;

  /** Feature flags */
  features: Record<string, boolean | string | number>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tenant Utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check if tenant has a specific feature enabled.
 */
export function isTenantFeatureEnabled(
  tenant: Tenant,
  featureId: string
): boolean {
  return tenant.enabledFeatures.includes(featureId) || tenant.enabledModules.includes(featureId);
}

/**
 * Legacy helper retained for compatibility.
 * @deprecated Use isTenantFeatureEnabled.
 */
export function isTenantModuleEnabled(
  tenant: Tenant,
  moduleId: string
): boolean {
  return isTenantFeatureEnabled(tenant, moduleId);
}

/**
 * Get feature flag value with default.
 */
export function getTenantFeature<T>(
  tenant: Tenant,
  key: string,
  defaultValue: T
): T {
  const value = tenant.features[key];
  return value !== undefined ? (value as T) : defaultValue;
}
