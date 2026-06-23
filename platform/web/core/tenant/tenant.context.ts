/**
 * Tenant Context Service
 * 
 * Provides reactive access to the current tenant context.
 * Central source of truth for tenant-scoped operations.
 */

import { Injectable, Signal, computed, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  Tenant,
  TenantContext,
  TenantFeatureConfig,
  TenantFeatureFlags,
  TenantSelectorItem,
  TenantType,
  isFeatureEnabled,
  getFeatureFlag,
} from './tenant.types';
import { Tenant as SecurityTenant, TenantMembership } from '../security/models/tenant.models';
import { AuthStateStore } from '../security/state/auth.state';
import { ApiConfigService } from '../config/api-config.service';
import { APPLICATION_REQUIRES_TENANT } from '../../../applications/routes.generated';

/**
 * Tenant context service.
 * 
 * Manages the current tenant state and provides utilities
 * for tenant-scoped checks throughout the application.
 */
@Injectable({ providedIn: 'root' })
export class TenantContextService {
  private readonly authState = inject(AuthStateStore);
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);
  
  private get apiBaseUrl(): string {
    return this.apiConfig.getApiBaseUrl();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // State
  // ─────────────────────────────────────────────────────────────────────────────

  /** Internal tenant context state */
  private readonly _context = signal<TenantContext | null>(null);

  /** Available tenants for the current user */
  private readonly _availableTenants = signal<TenantSelectorItem[]>([]);

  /** Loading state */
  private readonly _isLoading = signal<boolean>(false);

  // ─────────────────────────────────────────────────────────────────────────────
  // Public Signals (Read-only)
  // ─────────────────────────────────────────────────────────────────────────────

  /** Current tenant context */
  readonly context: Signal<TenantContext | null> = this._context.asReadonly();

  /** Current tenant (convenience accessor) */
  readonly tenant: Signal<Tenant | null> = computed(() => this._context()?.tenant ?? null);

  /** Current tenant ID */
  readonly tenantId: Signal<string | null> = computed(() => this._context()?.tenant.id ?? null);

  /** Current tenant type */
  readonly tenantType: Signal<TenantType | null> = computed(() => this._context()?.tenant.type ?? null);

  /** Enabled feature IDs for current tenant */
  readonly enabledFeatureIds: Signal<Set<string>> = computed(
    () => this._context()?.enabledFeatureIds ?? new Set()
  );

  /**
   * Enabled module IDs for current tenant (legacy alias).
   * @deprecated Use enabledFeatureIds.
   */
  readonly enabledModuleIds: Signal<Set<string>> = computed(
    () => this._context()?.enabledFeatureIds ?? new Set()
  );

  /** Feature flags for current tenant */
  readonly featureFlags: Signal<TenantFeatureFlags> = computed(
    () => this._context()?.featureFlags ?? {}
  );

  /** Available tenants for switching */
  readonly availableTenants: Signal<TenantSelectorItem[]> = this._availableTenants.asReadonly();

  /** Is a tenant currently loaded */
  readonly hasTenant: Signal<boolean> = computed(() => this._context() !== null);

  /** Is currently loading tenant data */
  readonly isLoading: Signal<boolean> = this._isLoading.asReadonly();

  /** Is current tenant temporary */
  readonly isTemporary: Signal<boolean> = computed(() => this._context()?.isTemporary ?? false);

  // ─────────────────────────────────────────────────────────────────────────────
  // Public Methods
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Initialize tenant context.
   * Called during app bootstrap or after authentication.
   */
  async initialize(tenantId: string): Promise<void> {
    this._isLoading.set(true);

    try {
      // Get membership for this tenant from auth state (real data from backend)
      const user = this.authState.user();
      const tenants = this.authState.tenants();
      const membership = tenants.find(m => m.tenant.id === tenantId);
      
      let permissions = new Set<string>();
      let permVersion = 1;

      if (membership) {
        // Permissions from real backend data
        permissions = new Set(membership.permissions);
      } else if (user?.isSuperAdmin) {
        // Super admin has all permissions
        permissions = new Set(['*']);
      }

      // Build tenant from membership data
      const tenant = membership ? this.membershipToTenant(membership) : await this.fetchTenantFromApi(tenantId);

      const context: TenantContext = {
        tenant,
        enabledFeatureIds: new Set(
          tenant.featuresConfig.filter(f => f.enabled).map(f => f.featureId)
        ),
        enabledModuleIds: new Set(
          tenant.featuresConfig.filter(f => f.enabled).map(f => f.featureId)
        ),
        featureFlags: tenant.featureFlags,
        isTemporary: false,
        permissions,
        permVersion,
      };

      this._context.set(context);
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Switch to a different tenant.
   * Used in multi-tenant user scenarios.
   */
  async switchTenant(tenantId: string): Promise<void> {
    await this.initialize(tenantId);
    // TODO: Emit event for other services to react
  }

  /**
   * Set available tenants for the current user.
   * Called after loading user's tenant memberships.
   */
  setAvailableTenants(tenants: TenantSelectorItem[]): void {
    this._availableTenants.set(tenants);
  }

  /**
   * Get all tenants for selection.
   * For super admin: fetches all tenants from API.
   * For normal users: returns their tenant memberships.
   */
  async getAllTenantsForSelection(): Promise<TenantSelectorItem[]> {
    if (!APPLICATION_REQUIRES_TENANT) {
      return [];
    }

    const user = this.authState.user();
    const token = this.authState.accessToken();
    
    if (!token) {
      return [];
    }

    try {
      // Fetch all tenants user has access to via /api/auth/tenants
      const response = await firstValueFrom(
        this.http.get<TenantMembershipApiResponse[]>(`${this.apiBaseUrl}/api/auth/tenants`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      );

      return response.map(t => ({
        id: t.tenantId,
        name: t.tenantName,
        slug: t.tenantKey,
        type: 'standard',
        logoUrl: undefined,
      }));
    } catch (error) {
      console.error('Failed to fetch tenants:', error);
      // Fallback to tenants from auth state
      const tenants = this.authState.tenants();
      return tenants.map(m => ({
        id: m.tenant.id,
        name: m.tenant.name,
        slug: m.tenant.slug,
        type: 'standard',
        logoUrl: m.tenant.branding?.logoUrl,
      }));
    }
  }

  /**
   * Check if a feature is enabled for the current tenant.
   */
  isFeatureEnabled(featureId: string): boolean {
    const ctx = this._context();
    return ctx ? isFeatureEnabled(ctx, featureId) : false;
  }

  /**
   * Check if a module is enabled for the current tenant.
   * @deprecated Use isFeatureEnabled.
   */
  isModuleEnabled(moduleId: string): boolean {
    return this.isFeatureEnabled(moduleId);
  }

  /**
   * Get a feature flag value.
   */
  getFeatureFlag<T>(key: string, defaultValue: T): T {
    const ctx = this._context();
    return ctx ? getFeatureFlag(ctx, key, defaultValue) : defaultValue;
  }

  /**
   * Check if current tenant matches any of the given types.
   */
  isTenantType(...types: TenantType[]): boolean {
    const currentType = this._context()?.tenant.type;
    return currentType ? types.includes(currentType) : false;
  }

  /**
   * Clear tenant context (logout).
   */
  clear(): void {
    this._context.set(null);
    this._availableTenants.set([]);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Private Methods
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Convert TenantMembership to Tenant context model.
   */
  private membershipToTenant(membership: TenantMembership): Tenant {
    // Convert enabledModules array to modules array
    const featuresConfig: TenantFeatureConfig[] = (membership.tenant.enabledModules || []).map(moduleId => ({
      featureId: moduleId,
      moduleId,
      enabled: true,
    }));

    return {
      id: membership.tenant.id,
      name: membership.tenant.name,
      slug: membership.tenant.slug,
      type: 'standard',
      applicationId: undefined,
      productId: undefined,
      featuresConfig,
      modules: featuresConfig,
      featureFlags: membership.tenant.features || {},
      branding: membership.tenant.branding ? {
        primaryColor: membership.tenant.branding.primaryColor,
        logoUrl: membership.tenant.branding.logoUrl,
      } : undefined,
      isActive: membership.tenant.status === 'active',
      createdAt: new Date(membership.tenant.createdAt),
      updatedAt: new Date(membership.tenant.updatedAt),
    };
  }

  /**
   * Fetch tenant from API (for super admin accessing any tenant).
   */
  private async fetchTenantFromApi(tenantId: string): Promise<Tenant> {
    // For super admin, create a minimal tenant object
    // In production, you might want to add a dedicated API endpoint for this
    return {
      id: tenantId,
      name: 'Unknown Tenant',
      slug: tenantId,
      type: 'standard',
      applicationId: undefined,
      productId: undefined,
      featuresConfig: [
        { featureId: 'documents', moduleId: 'documents', enabled: true },
        { featureId: 'doc-extractor', moduleId: 'doc-extractor', enabled: true },
        { featureId: 'inventory', moduleId: 'inventory', enabled: true },
      ],
      modules: [
        { featureId: 'documents', moduleId: 'documents', enabled: true },
        { featureId: 'doc-extractor', moduleId: 'doc-extractor', enabled: true },
        { featureId: 'inventory', moduleId: 'inventory', enabled: true },
      ],
      featureFlags: {},
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

// API Response type
interface TenantMembershipApiResponse {
  tenantId: string;
  tenantKey: string;
  tenantName: string;
  enabledModules?: string[];
  roles?: any[];
  permissions?: string[];
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
  joinedAt?: string;
}
