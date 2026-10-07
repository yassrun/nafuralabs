/**
 * nf-listing-flat — presentation for a flat collection: the toolbar (`nf-listing-toolbar`, internal) above the
 * table, then the pager. The query state (search, filters, segment, sort, page, columns, saved views) is a
 * `ListingQueryStore` shared by the toolbar and the table.
 */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  effect,
  inject,
  input,
  output,
  signal,
  TemplateRef,
  untracked,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { DataTableComponent, type SortChangeEvent } from '../data-table';
import { ColumnTemplateDirective } from '../entity-listing/column-template.directive';
import { PaginationComponent } from '../pagination';
import { DataStateComponent } from '../../molecules/data-state';
import { EmptyStateComponent } from '../../molecules/empty-state';
import type { ColumnConfig, ListingQueryState, LookupContext } from '../../../types';
import { ListingExportDialogComponent } from './export/listing-export-dialog.component';
import type { ListingFlatConfig } from './listing-flat.types';
import { matchesFilterGroup, matchesSearch, matchesSegment } from './listing-query.util';
import { resolveFilterGroup, sortItemsLocally } from './listing-query-state.util';
import { ListingQueryStore } from './listing-query.store';
import { ListingToolbarComponent } from './toolbar/listing-toolbar.component';

@Component({
  selector: 'nf-listing-flat',
  standalone: true,
  imports: [
    TranslateModule,
    ListingToolbarComponent,
    ListingExportDialogComponent,
    DataTableComponent,
    DataStateComponent,
    EmptyStateComponent,
    PaginationComponent,
  ],
  providers: [ListingQueryStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './listing-flat.component.html',
  styleUrl: './listing-flat.component.scss',
})
export class ListingFlatComponent<T = unknown> {
  protected readonly store = inject(ListingQueryStore);

  readonly config = input.required<ListingFlatConfig>();
  readonly items = input<T[]>([]);
  readonly loading = input<boolean>(false);
  /** Controlled listing query (URL / parent / saved view). */
  readonly query = input<ListingQueryState | undefined>();
  /** When true, items are already filtered/paged server-side — skip client refilter. */
  readonly remote = input<boolean>(false);
  readonly remoteTotal = input<number | undefined>(undefined);
  readonly resourceKey = input<string | undefined>();
  /** Options of filters declared with `lookupKey`. */
  readonly lookups = input<LookupContext>({});
  /** Custom cells by column key (`<ng-template nfColumn="key" let-value let-item="item">`). */
  readonly cellTemplates = input<Record<string, TemplateRef<unknown>>>({});
  private readonly projectedCells = contentChildren(ColumnTemplateDirective);
  readonly resolvedCellTemplates = computed(() => ({
    ...Object.fromEntries(this.projectedCells().map((cell) => [cell.nfColumn, cell.templateRef])),
    ...this.cellTemplates(),
  }));
  /** Row highlighted as open (master–detail). */
  readonly activeRowId = input<string | null>(null);
  /** Load failure: replaces the table with a retry state. */
  readonly error = input<string | null>(null);

  readonly queryChange = output<ListingQueryState>();
  readonly load = output<ListingQueryState>();
  readonly retry = output<void>();

  readonly rowClick = output<T>();
  readonly rowDblClick = output<T>();
  readonly actionClick = output<string>();
  readonly selectionChange = output<T[]>();
  readonly exportClick = output<void>();

  readonly toggleSelectionOn = signal(false);
  readonly selection = signal<T[]>([]);
  protected readonly exportOpen = signal(false);

  readonly features = this.store.features;
  protected readonly layout = computed(() => this.config().toolbarLayout ?? 'chips');
  protected readonly selectionKind = computed(() => this.features().selection);
  private readonly selectionToggleDefault = computed(() => this.features().selectionToggleDefaultActive ?? false);

  protected readonly pageSizeOptions = computed(() => this.config().pageSizeOptions ?? [10, 20, 50, 100]);

  protected readonly emptyState = computed(() => {
    const empty = this.config().emptyState;
    if (!empty || this.loading() || this.items().length > 0) return null;
    return this.store.narrowed() ? null : empty;
  });

  protected readonly tableSelectable = computed((): false | 'single' | 'multiple' => {
    const sel = this.selectionKind();
    if (sel === 'none') return false;
    if (this.features().selectionToggle) return this.toggleSelectionOn() ? 'multiple' : 'single';
    return sel;
  });

  protected readonly visibleColumns = computed((): ColumnConfig[] => {
    const visible = new Set(
      this.store
        .controlColumns()
        .filter((c) => c.visible)
        .map((c) => c.key)
    );
    return this.config().columns.filter((c) => visible.has(c.key));
  });

  protected readonly pagerTotal = computed(() =>
    this.remote() ? (this.remoteTotal() ?? this.items().length) : this.filteredItems().length
  );

  protected readonly filteredItems = computed(() => {
    if (this.remote()) return this.items();
    const q = this.store.listingQuery();
    const searchFields = this.config().searchFields ?? this.config().columns.map((c) => c.field || c.key);
    const rows = this.items().filter(
      (item) =>
        matchesSearch(item, q.search ?? '', searchFields) &&
        matchesFilterGroup(item, resolveFilterGroup(q)) &&
        matchesSegment(item, this.store.activeSegment()?.filters)
    );
    return sortItemsLocally(rows, q.sort, this.config().columns);
  });

  protected readonly pageItems = computed(() => {
    if (this.remote()) return this.items();
    const rows = this.filteredItems();
    if (!this.features().pagination) return rows;
    const size = this.store.pageSize();
    const start = (this.store.page() - 1) * size;
    return rows.slice(start, start + size);
  });

  constructor() {
    this.store.connect({
      config: this.config,
      lookups: this.lookups,
      query: this.query,
      remote: this.remote,
      resourceKey: this.resourceKey,
      emit: (query) => {
        this.queryChange.emit(query);
        if (this.remote()) this.load.emit(query);
      },
    });

    // Depends on primitives only: a config recomputed for other reasons (lookups, permissions) keeps the selection.
    effect(() => {
      const kind = this.selectionKind();
      const defaultActive = this.selectionToggleDefault();
      this.toggleSelectionOn.set(kind !== 'none' && defaultActive);
      untracked(() => this.setSelection([]));
    });

    // New data (reload, delete): the selection keeps only rows still listed.
    effect(() => {
      const items = this.items();
      const selected = untracked(this.selection);
      if (selected.length && selected.some((item) => !items.includes(item))) {
        untracked(() => this.setSelection(selected.filter((item) => items.includes(item))));
      }
    });
  }

  protected onToolbarAction(id: string): void {
    if (id === 'export' && this.features().export) {
      this.openExportDialog();
      return;
    }
    this.actionClick.emit(id);
  }

  openExportDialog(): void {
    this.exportOpen.set(true);
  }

  exportFilteredData(): void {
    this.openExportDialog();
  }

  protected onExported(): void {
    this.exportClick.emit();
    this.actionClick.emit('export');
  }

  protected onPageChange(ev: { page: number; pageSize: number }): void {
    this.store.patchQuery({ page: ev.page, pageSize: ev.pageSize });
  }

  protected onSortChange(ev: SortChangeEvent): void {
    this.store.setPrimarySort(ev.column, ev.direction ?? null);
  }

  /** Single mode: row click toggles the selected row (highlight, no checkboxes). */
  protected onRowClick(item: T): void {
    if (this.features().rowClick !== 'open' && this.tableSelectable() === 'single') {
      this.setSelection(this.selection().includes(item) ? [] : [item]);
    }
    this.rowClick.emit(item);
  }

  protected onTableSelectionChange(items: T[]): void {
    this.setSelection(items);
  }

  protected toggleSelectionMode(): void {
    this.toggleSelectionOn.update((v) => !v);
    this.setSelection([]);
  }

  private setSelection(items: T[]): void {
    this.selection.set(items);
    this.selectionChange.emit(items);
  }
}
