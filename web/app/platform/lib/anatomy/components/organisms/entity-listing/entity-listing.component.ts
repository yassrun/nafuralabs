/**
 * Entity Listing Component
 *
 * A config-driven, fully standardized listing component for entities.
 * Handles all listing concerns: data loading, pagination, sorting, selection,
 * filtering, view modes, and actions.
 *
 * Features:
 * - Multiple view modes: table, cards, grid, list
 * - Config-driven columns, filters, actions
 * - Built-in selection (single, multiple, toggleable)
 * - Import/export support
 * - Custom cell templates via content projection
 *
 * @example
 * ```html
 * <nf-entity-listing
 *   [config]="config"
 *   [facade]="facade"
 *   (action)="onAction($event)">
 *
 *   <!-- Custom status cell template -->
 *   <ng-template nfColumn="status" let-value let-item="item">
 *     <nf-badge [variant]="getStatusVariant(value)">{{ value }}</nf-badge>
 *   </ng-template>
 *
 * </nf-entity-listing>
 * ```
 */

import {
  Component,
  ContentChildren,
  OnDestroy,
  QueryList,
  TemplateRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

import { DataTableComponent } from '../data-table';
import { PaginationComponent } from '../pagination';
import { ListingControlsComponent, ListingControlsColumn } from '../../molecules/listing-controls';
import { FilterResetComponent } from '../../molecules/filter-reset/filter-reset.component';
import { ButtonListComponent, ButtonListItem } from '../../molecules/button-list';
import { DataStateComponent, type DataStateValue } from '../../molecules/data-state';
import { ToastService, ConfirmDialogService, CsvService, ImportExportDialogService } from '../../services';
import { PermissionService } from '../../../../../core/security/services/permission.service';
import { ColumnTemplateDirective } from './column-template.directive';
import { LISTING_EXPORT_AUDIT, type ListingExportAuditPayload } from '../../../tokens/listing-export-audit.token';
import { CardViewComponent } from './card-view.component';
import { GridViewComponent } from './grid-view.component';
import { ListViewComponent } from './list-view.component';

import type {
  ListingPageConfig,
  ListingActionEvent,
  ColumnConfig,
  LookupContext,
  ViewMode,
  SelectionMode,
  SortState,
  PartialCrudFacade,
  ImportResult,
  EntityActionConfig,
} from '../../../types';

@Component({
  selector: 'nf-entity-listing',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    DataTableComponent,
    PaginationComponent,
    ListingControlsComponent,
    FilterResetComponent,
    ButtonListComponent,
    DataStateComponent,
    CardViewComponent,
    GridViewComponent,
    ListViewComponent,
  ],
  templateUrl: './entity-listing.component.html',
  styleUrl: './entity-listing.component.scss',
})
export class EntityListingComponent<TItem = unknown> implements OnDestroy {
  // ═══════════════════════════════════════════════════════════════════════════
  // Inputs
  // ═══════════════════════════════════════════════════════════════════════════

  /** Listing configuration */
  config = input.required<ListingPageConfig<TItem>>();

  /** CRUD facade for data operations */
  facade = input.required<PartialCrudFacade<unknown, TItem>>();

  /** Whether to auto-load data on init */
  autoLoad = input<boolean>(true);

  /**
   * Master–Slave mode: single click opens item (emits rowOpen) instead of toggling selection.
   * When true, selection mode is effectively ignored for row click; use (rowOpen) to sync URL/detail.
   */
  openOnRowClick = input<boolean>(false);

  /**
   * Master–Slave: id of the row that is "open" (drives detail pane). When set with openOnRowClick,
   * that row is highlighted (single-selection effect) without using checkbox selection.
   */
  activeItemId = input<string | null>(null);

  // ═══════════════════════════════════════════════════════════════════════════
  // Outputs
  // ═══════════════════════════════════════════════════════════════════════════

  /** Emitted when an action is triggered */
  action = output<ListingActionEvent<TItem>>();

  /** Emitted when selection changes */
  selectionChange = output<TItem[]>();

  /** Emitted when view mode changes */
  viewModeChange = output<ViewMode>();

  /** Emitted when user single-clicks a row and openOnRowClick is true (Master–Slave pattern). */
  rowOpen = output<TItem>();

  /** Emitted when a load completes successfully with the current items (e.g. for master–slave to auto-select first). */
  itemsLoaded = output<TItem[]>();

  /** Emitted right after a successful export (CSV/XLSX). Hook for audit logging. */
  exported = output<{ format: 'csv' | 'xlsx'; filename: string; rowCount: number; selectionOnly: boolean }>();

  // ═══════════════════════════════════════════════════════════════════════════
  // Content Children (Custom Templates)
  // ═══════════════════════════════════════════════════════════════════════════

  @ContentChildren(ColumnTemplateDirective)
  columnTemplates!: QueryList<ColumnTemplateDirective>;

  // ═══════════════════════════════════════════════════════════════════════════
  // Injected Services
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
  // Internal State
  // ═══════════════════════════════════════════════════════════════════════════

  // Lifecycle
  private readonly destroy$ = new Subject<void>();
  private readonly search$ = new Subject<string>();

  // Data
  protected readonly _items = signal<TItem[]>([]);
  protected readonly _totalItems = signal<number>(0);
  protected readonly _loadingState = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
  protected readonly _error = signal<string | null>(null);
  protected readonly _isRefreshing = signal<boolean>(false);

  // Pagination
  protected readonly _currentPage = signal<number>(1);
  protected readonly _pageSize = signal<number>(20);

  // Sorting
  protected readonly _sort = signal<SortState | null>(null);

  // Selection
  protected readonly _selectionMode = signal<SelectionMode>('none');
  protected readonly _selection = signal<TItem[]>([]);

  // View
  protected readonly _viewMode = signal<ViewMode>('table');

  // Filters & Search
  protected readonly _filterValues = signal<Record<string, unknown>>({});
  protected readonly _searchTerm = signal<string>('');

  // Column visibility
  protected readonly _visibleColumnKeys = signal<Set<string>>(new Set());

  // ═══════════════════════════════════════════════════════════════════════════
  // Computed State
  // ═══════════════════════════════════════════════════════════════════════════

  readonly items = this._items.asReadonly();
  readonly totalItems = this._totalItems.asReadonly();
  readonly isLoading = computed(() => this._loadingState() === 'loading');
  readonly isLoaded = computed(() => this._loadingState() === 'success');
  readonly hasError = computed(() => this._loadingState() === 'error');
  readonly error = this._error.asReadonly();
  readonly isRefreshing = this._isRefreshing.asReadonly();
  readonly isEmpty = computed(() => this.isLoaded() && this._items().length === 0);

  /** Unified state for `<nf-data-state>` (all config-driven listings). */
  readonly listingDataState = computed<DataStateValue>(() => {
    const ls = this._loadingState();
    if (ls === 'idle') {
      return this.autoLoad() ? 'loading' : 'loaded';
    }
    if (this.isLoading() && !this.isRefreshing()) {
      return 'loading';
    }
    if (this.hasError()) {
      return 'error';
    }
    if (this.isEmpty()) {
      return 'empty';
    }
    return 'loaded';
  });

  readonly listingLoadingMessage = computed(() => {
    const head = this.translate.instant('Loading');
    const plural = this.translateLabel(this.config().entityNamePlural);
    return `${head} ${plural}...`;
  });

  readonly listingErrorMessage = computed(() =>
    this.error() ?? this.t('Failed to load data', 'Failed to load data'),
  );

  readonly listingEmptyTitle = computed(() => this.translateLabel(this.config().emptyState.title));

  readonly listingEmptyMessage = computed(() => this.translateLabel(this.config().emptyState.message));

  readonly listingEmptyActionLabel = computed(() => {
    const label = this.config().emptyState.actionLabel;
    return label ? this.translateLabel(label) : '';
  });

  readonly currentPage = this._currentPage.asReadonly();
  readonly pageSize = this._pageSize.asReadonly();
  readonly totalPages = computed(() =>
    Math.ceil(this._totalItems() / this._pageSize()) || 1
  );

  readonly sort = this._sort.asReadonly();
  readonly selectionMode = this._selectionMode.asReadonly();
  readonly selectedItems = this._selection.asReadonly();
  readonly hasSelection = computed(() => this._selection().length > 0);
  readonly selectionCount = computed(() => this._selection().length);

  /**
   * Selection passed to table/card/grid/list for display (row highlight).
   * When openOnRowClick + activeItemId, highlights the row with that id; otherwise uses _selection.
   */
  readonly effectiveTableSelection = computed<TItem[]>(() => {
    if (this.openOnRowClick() && this.activeItemId()) {
      const id = this.activeItemId()!;
      const found = this._items().find((i) => (i as { id?: string }).id === id);
      return found ? [found] : [];
    }
    return this._selection();
  });

  readonly viewMode = this._viewMode.asReadonly();
  readonly filterValues = this._filterValues.asReadonly();
  readonly searchTerm = this._searchTerm.asReadonly();
  readonly hasActiveFilters = computed(() =>
    Object.keys(this._filterValues()).length > 0 || this._searchTerm().length > 0
  );

  /**
   * Active structured filters as removable chips (shown below toolbar on narrow viewports; Task 4.5).
   */
  readonly mobileActiveFilterChips = computed(() => {
    const cfg = this.config();
    const values = this._filterValues();
    const filters = cfg.filters ?? [];
    const chips: { key: string; label: string; value: string }[] = [];
    for (const f of filters) {
      const v = values[f.key];
      if (v === undefined || v === null || v === '') continue;
      if (Array.isArray(v) && v.length === 0) continue;
      const display = Array.isArray(v) ? v.map(String).join(', ') : String(v);
      chips.push({ key: f.key, label: f.label, value: display });
    }
    return chips;
  });

  /** Columns with visibility toggle support */
  readonly listingColumns = computed<ListingControlsColumn[]>(() => {
    const visibleKeys = this._visibleColumnKeys();
    return this.config().columns.map((c) => ({
      key: c.key,
      label: c.label,
      visible: visibleKeys.has(c.key),
    }));
  });

  readonly hiddenColumnsCount = computed(() =>
    this.listingColumns().filter((c) => !c.visible).length
  );

  /** Lookups for filter options (from facade if available). */
  readonly listingLookups = computed<LookupContext>(() => {
    const f = this.facade() as (PartialCrudFacade<unknown, TItem> & { lookups?: () => LookupContext }) | undefined;
    if (!f) return {};
    return f.lookups?.() ?? {};
  });

  /** Visible columns for table view */
  readonly visibleColumns = computed<ColumnConfig[]>(() => {
    const visibleKeys = this._visibleColumnKeys();
    return this.config().columns.filter((col) => visibleKeys.has(col.key));
  });

  /**
   * Check if user has permission for an action.
   * If no permission is specified, action is allowed.
   */
  private hasActionPermission(action: EntityActionConfig<TItem>): boolean {
    if (!action.permission) return true;
    return this.permissionService.hasPermission(action.permission);
  }

  /**
   * Selection-based actions (single, bulk, single+bulk scopes).
   * Only visible when items are selected and user has permission.
   */
  readonly selectionActions = computed<ButtonListItem[]>(() => {
    const cfg = this.config();
    const unifiedActions = cfg.actions ?? [];
    const selection = this._selection();
    const selectionCount = selection.length;
    const result: ButtonListItem[] = [];

    if (selectionCount === 0) return result;

    // Process selection-based actions
    unifiedActions
      .filter((a) => a.scope !== 'global')
      .filter((a) => this.hasActionPermission(a)) // Permission check
      .forEach((a) => {
        let isVisible = false;

        switch (a.scope) {
          case 'single':
            isVisible = selectionCount === 1;
            break;
          case 'bulk':
            isVisible = selectionCount >= (a.minSelection ?? 2);
            break;
          case 'single+bulk':
            isVisible = selectionCount >= (a.minSelection ?? 1);
            break;
        }

        if (!isVisible) return;
        if (a.maxSelection && selectionCount > a.maxSelection) return;
        if (a.visible && !a.visible(selection)) return;

        const isDisabled = a.disabled ? a.disabled(selection) : false;

        result.push({
          id: a.id,
          label: a.label ?? '',
          icon: a.icon,
          variant: (a.variant as ButtonListItem['variant']) ?? 'secondary',
          ariaLabel: a.ariaLabel ?? a.label,
          tooltip: a.tooltip ?? a.ariaLabel ?? a.label ?? '',
          disabled: isDisabled,
        });
      });

    // Fallback to legacy bulkActions
    if (result.length === 0 && cfg.bulkActions) {
      cfg.bulkActions.forEach((a) => {
        result.push({
          id: a.id,
          label: a.label ?? '',
          icon: a.icon,
          variant: (a.variant as ButtonListItem['variant']) ?? 'secondary',
          ariaLabel: a.ariaLabel ?? a.label,
          disabled: a.disabled,
        });
      });
    }

    return result;
  });

  /**
   * Global actions (always visible if user has permission).
   */
  readonly globalActions = computed<ButtonListItem[]>(() => {
    const cfg = this.config();
    const unifiedActions = cfg.actions ?? [];
    const result: ButtonListItem[] = [];

    // Process global actions
    unifiedActions
      .filter((a) => a.scope === 'global')
      .filter((a) => this.hasActionPermission(a)) // Permission check
      .forEach((a) => {
        result.push({
          id: a.id,
          label: a.label ?? '',
          icon: a.icon,
          variant: (a.variant as ButtonListItem['variant']) ?? 'secondary',
          ariaLabel: a.ariaLabel ?? a.label,
          tooltip: a.tooltip ?? a.ariaLabel ?? a.label ?? '',
          disabled: false,
        });
      });

    // Fallback to legacy toolbarActions
    if (result.length === 0 && cfg.toolbarActions) {
      cfg.toolbarActions.forEach((a) => {
        result.push({
          id: a.id,
          label: a.label ?? '',
          icon: a.icon,
          variant: (a.variant as ButtonListItem['variant']) ?? 'secondary',
          ariaLabel: a.ariaLabel ?? a.label,
          tooltip: a.tooltip ?? a.ariaLabel ?? a.label ?? '',
          disabled: a.disabled,
        });
      });
    }

    return result;
  });

  /** Combined toolbar actions (for backwards compatibility). */
  readonly toolbarButtonActions = computed<ButtonListItem[]>(() => {
    return [...this.selectionActions(), ...this.globalActions()];
  });

  /** Selection mode for data table */
  readonly selectableMode = computed<boolean | 'single' | 'multiple'>(() => {
    const mode = this._selectionMode();
    return mode === 'none' ? false : mode;
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Lifecycle
  // ═══════════════════════════════════════════════════════════════════════════

  constructor() {
    // Initialize state from config when config changes
    effect(() => {
      const cfg = this.config();

      // Set default page size
      this._pageSize.set(cfg.pagination.defaultPageSize);

      // Set default sort
      if (cfg.defaultSort) {
        this._sort.set(cfg.defaultSort);
      }

      // Set default selection mode
      const selMode = cfg.features.selectionMode;
      if (selMode === 'single' || selMode === 'multiple') {
        this._selectionMode.set(selMode);
      } else if (selMode === 'toggleable') {
        this._selectionMode.set('single'); // Default to single, can toggle to multiple
      } else {
        this._selectionMode.set('none');
      }

      // Set default view mode
      this._viewMode.set(cfg.viewModes.default);

      // Initialize visible columns
      const defaultVisible = cfg.defaultVisibleColumns ?? cfg.columns.map((c) => c.key);
      this._visibleColumnKeys.set(new Set(defaultVisible));
    }, { allowSignalWrites: true });

    // Auto-load data
    effect(() => {
      if (this.autoLoad()) {
        this.loadData();
      }
    }, { allowSignalWrites: true });

    // Debounced search (300ms)
    this.search$
      .pipe(
        debounceTime(300),
        takeUntil(this.destroy$)
      )
      .subscribe((value) => {
        this._searchTerm.set(value);
        this._currentPage.set(1);
        this.loadData();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Data Operations
  // ═══════════════════════════════════════════════════════════════════════════

  async loadData(): Promise<void> {
    const facadeInstance = this.facade();
    if (!facadeInstance?.loadItems) {
      if (!facadeInstance) return;
      console.warn('Facade does not implement loadItems()');
      return;
    }

    this._loadingState.set('loading');
    this._error.set(null);
    this.clearSelection();

    try {
      const ensureLookups = (facadeInstance as { ensureLookups?: () => Promise<void> }).ensureLookups;
      if (ensureLookups) {
        await ensureLookups.call(facadeInstance);
      }
      const query = this.buildQuery();
      const result = await facadeInstance.loadItems(query);
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
      const query = this.buildQuery();
      const result = await facadeInstance.loadItems(query);
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
    const sort = this._sort();
    return {
      page: this._currentPage(),
      pageSize: this._pageSize(),
      sortBy: sort?.column,
      sortDirection: sort?.direction,
      search: this._searchTerm() || undefined,
      ...this._filterValues(),
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Pagination
  // ═══════════════════════════════════════════════════════════════════════════

  onPageChange(event: { page: number; pageSize: number }): void {
    if (event.pageSize !== this._pageSize()) {
      this._pageSize.set(event.pageSize);
      this._currentPage.set(1);
    } else {
      this._currentPage.set(event.page);
    }
    this.loadData();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Sorting
  // ═══════════════════════════════════════════════════════════════════════════

  onSortChange(event: { column: string; direction: 'asc' | 'desc' | null }): void {
    this._sort.set(event.direction ? { column: event.column, direction: event.direction } : null);
    this._currentPage.set(1);
    this.loadData();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Selection
  // ═══════════════════════════════════════════════════════════════════════════

  onSelectionChange(items: TItem[]): void {
    this._selection.set(items);
    this.selectionChange.emit(items);
  }

  clearSelection(): void {
    this._selection.set([]);
    this.selectionChange.emit([]);
  }

  onToggleSelectionMode(): void {
    const currentMode = this._selectionMode();
    if (currentMode === 'multiple') {
      this._selectionMode.set('single');
      this.clearSelection();
    } else {
      this._selectionMode.set('multiple');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Filters & Search
  // ═══════════════════════════════════════════════════════════════════════════

  onSearchChange(value: string): void {
    // Use debounced search to avoid excessive API calls
    this.search$.next(value);
  }

  onFilterChange(filters: Record<string, unknown>): void {
    this._filterValues.set(filters);
    this._currentPage.set(1);
    this.loadData();
  }

  onResetFilters(): void {
    this._filterValues.set({});
    this._searchTerm.set('');
    this.search$.next('');
    this._currentPage.set(1);
    this.loadData();
  }

  clearFilterChip(key: string): void {
    const next = { ...this._filterValues() };
    delete next[key];
    this.onFilterChange(next);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Column Visibility
  // ═══════════════════════════════════════════════════════════════════════════

  onColumnsChange(columns: ListingControlsColumn[]): void {
    const visibleKeys = new Set(columns.filter((c) => c.visible).map((c) => c.key));
    this._visibleColumnKeys.set(visibleKeys);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // View Mode
  // ═══════════════════════════════════════════════════════════════════════════

  onViewModeChange(mode: ViewMode): void {
    this._viewMode.set(mode);
    this.viewModeChange.emit(mode);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Row Events
  // ═══════════════════════════════════════════════════════════════════════════

  onRowClick(item: TItem): void {
    if (this.openOnRowClick()) {
      this.rowOpen.emit(item);
      return;
    }
    const routes = this.config().routes;
    // M-TRA-02: config `selectionMode: 'none'` → single click opens detail (achats, RH, HSE…).
    if (this.config().features.selectionMode === 'none' && routes?.detail) {
      void this.router.navigate(routes.detail(item));
      return;
    }
    const mode = this._selectionMode();
    if (mode !== 'none') {
      const current = this._selection();
      const index = current.indexOf(item);
      if (mode === 'single') {
        this._selection.set(index >= 0 ? [] : [item]);
      } else {
        if (index >= 0) {
          this._selection.set(current.filter((i) => i !== item));
        } else {
          this._selection.set([...current, item]);
        }
      }
      this.selectionChange.emit(this._selection());
      return;
    }
    if (routes?.detail) {
      void this.router.navigate(routes.detail(item));
    }
  }

  onRowDblClick(item: TItem): void {
    const routes = this.config().routes;
    if (routes?.detail) {
      this.router.navigate(routes.detail(item));
    }
  }

  onRowAction(event: { action: string; item: TItem }): void {
    // Row actions are deprecated - emit for custom handling
    this.action.emit({
      actionId: event.action,
      source: 'row',
      item: event.item,
    });
  }

  /**
   * Handle builtin action for the current selection.
   */
  protected handleBuiltinAction(action: 'edit' | 'view' | 'delete' | 'duplicate'): void {
    const selection = this._selection();

    switch (action) {
      case 'edit':
      case 'view':
        // Edit/view navigates to detail page (only for single selection)
        if (selection.length === 1) {
          const routes = this.config().routes;
          if (routes?.detail) {
            this.router.navigate(routes.detail(selection[0]));
          }
        }
        break;
      case 'delete':
        // Delete works for single or multiple items
        if (selection.length === 1) {
          this.deleteItem(selection[0]);
        } else if (selection.length > 1) {
          this.handleBulkDelete();
        }
        break;
      case 'duplicate':
        // Duplicate single item
        if (selection.length === 1) {
          this.action.emit({ actionId: 'duplicate', source: 'bulk', item: selection[0], selection });
        }
        break;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Action Handlers
  // ═══════════════════════════════════════════════════════════════════════════

  onToolbarAction(actionId: string): void {
    // Handle built-in toolbar actions (always visible)
    switch (actionId) {
      case 'new':
      case 'create':
        this.navigateToCreate();
        return;
      case 'refresh':
        this.refresh();
        return;
      case 'import-export':
        this.openImportExportModal();
        return;
      case 'bulk-delete':
        this.handleBulkDelete();
        return;
    }

    // Check if it's a unified action with builtin handler
    const unifiedAction = (this.config().actions ?? []).find((a) => a.id === actionId);
    if (unifiedAction?.builtin) {
      this.handleBuiltinAction(unifiedAction.builtin);
      return;
    }

    // Check if it's a selection-based action
    const selection = this._selection();
    const isSelectionAction =
      unifiedAction !== undefined ||
      this.config().bulkActions?.some((a) => a.id === actionId) ||
      false;

    this.action.emit({
      actionId,
      source: isSelectionAction && selection.length > 0 ? 'bulk' : 'toolbar',
      selection: isSelectionAction && selection.length > 0 ? selection : undefined,
      item: selection.length === 1 ? selection[0] : undefined,
    });
  }

  onEmptyStateAction(): void {
    const cfg = this.config().emptyState;
    const actionId = cfg.actionId ?? 'create';

    if (actionId === 'create') {
      this.navigateToCreate();
    } else {
      this.action.emit({ actionId, source: 'toolbar' });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Navigation
  // ═══════════════════════════════════════════════════════════════════════════

  navigateToCreate(): void {
    const routes = this.config().routes;
    if (routes?.create) {
      this.router.navigate(routes.create);
    }
  }

  navigateToDetail(item: TItem): void {
    const routes = this.config().routes;
    if (routes?.detail) {
      this.router.navigate(routes.detail(item));
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

    if (confirmed) {
      try {
        const facadeInstance = this.facade();
        if (facadeInstance.deleteItem) {
          const id = this.getItemId(item);
          await facadeInstance.deleteItem(id);
          this.toast.success(deleteConfig.successMessage);
          await this.refresh();
        }
      } catch (error) {
        this.toast.error(deleteConfig.errorMessage);
      }
    }
  }

  protected async handleBulkDelete(): Promise<void> {
    const selected = this._selection();
    if (selected.length === 0) return;

    const deleteConfig = this.config().delete;
    if (!deleteConfig) return;

    const confirmed = await this.confirmDialog.confirm({
      title: this.translate.instant('shared.entityListing.bulkDelete.title', {
        count: selected.length,
        entity:
          selected.length === 1
            ? this.translateLabel(this.config().entityName)
            : this.translateLabel(this.config().entityNamePlural),
      }),
      message: this.translate.instant('shared.entityListing.bulkDelete.message', {
        count: selected.length,
      }),
      confirmLabel: this.translate.instant('shared.entityListing.bulkDelete.confirmLabel'),
      variant: 'danger',
      icon: 'delete',
    });

    if (confirmed) {
      try {
        const facadeInstance = this.facade();
        if (facadeInstance.deleteItem) {
          for (const item of selected) {
            await facadeInstance.deleteItem(this.getItemId(item));
          }
          this.toast.success(
            this.translate.instant('shared.entityListing.toast.deleted', {
              count: selected.length,
            })
          );
          this.clearSelection();
          await this.refresh();
        }
      } catch (error) {
        this.toast.error(this.t('Failed to delete some items', 'Failed to delete some items'));
      }
    }
  }

  protected getItemId(item: TItem): string {
    return (item as { id: string }).id;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Import/Export
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
          `${this.config().entityName.toLowerCase()}-template-${new Date().toISOString().slice(0, 10)}.csv`
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

  /**
   * Import by sending the raw CSV file to the backend.
   */
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

  /**
   * Export current view. When useBackendExport is true, calls backend export endpoint (filtered, up to 10k rows).
   * Otherwise uses client-side CSV from loaded data (same filters/sort).
   */
  protected async exportView(useBackendExport?: boolean): Promise<void> {
    const facadeInstance = this.facade() as {
      loadItems?: (q: Record<string, unknown>) => Promise<{ items: unknown[]; total: number }>;
      exportCsv?: (q?: Record<string, unknown>) => Promise<Blob>;
    };

    if (useBackendExport && facadeInstance.exportCsv) {
      try {
        const query = this.buildQuery();
        const blob = await facadeInstance.exportCsv(query);
        const filename = `${this.config().entityName.toLowerCase()}-export-${new Date().toISOString().slice(0, 10)}.csv`;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        this.toast.success(this.t('Export complete', 'Export complete'));
        this.exported.emit({ format: 'csv', filename, rowCount: -1, selectionOnly: false });
        this.emitListingExportAudit({
          entityName: this.config().entityName,
          entityNamePlural: this.config().entityNamePlural,
          format: 'csv',
          filename,
          rowCount: -1,
          selectionOnly: false,
        });
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

    const query = {
      ...this.buildQuery(),
      page: 1,
      pageSize: CsvService.DEFAULT_EXPORT_PAGE_SIZE,
    };

    const result = await facadeInstance.loadItems(query);
    const filename = `${this.config().entityName.toLowerCase()}-export-${new Date().toISOString().slice(0, 10)}.csv`;
    this.csvService.exportToCsv(
      result.items as Record<string, unknown>[],
      columns,
      filename,
    );
    this.toast.success(
      this.translate.instant('shared.entityListing.toast.exported', {
        count: result.items.length,
      })
    );
    this.exported.emit({ format: 'csv', filename, rowCount: result.items.length, selectionOnly: false });
    this.emitListingExportAudit({
      entityName: this.config().entityName,
      entityNamePlural: this.config().entityNamePlural,
      format: 'csv',
      filename,
      rowCount: result.items.length,
      selectionOnly: false,
    });
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
    this.csvService.exportToCsv(
      selected as Record<string, unknown>[],
      columns,
      filename,
    );
    this.toast.success(
      this.translate.instant('shared.entityListing.toast.exported', {
        count: selected.length,
      })
    );
    this.exported.emit({ format: 'csv', filename, rowCount: selected.length, selectionOnly: true });
    this.emitListingExportAudit({
      entityName: this.config().entityName,
      entityNamePlural: this.config().entityNamePlural,
      format: 'csv',
      filename,
      rowCount: selected.length,
      selectionOnly: true,
    });
  }

  private emitListingExportAudit(payload: ListingExportAuditPayload): void {
    this.listingExportAudit?.(payload);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Template Helpers
  // ═══════════════════════════════════════════════════════════════════════════

  /** Get custom template for a column, if defined */
  getColumnTemplate(columnKey: string): TemplateRef<unknown> | null {
    const directive = this.columnTemplates?.find((t) => t.nfColumn === columnKey);
    return directive?.templateRef ?? null;
  }

  /** Check if view mode is available */
  isViewModeAvailable(mode: ViewMode): boolean {
    return this.config().viewModes.available.includes(mode);
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
