/**
 * Feature List Page Class
 *
 * Abstract base for list/collection pages.
 *
 * Design principles:
 * - Extends FeaturePageClass
 * - Provides list-specific state management
 * - Pagination, sorting, selection infrastructure
 * - Optional quick-edit support (drawer/modal/inline patterns)
 * - Generic filter, search, navigation, and delete handling
 * - No display/component concerns (table config, buttons, etc.)
 * - No business logic - just structure
 */

import { Directive, Signal, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { FeaturePageClass } from './feature-page.class';
import {
  LoadingState,
  PaginationState,
  SortState,
  SortDirection,
  SelectionMode,
  ListQuery,
  ListResponse,
  QuickEditMode,
  QuickEditOperation,
  QuickEditState,
  createEmptyQuickEditState,
  CrudFacade,
  PartialCrudFacade,
} from '../types';
import { ToastService, ConfirmDialogService } from '../components';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Route configuration for list pages.
 */
export interface ListPageRouteConfig<TItem> {
  /** Route to detail/edit page. Receives the item to build route. */
  detail: (item: TItem) => string[];
  /** Route to create page. */
  create: string[];
  /** Base route for the list (for navigation back). */
  list?: string[];
}

/**
 * Delete operation configuration.
 */
export interface ListPageDeleteConfig<TItem> {
  /** Dialog title */
  title: string;
  /** Function to generate confirmation message */
  getMessage: (item: TItem) => string;
  /** Label for confirm button */
  confirmLabel?: string;
  /** Icon for confirm dialog */
  icon?: string;
  /** Toast message on success */
  successMessage: string;
  /** Toast message on error */
  errorMessage: string;
}

/**
 * Feature List Page Class
 *
 * Extend for pages that display lists/collections of items.
 *
 * @typeParam TListItem - The type of items in the list
 * @typeParam TFacade - The facade type (must implement at least PartialCrudFacade)
 *
 * @example
 * ```typescript
 * export class ProductListingPage extends FeatureListPageClass<ProductListItem, ProductFacade> {
 *   protected readonly facade = inject(ProductFacade);
 *   // Config only - fetchData and performDelete are automatic!
 * }
 * ```
 */
@Directive()
export abstract class FeatureListPageClass<
  TListItem,
  TFacade extends PartialCrudFacade<unknown, TListItem> = PartialCrudFacade<unknown, TListItem>
> extends FeaturePageClass {
  // ═══════════════════════════════════════════════════════════════════════════
  // INJECTED SERVICES
  // ═══════════════════════════════════════════════════════════════════════════

  protected readonly router = inject(Router);
  protected readonly toast = inject(ToastService);
  protected readonly confirmDialog = inject(ConfirmDialogService);

  /**
   * The facade for CRUD operations.
   * Provide this in subclass to enable automatic data operations.
   */
  protected abstract readonly facade: TFacade;

  // ═══════════════════════════════════════════════════════════════════════════
  // CONFIGURATION (Override in subclass)
  // ═══════════════════════════════════════════════════════════════════════════

  protected defaultPageSize = 20;
  protected pageSizeOptions: number[] = [10, 20, 50, 100];
  protected defaultSort: SortState | null = null;
  protected enableSelection: SelectionMode = 'none';
  protected autoLoadOnInit = true;

  /**
   * Quick edit mode configuration.
   * Set to 'drawer', 'modal', or 'inline' to enable quick-edit support.
   * Leave as 'none' to disable (default).
   */
  protected quickEditMode: QuickEditMode | 'none' = 'none';

  /**
   * Route configuration for navigation.
   * Override in subclass to enable generic navigation methods.
   */
  protected routeConfig?: ListPageRouteConfig<TListItem>;

  /**
   * Delete operation configuration.
   * Override in subclass to enable generic delete with confirmation.
   */
  protected deleteConfig?: ListPageDeleteConfig<TListItem>;

  /**
   * Delete function for simple delete operations.
   * Set this to avoid overriding performDelete() for standard cases.
   * 
   * @example
   * ```typescript
   * protected override deleteFn = (id) => this.facade.deleteProduct(id as string);
   * ```
   */
  protected deleteFn?: (id: string | number) => Promise<void>;

  // ═══════════════════════════════════════════════════════════════════════════
  // CORE STATE: Items
  // ═══════════════════════════════════════════════════════════════════════════

  protected readonly _items = signal<TListItem[]>([]);
  readonly items: Signal<TListItem[]> = this._items.asReadonly();
  readonly itemCount: Signal<number> = computed(() => this._items().length);

  // ═══════════════════════════════════════════════════════════════════════════
  // CORE STATE: Loading & Error
  // ═══════════════════════════════════════════════════════════════════════════

  protected readonly _loadingState = signal<LoadingState>('idle');
  protected readonly _error = signal<string | null>(null);
  protected readonly _isRefreshing = signal<boolean>(false);

  readonly loadingState: Signal<LoadingState> = this._loadingState.asReadonly();
  readonly isLoading: Signal<boolean> = computed(() => this._loadingState() === 'loading');
  readonly isLoaded: Signal<boolean> = computed(() => this._loadingState() === 'success');
  readonly hasError: Signal<boolean> = computed(() => this._loadingState() === 'error');
  readonly error: Signal<string | null> = this._error.asReadonly();
  readonly isRefreshing: Signal<boolean> = this._isRefreshing.asReadonly();
  readonly isEmpty: Signal<boolean> = computed(() => this.isLoaded() && this._items().length === 0);

  // ═══════════════════════════════════════════════════════════════════════════
  // CORE STATE: Pagination
  // ═══════════════════════════════════════════════════════════════════════════

  protected readonly _pagination = signal<PaginationState>({
    page: 1,
    pageSize: 20,
    total: 0,
  });

  readonly pagination: Signal<PaginationState> = this._pagination.asReadonly();
  readonly currentPage: Signal<number> = computed(() => this._pagination().page);
  readonly pageSize: Signal<number> = computed(() => this._pagination().pageSize);
  readonly totalItems: Signal<number> = computed(() => this._pagination().total);
  readonly totalPages: Signal<number> = computed(() =>
    Math.ceil(this._pagination().total / this._pagination().pageSize) || 1
  );
  readonly hasNextPage: Signal<boolean> = computed(() => this.currentPage() < this.totalPages());
  readonly hasPreviousPage: Signal<boolean> = computed(() => this.currentPage() > 1);

  // ═══════════════════════════════════════════════════════════════════════════
  // CORE STATE: Sorting
  // ═══════════════════════════════════════════════════════════════════════════

  protected readonly _sort = signal<SortState | null>(null);
  readonly sort: Signal<SortState | null> = this._sort.asReadonly();
  readonly isSorted: Signal<boolean> = computed(() => this._sort() !== null);

  // ═══════════════════════════════════════════════════════════════════════════
  // OPTIONAL STATE: Selection
  // ═══════════════════════════════════════════════════════════════════════════

  protected readonly _selectionMode = signal<SelectionMode>('none');
  protected readonly _selection = signal<TListItem[]>([]);

  readonly selectionMode: Signal<SelectionMode> = this._selectionMode.asReadonly();
  readonly selectedItems: Signal<TListItem[]> = this._selection.asReadonly();
  readonly selectedCount: Signal<number> = computed(() => this._selection().length);
  readonly hasSelection: Signal<boolean> = computed(() => this._selection().length > 0);
  readonly hasSingleSelection: Signal<boolean> = computed(() => this._selection().length === 1);
  readonly isSelectionEnabled: Signal<boolean> = computed(() => this._selectionMode() !== 'none');

  // ═══════════════════════════════════════════════════════════════════════════
  // OPTIONAL STATE: Quick Edit
  // ═══════════════════════════════════════════════════════════════════════════

  protected readonly _quickEdit = signal<QuickEditState<TListItem>>(createEmptyQuickEditState<TListItem>());

  /** Full quick edit state (for advanced use) */
  readonly quickEdit: Signal<QuickEditState<TListItem>> = this._quickEdit.asReadonly();

  /** Whether quick edit panel/modal is open */
  readonly isQuickEditOpen: Signal<boolean> = computed(() => this._quickEdit().isOpen);

  /** Item currently being edited (null for create mode) */
  readonly editingItem: Signal<TListItem | null> = computed(() => this._quickEdit().item);

  /** Current quick edit operation type */
  readonly quickEditOperation: Signal<QuickEditOperation> = computed(() => this._quickEdit().operation);

  /** Whether in create mode (no existing item) */
  readonly isCreating: Signal<boolean> = computed(() => this._quickEdit().operation === 'create' && this._quickEdit().isOpen);

  /** Whether editing an existing item */
  readonly isEditing: Signal<boolean> = computed(() => this._quickEdit().operation === 'edit' && this._quickEdit().isOpen);

  /** Whether viewing an item (read-only quick view) */
  readonly isViewing: Signal<boolean> = computed(() => this._quickEdit().operation === 'view' && this._quickEdit().isOpen);

  /** Whether a save operation is in progress */
  readonly isQuickEditSaving: Signal<boolean> = computed(() => this._quickEdit().isSaving);

  /** Quick edit error message */
  readonly quickEditError: Signal<string | null> = computed(() => this._quickEdit().error);

  /** Whether quick edit is enabled for this page */
  readonly isQuickEditEnabled: Signal<boolean> = computed(() => this.quickEditMode !== 'none');

  // ═══════════════════════════════════════════════════════════════════════════
  // CORE STATE: Filters & Search
  // ═══════════════════════════════════════════════════════════════════════════

  protected readonly _filterValues = signal<Record<string, unknown>>({});
  protected readonly _searchTerm = signal<string>('');

  readonly filterValues = this._filterValues.asReadonly();
  readonly searchTerm: Signal<string> = this._searchTerm.asReadonly();
  readonly hasActiveFilters: Signal<boolean> = computed(() => 
    Object.keys(this._filterValues()).length > 0 || this._searchTerm().length > 0
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // DATA OPERATIONS (Using Facade)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Fetch data from the facade.
   * 
   * Default implementation uses facade.loadItems() with query and filters.
   * Override in subclass for custom data fetching logic.
   */
  protected async fetchData(): Promise<ListResponse<TListItem>> {
    if (this.facade.loadItems) {
      const query = { ...this.buildQuery(), ...this.getFilters() };
      return this.facade.loadItems(query);
    }
    console.warn('Facade does not implement loadItems(). Override fetchData() in subclass.');
    return { items: [], total: 0 };
  }

  /**
   * Delete an item. Called by deleteItem() after confirmation.
   * 
   * Default implementation uses facade.deleteItem() or deleteFn.
   * Override in subclass for complex delete logic (e.g., refresh lookups, chain calls).
   */
  protected async performDelete(item: TListItem): Promise<void> {
    if (this.facade.deleteItem) {
      await this.facade.deleteItem(this.getItemId(item) as string);
    } else if (this.deleteFn) {
      await this.deleteFn(this.getItemId(item));
    } else {
      console.warn('Facade does not implement deleteItem() and deleteFn is not set. Override performDelete() in subclass.');
    }
  }

  /**
   * Get the unique identifier of an item.
   * Override if your items use a different id field.
   */
  protected getItemId(item: TListItem): string | number {
    return (item as unknown as { id: string | number }).id;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LIFECYCLE
  // ═══════════════════════════════════════════════════════════════════════════

  protected override onPageInit(): void {
    this._pagination.update((p) => ({ ...p, pageSize: this.defaultPageSize }));
    this._sort.set(this.defaultSort);
    this._selectionMode.set(this.enableSelection);
    this.onListInit();
    if (this.autoLoadOnInit) {
      this.loadData();
    }
  }

  protected onListInit(): void {
    // Override in subclass
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DATA LOADING
  // ═══════════════════════════════════════════════════════════════════════════

  async loadData(): Promise<void> {
    this._loadingState.set('loading');
    this._error.set(null);
    this.clearSelection();

    try {
      const result = await this.fetchData();
      this._items.set(result.items);
      this._pagination.update((p) => ({ ...p, total: result.total }));
      this._loadingState.set('success');
    } catch (e) {
      this._error.set(e instanceof Error ? e.message : 'Failed to load data');
      this._loadingState.set('error');
    }
  }

  async refresh(): Promise<void> {
    this._isRefreshing.set(true);
    this._error.set(null);

    try {
      const result = await this.fetchData();
      this._items.set(result.items);
      this._pagination.update((p) => ({ ...p, total: result.total }));
    } catch (e) {
      this._error.set(e instanceof Error ? e.message : 'Failed to refresh');
    } finally {
      this._isRefreshing.set(false);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGINATION METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  setPage(page: number): void {
    const validPage = Math.max(1, Math.min(page, this.totalPages()));
    this._pagination.update((p) => ({ ...p, page: validPage }));
    this.onQueryChange();
  }

  nextPage(): void {
    if (this.hasNextPage()) this.setPage(this.currentPage() + 1);
  }

  previousPage(): void {
    if (this.hasPreviousPage()) this.setPage(this.currentPage() - 1);
  }

  setPageSize(size: number): void {
    this._pagination.update((p) => ({ ...p, pageSize: size, page: 1 }));
    this.onQueryChange();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SORTING METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  setSort(column: string, direction: SortDirection | null): void {
    this._sort.set(direction ? { column, direction } : null);
    this._pagination.update((p) => ({ ...p, page: 1 }));
    this.onQueryChange();
  }

  toggleSort(column: string): void {
    const current = this._sort();
    if (!current || current.column !== column) {
      this.setSort(column, 'asc');
    } else if (current.direction === 'asc') {
      this.setSort(column, 'desc');
    } else {
      this.setSort(column, null);
    }
  }

  clearSort(): void {
    this._sort.set(null);
    this.onQueryChange();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SELECTION METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  selectItem(item: TListItem): void {
    const mode = this._selectionMode();
    if (mode === 'none') return;

    if (mode === 'single') {
      this._selection.set(this.isSelected(item) ? [] : [item]);
    } else {
      this._selection.update((selection) =>
        this.isSelected(item)
          ? selection.filter((i) => !this.areItemsEqual(i, item))
          : [...selection, item]
      );
    }
  }

  deselectItem(item: TListItem): void {
    this._selection.update((selection) =>
      selection.filter((i) => !this.areItemsEqual(i, item))
    );
  }

  selectAllPage(): void {
    if (this._selectionMode() !== 'multiple') return;
    this._selection.set([...this._items()]);
  }

  clearSelection(): void {
    this._selection.set([]);
  }

  isSelected(item: TListItem): boolean {
    return this._selection().some((i) => this.areItemsEqual(i, item));
  }

  setSelection(items: TListItem[]): void {
    this._selection.set(items);
  }

  /**
   * Enter selection mode - show checkboxes.
   * Call this when user clicks a "Select" button to enable bulk operations.
   */
  enterSelectionMode(mode: 'single' | 'multiple' = 'multiple'): void {
    this._selectionMode.set(mode);
  }

  /**
   * Exit selection mode - hide checkboxes and clear selection.
   * Call this when user clicks "Cancel" or "Clear" to exit bulk operations.
   */
  exitSelectionMode(): void {
    this._selectionMode.set('none');
    this.clearSelection();
  }

  /**
   * Get selectable mode for data-table component.
   * Maps SelectionMode ('none'|'single'|'multiple') to SelectableMode (false|'single'|'multiple').
   */
  getSelectableMode(): boolean | 'single' | 'multiple' {
    const mode = this._selectionMode();
    return mode === 'none' ? false : mode;
  }

  protected areItemsEqual(a: TListItem, b: TListItem): boolean {
    return a === b;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // QUERY HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  protected buildQuery(): ListQuery {
    const sort = this._sort();
    return {
      page: this._pagination().page,
      pageSize: this._pagination().pageSize,
      sortBy: sort?.column,
      sortDirection: sort?.direction,
    };
  }

  protected onQueryChange(): void {
    this.loadData();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FILTER & SEARCH METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Handle filter changes from filter bar.
   * Resets to page 1 and reloads data.
   */
  onFilterChange(filters: Record<string, unknown>): void {
    this._filterValues.set(filters);
    this.setPage(1);
    this.loadData();
  }

  /**
   * Handle search term changes.
   * Resets to page 1 and reloads data.
   */
  onSearch(term: string): void {
    this._searchTerm.set(term);
    this.setPage(1);
    this.loadData();
  }

  /**
   * Reset all filters and search.
   * Resets to page 1 and reloads data.
   */
  onFilterReset(): void {
    this._filterValues.set({});
    this._searchTerm.set('');
    this.setPage(1);
    this.loadData();
  }

  /**
   * Get current filters for use in fetchData.
   */
  protected getFilters(): Record<string, unknown> {
    const filterValues = this._filterValues();
    return {
      ...filterValues,
      search: (filterValues['search'] as string) || this._searchTerm() || undefined,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EVENT HANDLERS (Template bindings)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Handle sort change from data table.
   */
  onSortChange(event: { column: string; direction: 'asc' | 'desc' | null }): void {
    this.setSort(event.column, event.direction);
  }

  /**
   * Handle page change from pagination.
   */
  onPageChange(event: { page: number; pageSize: number }): void {
    if (event.pageSize !== this.pageSize()) {
      this.setPageSize(event.pageSize);
    } else {
      this.setPage(event.page);
    }
  }

  /**
   * Handle row single-click.
   * When selection mode is single: select the row (selection stays visible).
   * Otherwise: navigate to detail page if routeConfig.detail is set.
   */
  onRowClick(item: TListItem): void {
    this.selectItem(item);
    return;
  }

  /**
   * Handle row double-click — navigate to detail page when one exists.
   */
  onRowDblClick(item: TListItem): void {
    if (this.routeConfig?.detail) {
      this.router.navigate(this.routeConfig.detail(item));
    }
  }

  /**
   * Handle row actions (edit, delete, etc.)
   */
  async onRowAction(event: { action: string; item: TListItem }): Promise<void> {
    switch (event.action) {
      case 'edit':
      case 'view':
        this.onRowClick(event.item);
        break;
      case 'delete':
        await this.deleteItem(event.item);
        break;
      default:
        this.onCustomRowAction(event.action, event.item);
    }
  }

  /**
   * Hook for custom row actions.
   * Override in subclass to handle custom actions.
   */
  protected onCustomRowAction(action: string, item: TListItem): void {
    console.warn(`Unhandled row action: ${action}`);
  }

  /**
   * Handle selection change from data table.
   */
  onSelectionChange(items: TListItem[]): void {
    this.setSelection(items);
  }

  /**
   * Handle header actions (create, import, etc.)
   * Handles 'create' by default. Override onCustomHeaderAction for others.
   */
  onHeaderAction(event: { type: 'primary' | 'secondary'; action: { id?: string } }): void {
    switch (event.action.id) {
      case 'create':
        this.navigateToCreate();
        break;
      default:
        this.onCustomHeaderAction(event);
    }
  }

  /**
   * Hook for custom header actions.
   * Override in subclass to handle actions like 'import'.
   */
  protected onCustomHeaderAction(event: { type: 'primary' | 'secondary'; action: { id?: string } }): void {
    console.warn(`Unhandled header action: ${event.action.id}`);
  }

  /**
   * Handle toolbar actions (select, export, columns, etc.)
   * Handles 'select' by default. Override onCustomToolbarAction for others.
   */
  onToolbarAction(actionId: string): void {
    switch (actionId) {
      case 'select':
        this.enterSelectionMode();
        break;
      default:
        this.onCustomToolbarAction(actionId);
    }
  }

  /**
   * Hook for custom toolbar actions.
   * Override in subclass to handle actions like 'export', 'columns'.
   */
  protected onCustomToolbarAction(actionId: string): void {
    console.warn(`Unhandled toolbar action: ${actionId}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NAVIGATION METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Navigate to create page.
   * Requires routeConfig.create to be set.
   */
  navigateToCreate(): void {
    if (this.routeConfig?.create) {
      this.router.navigate(this.routeConfig.create);
    }
  }

  /**
   * Navigate to detail/edit page.
   * Requires routeConfig.detail to be set.
   */
  navigateToDetail(item: TListItem): void {
    if (this.routeConfig?.detail) {
      this.router.navigate(this.routeConfig.detail(item));
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DELETE METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Delete an item with confirmation dialog.
   * Requires deleteConfig to be set.
   */
  async deleteItem(item: TListItem): Promise<void> {
    if (!this.deleteConfig) {
      console.warn('deleteConfig not set. Override deleteItem() or set deleteConfig.');
      return;
    }

    const confirmed = await this.confirmDialog.confirm({
      title: this.deleteConfig.title,
      message: this.deleteConfig.getMessage(item),
      confirmLabel: this.deleteConfig.confirmLabel ?? 'Delete',
      variant: 'danger',
      icon: this.deleteConfig.icon ?? 'delete',
    });

    if (confirmed) {
      try {
        await this.performDelete(item);
        this.toast.success(this.deleteConfig.successMessage);
        await this.refresh();
      } catch (error) {
        this.toast.error(this.deleteConfig.errorMessage);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // QUICK EDIT METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Open quick edit panel for creating a new item.
   */
  openCreate(): void {
    this._quickEdit.set({
      isOpen: true,
      item: null,
      operation: 'create',
      isSaving: false,
      error: null,
    });
    this.onQuickEditOpen('create', null);
  }

  /**
   * Open quick edit panel for editing an existing item.
   */
  openEdit(item: TListItem): void {
    this._quickEdit.set({
      isOpen: true,
      item,
      operation: 'edit',
      isSaving: false,
      error: null,
    });
    this.onQuickEditOpen('edit', item);
  }

  /**
   * Open quick edit panel for viewing an item (read-only).
   */
  openView(item: TListItem): void {
    this._quickEdit.set({
      isOpen: true,
      item,
      operation: 'view',
      isSaving: false,
      error: null,
    });
    this.onQuickEditOpen('view', item);
  }

  /**
   * Close quick edit panel and reset state.
   */
  closeQuickEdit(): void {
    const wasOpen = this._quickEdit().isOpen;
    this._quickEdit.set(createEmptyQuickEditState<TListItem>());
    if (wasOpen) {
      this.onQuickEditClose();
    }
  }

  /**
   * Set saving state for quick edit operations.
   */
  protected setQuickEditSaving(isSaving: boolean): void {
    this._quickEdit.update((state) => ({ ...state, isSaving }));
  }

  /**
   * Set error state for quick edit operations.
   */
  protected setQuickEditError(error: string | null): void {
    this._quickEdit.update((state) => ({ ...state, error, isSaving: false }));
  }

  /**
   * Clear quick edit error.
   */
  clearQuickEditError(): void {
    this._quickEdit.update((state) => ({ ...state, error: null }));
  }

  /**
   * Update the editing item in quick edit state.
   * Useful for optimistic updates or form value tracking.
   */
  protected updateEditingItem(updates: Partial<TListItem>): void {
    const current = this._quickEdit();
    if (current.item) {
      this._quickEdit.update((state) => ({
        ...state,
        item: { ...state.item!, ...updates },
      }));
    }
  }

  /**
   * Save quick edit changes.
   * Override this in subclass to implement actual save logic.
   * 
   * @param data - The form data to save
   * @returns Promise that resolves when save is complete
   * 
   * @example
   * ```typescript
   * protected override async saveQuickEdit(data: Partial<Item>): Promise<void> {
   *   const item = this.editingItem();
   *   if (item) {
   *     await this.facade.updateItem(item.id, data);
   *   } else {
   *     await this.facade.createItem(data);
   *   }
   *   await this.refresh();
   * }
   * ```
   */
  protected async saveQuickEdit(data: Partial<TListItem>): Promise<void> {
    // Override in subclass to implement save logic
    console.warn('saveQuickEdit() not implemented. Override in subclass.');
  }

  /**
   * Execute save with loading/error state management.
   * Call this from your template or form submit handler.
   */
  async performQuickEditSave(data: Partial<TListItem>): Promise<boolean> {
    this.setQuickEditSaving(true);
    this.setQuickEditError(null);

    try {
      await this.saveQuickEdit(data);
      this.closeQuickEdit();
      return true;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to save';
      this.setQuickEditError(message);
      return false;
    }
  }

  /**
   * Delete item with confirmation (for quick edit context).
   * Override in subclass to implement actual delete logic.
   */
  protected async deleteQuickEditItem(): Promise<void> {
    // Override in subclass to implement delete logic
    console.warn('deleteQuickEditItem() not implemented. Override in subclass.');
  }

  /**
   * Execute delete with loading/error state management.
   */
  async performQuickEditDelete(): Promise<boolean> {
    const item = this.editingItem();
    if (!item) return false;

    this.setQuickEditSaving(true);
    this.setQuickEditError(null);

    try {
      await this.deleteQuickEditItem();
      this.closeQuickEdit();
      await this.refresh();
      return true;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to delete';
      this.setQuickEditError(message);
      return false;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // QUICK EDIT HOOKS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Hook called when quick edit panel opens.
   * Override to perform actions like loading related data.
   */
  protected onQuickEditOpen(operation: QuickEditOperation, item: TListItem | null): void {
    // Override in subclass
  }

  /**
   * Hook called when quick edit panel closes.
   * Override to perform cleanup.
   */
  protected onQuickEditClose(): void {
    // Override in subclass
  }
}
