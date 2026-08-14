/**
 * Page Title Service
 *
 * Manages the browser page title with application-aware formatting.
 */

import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';

import { ApplicationContextService } from '../../../core/application';
import { TenantContextService } from '../../../core/tenant/tenant.context';

@Injectable({ providedIn: 'root' })
export class PageTitleService {
  private readonly titleService = inject(Title);
  private readonly applicationContext = inject(ApplicationContextService);
  private readonly tenantContext = inject(TenantContextService);

  /**
   * Set the page title with application-aware formatting.
   */
  setTitle(title: string): void {
    const tenantName = this.tenantContext.tenant()?.name;
    const fullTitle = tenantName && title ? `${title} | ${tenantName}` : title;
    this.titleService.setTitle(fullTitle);
  }

  /**
   * Set title with a dynamic suffix.
   */
  setTitleWithSuffix(prefix: string, suffix: string): void {
    const combinedTitle = suffix ? `${prefix}: ${suffix}` : prefix;
    this.setTitle(combinedTitle);
  }

  /**
   * Get the current page title.
   */
  getTitle(): string {
    return this.titleService.getTitle();
  }

  /**
   * Reset to default application title.
   */
  resetTitle(): void {
    const tenantName = this.tenantContext.tenant()?.name;
    const appKey = this.applicationContext.applicationKey();
    const appTitle = appKey
      .split('-')
      .filter(Boolean)
      .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ');
    this.titleService.setTitle(tenantName || appTitle || 'Nafura');
  }
}
