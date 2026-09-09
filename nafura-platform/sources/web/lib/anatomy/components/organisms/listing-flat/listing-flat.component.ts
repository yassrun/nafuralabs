/**
 * nf-listing-flat — presentation for a flat collection.
 * Owns the view toolbar (search, filters, columns, listing actions) and pagination.
 */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { DataTableComponent } from '../data-table';
import { PaginationComponent } from '../pagination';
import {
  ListingControlsComponent,
  type ListingControlsColumn,
} from '../../molecules/listing-controls';
import { ListingActionsComponent } from '../../molecules/listing-actions';
import type { ColumnConfig } from '../../../types';
import { matchesFilters, matchesSearch } from './listing-query.util';
import {
  DEFAULT_LISTING_FLAT_FEATURES,
  type ListingFlatConfig,
} from './listing-flat.types';

@Component({
  selector: 'nf-listing-flat',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    ListingControlsComponent,
    ListingActionsComponent,
    DataTableComponent,
    PaginationComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="nf-listing-flat">
      <div class="nf-listing-flat__toolbar">
        <nf-listing-controls
          [showSelectionToggle]="features().selectionToggle"
          [selectionModeActive]="toggleSelectionOn()"
          [columns]="controlColumns()"
          [hiddenColumnsCount]="hiddenCount()"
          [showColumnsButton]="features().columnToggle"
          [filterActive]="filterActive()"
          [filterFields]="features().filters ? (config().filters ?? []) : []"
          [filterValues]="filterValues()"
          [search]="search()"
          [showSearch]="features().search"
          (selectionToggleClick)="toggleSelectionOn.update((v) => !v)"
          (columnsChange)="onColumnsChange($event)"
          (filterChange)="onFilterChange($event)"
          (filterReset)="onResetFilters()"
          (searchChange)="onSearchChange($event)"
        />
        @if (hasActions()) {
          <nf-listing-actions
            [actions]="config().actions ?? []"
            [selectionActions]="visibleSelectionActions()"
            (actionClick)="actionClick.emit($event)"
          >
            <ng-content />
          </nf-listing-actions>
        }
      </div>

      <div class="nf-listing-flat__view">
        <nf-data-table
          [items]="pageItems()"
          [columns]="visibleColumns()"
          [paginateAfter]="0"
          [rowClickable]="true"
          [selectable]="tableSelectable()"
          [selection]="selection()"
          [emptyMessage]="config().emptyMessage ?? 'No items'"
          [loading]="loading()"
          (selectionChange)="onTableSelectionChange($event)"
          (rowClick)="onRowClick($event)"
          (rowDblClick)="rowDblClick.emit($event)"
        />
      </div>

      @if (features().pagination && filteredItems().length > 0) {
        <div class="nf-listing-flat__pager">
          <nf-pagination
            [total]="filteredItems().length"
            [page]="page()"
            [pageSize]="pageSize()"
            [pageSizeOptions]="pageSizeOptions()"
            (pageChange)="onPageChange($event)"
          />
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        min-height: 0;
        height: 100%;
      }
      .nf-listing-flat {
        display: flex;
        flex-direction: column;
        min-height: 0;
        height: 100%;
        gap: 8px;
      }
      .nf-listing-flat__toolbar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        flex: 0 0 auto;
      }
      .nf-listing-flat__view {
        /* Hug content: pager sits right under the table; shrinks + scrolls when space is tight. */
        flex: 0 1 auto;
        min-height: 0;
        overflow: auto;
      }
      .nf-listing-flat__pager {
        flex: 0 0 auto;
      }
    `,
  ],
})
export class ListingFlatComponent<T = unknown> {
  readonly config = input.required<ListingFlatConfig>();
  readonly items = input<T[]>([]);
  readonly loading = input<boolean>(false);

  readonly rowClick = output<T>();
  readonly rowDblClick = output<T>();
  readonly actionClick = output<string>();
  readonly selectionChange = output<T[]>();

  readonly search = signal('');
  readonly filterValues = signal<Record<string, unknown>>({});
  readonly page = signal(1);
  readonly pageSize = signal(20);
  readonly toggleSelectionOn = signal(false);
  readonly selection = signal<T[]>([]);
  readonly controlColumns = signal<ListingControlsColumn[]>([]);

  readonly features = computed(() => ({
    ...DEFAULT_LISTING_FLAT_FEATURES,
    ...this.config().features,
  }));

  readonly selectionKind = computed(() => this.features().selection);

  readonly tableSelectable = computed((): false | 'single' | 'multiple' => {
    if (this.features().selectionToggle && this.toggleSelectionOn()) return 'multiple';
    const sel = this.selectionKind();
    return sel === 'none' ? false : sel;
  });

  constructor() {
    effect(() => {
      const cols = this.config().columns;
      this.controlColumns.set(
        cols.map((c) => ({
          key: c.key,
          label: c.label,
          visible: true,
        }))
      );
    });
    effect(() => {
      this.pageSize.set(this.config().pageSize ?? 20);
      this.page.set(1);
    });
    effect(() => {
      this.selectionKind();
      this.features().selectionToggle;
      this.toggleSelectionOn.set(false);
      this.setSelection([]);
    });
  }

  /** Apply initialFilters only when its content actually changes (config is rebuilt often). */
  private lastInitialFilters = '';
  readonly initialFiltersEffect = effect(() => {
    const init = this.config().initialFilters;
    const key = JSON.stringify(init ?? null);
    if (key === this.lastInitialFilters) return;
    this.lastInitialFilters = key;
    this.filterValues.set({ ...(init ?? {}) });
    this.page.set(1);
  });

  readonly pageSizeOptions = computed(
    () => this.config().pageSizeOptions ?? [10, 20, 50, 100]
  );

  readonly filterActive = computed(() => Object.keys(this.filterValues()).length > 0);
  readonly hiddenCount = computed(
    () => this.controlColumns().filter((c) => !c.visible).length
  );
  readonly hasActions = computed(() => {
    const actions = this.config().actions ?? [];
    return (
      !!this.config().projectedActions ||
      actions.some((a) => a.visible !== false) ||
      this.visibleSelectionActions().length > 0
    );
  });

  /** Selection-scoped actions: shown when selection count matches the action scope. */
  readonly visibleSelectionActions = computed(() => {
    const count = this.selection().length;
    if (count === 0) return [];
    return (this.config().selectionActions ?? []).filter((a) => {
      if (a.visible === false) return false;
      const scope = a.scope ?? 'single+bulk';
      const min =
        scope === 'single' ? 1 : scope === 'bulk' ? (a.minSelection ?? 2) : (a.minSelection ?? 1);
      const max = scope === 'single' ? 1 : a.maxSelection;
      if (count < min) return false;
      if (max != null && count > max) return false;
      return true;
    });
  });

  readonly visibleColumns = computed((): ColumnConfig[] => {
    const visible = new Set(
      this.controlColumns()
        .filter((c) => c.visible)
        .map((c) => c.key)
    );
    return this.config().columns.filter((c) => visible.has(c.key));
  });

  readonly filteredItems = computed(() => {
    const searchFields =
      this.config().searchFields ?? this.config().columns.map((c) => c.field || c.key);
    return this.items().filter(
      (item) =>
        matchesSearch(item, this.search(), searchFields) &&
        matchesFilters(item, this.filterValues())
    );
  });

  readonly pageItems = computed(() => {
    const rows = this.filteredItems();
    if (!this.features().pagination) return rows;
    const size = this.pageSize();
    const start = (this.page() - 1) * size;
    return rows.slice(start, start + size);
  });

  onColumnsChange(cols: ListingControlsColumn[]): void {
    this.controlColumns.set(cols);
  }

  onFilterChange(values: Record<string, unknown>): void {
    this.filterValues.set(values);
    this.page.set(1);
  }

  onSearchChange(value: string): void {
    this.search.set(value);
    this.page.set(1);
  }

  onResetFilters(): void {
    this.filterValues.set({});
    this.search.set('');
    this.page.set(1);
  }

  onPageChange(ev: { page: number; pageSize: number }): void {
    this.page.set(ev.page);
    this.pageSize.set(ev.pageSize);
  }

  /** Single mode: row click toggles the selected row (highlight, no checkboxes). */
  onRowClick(item: T): void {
    if (this.selectionKind() === 'single') {
      const next = this.selection().includes(item) ? [] : [item];
      this.setSelection(next);
    }
    this.rowClick.emit(item);
  }

  onTableSelectionChange(items: T[]): void {
    this.setSelection(items);
  }

  private setSelection(items: T[]): void {
    this.selection.set(items);
    this.selectionChange.emit(items);
  }
}
