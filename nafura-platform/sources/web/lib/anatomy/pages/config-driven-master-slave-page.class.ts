/**
 * Config-Driven Master–Slave Page Base Class
 *
 * Base class for master–slave (panel) pages: persistent list + detail pane,
 * URL-driven selection, single click opens detail. Handles route sync, load,
 * save/cancel/delete, and listing action delegation.
 *
 * @example
 * ```typescript
 * @Component({ ... })
 * export class ProductMasterSlavePage extends ConfigDrivenMasterSlavePage<Product, ProductListItem> {
 *   readonly productFacade = inject(ProductFacade);
 *   readonly listingFacade = this.productFacade;
 *   readonly detailFacade = new ProductDetailFacade(this.productFacade);
 *   readonly panelListingConfig = PANEL_LISTING_CONFIG;
 *   readonly panelDetailConfig = PANEL_DETAIL_CONFIG;
 *   readonly panelRoutes = { list: ['/sandbox/products-panel'], detail: (id) => ['/sandbox/products-panel', id], create: ['/sandbox/products/new'] };
 *   readonly headerTitle = 'Products (Panel)';
 * }
 * ```
 */

import {
  Directive,
  ViewChild,
  inject,
  signal,
  computed,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import {
  MasterSlaveShellComponent,
  EntityListingComponent,
  EntityDetailComponent,
  PageHeaderComponent,
  PageShellComponent,
  ToastService,
  ConfirmDialogService,
  ListingActionHandler,
} from '../components';
import { CommonModule } from '@angular/common';
import type { DetailFacade } from './config-driven-detail-page.class';

// ═══════════════════════════════════════════════════════════════════════════
// SHARED IMPORTS & STYLES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Common imports for config-driven master–slave pages.
 */
export const ConfigDrivenMasterSlavePageImports = [
  CommonModule,
  PageShellComponent,
  PageHeaderComponent,
  MasterSlaveShellComponent,
  EntityListingComponent,
  EntityDetailComponent,
] as const;

/**
 * Common styles for config-driven master–slave pages.
 */
export const ConfigDrivenMasterSlavePageStyles = `
  :host { display: block; height: 100%; }
  nf-page-shell { height: 100%; }
  nf-page-header { flex: 0 0 auto; }
  nf-master-slave-shell { flex: 1 1 0; min-height: 0; display: block; }
`;
import type {
  ListingPageConfig,
  DetailPageConfig,
  DetailActionEvent,
  PartialCrudFacade,
  ListingActionEvent,
} from '../types';

/** Route config for master–slave panel (list without id, detail with id, create). */
export interface PanelRouteConfig {
  list: string[];
  detail: (id: string) => string[];
  create: string[];
}

/**
 * Base class for config-driven master–slave pages.
 *
 * Subclass must provide:
 * - listingFacade, detailFacade, panelListingConfig, panelDetailConfig, panelRoutes, headerTitle
 * - getItemId(row) optional if list item has non-'id' key
 *
 * @stable
 *
 * @typeParam TItem - Detail entity type
 * @typeParam TListItem - List row type (must have id or override getItemId)
 */
@Directive()
export abstract class ConfigDrivenMasterSlavePage<TItem, TListItem = { id: string }>
  implements OnInit, OnDestroy
{
  protected readonly route = inject(ActivatedRoute);
  protected readonly router = inject(Router);
  protected readonly toast = inject(ToastService);
  protected readonly confirmDialog = inject(ConfirmDialogService);
  protected readonly actionHandler = inject(ListingActionHandler);

  private paramSub?: Subscription;

  @ViewChild('listing') protected listingRef?: EntityListingComponent<TListItem>;
  @ViewChild('detail') protected detailRef?: EntityDetailComponent<TItem>;

  abstract readonly listingFacade: PartialCrudFacade<unknown, TListItem>;
  abstract readonly detailFacade: DetailFacade<TItem>;
  abstract readonly panelListingConfig: ListingPageConfig<TListItem>;
  abstract readonly panelDetailConfig: DetailPageConfig<TItem>;
  abstract readonly panelRoutes: PanelRouteConfig;
  abstract readonly headerTitle: string;

  /** Route param key for selected id. Default 'id'. */
  protected paramKey = 'id';

  readonly selectedId = signal<string | null>(null);
  readonly item = signal<TItem | null>(null);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);

  get headerConfig(): { title: string } {
    return { title: this.headerTitle };
  }
  readonly lookups = computed(() => this.detailFacade.lookups?.() ?? {});

  ngOnInit(): void {
    const syncFromRoute = (id: string | null): void => {
      if (id && id !== 'new') {
        this.selectedId.set(id);
        this.loadItem(id);
      } else {
        this.selectedId.set(null);
        this.item.set(null);
      }
    };
    syncFromRoute(this.route.snapshot.paramMap.get(this.paramKey));
    this.paramSub = this.route.paramMap.subscribe((params) => {
      syncFromRoute(params.get(this.paramKey));
    });
  }

  ngOnDestroy(): void {
    this.paramSub?.unsubscribe();
  }

  protected async loadItem(id: string): Promise<void> {
    this.isLoading.set(true);
    try {
      const loaded = await this.detailFacade.loadById(id);
      this.item.set(loaded);
    } catch {
      this.showError('Failed to load item');
      this.navigateToPanel(null);
    } finally {
      this.isLoading.set(false);
    }
  }

  /** Extract id from list row. Override if key is not 'id'. */
  protected getItemId(row: TListItem): string {
    return (row as { id: string }).id;
  }

  onRowOpen(row: TListItem): void {
    this.navigateToPanel(this.getItemId(row));
  }

  /**
   * When listing has loaded and we're on the list route (no id), select the first item by default
   * so both panels are visible with the first row selected.
   */
  onItemsLoaded(items: TListItem[]): void {
    if (this.selectedId() != null) return;
    if (items.length > 0) {
      this.navigateToPanel(this.getItemId(items[0]));
    }
  }

  onSelectedIdChange(id: string | null): void {
    this.navigateToPanel(id);
  }

  protected navigateToPanel(id: string | null): void {
    if (id) {
      this.router.navigate(this.panelRoutes.detail(id));
    } else {
      this.router.navigate(this.panelRoutes.list);
    }
  }

  async onListingAction(event: ListingActionEvent<TListItem>): Promise<void> {
    const handled = await this.actionHandler.handleAction(event, {
      config: this.panelListingConfig,
      facade: this.listingFacade,
      onSuccess: () => this.refreshListing(),
      onError: (err) => this.toast.error(err.message),
    });
    if (!handled && (event.actionId === 'new' || event.actionId === 'create')) {
      this.router.navigate(this.panelRoutes.create);
    }
  }

  async onDetailAction(event: DetailActionEvent<TItem>): Promise<void> {
    switch (event.actionId) {
      case 'save':
        await this.handleSave(event);
        break;
      case 'cancel':
        await this.handleCancel();
        break;
      case 'delete':
        await this.handleDelete();
        break;
      default:
        await this.handleCustomDetailAction(event);
    }
  }

  protected async handleSave(event: DetailActionEvent<TItem>): Promise<void> {
    const id = this.selectedId();
    if (!id) return;
    this.isSaving.set(true);
    try {
      const saved = await this.detailFacade.update(id, event.formValue as any);
      this.item.set(saved);
      this.showSuccess(this.getSuccessMessage('save', saved));
      this.detailRef?.markAsPristine();
    } catch {
      this.showError(this.panelDetailConfig.saveErrorMessage ?? 'Failed to save');
    } finally {
      this.isSaving.set(false);
    }
  }

  protected async handleCancel(): Promise<void> {
    if (this.detailRef?.isDirty?.()) {
      const ok = await this.confirmDialog.confirm({
        title: 'Unsaved Changes',
        message: 'Leave without saving?',
        confirmLabel: 'Leave',
        cancelLabel: 'Stay',
      });
      if (!ok) return;
    }
    this.navigateToPanel(null);
  }

  protected async handleDelete(): Promise<void> {
    const currentItem = this.item();
    if (!currentItem) return;
    const cfg = this.panelDetailConfig.deleteConfirm;
    const title = cfg?.title ?? `Delete ${this.panelDetailConfig.entityName}`;
    const message =
      typeof cfg?.message === 'function' ? cfg.message(currentItem) : cfg?.message ?? 'Are you sure you want to delete this item?';
    const ok = await this.confirmDialog.confirm({
      title,
      message,
      confirmLabel: cfg?.confirmLabel ?? 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    this.isSaving.set(true);
    try {
      await this.detailFacade.delete(this.getItemIdFromItem(currentItem));
      this.showSuccess(this.getSuccessMessage('delete', currentItem));
      this.navigateToPanel(null);
      this.refreshListing();
    } catch {
      this.showError('Failed to delete');
    } finally {
      this.isSaving.set(false);
    }
  }

  /** Override for custom detail actions. */
  protected async handleCustomDetailAction(event: DetailActionEvent<TItem>): Promise<void> {
    console.log('Unhandled detail action:', event.actionId);
  }

  /** Get id from detail item (for delete). Default (item as { id: string }).id */
  protected getItemIdFromItem(item: TItem): string {
    return (item as { id: string }).id;
  }

  protected getSuccessMessage(action: 'save' | 'delete', item: TItem): string {
    if (action === 'save') {
      const msg = this.panelDetailConfig.saveSuccessMessage;
      return typeof msg === 'function' ? msg(item) : msg ?? `${this.panelDetailConfig.entityName} saved`;
    }
    const msg = this.panelDetailConfig.deleteSuccessMessage;
    return typeof msg === 'function' ? msg(item) : msg ?? `${this.panelDetailConfig.entityName} deleted`;
  }

  protected refreshListing(): void {
    this.listingRef?.refresh();
  }

  protected showSuccess(message: string): void {
    this.toast.success(message);
  }

  protected showError(message: string): void {
    this.toast.error(message);
  }
}
