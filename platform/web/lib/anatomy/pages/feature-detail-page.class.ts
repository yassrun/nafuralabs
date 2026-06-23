/**
 * Feature Detail Page Class
 *
 * Abstract base for detail/view pages showing a single item.
 *
 * Design principles:
 * - Extends FeaturePageClass
 * - Minimal and focused on universal concerns only
 * - Provides single item state management
 * - Loading/error state
 * - No form handling (concrete page concern)
 * - No edit mode (concrete page concern)
 */

import { Directive, Signal, computed, signal } from '@angular/core';

import { FeaturePageClass } from './feature-page.class';
import { LoadingState } from '../types';

/**
 * Feature Detail Page Class
 *
 * Extend for pages that display a single item.
 *
 * @typeParam TItem - The type of the item
 */
@Directive()
export abstract class FeatureDetailPageClass<TItem> extends FeaturePageClass {
  // ═══════════════════════════════════════════════════════════════════════════
  // CONFIGURATION (Override in subclass)
  // ═══════════════════════════════════════════════════════════════════════════

  protected autoLoadOnInit = true;
  protected idParamKey = 'id';

  // ═══════════════════════════════════════════════════════════════════════════
  // CORE STATE: Item
  // ═══════════════════════════════════════════════════════════════════════════

  protected readonly _item = signal<TItem | null>(null);
  readonly item: Signal<TItem | null> = this._item.asReadonly();
  readonly hasItem: Signal<boolean> = computed(() => this._item() !== null);

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

  // ═══════════════════════════════════════════════════════════════════════════
  // ROUTE HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  readonly isCreateMode: Signal<boolean> = computed(() => {
    const url = this.route.snapshot.url;
    const lastSegment = url.length > 0 ? url[url.length - 1]?.path : null;
    return lastSegment === 'new' || !this.getParam(this.idParamKey);
  });

  readonly isExistingItem: Signal<boolean> = computed(() => !this.isCreateMode());

  readonly itemId: Signal<string | null> = computed(() => this.getParam(this.idParamKey));

  // ═══════════════════════════════════════════════════════════════════════════
  // ABSTRACT METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  protected abstract fetchData(): Promise<TItem>;

  // ═══════════════════════════════════════════════════════════════════════════
  // LIFECYCLE
  // ═══════════════════════════════════════════════════════════════════════════

  protected override onPageInit(): void {
    this.onDetailInit();
    if (this.autoLoadOnInit && !this.isCreateMode()) {
      this.loadData();
    }
  }

  protected onDetailInit(): void {
    // Override in subclass
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DATA LOADING
  // ═══════════════════════════════════════════════════════════════════════════

  async loadData(): Promise<void> {
    this._loadingState.set('loading');
    this._error.set(null);

    try {
      const result = await this.fetchData();
      this._item.set(result);
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
      this._item.set(result);
    } catch (e) {
      this._error.set(e instanceof Error ? e.message : 'Failed to refresh');
    } finally {
      this._isRefreshing.set(false);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ITEM HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  protected setItem(item: TItem | null): void {
    this._item.set(item);
  }

  protected updateItem(updates: Partial<TItem>): void {
    const current = this._item();
    if (current) {
      this._item.set({ ...current, ...updates });
    }
  }

  protected clearItem(): void {
    this._item.set(null);
    this._loadingState.set('idle');
    this._error.set(null);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ERROR HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  protected setError(message: string): void {
    this._error.set(message);
    this._loadingState.set('error');
  }

  protected clearError(): void {
    this._error.set(null);
    if (this._loadingState() === 'error') {
      this._loadingState.set('idle');
    }
  }
}
