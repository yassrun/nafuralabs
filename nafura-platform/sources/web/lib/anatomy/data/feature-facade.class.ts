/**
 * Feature Facade
 *
 * Abstract base for feature state management and orchestration.
 * Provides standard CRUD state patterns and operations.
 */

import { Signal, computed, inject, signal } from '@angular/core';

import { FeatureApiService } from './feature-api.service';
import { ListQuery, ListResponse, LoadingState, LookupContext } from '../types';
import type { ImportResult } from '../types';
import { LookupService } from '../services/lookup.service';

/**
 * Feature Facade
 *
 * Base class for feature state management.
 *
 * @typeParam TItem - The entity type
 * @typeParam TApi - The API service type
 */
export abstract class FeatureFacade<
  TItem,
  TApi extends FeatureApiService<TItem, unknown, unknown> = FeatureApiService<TItem>
> {
  protected readonly lookupService = inject(LookupService);

  /**
   * API service for this feature.
   */
  protected abstract api: TApi;

  // ═══════════════════════════════════════════════════════════════════════════
  // STATE: Items
  // ═══════════════════════════════════════════════════════════════════════════

  protected readonly _items = signal<TItem[]>([]);
  protected readonly _total = signal<number>(0);

  readonly items: Signal<TItem[]> = this._items.asReadonly();
  readonly total: Signal<number> = this._total.asReadonly();
  readonly itemCount: Signal<number> = computed(() => this._items().length);
  readonly isEmpty: Signal<boolean> = computed(() => this._items().length === 0);

  // ═══════════════════════════════════════════════════════════════════════════
  // STATE: Selected Item
  // ═══════════════════════════════════════════════════════════════════════════

  protected readonly _selectedItem = signal<TItem | null>(null);

  readonly selectedItem: Signal<TItem | null> = this._selectedItem.asReadonly();
  readonly hasSelectedItem: Signal<boolean> = computed(() => this._selectedItem() !== null);

  // ═══════════════════════════════════════════════════════════════════════════
  // STATE: Loading & Error
  // ═══════════════════════════════════════════════════════════════════════════

  protected readonly _loadingState = signal<LoadingState>('idle');
  protected readonly _error = signal<string | null>(null);
  protected readonly _isSaving = signal<boolean>(false);

  readonly loadingState: Signal<LoadingState> = this._loadingState.asReadonly();
  readonly isLoading: Signal<boolean> = computed(() => this._loadingState() === 'loading');
  readonly isLoaded: Signal<boolean> = computed(() => this._loadingState() === 'success');
  readonly hasError: Signal<boolean> = computed(() => this._loadingState() === 'error');
  readonly error: Signal<string | null> = this._error.asReadonly();
  readonly isSaving: Signal<boolean> = this._isSaving.asReadonly();

  // ═══════════════════════════════════════════════════════════════════════════
  // STATE: Lookups
  // ═══════════════════════════════════════════════════════════════════════════

  protected readonly _lookups = signal<LookupContext>({});
  protected readonly _lookupsLoaded = signal<boolean>(false);

  readonly lookups: Signal<LookupContext> = this._lookups.asReadonly();
  readonly lookupsLoaded: Signal<boolean> = this._lookupsLoaded.asReadonly();

  // ═══════════════════════════════════════════════════════════════════════════
  // CRUD: List Operations
  // ═══════════════════════════════════════════════════════════════════════════

  async loadItems(query?: ListQuery): Promise<ListResponse<TItem>> {
    this._loadingState.set('loading');
    this._error.set(null);

    try {
      const response = await this.api.getAll(query);
      this._items.set(response.items);
      this._total.set(response.total);
      this._loadingState.set('success');
      this.onLoadSuccess(response);
      return response;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load items';
      this._error.set(message);
      this._loadingState.set('error');
      this.onError(e);
      throw e;
    }
  }

  async refreshItems(query?: ListQuery): Promise<void> {
    try {
      const response = await this.api.getAll(query);
      this._items.set(response.items);
      this._total.set(response.total);
    } catch (e) {
      this.onError(e);
      throw e;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CRUD: Single Item Operations
  // ═══════════════════════════════════════════════════════════════════════════

  async loadItem(id: string | number): Promise<TItem> {
    this._loadingState.set('loading');
    this._error.set(null);

    try {
      const item = await this.api.getById(id);
      this._selectedItem.set(item);
      this._loadingState.set('success');
      return item;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load item';
      this._error.set(message);
      this._loadingState.set('error');
      this.onError(e);
      throw e;
    }
  }

  async createItem(data: Parameters<TApi['create']>[0]): Promise<TItem> {
    this._isSaving.set(true);
    this._error.set(null);

    try {
      const item = await this.api.create(data);
      this._selectedItem.set(item);
      this._isSaving.set(false);
      this.onCreateSuccess(item);
      return item;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to create item';
      this._error.set(message);
      this._isSaving.set(false);
      this.onError(e);
      throw e;
    }
  }

  async updateItem(id: string | number, data: Parameters<TApi['update']>[1]): Promise<TItem> {
    this._isSaving.set(true);
    this._error.set(null);

    try {
      const item = await this.api.update(id, data);
      this._selectedItem.set(item);
      this._items.update((items) =>
        items.map((i) => (this.getItemId(i) === id ? item : i))
      );
      this._isSaving.set(false);
      this.onUpdateSuccess(item);
      return item;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to update item';
      this._error.set(message);
      this._isSaving.set(false);
      this.onError(e);
      throw e;
    }
  }

  async deleteItem(id: string | number): Promise<void> {
    this._isSaving.set(true);
    this._error.set(null);

    try {
      await this.api.delete(id);
      this._items.update((items) => items.filter((i) => this.getItemId(i) !== id));
      this._total.update((t) => t - 1);
      if (this._selectedItem() && this.getItemId(this._selectedItem()!) === id) {
        this._selectedItem.set(null);
      }
      this._isSaving.set(false);
      this.onDeleteSuccess();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to delete item';
      this._error.set(message);
      this._isSaving.set(false);
      this.onError(e);
      throw e;
    }
  }

  async deleteItems(ids: (string | number)[]): Promise<void> {
    this._isSaving.set(true);
    this._error.set(null);

    try {
      await this.api.deleteMany(ids);
      this._items.update((items) => items.filter((i) => !ids.includes(this.getItemId(i))));
      this._total.update((t) => t - ids.length);
      this._isSaving.set(false);
      this.onDeleteSuccess();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to delete items';
      this._error.set(message);
      this._isSaving.set(false);
      this.onError(e);
      throw e;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Import / Export
  // ═══════════════════════════════════════════════════════════════════════════

  async importCsv(file: File): Promise<ImportResult> {
    return this.api.importCsv(file);
  }

  async exportCsv(query?: ListQuery): Promise<Blob> {
    return this.api.exportCsv(query);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LOOKUPS
  // ═══════════════════════════════════════════════════════════════════════════

  async loadLookups(): Promise<void> {
    this._lookupsLoaded.set(true);
  }

  async ensureLookups(): Promise<void> {
    if (!this._lookupsLoaded()) {
      await this.loadLookups();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SELECTION
  // ═══════════════════════════════════════════════════════════════════════════

  selectItem(item: TItem | null): void {
    this._selectedItem.set(item);
  }

  clearSelection(): void {
    this._selectedItem.set(null);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HOOKS (Override in subclass)
  // ═══════════════════════════════════════════════════════════════════════════

  protected onLoadSuccess(response: ListResponse<TItem>): void {}
  protected onCreateSuccess(item: TItem): void {}
  protected onUpdateSuccess(item: TItem): void {}
  protected onDeleteSuccess(): void {}
  protected onError(error: unknown): void {}

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  protected getItemId(item: TItem): string | number {
    return (item as Record<string, unknown>)['id'] as string | number;
  }

  reset(): void {
    this._items.set([]);
    this._total.set(0);
    this._selectedItem.set(null);
    this._loadingState.set('idle');
    this._error.set(null);
    this._isSaving.set(false);
    this._lookups.set({});
    this._lookupsLoaded.set(false);
  }

  clearError(): void {
    this._error.set(null);
  }
}
