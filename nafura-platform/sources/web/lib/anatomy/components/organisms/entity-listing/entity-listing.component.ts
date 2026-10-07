/**
 * Entity Listing Component — a facade-backed list rendered by `nf-listing-flat`.
 *
 * Keeps the `ListingPageConfig` + `PartialCrudFacade` contract of config-driven
 * pages; the look and the toolbar are the ones of the listing artifact.
 *
 * @example
 * ```html
 * <nf-entity-listing [config]="config" [facade]="facade" (action)="onAction($event)">
 *   <ng-template nfColumn="status" let-value let-item="item">
 *     <nf-badge [variant]="getStatusVariant(value)">{{ value }}</nf-badge>
 *   </ng-template>
 * </nf-entity-listing>
 * ```
 */

import {
  Component,
  TemplateRef,
  computed,
  contentChildren,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import { ListingFlatComponent } from '../listing-flat/listing-flat.component';
import type {
  ListingFlatConfig,
  ListingSelectionAction,
  ListingSelectionScope,
} from '../listing-flat/listing-flat.types';
import {
  clausesToGroup,
  createDefaultListingQuery,
  filterGroupToPinnedValues,
  filterValuesToClauses,
  listingQuerySnapshotEqual,
  resolveFilterGroup,
} from '../listing-flat/listing-query-state.util';
import type { ListingActionItem } from '../../molecules/listing-actions';
import { ToastService, ConfirmDialogService, CsvService, ImportExportDialogService } from '../../services';
import { PermissionService } from '../../../../../core/security/services/permission.service';
import { ColumnTemplateDirective } from './column-template.directive';
import { LISTING_EXPORT_AUDIT, type ListingExportAuditPayload } from '../../../tokens/listing-export-audit.token';

import type {
  ActionConfig,
  ColumnConfig,
  EntityActionConfig,
  ImportResult,
  ListingActionEvent,
  ListingPageConfig,
  ListingQueryState,
  LookupContext,
  PartialCrudFacade,
  ViewMode,
} from '../../../types';

@Component({
  selector: 'nf-entity-listing',
  standalone: true,
  imports: [ListingFlatComponent],
  template: `
    <nf-listing-flat
      [config]="flatConfig()"
      [items]="items()"
      [loading]="isLoading() || isRefreshing()"
      [remote]="true"
      [remoteTotal]="totalItems()"
      [query]="query()"
      [lookups]="listingLookups()"
      [cellTemplates]="cellTemplates()"
      [activeRowId]="openOnRowClick() ? activeItemId() : null"
      [error]="hasError() ? listingErrorMessage() : null"
      (load)="onQueryLoad($event)"
      (retry)="loadData()"
      (rowClick)="onRowClick($event)"
      (rowDblClick)="onRowDblClick($event)"
      (actionClick)="onToolbarAction($event)"
      (selectionChange)="onSelectionChange($event)"
    >
      <ng-content select="[nf-listing-smart-import]" />
    </nf-listing-flat>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
      min-height: 0;
    }
  `,
})
export class EntityListingComponent<TItem = unknown> {
  // ═══════════════════════════════════════════════════════════════════════════
  // Inputs / Outputs
  // ═══════════════════════════════════════════════════════════════════════════

  config = input.required<ListingPageConfig<TItem>>();
  facade = input.required<PartialCrudFacade<unknown, TItem>>();
  autoLoad = input<boolean>(true);
  /** Prefill filters (ex. query params depuis un dashboard). */
  initialFilters = input<Record<string, unknown>>({});
  /** Master–detail: a click opens the row (`rowOpen`) instead of selecting it. */
  openOnRowClick = input<boolean>(false);
  /** Master–detail: id of the open row, highlighted. */
  activeItemId = input<string | null>(null);

  action = output<ListingActionEvent<TItem>>();
  selectionChange = output<TItem[]>();
  /** @deprecated The listing has a single (table) view. */
  viewModeChange = output<ViewMode>();
  rowOpen = output<TItem>();
  itemsLoaded = output<TItem[]>();
  exported = output<{ format: 'csv' | 'xlsx'; filename: string; rowCount: number; selectionOnly: boolean }>();

  private readonly columnTemplates = contentChildren(ColumnTemplateDirective);

  // ═══════════════════════════════════════════════════════════════════════════
  // Services
  // ═══════════════════════════════════════════════════════════════════════════

  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly csvService = inject(CsvService);
  private readonly importExportDialog = inject(ImportExportDialogService);
  private readonly permissionService = inject(PermissionService);
  private readonly listingExportAudit = inject(LISTING_EXPORT_AUDIT, { optional: true });

  // ═══════════════════════════════════════════════════════════════════════════
  // State
  // ═══════════════════════════════════════════════════════════════════════════

  protected readonly _items = signal<TItem[]>([]);
  protected readonly _totalItems = signal<number>(0);
  protected readonly _loadingState = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
  protected readonly _error = signal<string | null>(null);
  protected readonly _isRefreshing = signal<boolean>(false);
  protected readonly _selection = signal<TItem[]>([]);
  /** Search, filters, sort, page and columns — shared with the listing. */
  protected readonly query = signal<ListingQueryState>(createDefaultListingQuery());
  /** Filters set by the page (quick chips) on fields the filter menu does not offer. */
  private readonly pageFilters = signal<Record<string, unknown>>({});

  readonly items = this._items.asReadonly();
  readonly totalItems = this._totalItems.asReadonly();
  readonly isLoading = computed(() => this._loadingState() === 'loading');
  readonly isLoaded = computed(() => this._loadingState() === 'success');
  readonly hasError = computed(() => this._loadingState() === 'error');
  readonly error = this._error.asReadonly();
  readonly isRefreshing = this._isRefreshing.asReadonly();
  readonly isEmpty = computed(() => this.isLoaded() && this._items().length === 0);
  readonly selectedItems = this._selection.asReadonly();
  readonly hasSelection = computed(() => this._selection().length > 0);
  readonly selectionCount = computed(() => this._selection().length);

  readonly searchTerm = computed(() => this.query().search ?? '');
  readonly filterValues = computed<Record<string, unknown>>(() => ({
    ...this.pageFilters(),
    ...filterGroupToPinnedValues(resolveFilterGroup(this.query())),
  }));
  /** Active quick view (first segment unless chosen). */
  readonly activeSegment = computed(() => {
    const segments = this.config().segments ?? [];
    const id = this.query().segment ?? this.config().defaultSegment;
    return segments.find((s) => s.id === id) ?? segments[0];
  });
  readonly currentPage = computed(() => this.query().page);
  readonly pageSize = computed(() => this.query().pageSize);

  readonly listingErrorMessage = computed(
    () => this.error() ?? this.t('Failed to load data', 'Failed to load data'),
  );

  readonly listingLookups = computed<LookupContext>(() => {
    const f = this.facade() as PartialCrudFacade<unknown, TItem> & { lookups?: () => LookupContext };
    return f?.lookups?.() ?? {};
  });

  readonly cellTemplates = computed<Record<string, TemplateRef<unknown>>>(() =>
    Object.fromEntries(this.columnTemplates().map((t) => [t.nfColumn, t.templateRef])),
  );

  /** Visible columns (used by exports). */
  readonly visibleColumns = computed<ColumnConfig[]>(() => {
    const state = new Map((this.query().columns ?? []).map((c) => [c.key, c.visible]));
    const defaults = this.config().defaultVisibleColumns;
    return this.config().columns.filter((c) =>
      state.has(c.key) ? state.get(c.key) : !defaults || defaults.includes(c.key),
    );
  });

  /** Listing artifact config — depends on the page config and permissions only. */
  readonly flatConfig = computed<ListingFlatConfig>(() => {
    const cfg = this.config();
    const allowed = (cfg.actions ?? []).filter((a) => this.hasActionPermission(a));
    const global = allowed.filter((a) => a.scope === 'global');
    const scoped = allowed.filter((a) => a.scope !== 'global');
    const mode = cfg.features.selectionMode;

    const actions: ListingActionItem[] = global.length
      ? global.map((a) => this.toActionItem(a))
      : (cfg.toolbarActions ?? []).map((a) => this.toActionItem(a));
    const selectionActions: ListingSelectionAction[] = scoped.length
      ? scoped.map((a) => ({
          ...this.toActionItem(a),
          scope: a.scope as ListingSelectionScope,
          minSelection: a.minSelection,
          maxSelection: a.maxSelection,
          visibleFor: a.visible as ((selection: unknown[]) => boolean) | undefined,
          disabledFor: a.disabled as ((selection: unknown[]) => boolean) | undefined,
        }))
      : (cfg.bulkActions ?? []).map((a) => ({ ...this.toActionItem(a), scope: 'single+bulk' as const }));

    const empty = cfg.emptyState;
    const emptyActionId = empty.actionId ?? 'create';
    const emptyActionOffered =
      !!empty.actionLabel &&
      (global.some((a) => a.id === emptyActionId || (emptyActionId === 'create' && a.id === 'new')) ||
        (!!cfg.routes?.create && !(cfg.actions ?? []).some((a) => a.id === emptyActionId)));

    return {
      columns: cfg.columns,
      defaultVisibleColumns: cfg.defaultVisibleColumns,
      filters: cfg.filters,
      filterMode: 'simple',
      segments: cfg.segments,
      defaultSegment: cfg.defaultSegment,
      pageSize: cfg.pagination.defaultPageSize,
      pageSizeOptions: cfg.pagination.pageSizeOptions,
      emptyState: {
        icon: empty.icon,
        title: empty.title,
        message: empty.message,
        actionLabel: emptyActionOffered ? empty.actionLabel : undefined,
        actionId: emptyActionId,
      },
      projectedActions: true,
      actions,
      selectionActions,
      features: {
        search: cfg.features.search,
        filters: cfg.features.filters,
        columnToggle: cfg.features.columnToggle,
        export: false,
        selection: mode === 'toggleable' ? 'multiple' : mode,
        selectionToggle: mode === 'toggleable',
        selectionToggleDefaultActive: false,
        pagination: true,
        rowClick: this.openOnRowClick() ? 'open' : 'select',
      },
    };
  });

  constructor() {
    effect(() => {
      const cfg = this.config();
      const init = this.initialFilters();
      untracked(() => {
        this.query.set({
          ...createDefaultListingQuery(cfg.pagination.defaultPageSize),
          sort: cfg.defaultSort
            ? [{ field: cfg.defaultSort.column, direction: cfg.defaultSort.direction ?? 'asc' }]
            : null,
        });
        this.applyFilterValues(init ?? {});
        if (this.autoLoad()) {
          void this.loadData();
        }
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Data
  // ═══════════════════════════════════════════════════════════════════════════

  async loadData(): Promise<void> {
    const facadeInstance = this.facade();
    if (!facadeInstance?.loadItems) {
      if (facadeInstance) console.warn('Facade does not implement loadItems()');
      return;
    }

    this._loadingState.set('loading');
    this._error.set(null);

    try {
      const ensureLookups = (facadeInstance as { ensureLookups?: () => Promise<void> }).ensureLookups;
      if (ensureLookups) {
        await ensureLookups.call(facadeInstance);
      }
      const result = await facadeInstance.loadItems(this.buildQuery());
      this._items.set(result.items);
      this._totalItems.set(result.total);
      this._loadingState.set('success');
      this.itemsLoaded.emit(result.items);
    } catch (e) {
      this._error.set(e instanceof Error ? e.message : this.t('Failed to load data', 'Failed to load data'));
      this._loadingState.set('error');
    }
  }

  async refresh(): Promise<void> {
    const facadeInstance = this.facade();
    if (!facadeInstance.loadItems) return;

    this._isRefreshing.set(true);
    this._error.set(null);

    try {
      const result = await facadeInstance.loadItems(this.buildQuery());
      this._items.set(result.items);
      this._totalItems.set(result.total);
      this.itemsLoaded.emit(result.items);
    } catch (e) {
      this._error.set(e instanceof Error ? e.message : this.t('Failed to refresh', 'Failed to refresh'));
    } finally {
      this._isRefreshing.set(false);
    }
  }

  protected buildQuery(): Record<string, unknown> {
    const q = this.query();
    const primary = q.sort?.[0];
    const sorted = primary ? this.config().columns.find((c) => c.key === primary.field) : undefined;
    return {
      page: q.page,
      pageSize: q.pageSize,
      sortBy: primary ? (sorted?.field ?? primary.field) : undefined,
      sortDirection: primary?.direction,
      search: q.search || undefined,
      ...this.activeSegment()?.filters,
      ...this.filterValues(),
    };
  }

  /** The listing changed search, filters, sort, page or columns. */
  onQueryLoad(next: ListingQueryState): void {
    const withoutColumns = (q: ListingQueryState) => ({ ...q, columns: undefined });
    const reload = !listingQuerySnapshotEqual(withoutColumns(next), withoutColumns(this.query()));
    this.query.set(next);
    if (reload) {
      void this.loadData();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Filters & search (also driven by pages: quick chips, dashboards)
  // ═══════════════════════════════════════════════════════════════════════════

  onFilterChange(filters: Record<string, unknown>): void {
    this.applyFilterValues(filters);
    void this.loadData();
  }

  onSearchChange(value: string): void {
    this.query.update((q) => ({ ...q, search: value, page: 1 }));
    void this.loadData();
  }

  onResetFilters(): void {
    this.pageFilters.set({});
    this.query.update((q) => ({ ...q, search: '', filters: [], filterGroup: clausesToGroup([]), page: 1 }));
    void this.loadData();
  }

  clearFilterChip(key: string): void {
    const next = { ...this.filterValues() };
    delete next[key];
    this.onFilterChange(next);
  }

  private applyFilterValues(values: Record<string, unknown>): void {
    const fields = this.config().filters ?? [];
    const offered = new Set(fields.map((f) => f.key));
    const inMenu: Record<string, unknown> = {};
    const fromPage: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(values)) {
      if (value === undefined) continue;
      (offered.has(key) ? inMenu : fromPage)[key] = value;
    }
    const clauses = filterValuesToClauses(inMenu, fields);
    this.pageFilters.set(fromPage);
    this.query.update((q) => ({ ...q, filters: clauses, filterGroup: clausesToGroup(clauses), page: 1 }));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Selection & rows
  // ═══════════════════════════════════════════════════════════════════════════

  onSelectionChange(items: TItem[]): void {
    this._selection.set(items);
    this.selectionChange.emit(items);
  }

  clearSelection(): void {
    this._selection.set([]);
    this.selectionChange.emit([]);
  }

  onRowClick(item: TItem): void {
    if (this.openOnRowClick()) {
      this.rowOpen.emit(item);
    }
  }

  onRowDblClick(item: TItem): void {
    this.navigateToDetail(item);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Actions
  // ═══════════════════════════════════════════════════════════════════════════

  onToolbarAction(actionId: string): void {
    switch (actionId) {
      case 'new':
      case 'create':
        if (this.config().routes?.create) {
          this.navigateToCreate();
          return;
        }
        break;
      case 'refresh':
        void this.refresh();
        return;
      case 'import-export':
        void this.openImportExportModal();
        return;
      case 'bulk-delete':
        void this.handleBulkDelete();
        return;
    }

    const unifiedAction = (this.config().actions ?? []).find((a) => a.id === actionId);
    if (unifiedAction?.builtin) {
      this.handleBuiltinAction(unifiedAction.builtin);
      return;
    }

    const selection = this._selection();
    const isSelectionAction =
      (unifiedAction !== undefined && unifiedAction.scope !== 'global') ||
      (this.config().bulkActions?.some((a) => a.id === actionId) ?? false);

    this.action.emit({
      actionId,
      source: isSelectionAction && selection.length > 0 ? 'bulk' : 'toolbar',
      selection: isSelectionAction && selection.length > 0 ? selection : undefined,
      item: selection.length === 1 ? selection[0] : undefined,
    });
  }

  protected handleBuiltinAction(action: 'edit' | 'view' | 'delete' | 'duplicate'): void {
    const selection = this._selection();
    switch (action) {
      case 'edit':
      case 'view':
        if (selection.length === 1) this.navigateToDetail(selection[0]);
        break;
      case 'delete':
        if (selection.length === 1) {
          void this.deleteItem(selection[0]);
        } else if (selection.length > 1) {
          void this.handleBulkDelete();
        }
        break;
      case 'duplicate':
        if (selection.length === 1) {
          this.action.emit({ actionId: 'duplicate', source: 'bulk', item: selection[0], selection });
        }
        break;
    }
  }

  navigateToCreate(): void {
    const routes = this.config().routes;
    if (routes?.create) {
      void this.router.navigate(routes.create);
    }
  }

  navigateToDetail(item: TItem): void {
    const routes = this.config().routes;
    if (routes?.detail) {
      void this.router.navigate(routes.detail(item));
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Delete
  // ═══════════════════════════════════════════════════════════════════════════

  async deleteItem(item: TItem): Promise<void> {
    const deleteConfig = this.config().delete;
    if (!deleteConfig) {
      console.warn('Delete config not set');
      return;
    }

    const confirmed = await this.confirmDialog.confirm({
      title: deleteConfig.title,
      message: deleteConfig.getMessage(item),
      confirmLabel: deleteConfig.confirmLabel ?? this.t('Delete', 'Delete'),
      variant: 'danger',
      icon: deleteConfig.icon ?? 'delete',
    });
    if (!confirmed) return;

    try {
      const facadeInstance = this.facade();
      if (facadeInstance.deleteItem) {
        await facadeInstance.deleteItem(this.getItemId(item));
        this.toast.success(deleteConfig.successMessage);
        await this.refresh();
      }
    } catch {
      this.toast.error(deleteConfig.errorMessage);
    }
  }

  protected async handleBulkDelete(): Promise<void> {
    const selected = this._selection();
    if (selected.length === 0) return;
    if (!this.config().delete) return;

    const confirmed = await this.confirmDialog.confirm({
      title: this.translate.instant('shared.entityListing.bulkDelete.title', {
        count: selected.length,
        entity:
          selected.length === 1
            ? this.translateLabel(this.config().entityName)
            : this.translateLabel(this.config().entityNamePlural),
      }),
      message: this.translate.instant('shared.entityListing.bulkDelete.message', { count: selected.length }),
      confirmLabel: this.translate.instant('shared.entityListing.bulkDelete.confirmLabel'),
      variant: 'danger',
      icon: 'delete',
    });
    if (!confirmed) return;

    try {
      const facadeInstance = this.facade();
      if (facadeInstance.deleteItem) {
        for (const item of selected) {
          await facadeInstance.deleteItem(this.getItemId(item));
        }
        this.toast.success(this.translate.instant('shared.entityListing.toast.deleted', { count: selected.length }));
        this.clearSelection();
        await this.refresh();
      }
    } catch {
      this.toast.error(this.t('Failed to delete some items', 'Failed to delete some items'));
    }
  }

  protected getItemId(item: TItem): string {
    return (item as { id: string }).id;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Import / Export
  // ═══════════════════════════════════════════════════════════════════════════

  async openImportExportModal(): Promise<void> {
    const importExportConfig = this.config().importExport;
    if (!importExportConfig?.enableImportExport) return;

    const facadeInstance = this.facade();
    const hasImportCsv = typeof (facadeInstance as { importCsv?: (f: File) => Promise<ImportResult> }).importCsv === 'function';
    const hasExportCsv = typeof (facadeInstance as { exportCsv?: (q?: Record<string, unknown>) => Promise<Blob> }).exportCsv === 'function';

    const closed = await this.importExportDialog.open({
      config: importExportConfig,
      downloadTemplate: () => {
        this.csvService.generateTemplateCsv(
          importExportConfig.templateColumns.map((c) => ({ key: c.key, label: c.label ?? c.key })),
          `${this.config().entityName.toLowerCase()}-template-${new Date().toISOString().slice(0, 10)}.csv`,
        );
        this.toast.success(this.t('Template downloaded', 'Template downloaded'));
      },
      importFile: hasImportCsv ? (file) => this.runImportFile(file) : undefined,
      importRows: hasImportCsv ? undefined : (rows) => this.runImport(rows),
      exportView: () => this.exportView(hasExportCsv),
      exportSelection: () => this.exportSelection(),
      hasSelection: () => this._selection().length > 0,
    });

    if (closed) {
      await this.loadData();
    }
  }

  protected async runImportFile(file: File): Promise<ImportResult> {
    const facadeInstance = this.facade() as { importCsv?: (f: File) => Promise<ImportResult> };
    if (facadeInstance.importCsv) {
      return facadeInstance.importCsv(file);
    }
    return { created: 0, updated: 0, skipped: 0, failed: 0, errors: [] };
  }

  protected async runImport(rows: Record<string, string>[]): Promise<ImportResult> {
    this.action.emit({ actionId: 'import', source: 'toolbar' });
    return { created: 0, updated: 0, skipped: 0, failed: rows.length, errors: [] };
  }

  /** Backend export when the facade has one (filtered, up to 10k rows); otherwise CSV of the filtered rows. */
  protected async exportView(useBackendExport?: boolean): Promise<void> {
    const facadeInstance = this.facade() as {
      loadItems?: (q: Record<string, unknown>) => Promise<{ items: unknown[]; total: number }>;
      exportCsv?: (q?: Record<string, unknown>) => Promise<Blob>;
    };
    const filename = `${this.config().entityName.toLowerCase()}-export-${new Date().toISOString().slice(0, 10)}.csv`;

    if (useBackendExport && facadeInstance.exportCsv) {
      try {
        const blob = await facadeInstance.exportCsv(this.buildQuery());
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        this.toast.success(this.t('Export complete', 'Export complete'));
        this.notifyExported({ format: 'csv', filename, rowCount: -1, selectionOnly: false });
      } catch (e) {
        this.toast.error(e instanceof Error ? e.message : this.t('Export failed', 'Export failed'));
      }
      return;
    }

    const columns = this.visibleColumns().map((c) => ({ field: c.field, label: c.label }));
    if (columns.length === 0) {
      this.toast.warning(this.t('No columns to export', 'No columns to export'));
      return;
    }
    if (!facadeInstance.loadItems) return;

    const result = await facadeInstance.loadItems({
      ...this.buildQuery(),
      page: 1,
      pageSize: CsvService.DEFAULT_EXPORT_PAGE_SIZE,
    });
    this.csvService.exportToCsv(result.items as Record<string, unknown>[], columns, filename);
    this.toast.success(this.translate.instant('shared.entityListing.toast.exported', { count: result.items.length }));
    this.notifyExported({ format: 'csv', filename, rowCount: result.items.length, selectionOnly: false });
  }

  protected async exportSelection(): Promise<void> {
    const selected = this._selection();
    if (selected.length === 0) {
      this.toast.warning(this.t('Select items to export', 'Select items to export'));
      return;
    }
    const columns = this.visibleColumns().map((c) => ({ field: c.field, label: c.label }));
    if (columns.length === 0) {
      this.toast.warning(this.t('No columns to export', 'No columns to export'));
      return;
    }

    const filename = `${this.config().entityName.toLowerCase()}-selected-${new Date().toISOString().slice(0, 10)}.csv`;
    this.csvService.exportToCsv(selected as Record<string, unknown>[], columns, filename);
    this.toast.success(this.translate.instant('shared.entityListing.toast.exported', { count: selected.length }));
    this.notifyExported({ format: 'csv', filename, rowCount: selected.length, selectionOnly: true });
  }

  private notifyExported(event: { format: 'csv'; filename: string; rowCount: number; selectionOnly: boolean }): void {
    this.exported.emit(event);
    const payload: ListingExportAuditPayload = {
      entityName: this.config().entityName,
      entityNamePlural: this.config().entityNamePlural,
      ...event,
    };
    this.listingExportAudit?.(payload);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Helpers
  // ═══════════════════════════════════════════════════════════════════════════

  /** Custom template for a column, if defined. */
  getColumnTemplate(columnKey: string): TemplateRef<unknown> | null {
    return this.cellTemplates()[columnKey] ?? null;
  }

  private hasActionPermission(action: EntityActionConfig<TItem>): boolean {
    return !action.permission || this.permissionService.hasPermission(action.permission);
  }

  private toActionItem(a: EntityActionConfig<TItem> | ActionConfig): ListingActionItem {
    return {
      id: a.id,
      label: a.label ?? '',
      icon: a.icon,
      variant: a.variant as ListingActionItem['variant'],
      tooltip: a.tooltip ?? a.ariaLabel ?? a.label,
      disabled: typeof a.disabled === 'boolean' ? a.disabled : undefined,
    };
  }

  private translateLabel(value: string): string {
    const translated = this.translate.instant(value);
    return translated === value ? value : translated;
  }

  private t(key: string, fallback: string, params?: Record<string, unknown>): string {
    const translated = this.translate.instant(key, params);
    return translated === key ? fallback : translated;
  }
}
