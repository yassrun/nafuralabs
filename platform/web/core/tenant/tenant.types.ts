/**
 * Tenant Types
 * 
 * Multi-tenant configuration types.
 * Tenants can have different types, enabled features, and feature flags.
 */

/**
 * Tenant type classification.
 * Used for segmentation and tenant-level access policies.
 */
export type TenantType = 'standard' | 'business' | 'enterprise' | 'custom';

/**
 * Feature enablement status for a tenant.
 */
export interface TenantFeatureConfig {
  /** Feature identifier (canonical) */
  featureId: string;

  /**
   * Legacy alias for featureId.
   * @deprecated Use featureId.
   */
  moduleId?: string;

  /** Is the feature enabled for this tenant */
  enabled: boolean;

  /** Feature-specific configuration overrides */
  config?: Record<string, unknown>;

  /** Optional expiration date for temporary access */
  expiresAt?: Date;
}

/**
 * Legacy alias retained during terminology migration.
 * @deprecated Use TenantFeatureConfig.
 */
export type TenantModuleConfig = TenantFeatureConfig;

/**
 * Tenant feature flags.
 * Fine-grained control over specific behavior within features.
 */
export interface TenantFeatureFlags {
  [featureKey: string]: boolean | string | number;
}

/**
 * Core tenant model.
 */
export interface Tenant {
  /** Unique tenant identifier */
  id: string;

  /** Display name */
  name: string;

  /** URL-safe slug for routing */
  slug: string;

  /** Tenant type */
  type: TenantType;

  /**
   * Application this tenant belongs to (e.g., "doxura", "agora").
   */
  applicationId?: string;

  /**
   * Legacy alias for applicationId.
   * @deprecated Use applicationId.
   */
  productId?: string;

  /** 
   * Enabled features configuration (canonical).
   */
  featuresConfig: TenantFeatureConfig[];

  /**
   * Legacy alias for featuresConfig.
   * @deprecated Use featuresConfig.
   */
  modules: TenantModuleConfig[];

  /** Feature flags */
  featureFlags: TenantFeatureFlags;

  /** Tenant-specific branding */
  branding?: TenantBranding;

  /** Is tenant active */
  isActive: boolean;

  /** Metadata */
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Tenant branding configuration.
 */
export interface TenantBranding {
  /** Primary brand color */
  primaryColor?: string;

  /** Logo URL */
  logoUrl?: string;

  /** Favicon URL */
  faviconUrl?: string;

  /** Custom CSS overrides */
  customCss?: string;
}

/**
 * Tenant context for the current session.
 * Minimal data needed for navigation and permission checks.
 */
export interface TenantContext {
  /** Current tenant */
  tenant: Tenant;

  /** Quick lookup: enabled feature IDs (canonical) */
  enabledFeatureIds: Set<string>;

  /**
   * Quick lookup: enabled module IDs (legacy alias).
   * @deprecated Use enabledFeatureIds.
   */
  enabledModuleIds: Set<string>;

  /** Quick lookup: feature flags */
  featureFlags: TenantFeatureFlags;

  /** Is tenant in temporary mode */
  isTemporary: boolean;

  /** User's permissions in this tenant (loaded from server) */
  permissions: Set<string>;

  /** Permission version - incremented when permissions change */
  permVersion: number;
}

/**
 * Tenant selector item for multi-tenant users.
 */
export interface TenantSelectorItem {
  id: string;
  name: string;
  slug: string;
  type: TenantType;
  logoUrl?: string;
}

/**
 * Helper to check if a feature is enabled for a tenant.
 */
export function isFeatureEnabled(context: TenantContext, featureId: string): boolean {
  return context.enabledFeatureIds.has(featureId);
}

/**
 * Legacy helper retained for compatibility.
 * @deprecated Use isFeatureEnabled.
 */
export function isModuleEnabled(context: TenantContext, moduleId: string): boolean {
  return context.enabledFeatureIds.has(moduleId) || context.enabledModuleIds.has(moduleId);
}

/**
 * Helper to get feature flag value with default.
 */
export function getFeatureFlag<T>(
  context: TenantContext,
  key: string,
  defaultValue: T
): T {
  const value = context.featureFlags[key];
  return value !== undefined ? (value as T) : defaultValue;
}
