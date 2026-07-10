/**
 * Config-Driven Listing Page Base Class
 *
 * Base class for listing pages that use EntityListingComponent with configuration.
 * Handles all boilerplate - subclasses only define entity-specific parts.
 *
 * @example
 * ```typescript
 * @Component({
 *   selector: 'app-product-listing',
 *   standalone: true,
 *   imports: [ConfigDrivenListingPageImports],
 *   template: `
 *     <nf-page-shell>
 *       <nf-page-header [config]="headerConfig"></nf-page-header>
 *       <nf-entity-listing #listing [config]="config" [facade]="facade" (action)="onAction($event)">
 *         <!-- Custom templates here -->
 *       </nf-entity-listing>
 *     </nf-page-shell>
 *   `,
 *   styles: [ConfigDrivenListingPageStyles],
 * })
 * export class ProductListingPage extends ConfigDrivenListingPage<ProductListItem> {
 *   facade = inject(ProductFacade);
 *   config = PRODUCT_LISTING_CONFIG;
 *   headerTitle = 'Products';
 * }
 * ```
 */

import { Directive, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

import {
  EntityListingComponent,
  ColumnTemplateDirective,
  BadgeComponent,
  PageHeaderComponent,
  PageShellComponent,
  ListingActionHandler,
  ToastService,
} from '../components';
import type { PageHeaderConfig } from '../components';
import type { ListingPageConfig, ListingActionEvent } from '../types';
import type { PartialCrudFacade } from '../types';
import { buildRouteBreadcrumbs } from '../utils/route-breadcrumb.util';

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED IMPORTS & STYLES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Common imports for config-driven listing pages.
 * Use in your component's imports array.
 */
export const ConfigDrivenListingPageImports = [
  CommonModule,
  EntityListingComponent,
  ColumnTemplateDirective,
  BadgeComponent,
  PageHeaderComponent,
  PageShellComponent,
] as const;

/**
 * Common styles for config-driven listing pages.
 * Use in your component's styles array.
 */
export const ConfigDrivenListingPageStyles = `
  :host {
    display: block;
    height: 100%;
  }

  nf-page-shell {
    height: 100%;
  }

  nf-page-header {
    flex: 0 0 auto;
  }

  nf-entity-listing {
    flex: 1 1 0;
    min-height: 0;
  }

  .chips-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
    flex: 0 0 auto;
  }

  .chips-row nf-button.chip-btn ::ng-deep button {
    border-radius: 999px;
    min-height: 28px;
    padding: 4px 12px;
    font-size: 12px;
    font-weight: 600;
  }

  .chips-row nf-button.chip-btn ::ng-deep .nf-button--secondary {
    background-color: var(--nf-color-surface-secondary, #f8fafc);
    border-color: var(--nf-color-border, #cbd5e1);
    color: var(--nf-color-text-secondary, #475569) !important;
  }

  .chips-row nf-button.chip-btn ::ng-deep .nf-button--secondary:hover:not(:disabled) {
    background-color: var(--nf-color-surface-hover, #e2e8f0);
    border-color: var(--nf-color-border-strong, #94a3b8);
  }

  .chips-row nf-button.chip-btn ::ng-deep .nf-button--primary {
    border: 1px solid var(--nf-color-primary, #1d4ed8);
    background-color: var(--nf-color-primary, #1d4ed8);
    color: var(--nf-color-text-inverse, #fff) !important;
  }

  .chips-row nf-button.chip-btn ::ng-deep .nf-button--primary .nf-button__content {
    color: inherit !important;
  }
`;

// ═══════════════════════════════════════════════════════════════════════════════
// BASE CLASS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Base class for config-driven listing pages.
 *
 * Provides:
 * - Action handling with ListingActionHandler
 * - Toast notifications
 * - Refresh mechanism
 * - Header config generation
 *
 * @stable
 *
 * Subclass must provide:
 * - facade: Entity-specific facade
 * - config: Listing page configuration
 * - headerTitle: Page title
 *
 * @typeParam TItem - The list item type
 */
@Directive()
export abstract class ConfigDrivenListingPage<TItem> {
  // ═══════════════════════════════════════════════════════════════════════════
  // Services
  // ═══════════════════════════════════════════════════════════════════════════

  protected readonly route = inject(ActivatedRoute);
  protected readonly actionHandler = inject(ListingActionHandler);
  protected readonly toast = inject(ToastService);

  // ═══════════════════════════════════════════════════════════════════════════
  // Abstract (Must Override)
  // ═══════════════════════════════════════════════════════════════════════════

  /** Entity-specific facade for CRUD operations */
  abstract readonly facade: PartialCrudFacade<unknown, TItem>;

  /** Listing page configuration */
  abstract readonly config: ListingPageConfig<TItem>;

  /** Page header title (can be computed) */
  abstract readonly headerTitle: string | (() => string);

  // ═══════════════════════════════════════════════════════════════════════════
  // View Child
  // ═══════════════════════════════════════════════════════════════════════════

  @ViewChild('listing') listingComponent?: EntityListingComponent<TItem>;

  // ═══════════════════════════════════════════════════════════════════════════
  // Computed
  // ═══════════════════════════════════════════════════════════════════════════

  /** Header configuration (derived from headerTitle + route `data.breadcrumb` chain) */
  get headerConfig(): PageHeaderConfig {
    const title = typeof this.headerTitle === 'function'
      ? this.headerTitle()
      : this.headerTitle;
    const breadcrumbs = buildRouteBreadcrumbs(this.route);
    // Listing pages are route leaves — a lone crumb duplicates the page title.
    const effectiveBreadcrumbs = breadcrumbs.length > 1 ? breadcrumbs : [];
    return {
      title,
      ...(effectiveBreadcrumbs.length > 0 ? { breadcrumbs: effectiveBreadcrumbs } : {}),
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Action Handling
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Handle all listing actions.
   * Uses ListingActionHandler for built-in actions, delegates custom to handleCustomAction.
   */
  async onAction(event: ListingActionEvent<TItem>): Promise<void> {
    const handled = await this.actionHandler.handleAction(event, {
      config: this.config,
      facade: this.facade,
      onSuccess: () => this.refresh(),
      onError: (error) => this.toast.error(error.message),
    });

    if (!handled) {
      await this.handleCustomAction(event);
    }
  }

  /**
   * Handle entity-specific custom actions.
   * Override in subclass to handle non-standard actions.
   */
  protected async handleCustomAction(event: ListingActionEvent<TItem>): Promise<void> {
    console.log('Unhandled action:', event.actionId, event);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Utilities
  // ═══════════════════════════════════════════════════════════════════════════

  /** Refresh the listing data */
  protected async refresh(): Promise<void> {
    await this.listingComponent?.refresh();
  }

  /** Show success toast */
  protected showSuccess(message: string): void {
    this.toast.success(message);
  }

  /** Show error toast */
  protected showError(message: string): void {
    this.toast.error(message);
  }
}
