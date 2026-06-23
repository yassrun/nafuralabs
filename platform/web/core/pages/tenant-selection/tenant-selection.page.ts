/**
 * Tenant Selection Page
 * 
 * Allows super admin to select a tenant to view tenant-scoped data.
 * Normal users with multiple tenants can also use this page.
 */

import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthFacade } from '../../security/services/auth.facade';
import { TenantContextService } from '../../tenant/tenant.context';
import { TenantSelectorItem } from '../../tenant/tenant.types';
import { APPLICATION_DEFAULT_ROUTE, APPLICATION_REQUIRES_TENANT } from '../../../../applications/routes.generated';

@Component({
  selector: 'app-tenant-selection-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './tenant-selection.page.html',
  styleUrl: './tenant-selection.page.scss',
})
export class TenantSelectionPage implements OnInit {
  private readonly auth = inject(AuthFacade);
  private readonly router = inject(Router);
  private readonly tenantContext = inject(TenantContextService);

  // State
  readonly isLoading = signal<boolean>(false);
  readonly tenants = signal<TenantSelectorItem[]>([]);
  readonly isSuperAdmin = computed(() => this.auth.isSuperAdmin());

  private async navigateToApplicationShell(): Promise<void> {
    const defaultRoute = APPLICATION_DEFAULT_ROUTE || 'feature-unavailable/unknown';
    const segments = defaultRoute.split('/').filter(Boolean);
    await this.router.navigate(['/', ...segments]);
  }

  async ngOnInit(): Promise<void> {
    if (!APPLICATION_REQUIRES_TENANT) {
      await this.navigateToApplicationShell();
      return;
    }

    await this.loadTenants();
  }

  /**
   * Load available tenants for selection.
   */
  private async loadTenants(): Promise<void> {
    this.isLoading.set(true);

    try {
      if (this.auth.isSuperAdmin()) {
        // Super admin can see all tenants
        const allTenants = await this.tenantContext.getAllTenantsForSelection();
        this.tenants.set(allTenants);
      } else {
        // Normal user: get their tenant memberships
        const memberships = this.auth.getAvailableTenants();
        const tenantItems: TenantSelectorItem[] = memberships.map(m => ({
          id: m.tenant.id,
          name: m.tenant.name,
          slug: m.tenant.slug,
          type: 'standard',
          logoUrl: m.tenant.branding?.logoUrl,
        }));
        this.tenants.set(tenantItems);
      }
    } catch (error) {
      console.error('Failed to load tenants:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Select a tenant and navigate to dashboard.
   */
  async selectTenant(tenantId: string): Promise<void> {
    this.isLoading.set(true);

    try {
      // Use AuthFacade.selectTenant which handles both super admin and normal users
      const success = await this.auth.selectTenant(tenantId);
      if (!success) {
        console.error('Failed to select tenant');
        return;
      }

      await this.navigateToApplicationShell();
    } catch (error) {
      console.error('Failed to select tenant:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Skip tenant selection (for super admin - access platform view).
   */
  async skipSelection(): Promise<void> {
    await this.navigateToApplicationShell();
  }

}
