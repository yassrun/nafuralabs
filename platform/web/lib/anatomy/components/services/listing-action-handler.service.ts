/**
 * Listing Action Handler Service
 *
 * Provides default implementations for common listing actions.
 * Pages can use this service to handle standard actions without
 * duplicating logic across different entity listings.
 *
 * @example
 * ```typescript
 * export class ProductListingPage {
 *   private actionHandler = inject(ListingActionHandler);
 *
 *   onAction(event: ListingActionEvent<ProductListItem>): void {
 *     // Try default handler first
 *     const handled = this.actionHandler.handleAction(event, {
 *       config: this.config,
 *       facade: this.facade,
 *       onSuccess: () => this.listingComponent.refresh(),
 *     });
 *
 *     // Handle custom actions if not handled
 *     if (!handled) {
 *       this.handleCustomAction(event);
 *     }
 *   }
 * }
 * ```
 */

import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { CHANTIER_ROW_NAVIGATOR } from '../../tokens/chantier-row-navigator.token';
import { ToastService } from './toast.service';
import { ConfirmDialogService } from './confirm-dialog.service';
import type {
  ListingActionEvent,
  ListingPageConfig,
  PartialCrudFacade,
} from '../../types';

/**
 * Options for the action handler.
 */
export interface ActionHandlerOptions<TItem> {
  /** Listing configuration */
  config: ListingPageConfig<TItem>;

  /** CRUD facade for data operations */
  facade: PartialCrudFacade<unknown, TItem>;

  /** Callback when action completes successfully (e.g., refresh list) */
  onSuccess?: () => void | Promise<void>;

  /** Callback when action fails */
  onError?: (error: Error) => void;

  /** Custom duplicate handler (if facade doesn't have duplicateItem) */
  onDuplicate?: (item: TItem) => Promise<void>;

  /** Custom archive handler */
  onArchive?: (item: TItem) => Promise<void>;

  /** Get item ID from item */
  getItemId?: (item: TItem) => string;
}

/**
 * Listing Action Handler Service
 *
 * Handles common listing actions with default implementations.
 */
@Injectable({ providedIn: 'root' })
export class ListingActionHandler {
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly translate = inject(TranslateService);
  private readonly chantierRowNavigator = inject(CHANTIER_ROW_NAVIGATOR, { optional: true });

  /**
   * Handle a listing action event.
   *
   * @returns true if the action was handled, false if it should be handled by the page
   */
  async handleAction<TItem>(
    event: ListingActionEvent<TItem>,
    options: ActionHandlerOptions<TItem>
  ): Promise<boolean> {
    const { config, facade, onSuccess, onError } = options;

    try {
      switch (event.actionId) {
        // ═══════════════════════════════════════════════════════════════════
        // Navigation Actions
        // ═══════════════════════════════════════════════════════════════════

        case 'create':
        case 'new':
          return this.handleCreate(config);

        case 'edit':
        case 'view':
          if (event.item) {
            return this.handleEdit(event.item, config);
          }
          return false;

        // ═══════════════════════════════════════════════════════════════════
        // Single Item Actions
        // ═══════════════════════════════════════════════════════════════════

        case 'delete':
          if (event.item) {
            const success = await this.handleDelete(event.item, config, facade, options);
            if (success && onSuccess) await onSuccess();
            return true;
          }
          return false;

        case 'duplicate':
          if (event.item) {
            const success = await this.handleDuplicate(event.item, options);
            if (success && onSuccess) await onSuccess();
            return true;
          }
          return false;

        case 'archive':
          if (event.item) {
            const success = await this.handleArchive(event.item, options);
            if (success && onSuccess) await onSuccess();
            return true;
          }
          return false;

        // ═══════════════════════════════════════════════════════════════════
        // Bulk Actions
        // ═══════════════════════════════════════════════════════════════════

        case 'bulk-delete':
          if (event.selection && event.selection.length > 0) {
            const success = await this.handleBulkDelete(event.selection, config, facade, options);
            if (success && onSuccess) await onSuccess();
            return true;
          }
          return false;

        case 'bulk-archive':
          if (event.selection && event.selection.length > 0) {
            const success = await this.handleBulkArchive(event.selection, options);
            if (success && onSuccess) await onSuccess();
            return true;
          }
          return false;

        // ═══════════════════════════════════════════════════════════════════
        // Toolbar Actions
        // ═══════════════════════════════════════════════════════════════════

        case 'refresh':
          if (onSuccess) await onSuccess();
          return true;

        case 'openChantier':
          if (event.item && this.chantierRowNavigator) {
            return this.chantierRowNavigator(event.item);
          }
          return false;

        default:
          return false;
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      if (onError) {
        onError(err);
      } else {
        this.toast.error(err.message || 'An error occurred');
      }
      return true; // We handled it (with error)
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Navigation Handlers
  // ═══════════════════════════════════════════════════════════════════════════

  private handleCreate<TItem>(config: ListingPageConfig<TItem>): boolean {
    if (config.routes?.create) {
      this.router.navigate(config.routes.create);
      return true;
    }
    return false;
  }

  private handleEdit<TItem>(item: TItem, config: ListingPageConfig<TItem>): boolean {
    if (config.routes?.detail) {
      this.router.navigate(config.routes.detail(item));
      return true;
    }
    return false;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Delete Handlers
  // ═══════════════════════════════════════════════════════════════════════════

  private async handleDelete<TItem>(
    item: TItem,
    config: ListingPageConfig<TItem>,
    facade: PartialCrudFacade<unknown, TItem>,
    options: ActionHandlerOptions<TItem>
  ): Promise<boolean> {
    const deleteConfig = config.delete;
    if (!deleteConfig) {
      console.warn('Delete config not set');
      return false;
    }

    const confirmed = await this.confirmDialog.confirm({
      title: deleteConfig.title,
      message: deleteConfig.getMessage(item),
      confirmLabel: deleteConfig.confirmLabel ?? 'Delete',
      variant: 'danger',
      icon: deleteConfig.icon ?? 'delete',
    });

    if (!confirmed) return false;

    if (facade.deleteItem) {
      const id = this.getItemId(item, options);
      await facade.deleteItem(id);
      this.toast.success(deleteConfig.successMessage);
      return true;
    }

    return false;
  }

  private async handleBulkDelete<TItem>(
    items: TItem[],
    config: ListingPageConfig<TItem>,
    facade: PartialCrudFacade<unknown, TItem>,
    options: ActionHandlerOptions<TItem>
  ): Promise<boolean> {
    const deleteConfig = config.delete;

    const confirmed = await this.confirmDialog.confirm({
      title: this.translate.instant('shared.entityListing.bulkDelete.title', {
        count: items.length,
        entity: items.length === 1 ? config.entityName : config.entityNamePlural,
      }),
      message: this.translate.instant('shared.entityListing.bulkDelete.message', {
        count: items.length,
      }),
      confirmLabel: this.translate.instant('shared.entityListing.bulkDelete.confirmLabel'),
      variant: 'danger',
      icon: 'delete',
    });

    if (!confirmed) return false;

    if (facade.deleteItem) {
      const ids = items.map((item) => this.getItemId(item, options));
      await Promise.all(ids.map((id) => facade.deleteItem!(id)));
      this.toast.success(
        this.translate.instant('shared.entityListing.toast.deleted', {
          count: items.length,
        })
      );
      return true;
    }

    return false;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Duplicate Handler
  // ═══════════════════════════════════════════════════════════════════════════

  private async handleDuplicate<TItem>(
    item: TItem,
    options: ActionHandlerOptions<TItem>
  ): Promise<boolean> {
    // Use custom handler if provided
    if (options.onDuplicate) {
      await options.onDuplicate(item);
      this.toast.success(`${options.config.entityName} duplicated`);
      return true;
    }

    // Check if facade has duplicateItem method
    const facade = options.facade as { duplicateItem?: (item: TItem) => Promise<TItem> };
    if (facade.duplicateItem) {
      // Create the duplicate on backend
      const newItem = await facade.duplicateItem(item);
      this.toast.success(`${options.config.entityName} duplicated`);

      // Navigate to the new item's detail page for editing
      if (options.config.routes?.detail && newItem) {
        this.router.navigate(options.config.routes.detail(newItem));
      }
      return true;
    }

    console.warn('No duplicate handler available. Provide onDuplicate or implement duplicateItem in facade.');
    return false;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Archive Handlers
  // ═══════════════════════════════════════════════════════════════════════════

  private async handleArchive<TItem>(
    item: TItem,
    options: ActionHandlerOptions<TItem>
  ): Promise<boolean> {
    // Use custom handler if provided
    if (options.onArchive) {
      await options.onArchive(item);
      this.toast.success(`${options.config.entityName} archived`);
      return true;
    }

    // Check if facade has archiveItem method
    const facade = options.facade as { archiveItem?: (id: string) => Promise<unknown> };
    if (facade.archiveItem) {
      const id = this.getItemId(item, options);
      await facade.archiveItem(id);
      this.toast.success(`${options.config.entityName} archived`);
      return true;
    }

    console.warn('No archive handler available. Provide onArchive or implement archiveItem in facade.');
    return false;
  }

  private async handleBulkArchive<TItem>(
    items: TItem[],
    options: ActionHandlerOptions<TItem>
  ): Promise<boolean> {
    const facade = options.facade as { archiveItem?: (id: string) => Promise<unknown> };

    if (facade.archiveItem) {
      const ids = items.map((item) => this.getItemId(item, options));
      await Promise.all(ids.map((id) => facade.archiveItem!(id)));
      this.toast.success(
        this.translate.instant('shared.entityListing.toast.archived', {
          count: items.length,
        })
      );
      return true;
    }

    console.warn('No bulk archive handler available.');
    return false;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Helpers
  // ═══════════════════════════════════════════════════════════════════════════

  private getItemId<TItem>(item: TItem, options: ActionHandlerOptions<TItem>): string {
    if (options.getItemId) {
      return options.getItemId(item);
    }
    return (item as { id: string }).id;
  }
}
