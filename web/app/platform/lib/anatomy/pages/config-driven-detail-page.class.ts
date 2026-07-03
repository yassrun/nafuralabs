/**
 * Config-Driven Detail Page Base Class
 *
 * Base class for detail/form pages that use EntityDetailComponent with configuration.
 * Handles all boilerplate - subclasses only define entity-specific parts.
 *
 * @example
 * ```typescript
 * @Component({
 *   selector: 'app-product-detail',
 *   standalone: true,
 *   imports: [ConfigDrivenDetailPageImports],
 *   template: `
 *     <nf-page-shell scroll>
 *       <nf-page-header [config]="headerConfig"></nf-page-header>
 *       <nf-entity-detail
 *         #detail
 *         [config]="config"
 *         [mode]="mode()"
 *         [item]="item()"
 *         [lookups]="lookups()"
 *         [loading]="isLoading()"
 *         [saving]="isSaving()"
 *         (action)="onAction($event)">
 *         <!-- Custom field templates here -->
 *       </nf-entity-detail>
 *     </nf-page-shell>
 *   `,
 *   styles: [ConfigDrivenDetailPageStyles],
 * })
 * export class ProductDetailPage extends ConfigDrivenDetailPage<Product> {
 *   facade = inject(ProductFacade);
 *   config = PRODUCT_DETAIL_CONFIG;
 *   headerTitle = computed(() => this.mode() === 'create' ? 'New Product' : 'Edit Product');
 * }
 * ```
 */

import { Directive, ViewChild, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import {
  EntityDetailComponent,
  FieldTemplateDirective,
  PageHeaderComponent,
  PageShellComponent,
  ToastService,
  ConfirmDialogService,
  PrintDialogService,
  SendEmailDialogService,
  StatusMachineComponent,
  StatusTransitionDialogService,
} from '../components';
import type { PageHeaderConfig } from '../components';
import { RecentItemsService } from '@core/shell/command-palette/recent-items.service';
import type { RecentItem } from '@core/shell/command-palette/command-palette.types';
import type {
  DetailPageConfig,
  DetailFieldConfig,
  DetailActionEvent,
  DetailPageMode,
  LookupContext,
} from '../types';
import { LookupService } from '../services/lookup.service';
import { buildRouteBreadcrumbs } from '../utils/route-breadcrumb.util';

// ═══════════════════════════════════════════════════════════════════════════════
// FACADE INTERFACE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Required facade methods for detail pages.
 */
export interface DetailFacade<TItem, TCreate = Partial<TItem>, TUpdate = Partial<TItem>> {
  /** Load item by ID */
  loadById(id: string): Promise<TItem>;

  /** Create new item */
  create(data: TCreate): Promise<TItem>;

  /** Update existing item */
  update(id: string, data: TUpdate): Promise<TItem>;

  /** Delete item */
  delete(id: string): Promise<void>;

  /** Optional: Duplicate item */
  duplicate?(item: TItem): Promise<TItem>;

  /** Optional: Lookups signal */
  lookups?(): LookupContext;

  /** Optional: Load lookups explicitly */
  loadLookups?(): Promise<void>;

  /** Optional: Ensure lookups are loaded (idempotent) */
  ensureLookups?(): Promise<void>;
}

/**
 * CRUD-style facade (getItem, createItem, updateItem, deleteItem).
 * Use with createDetailFacadeFromCrud to avoid per-entity adapter classes.
 */
export interface CrudStyleFacade<TItem, TInput = Partial<TItem>> {
  getItem(id: string): Promise<TItem>;
  createItem(input: TInput): Promise<TItem>;
  updateItem(id: string, input: Partial<TInput>): Promise<TItem>;
  deleteItem(id: string): Promise<void>;
  duplicateItem?(item: TItem): Promise<TItem>;
}

/**
 * Build a DetailFacade from a CRUD-style facade (getItem/createItem/updateItem/deleteItem).
 * Use in detail or master–slave pages to avoid per-entity adapter classes.
 *
 * @example
 * ```ts
 * readonly detailFacade = createDetailFacadeFromCrud({
 *   crud: inject(ProductFacade),
 *   lookups: () => ({ categories: [...] }),
 * });
 * ```
 */
export function createDetailFacadeFromCrud<TItem, TInput = Partial<TItem>>(options: {
  crud: CrudStyleFacade<TItem, TInput>;
  lookups?: () => LookupContext;
}): DetailFacade<TItem, TInput, Partial<TInput>> {
  const { crud, lookups } = options;
  const crudWithLookups = crud as CrudStyleFacade<TItem, TInput> & {
    lookups?: () => LookupContext;
    loadLookups?: () => Promise<void>;
    ensureLookups?: () => Promise<void>;
  };
  return {
    loadById: (id) => crud.getItem(id),
    create: (data) => crud.createItem(data),
    update: (id, data) => crud.updateItem(id, data),
    delete: (id) => crud.deleteItem(id),
    duplicate: crud.duplicateItem ? (item) => crud.duplicateItem!(item) : undefined,
    lookups: lookups ?? crudWithLookups.lookups?.bind(crudWithLookups),
    loadLookups: crudWithLookups.loadLookups?.bind(crudWithLookups),
    ensureLookups: crudWithLookups.ensureLookups?.bind(crudWithLookups),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED IMPORTS & STYLES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Common imports for config-driven detail pages.
 * Use in your component's imports array.
 */
export const ConfigDrivenDetailPageImports = [
  CommonModule,
  EntityDetailComponent,
  FieldTemplateDirective,
  PageHeaderComponent,
  PageShellComponent,
  StatusMachineComponent,
] as const;

/**
 * Common styles for config-driven detail pages.
 * Use in your component's styles array.
 */
export const ConfigDrivenDetailPageStyles = `
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

  nf-entity-detail {
    flex: 1 1 auto;
  }
`;

// ═══════════════════════════════════════════════════════════════════════════════
// BASE CLASS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Base class for config-driven detail pages.
 *
 * Provides:
 * - Mode detection from route (create vs edit)
 * - Item loading
 * - Save/Cancel/Delete action handling
 * - Toast notifications
 * - Navigation
 *
 * @stable
 *
 * Subclass must provide:
 * - facade: Entity-specific facade
 * - config: Detail page configuration
 * - headerTitle: Page title (can be computed based on mode)
 *
 * @typeParam TItem - The entity type
 */
@Directive()
export abstract class ConfigDrivenDetailPage<TItem>
  implements OnInit
{
  /** CanDeactivate guard interface — auto-delegates to EntityDetailComponent.isDirty() */
  hasUnsavedChanges(): boolean {
    return this.detailComponent?.isDirty() ?? false;
  }
  // ═══════════════════════════════════════════════════════════════════════════
  // Services
  // ═══════════════════════════════════════════════════════════════════════════

  protected readonly route = inject(ActivatedRoute);
  protected readonly router = inject(Router);
  protected readonly toast = inject(ToastService);
  protected readonly confirmDialog = inject(ConfirmDialogService);
  protected readonly printDialog = inject(PrintDialogService);
  protected readonly lookupService = inject(LookupService);
  protected readonly recentItems = inject(RecentItemsService);
  protected readonly statusTransitionDialog = inject(StatusTransitionDialogService);

  // ═══════════════════════════════════════════════════════════════════════════
  // Abstract (Must Override)
  // ═══════════════════════════════════════════════════════════════════════════

  /** Entity-specific facade for CRUD operations */
  abstract readonly facade: DetailFacade<TItem>;

  /** Detail page configuration */
  abstract readonly config: DetailPageConfig<TItem>;

  /** Page header title (can be computed) */
  abstract readonly headerTitle: string | (() => string);

  // ═══════════════════════════════════════════════════════════════════════════
  // State
  // ═══════════════════════════════════════════════════════════════════════════

  /** Current mode */
  readonly mode = signal<DetailPageMode>('create');

  /** Item ID (from route) */
  readonly itemId = signal<string | null>(null);

  /** Loaded item */
  readonly item = signal<TItem | null>(null);

  /** Loading state */
  readonly isLoading = signal(false);

  /** Saving state */
  readonly isSaving = signal(false);

  /** Status transition in progress */
  readonly isTransitioning = signal(false);

  /** Lookups loaded from field metadata (lookupEndpoint/lookupKey) */
  private readonly generatedLookups = signal<LookupContext>({});

  // ═══════════════════════════════════════════════════════════════════════════
  // View Child
  // ═══════════════════════════════════════════════════════════════════════════

  @ViewChild('detail') detailComponent?: EntityDetailComponent<TItem>;

  // ═══════════════════════════════════════════════════════════════════════════
  // Computed
  // ═══════════════════════════════════════════════════════════════════════════

  /** Header configuration — prefers route `data.breadcrumb` chain, else entity list + title */
  get headerConfig(): PageHeaderConfig {
    const title = typeof this.headerTitle === 'function'
      ? this.headerTitle()
      : this.headerTitle;

    const routeCrumbs = buildRouteBreadcrumbs(this.route);
    if (routeCrumbs.length > 0) {
      return { title, breadcrumbs: routeCrumbs };
    }

    const listRoute = this.config?.routes?.list;
    const entityName = this.config?.entityName;
    const icon = this.config?.icon;

    if (listRoute?.length && entityName) {
      const listPath = listRoute[0]?.startsWith('/') ? listRoute.join('/').replace(/\/+/g, '/') : `/${listRoute.join('/')}`;
      return {
        title,
        breadcrumbs: [
          { label: entityName, route: listPath, icon },
          { label: title },
        ],
      };
    }

    return { title };
  }

  /** Lookups for select fields */
  readonly lookups = computed(() => {
    const lookupsFromFacade = this.facade?.lookups?.() ?? {};
    return {
      ...lookupsFromFacade,
      ...this.generatedLookups(),
    };
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Lifecycle
  // ═══════════════════════════════════════════════════════════════════════════

  ngOnInit(): void {
    // Determine mode and ID from route
    const id = this.route.snapshot.paramMap.get('id');

    if (id && id !== 'new') {
      this.itemId.set(id);
      this.mode.set('edit');
      this.loadItem(id);
    } else {
      this.mode.set('create');
    }

    void this.loadLookups();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Data Loading
  // ═══════════════════════════════════════════════════════════════════════════

  protected async loadItem(id: string): Promise<void> {
    this.isLoading.set(true);
    try {
      const item = await this.facade.loadById(id);
      this.item.set(item);
      this.trackRecentVisit(item, id);
    } catch (error) {
      this.showError('Failed to load item');
      this.navigateToList();
    } finally {
      this.isLoading.set(false);
    }
  }

  private async loadLookups(): Promise<void> {
    await Promise.allSettled([
      this.ensureFacadeLookups(),
      this.loadLookupsFromConfig(),
    ]);
  }

  private async ensureFacadeLookups(): Promise<void> {
    if (this.facade.ensureLookups) {
      await this.facade.ensureLookups();
      return;
    }
    if (this.facade.loadLookups) {
      await this.facade.loadLookups();
    }
  }

  private async loadLookupsFromConfig(): Promise<void> {
    const lookupFields = this.config.fields.filter(
      (field): field is DetailFieldConfig<TItem> & { lookupKey: string; lookupEndpoint: string } =>
        !!field.lookupKey && !!field.lookupEndpoint
    );

    if (lookupFields.length === 0) {
      return;
    }

    const uniqueFields = new Map<string, DetailFieldConfig<TItem>>();
    for (const field of lookupFields) {
      if (!uniqueFields.has(field.lookupKey!)) {
        uniqueFields.set(field.lookupKey!, field);
      }
    }

    const requests = Array.from(uniqueFields.values()).map((field) => {
      const params: Record<string, string | number | boolean> = {
        ...(field.lookupParams ?? {}),
      };
      if (field.lookupDisplayField) {
        params['labelField'] = field.lookupDisplayField;
      }
      if (field.lookupValueField) {
        params['valueField'] = field.lookupValueField;
      }
      return {
        key: field.lookupKey!,
        endpoint: field.lookupEndpoint!,
        displayField: field.lookupDisplayField,
        valueField: field.lookupValueField,
        params: Object.keys(params).length > 0 ? params : undefined,
      };
    });

    const loaded = await this.lookupService.getMultiple(requests);
    this.generatedLookups.update((current) => ({ ...current, ...loaded }));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Action Handling
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Handle all detail actions.
   * Built-in actions (save, cancel, delete, duplicate) are handled automatically.
   * Custom actions are delegated to handleCustomAction.
   */
  async onAction(event: DetailActionEvent<TItem>): Promise<void> {
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

      case 'duplicate':
        await this.handleDuplicate();
        break;

      case 'print':
        await this.handlePrint();
        break;

      case 'sendEmail':
        await this.handleSendEmail();
        break;

      default:
        await this.handleCustomAction(event);
    }
  }

  protected async handlePrint(): Promise<void> {
    const id = this.itemId();
    const entityType =
      this.config.entityTypeForPrint ?? this.config.entityTypeForAudit;
    if (!id || !entityType) return;

    const item = this.item();
    const entityCode =
      item != null && typeof item === 'object' && 'code' in item
        ? String((item as { code: unknown }).code)
        : undefined;

    await this.printDialog.open(entityType, id, entityCode);
  }

  protected sendEmailDialog = inject(SendEmailDialogService);

  protected async handleSendEmail(): Promise<void> {
    const id = this.itemId();
    const entityType = this.config.entityTypeForEmail;
    if (!id || !entityType) return;

    const item = this.item();
    const entityCode =
      item != null && typeof item === 'object' && 'code' in item
        ? String((item as { code: unknown }).code)
        : undefined;
    const initialTo =
      item != null && typeof item === 'object' && 'email' in item
        ? String((item as { email: unknown }).email)
        : item != null && typeof item === 'object' && 'customerEmail' in item
          ? String((item as { customerEmail: unknown }).customerEmail)
          : undefined;

    const sent = await this.sendEmailDialog.open(entityType, id, {
      entityCode,
      initialTo,
    });
    if (sent) {
      this.showSuccess('Email sent successfully');
    }
  }

  protected async handleSave(event: DetailActionEvent<TItem>): Promise<void> {
    this.isSaving.set(true);
    try {
      const formValue = event.formValue;
      let savedItem: TItem;

      if (this.mode() === 'create') {
        savedItem = await this.facade.create(formValue as any);
      } else {
        const id = this.itemId();
        if (!id) throw new Error('No item ID');
        savedItem = await this.facade.update(id, formValue as any);
      }

      // Show success message
      const message = this.getSuccessMessage('save', savedItem);
      this.showSuccess(message);

      // Mark form as pristine
      this.detailComponent?.markAsPristine();

      // Navigate or update state
      this.afterSave(savedItem);
    } catch (error) {
      const message = this.config.saveErrorMessage ?? 'Failed to save';
      this.showError(message);
    } finally {
      this.isSaving.set(false);
    }
  }

  protected async handleCancel(): Promise<void> {
    // Check for unsaved changes
    if (this.detailComponent?.isDirty()) {
      const confirmed = await this.confirmDialog.confirm({
        title: 'Unsaved Changes',
        message: 'You have unsaved changes. Are you sure you want to leave?',
        confirmLabel: 'Leave',
        cancelLabel: 'Stay',
      });

      if (!confirmed) return;
    }

    this.navigateToList();
  }

  protected async handleDelete(): Promise<void> {
    const item = this.item();
    if (!item) return;

    const deleteConfig = this.config.deleteConfirm;
    const title = deleteConfig?.title ?? `Delete ${this.config.entityName}`;
    const message =
      typeof deleteConfig?.message === 'function'
        ? deleteConfig.message(item)
        : deleteConfig?.message ?? 'Are you sure you want to delete this item?';

    const confirmed = await this.confirmDialog.confirm({
      title,
      message,
      confirmLabel: deleteConfig?.confirmLabel ?? 'Delete',
      variant: 'danger',
    });

    if (!confirmed) return;

    this.isSaving.set(true);
    try {
      const id = this.itemId();
      if (!id) throw new Error('No item ID');

      await this.facade.delete(id);

      const successMessage = this.getSuccessMessage('delete', item);
      this.showSuccess(successMessage);

      this.navigateToList();
    } catch (error) {
      this.showError('Failed to delete');
    } finally {
      this.isSaving.set(false);
    }
  }

  protected async handleDuplicate(): Promise<void> {
    const item = this.item();
    if (!item) return;

    if (!this.facade.duplicate) {
      // No duplicate method - navigate to create with prefilled data
      // This is handled by the subclass
      await this.handleCustomAction({ actionId: 'duplicate', mode: 'edit', formValue: item as any, item });
      return;
    }

    this.isSaving.set(true);
    try {
      const duplicated = await this.facade.duplicate(item);
      this.showSuccess(`${this.config.entityName} duplicated`);

      // Navigate to the duplicated item
      if (this.config.routes.edit) {
        const route = this.config.routes.edit(duplicated);
        this.router.navigate(route);
      }
    } catch (error) {
      this.showError('Failed to duplicate');
    } finally {
      this.isSaving.set(false);
    }
  }

  /**
   * Handle entity-specific custom actions.
   * Override in subclass to handle non-standard actions.
   */
  protected async handleCustomAction(event: DetailActionEvent<TItem>): Promise<void> {
    console.log('Unhandled action:', event.actionId, event);
  }

  /**
   * Handle a status transition emitted by nf-status-machine.
   *
   * Override in subclass to call the appropriate facade method.
   * The base implementation calls `facade.executeTransition` if available,
   * then reloads the item.
   *
   * @example
   * // In your detail page:
   * protected override async handleTransition(event: StatusTransitionEvent): Promise<void> {
   *   await this.myFacade.validate(this.itemId()!);
   *   this.item.set(updated);
   * }
   */
  async handleTransition(event: import('../types').StatusTransitionEvent): Promise<void> {
    const id = this.itemId();
    if (!id) return;

    this.isTransitioning.set(true);
    try {
      const facadeWithTransition = this.facade as unknown as {
        executeTransition?: (id: string, endpoint: string, payload?: Record<string, unknown>) => Promise<TItem>;
      };

      if (facadeWithTransition.executeTransition) {
        const updated = await facadeWithTransition.executeTransition(
          id,
          event.endpoint,
          event.note ? { note: event.note } : undefined,
        );
        this.item.set(updated);
        this.showSuccess(`Transition vers "${event.toStatus}" effectuée`);
      } else {
        console.warn(`[StatusMachine] No executeTransition on facade. Override handleTransition() in your page.`);
      }
    } catch (err) {
      this.showError((err as Error).message ?? 'Transition impossible');
    } finally {
      this.isTransitioning.set(false);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Navigation
  // ═══════════════════════════════════════════════════════════════════════════

  protected navigateToList(): void {
    const route = this.config.routes.list;
    this.router.navigate(route);
  }

  /**
   * Called after successful save.
   * Default behavior: navigate to edit mode (for create) or stay (for edit).
   * Override in subclass for custom behavior.
   */
  protected afterSave(item: TItem): void {
    if (this.mode() === 'create') {
      // Navigate to edit mode with new ID
      if (this.config.routes.edit) {
        const route = this.config.routes.edit(item);
        this.router.navigate(route, { replaceUrl: true });
      } else {
        this.navigateToList();
      }
    } else {
      // Stay on page, update item
      this.item.set(item);
      const id = this.itemId();
      if (id) {
        this.trackRecentVisit(item, id);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Utilities
  // ═══════════════════════════════════════════════════════════════════════════

  protected getSuccessMessage(action: 'save' | 'delete', item: TItem): string {
    if (action === 'save') {
      const msg = this.config.saveSuccessMessage;
      return typeof msg === 'function' ? msg(item) : msg ?? `${this.config.entityName} saved`;
    } else {
      const msg = this.config.deleteSuccessMessage;
      return typeof msg === 'function' ? msg(item) : msg ?? `${this.config.entityName} deleted`;
    }
  }

  /** Show success toast */
  protected showSuccess(message: string): void {
    this.toast.success(message);
  }

  /** Show error toast */
  protected showError(message: string): void {
    this.toast.error(message);
  }

  private trackRecentVisit(item: TItem, id: string): void {
    const route = this.router.url;
    const title = this.extractTitle(item) || `${this.config.entityName} ${id}`;
    const subtitle = this.extractSubtitle(item);
    const entityType = this.config.entityTypeForAudit ?? this.config.entityName;
    const payload: RecentItem = {
      entityType,
      entityId: id,
      title,
      subtitle,
      route,
      visitedAt: new Date().toISOString(),
    };
    this.recentItems.trackVisit(payload);
  }

  private extractTitle(item: TItem): string | null {
    if (!item || typeof item !== 'object') {
      return null;
    }
    const candidate = item as Record<string, unknown>;
    for (const key of ['name', 'title', 'code']) {
      const value = candidate[key];
      if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
      }
    }
    return null;
  }

  private extractSubtitle(item: TItem): string {
    if (!item || typeof item !== 'object') {
      return this.config.entityName;
    }
    const candidate = item as Record<string, unknown>;
    const code = typeof candidate['code'] === 'string' ? candidate['code'] : null;
    const entity = this.config.entityName;
    return code ? `${entity} - ${code}` : entity;
  }
}
