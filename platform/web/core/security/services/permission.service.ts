/**
 * Permission Service
 *
 * RBAC permission checking with tenant context.
 * Provides reactive permission signals and check utilities.
 */

import { Injectable, Signal, computed, inject } from '@angular/core';
import { APPLICATION_REQUIRES_TENANT } from '../../../../applications/routes.generated';

import { AuthStateStore } from '../state/auth.state';
import { Permission, matchesPermissionPattern } from '../models/user.models';
import { TenantContext } from '../models/tenant.models';
import { TenantContextService } from '../../tenant/tenant.context';

/**
 * Permission check options.
 */
export interface PermissionCheckOptions {
  /** Check mode */
  mode: 'all' | 'any';
  /** Permissions to check */
  permissions: Permission[];
  /** Also check feature enabled (canonical) */
  checkFeature?: string;
  /**
   * Also check module enabled (legacy alias).
   * @deprecated Use checkFeature.
   */
  checkModule?: string;
}

/**
 * Permission check result.
 */
export interface PermissionCheckResult {
  granted: boolean;
  reason?: 'not_authenticated' | 'permission_denied' | 'feature_disabled' | 'module_disabled';
  missingPermissions?: Permission[];
}

/**
 * Permission Service
 *
 * Centralized permission checking with RBAC support.
 * Integrates with tenant context for multi-tenant permissions.
 */
@Injectable({ providedIn: 'root' })
export class PermissionService {
  private readonly state = inject(AuthStateStore);
  private readonly tenantContextService = inject(TenantContextService);

  // ─────────────────────────────────────────────────────────────────────────────
  // Reactive Selectors
  // ─────────────────────────────────────────────────────────────────────────────

  /** Current user permissions (tenant context first, auth-state fallback for non-tenant apps) */
  readonly permissions: Signal<Set<Permission>> = computed(() => {
    // Super admin has all permissions
    if (this.state.isSuperAdmin()) {
      return new Set<string>(['*']);
    }

    // Get permissions from TenantContext (loaded from server)
    const ctx = this.tenantContextService.context();
    if (ctx) {
      return ctx.permissions;
    }

    // Non-tenant apps (or pre-context phase): fallback to auth state permissions
    return this.state.permissions();
  });

  /** Current user roles */
  readonly roles: Signal<string[]> = this.state.roles;

  /** Is super admin */
  readonly isSuperAdmin: Signal<boolean> = this.state.isSuperAdmin;

  /** Tenant context */
  readonly tenantContext: Signal<TenantContext | null> = this.state.tenantContext;

  /** Enabled features in current tenant (canonical) */
  readonly enabledFeatures: Signal<Set<string>> = computed(() => {
    const ctx = this.state.tenantContext();
    return ctx?.enabledFeatures ?? ctx?.enabledModules ?? new Set<string>();
  });

  /**
   * Enabled modules in current tenant (legacy alias).
   * @deprecated Use enabledFeatures.
   */
  readonly enabledModules: Signal<Set<string>> = computed(() => {
    return this.enabledFeatures();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Permission Checks
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Check if user has a specific permission.
   * Permissions are loaded from TenantContext (server-driven), not token.
   */
  hasPermission(permission: Permission): boolean {
    // Non-tenant application mode: no tenant-context RBAC resolution.
    // Keep UI actions available; backend remains source of enforcement.
    if (!APPLICATION_REQUIRES_TENANT && this.state.isAuthenticated()) {
      return true;
    }

    // Super admin has all permissions (but still needs tenant context for tenant-scoped ops)
    if (this.state.isSuperAdmin()) {
      // For tenant-scoped permissions, still require tenant context
      if (this.isTenantScopedPermission(permission)) {
        const ctx = this.tenantContextService.context();
        if (!ctx) return false; // Super admin still needs tenant context
      }
      return true;
    }

    // Get permissions from TenantContext (loaded from server)
    const userPermissions = this.permissions();
    
    // Check version if available
    const ctx = this.tenantContextService.context();
    if (ctx) {
      const token = this.state.accessToken();
      if (token) {
        // Decode token to check perm_v
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
            const tokenPermVersion = payload.perm_v || 1;
            
            // If version mismatch, permissions may be stale - force refresh
            if (tokenPermVersion !== ctx.permVersion) {
              // Version mismatch detected - would trigger refresh in production
              // For now, log warning
              console.warn('Permission version mismatch detected. Token version:', tokenPermVersion, 'Context version:', ctx.permVersion);
            }
          }
        } catch {
          // If decode fails, continue with permission check
        }
      }
    }

    return this.matchPermission(permission, userPermissions);
  }

  /**
   * Check if permission is tenant-scoped (has module prefix).
   */
  private isTenantScopedPermission(permission: Permission): boolean {
    return permission.includes('.');
  }

  /**
   * Create a reactive signal for a permission check.
   */
  hasPermission$(permission: Permission): Signal<boolean> {
    return computed(() => this.hasPermission(permission));
  }

  /**
   * Check if user has ANY of the specified permissions.
   */
  hasAnyPermission(permissions: Permission[]): boolean {
    if (permissions.length === 0) return true;
    if (this.state.isSuperAdmin()) return true;
    return permissions.some(p => this.hasPermission(p));
  }

  /**
   * Create a reactive signal for hasAnyPermission.
   */
  hasAnyPermission$(permissions: Permission[]): Signal<boolean> {
    return computed(() => this.hasAnyPermission(permissions));
  }

  /**
   * Check if user has ALL of the specified permissions.
   */
  hasAllPermissions(permissions: Permission[]): boolean {
    if (permissions.length === 0) return true;
    if (this.state.isSuperAdmin()) return true;
    return permissions.every(p => this.hasPermission(p));
  }

  /**
   * Create a reactive signal for hasAllPermissions.
   */
  hasAllPermissions$(permissions: Permission[]): Signal<boolean> {
    return computed(() => this.hasAllPermissions(permissions));
  }

  /**
   * Advanced permission check with options.
   */
  checkPermissions(options: PermissionCheckOptions): PermissionCheckResult {
    // Check authentication
    if (!this.state.isAuthenticated()) {
      return { granted: false, reason: 'not_authenticated' };
    }

    // Super admin bypasses all
    if (this.state.isSuperAdmin()) {
      return { granted: true };
    }

    const ctx = this.state.tenantContext();

    // Check feature/module enablement if specified
    const featureToCheck = options.checkFeature ?? options.checkModule;
    if (featureToCheck && ctx) {
      const enabled = (ctx.enabledFeatures?.has(featureToCheck) ?? false)
        || (ctx.enabledModules?.has(featureToCheck) ?? false);
      if (!enabled) {
        return { granted: false, reason: 'feature_disabled' };
      }
    }

    // Check permissions
    const { mode, permissions } = options;
    const userPermissions = this.state.permissions();

    if (permissions.length === 0) {
      return { granted: true };
    }

    if (mode === 'any') {
      const hasAny = permissions.some(p => this.matchPermission(p, userPermissions));
      return hasAny
        ? { granted: true }
        : { granted: false, reason: 'permission_denied', missingPermissions: permissions };
    }

    // mode === 'all'
    const missing = permissions.filter(p => !this.matchPermission(p, userPermissions));
    return missing.length === 0
      ? { granted: true }
      : { granted: false, reason: 'permission_denied', missingPermissions: missing };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Role Checks
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Check if user has a specific role.
   */
  hasRole(role: string): boolean {
    return this.state.roles().includes(role);
  }

  /**
   * Create a reactive signal for role check.
   */
  hasRole$(role: string): Signal<boolean> {
    return computed(() => this.hasRole(role));
  }

  /**
   * Check if user has ANY of the specified roles.
   */
  hasAnyRole(roles: string[]): boolean {
    if (roles.length === 0) return true;
    const userRoles = this.state.roles();
    return roles.some(r => userRoles.includes(r));
  }

  /**
   * Check if user has ALL of the specified roles.
   */
  hasAllRoles(roles: string[]): boolean {
    if (roles.length === 0) return true;
    const userRoles = this.state.roles();
    return roles.every(r => userRoles.includes(r));
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Feature/Module Access Checks
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Check if a feature is enabled for the current tenant.
   */
  isFeatureAccessible(featureId: string): boolean {
    const ctx = this.state.tenantContext();
    if (!ctx) return false;
    return (ctx.enabledFeatures?.has(featureId) ?? false)
      || (ctx.enabledModules?.has(featureId) ?? false);
  }

  /**
   * Check if a module is enabled for the current tenant.
   * @deprecated Use isFeatureAccessible.
   */
  isModuleEnabled(moduleId: string): boolean {
    return this.isFeatureAccessible(moduleId);
  }

  /**
   * Create a reactive signal for feature access check.
   */
  isFeatureAccessible$(featureId: string): Signal<boolean> {
    return computed(() => this.isFeatureAccessible(featureId));
  }

  /**
   * Create a reactive signal for module enabled check.
   * @deprecated Use isFeatureAccessible$.
   */
  isModuleEnabled$(moduleId: string): Signal<boolean> {
    return computed(() => this.isModuleEnabled(moduleId));
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Feature Flag Checks
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Get a feature flag value.
   */
  getFeatureFlag<T>(key: string, defaultValue: T): T {
    const ctx = this.state.tenantContext();
    if (!ctx) return defaultValue;
    const value = ctx.features[key];
    return value !== undefined ? (value as T) : defaultValue;
  }

  /**
   * Check if a feature is enabled.
   */
  isFeatureEnabled(key: string): boolean {
    return this.getFeatureFlag(key, false);
  }

  /**
   * Create a reactive signal for feature flag.
   */
  isFeatureEnabled$(key: string): Signal<boolean> {
    return computed(() => this.isFeatureEnabled(key));
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Internal Helpers
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Match a permission against user permissions with wildcard support.
   */
  private matchPermission(
    permission: Permission,
    userPermissions: Set<Permission>
  ): boolean {
    // Direct match
    if (userPermissions.has(permission)) {
      return true;
    }

    // Check patterns
    for (const userPerm of userPermissions) {
      if (matchesPermissionPattern(permission, userPerm)) {
        return true;
      }
    }

    return false;
  }
}
