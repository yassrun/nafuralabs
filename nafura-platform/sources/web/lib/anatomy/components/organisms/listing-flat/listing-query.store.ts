import { computed, effect, inject, Injectable, signal, untracked, type OnDestroy, type Signal } from '@angular/core';

import type { FilterFieldConfig, FilterGroup, ListingQueryState, ListingSort, LookupContext } from '../../../types';
import { LISTING_MAX_SORT_LEVELS } from '../../../types';
import type { NfSelectOption } from '../../atoms/select';
import type { ListingControlsColumn } from '../../molecules/listing-controls';
import { DEFAULT_LISTING_FLAT_FEATURES, type ListingFlatConfig } from './listing-flat.types';
import {
  clausesToGroup,
  collectLeaves,
  columnStateFromControls,
  controlColumnsFromQuery,
  createDefaultListingQuery,
  filterGroupToPinnedValues,
  filterValuesToClauses,
  listingQuerySnapshotEqual,
  mergeListingQuery,
  resolveFilterGroup,
  upsertPinnedClause,
  withSyncedFilters,
} from './listing-query-state.util';
import { LISTING_SAVED_VIEWS_ADAPTER, type ListingSavedView } from './listing-saved-views.adapter';

/** What the owner of the store (nf-listing-flat, or nf-listing-page for a toolbar alone) feeds it. */
export interface ListingQuerySource {
  config: Signal<ListingFlatConfig>;
  lookups: Signal<LookupContext>;
  /** Controlled query (URL / parent / saved view). */
  query: Signal<ListingQueryState | undefined>;
  /** Items filtered and paged server-side: the search waits for a pause in typing before it is emitted. */
  remote: Signal<boolean>;
  resourceKey: Signal<string | undefined>;
  /** Every change of the query the user made. */
  emit: (query: ListingQueryState) => void;
}

/**
 * The single query state of a list: search, filters, segment, sort, page, columns and saved views.
 * Provided by the component that owns the list; the toolbar and the table read and write it.
 */
@Injectable()
export class ListingQueryStore implements OnDestroy {
  private readonly savedViewsAdapter = inject(LISTING_SAVED_VIEWS_ADAPTER, { optional: true });
  private readonly source = signal<ListingQuerySource | null>(null);
  private suppressEmit = false;
  private lastInitialFilters = '';
  private searchTimer?: ReturnType<typeof setTimeout>;

  readonly listingQuery = signal<ListingQueryState>(createDefaultListingQuery());
  readonly controlColumns = signal<ListingControlsColumn[]>([]);
  readonly savedViews = signal<ListingSavedView[]>([]);
  readonly activeSavedViewId = signal<string | null>(null);
  readonly activeSavedViewQuery = signal<ListingQueryState | null>(null);

  readonly config = computed(() => this.bound().config());
  readonly features = computed(() => ({ ...DEFAULT_LISTING_FLAT_FEATURES, ...this.config().features }));

  readonly search = computed(() => this.listingQuery().search ?? '');
  readonly activeFilterGroup = computed(() => resolveFilterGroup(this.listingQuery()));
  readonly filterValues = computed(() => filterGroupToPinnedValues(this.activeFilterGroup()));
  readonly filterActive = computed(() => collectLeaves(this.activeFilterGroup()).length > 0);
  readonly page = computed(() => this.listingQuery().page);
  readonly pageSize = computed(() => this.listingQuery().pageSize);
  /** Sort levels in priority order. */
  readonly sorts = computed(() => this.listingQuery().sort ?? []);
  readonly sortActive = computed(() => this.sorts().length > 0);
  /** First level — drives the table header indicator. */
  readonly sortColumn = computed(() => this.sorts()[0]?.field);
  readonly sortDirection = computed(() => this.sorts()[0]?.direction);
  readonly sortableColumns = computed(() =>
    (this.config().columns ?? []).filter((c) => c.sortable && c.key)
  );
  readonly canAddSortLevel = computed(
    () => this.sorts().length < LISTING_MAX_SORT_LEVELS && this.sortableColumns().length > 0
  );

  readonly activeSegment = computed(() => {
    const segments = this.config().segments ?? [];
    const id = this.listingQuery().segment ?? this.config().defaultSegment;
    return segments.find((s) => s.id === id) ?? segments[0];
  });
  readonly presets = computed(() => this.config().presets ?? []);
  /** Active quick-filter pills by id. */
  readonly activePresets = computed(
    () => Object.fromEntries((this.listingQuery().presets ?? []).map((id) => [id, true])) as Record<string, boolean>
  );

  /** Lookup options resolved; « All » placeholders dropped (the listing offers its own). */
  readonly resolvedFilters = computed((): FilterFieldConfig[] => {
    const lookups = this.bound().lookups();
    return (this.config().filters ?? []).map((f) => {
      const options =
        f.options ??
        (f.lookupKey ? (lookups[f.lookupKey] ?? []).map((l) => ({ value: l.key, label: l.value })) : undefined);
      return options ? { ...f, options: options.filter((o) => o.value !== '' && o.value != null) } : f;
    });
  });
  readonly pinnedFilters = computed(() => this.resolvedFilters().filter((f) => f.pinned === true));
  readonly popupFilters = computed(() => this.resolvedFilters().filter((f) => !f.pinned));
  readonly pinnedSelectOptions = computed(() =>
    Object.fromEntries(
      this.pinnedFilters().map((filter) => [
        filter.key,
        (filter.options ?? []).map((option) => ({
          value: String(option.value),
          label: String(option.label ?? option.value),
        })),
      ])
    ) as Record<string, NfSelectOption[]>
  );
  readonly pinnedMultiValues = computed(() => {
    const values = this.filterValues();
    return Object.fromEntries(
      this.pinnedFilters().map((filter) => {
        const value = values[filter.key];
        const selected = Array.isArray(value)
          ? value.map(String)
          : value == null || value === ''
            ? []
            : [String(value)];
        return [filter.key, selected];
      })
    ) as Record<string, string[]>;
  });
  readonly pinnedValues = computed(() => {
    const values = this.filterValues();
    return Object.fromEntries(this.pinnedFilters().map((filter) => [filter.key, values[filter.key] ?? null])) as Record<
      string,
      unknown
    >;
  });
  readonly pinnedRanges = computed(() => {
    const values = this.filterValues();
    const part = (value: unknown, index: 0 | 1): string =>
      Array.isArray(value) && value[index] != null ? String(value[index]) : '';
    return Object.fromEntries(
      this.pinnedFilters()
        .filter((filter) => filter.type === 'daterange')
        .map((filter) => [filter.key, [part(values[filter.key], 0), part(values[filter.key], 1)] as [string, string]])
    ) as Record<string, [string, string]>;
  });

  /** Search, filters or a filtering segment hide part of the rows. */
  readonly narrowed = computed(
    () =>
      !!this.search() ||
      this.filterActive() ||
      (this.listingQuery().presets?.length ?? 0) > 0 ||
      Object.keys(this.activeSegment()?.filters ?? {}).length > 0
  );

  readonly hiddenCount = computed(() => this.controlColumns().filter((c) => !c.visible).length);

  readonly savedViewsEnabled = computed(
    () => !!this.bound().resourceKey() && this.config().savedViews !== false && !!this.savedViewsAdapter
  );
  readonly viewDirty = computed(() => {
    const baseline = this.activeSavedViewQuery();
    if (!baseline) return false;
    return !listingQuerySnapshotEqual(this.listingQuery(), baseline, { ignorePage: true });
  });

  /** Binds the store to its owner; call once from the owner's constructor (it creates effects). */
  connect(source: ListingQuerySource): void {
    this.source.set(source);

    effect(() => {
      this.controlColumns.set(
        controlColumnsFromQuery(this.config().columns, this.listingQuery().columns, this.config().defaultVisibleColumns)
      );
    });

    effect(() => {
      const external = source.query();
      if (!external) return;
      this.suppressEmit = true;
      this.listingQuery.set(external);
      this.controlColumns.set(
        controlColumnsFromQuery(this.config().columns, external.columns, this.config().defaultVisibleColumns)
      );
      this.suppressEmit = false;
    });

    effect(() => {
      if (source.query()) return;
      const init = this.config().initialFilters;
      const key = JSON.stringify(init ?? null);
      if (key === this.lastInitialFilters) return;
      this.lastInitialFilters = key;
      if (!init || Object.keys(init).length === 0) return;
      const clauses = filterValuesToClauses(init, this.config().filters ?? []);
      this.patchQuery({ filterGroup: clausesToGroup(clauses), filters: clauses, page: 1 });
    });

    // Only a config change resets the page size; the user's pick stays.
    effect(() => {
      const size = this.config().pageSize ?? 20;
      untracked(() => {
        if (this.listingQuery().pageSize !== size) this.patchQuery({ pageSize: size, page: 1 });
      });
    });

    effect(() => {
      const key = source.resourceKey();
      if (!key || !this.savedViewsAdapter) {
        this.savedViews.set([]);
        return;
      }
      void this.refreshSavedViews(key);
    });
  }

  ngOnDestroy(): void {
    clearTimeout(this.searchTimer);
  }

  patchQuery(patch: Partial<ListingQueryState>, resetPage = false): void {
    this.listingQuery.update((current) => {
      const next = mergeListingQuery(current, patch);
      if (resetPage) next.page = 1;
      return next;
    });
    this.emitQueryChange();
  }

  /** Replaces the whole filter group (builder Apply / Clear, chip remove, pinned filter). */
  replaceFilterGroup(group: FilterGroup, resetPage = true): void {
    this.patchQuery(withSyncedFilters({ ...this.listingQuery(), filterGroup: group }), resetPage);
  }

  /** Replaces all sort levels (empty / null clears to the API default). */
  setSorts(sorts: ListingSort[] | null): void {
    const next = (sorts ?? []).filter((s) => s?.field && (s.direction === 'asc' || s.direction === 'desc')).slice(0, LISTING_MAX_SORT_LEVELS);
    this.patchQuery({ sort: next.length ? next : null }, true);
  }

  /** Column header: one level only (toggle / replace). Multi-sort is the toolbar panel. */
  setPrimarySort(field: string, direction: ListingSort['direction'] | null): void {
    this.setSorts(direction ? [{ field, direction }] : null);
  }

  updateSortLevel(index: number, patch: Partial<ListingSort>): void {
    const levels = [...this.sorts()];
    if (index < 0 || index >= levels.length) return;
    levels[index] = { ...levels[index], ...patch };
    this.setSorts(levels);
  }

  addSortLevel(): void {
    if (!this.canAddSortLevel()) return;
    const used = new Set(this.sorts().map((s) => s.field));
    const next = this.sortableColumns().find((c) => !used.has(c.key));
    if (!next) return;
    this.setSorts([...this.sorts(), { field: next.key, direction: 'asc' }]);
  }

  removeSortLevel(index: number): void {
    this.setSorts(this.sorts().filter((_, i) => i !== index));
  }

  moveSortLevel(index: number, delta: -1 | 1): void {
    const levels = [...this.sorts()];
    const target = index + delta;
    if (index < 0 || target < 0 || index >= levels.length || target >= levels.length) return;
    const [row] = levels.splice(index, 1);
    levels.splice(target, 0, row);
    this.setSorts(levels);
  }

  selectSegment(id: string): void {
    this.patchQuery({ segment: id }, true);
  }

  togglePreset(id: string): void {
    const active = this.listingQuery().presets ?? [];
    this.patchQuery({ presets: active.includes(id) ? active.filter((item) => item !== id) : [...active, id] }, true);
  }

  setFilterValue(key: string, value: unknown): void {
    const field =
      this.pinnedFilters().find((f) => f.key === key) ?? this.resolvedFilters().find((f) => f.key === key);
    if (!field) return;
    this.replaceFilterGroup(upsertPinnedClause(this.activeFilterGroup(), field, value));
  }

  setRangePart(key: string, index: 0 | 1, part: string): void {
    const current = this.pinnedRanges()[key] ?? ['', ''];
    const next: [string, string] = [current[0], current[1]];
    next[index] = part ?? '';
    this.setFilterValue(key, !next[0] && !next[1] ? null : next);
  }

  /** Remote lists reload once typing pauses (300 ms), not on every key. */
  setSearch(value: string): void {
    if (!this.bound().remote()) {
      this.patchQuery({ search: value }, true);
      return;
    }
    this.listingQuery.update((current) => ({ ...mergeListingQuery(current, { search: value }), page: 1 }));
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.emitQueryChange(), 300);
  }

  setColumnVisibility(key: string, visible: boolean): void {
    this.controlColumns.update((cols) => cols.map((c) => (c.key === key ? { ...c, visible } : c)));
    this.patchQuery({ columns: columnStateFromControls(this.controlColumns()) });
  }

  showAllColumns(): void {
    this.controlColumns.update((cols) => cols.map((c) => ({ ...c, visible: true })));
    this.patchQuery({ columns: columnStateFromControls(this.controlColumns()) });
  }

  resetDefaultColumns(): void {
    this.controlColumns.set(
      controlColumnsFromQuery(this.config().columns, undefined, this.config().defaultVisibleColumns)
    );
    this.patchQuery({ columns: columnStateFromControls(this.controlColumns()) });
  }

  applySavedView(view: ListingSavedView, markActive = true): void {
    this.suppressEmit = true;
    this.listingQuery.set({ ...view.query, page: view.query.page ?? 1 });
    this.controlColumns.set(
      controlColumnsFromQuery(this.config().columns, view.query.columns, this.config().defaultVisibleColumns)
    );
    this.suppressEmit = false;
    if (markActive) {
      this.activeSavedViewId.set(view.id);
      this.activeSavedViewQuery.set(view.query);
    }
    this.emitQueryChange();
  }

  async promptSaveView(update: boolean): Promise<void> {
    const adapter = this.savedViewsAdapter;
    const resourceKey = this.bound().resourceKey();
    if (!adapter || !resourceKey) return;
    const defaultName = update
      ? (this.savedViews().find((v) => v.id === this.activeSavedViewId())?.name ?? 'My view')
      : 'My view';
    const name = window.prompt(update ? 'Update view name' : 'Save view as', defaultName);
    if (!name?.trim()) return;
    const query = { ...this.listingQuery(), page: 1 };
    const isDefault = window.confirm('Set as your default view for this list?');
    if (update && this.activeSavedViewId()) {
      await adapter.update(this.activeSavedViewId()!, { name: name.trim(), isDefault, query });
    } else {
      const created = await adapter.create({ resourceKey, name: name.trim(), isDefault, query });
      this.activeSavedViewId.set(created.id);
      this.activeSavedViewQuery.set(created.query);
    }
    await this.refreshSavedViews(resourceKey);
  }

  async deleteActiveView(): Promise<void> {
    const adapter = this.savedViewsAdapter;
    const resourceKey = this.bound().resourceKey();
    const id = this.activeSavedViewId();
    if (!adapter || !resourceKey || !id) return;
    if (!window.confirm('Delete this saved view?')) return;
    await adapter.delete(id);
    this.activeSavedViewId.set(null);
    this.activeSavedViewQuery.set(null);
    await this.refreshSavedViews(resourceKey);
  }

  private async refreshSavedViews(resourceKey: string): Promise<void> {
    const adapter = this.savedViewsAdapter;
    if (!adapter) return;
    const views = await adapter.list(resourceKey);
    this.savedViews.set(views);
    const defaultView = views.find((v) => v.isDefault);
    if (defaultView && !this.activeSavedViewId() && !this.bound().query()) {
      this.applySavedView(defaultView, false);
    }
  }

  private emitQueryChange(): void {
    if (this.suppressEmit) return;
    this.bound().emit(this.listingQuery());
  }

  private bound(): ListingQuerySource {
    const source = this.source();
    if (!source) throw new Error('ListingQueryStore: connect() must be called by its owner first.');
    return source;
  }
}
