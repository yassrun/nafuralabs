/**
 * nf-listing-tree — presentation for a hierarchical collection.
 * Owns the view toolbar (search, filters, column visibility, tree actions).
 * Single column header so column show/hide stays available.
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

import {
  TreeTableComponent,
  type NfTreeNode,
  type NfTreeTableColumn,
} from '../tree-table';
import {
  ListingControlsComponent,
  type ListingControlsColumn,
} from '../../molecules/listing-controls';
import { FilterResetComponent } from '../../molecules/filter-reset/filter-reset.component';
import { ListingActionsComponent } from '../../molecules/listing-actions';
import {
  collectExpandableKeys,
  filterTreeNodes,
  matchesFilters,
  matchesSearch,
} from '../listing-flat/listing-query.util';
import {
  DEFAULT_LISTING_TREE_FEATURES,
  type ListingTreeConfig,
} from './listing-tree.types';

@Component({
  selector: 'nf-listing-tree',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    ListingControlsComponent,
    FilterResetComponent,
    ListingActionsComponent,
    TreeTableComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="nf-listing-tree">
      <div class="nf-listing-tree__toolbar">
        <nf-listing-controls
          [columns]="controlColumns()"
          [hiddenColumnsCount]="hiddenCount()"
          [showColumnsButton]="features().columnToggle"
          [filterActive]="filterActive()"
          [filterFields]="features().filters ? (config().filters ?? []) : []"
          [filterValues]="filterValues()"
          [search]="search()"
          [showSearch]="features().search"
          (columnsChange)="onColumnsChange($event)"
          (filterChange)="onFilterChange($event)"
          (searchChange)="search.set($event)"
        />
        <nf-filter-reset [active]="filterActive()" (reset)="onResetFilters()" />
        @if (features().treeActions) {
          <nf-listing-actions
            mode="tree"
            [selectedId]="selectedId()"
            [canAddChild]="canAddChild()"
            (actionClick)="onTreeAction($event)"
          />
        }
      </div>

      <div class="nf-listing-tree__view">
        <nf-tree-table
          [nodes]="filteredNodes()"
          [columns]="visibleColumns()"
          [treeColumnKey]="config().treeColumnKey"
          [loading]="loading()"
          [rowClickable]="true"
          [expandedKeys]="expandedKeys()"
          [emptyMessage]="config().emptyMessage ?? 'No items'"
          (expandedKeysChange)="expandedKeys.set($event)"
          (rowClick)="onRowClick($event)"
          (rowDblClick)="rowDblClick.emit($event)"
        />
      </div>
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
      .nf-listing-tree {
        display: flex;
        flex-direction: column;
        min-height: 0;
        height: 100%;
        gap: 8px;
      }
      .nf-listing-tree__toolbar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        flex: 0 0 auto;
      }
      .nf-listing-tree__view {
        flex: 1 1 auto;
        min-height: 0;
        overflow: auto;
      }
    `,
  ],
})
export class ListingTreeComponent<T = unknown> {
  readonly config = input.required<ListingTreeConfig<T>>();
  readonly nodes = input<NfTreeNode<T>[]>([]);
  readonly loading = input<boolean>(false);
  /** When set, parent decides if the selected node may receive a child. */
  readonly canAddChild = input<boolean>(true);

  readonly rowClick = output<T>();
  readonly rowDblClick = output<T>();
  readonly action = output<{ id: string; selectedId: string | null }>();

  readonly search = signal('');
  readonly filterValues = signal<Record<string, unknown>>({});
  readonly selectedId = signal<string | null>(null);
  readonly expandedKeys = signal<ReadonlySet<string>>(new Set());
  readonly controlColumns = signal<ListingControlsColumn[]>([]);

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
  }

  readonly features = computed(() => ({
    ...DEFAULT_LISTING_TREE_FEATURES,
    ...this.config().features,
  }));

  readonly filterActive = computed(() => Object.keys(this.filterValues()).length > 0);
  readonly hiddenCount = computed(
    () => this.controlColumns().filter((c) => !c.visible).length
  );

  readonly visibleColumns = computed((): NfTreeTableColumn<T>[] => {
    const visible = new Set(
      this.controlColumns()
        .filter((c) => c.visible)
        .map((c) => c.key)
    );
    const cols = this.config().columns.filter((c) => visible.has(c.key));
    const treeKey = this.config().treeColumnKey;
    if (cols.some((c) => c.key === treeKey)) return cols;
    const treeCol = this.config().columns.find((c) => c.key === treeKey);
    return treeCol ? [treeCol, ...cols] : cols;
  });

  readonly filteredNodes = computed(() => {
    const searchFields = this.config().searchFields;
    const q = this.search();
    const filters = this.filterValues();
    if (!q.trim() && !Object.keys(filters).length) return this.nodes();
    return filterTreeNodes(this.nodes(), (data) => {
      return matchesSearch(data, q, searchFields) && matchesFilters(data, filters);
    });
  });

  onColumnsChange(cols: ListingControlsColumn[]): void {
    this.controlColumns.set(cols);
  }

  onFilterChange(values: Record<string, unknown>): void {
    this.filterValues.set(values);
  }

  onResetFilters(): void {
    this.filterValues.set({});
    this.search.set('');
  }

  onRowClick(row: T): void {
    const id = this.rowId(row);
    this.selectedId.set(id);
    this.rowClick.emit(row);
  }

  onTreeAction(id: string): void {
    if (id === 'expand-all') {
      this.expandedKeys.set(collectExpandableKeys(this.filteredNodes()));
      return;
    }
    if (id === 'collapse-all') {
      this.expandedKeys.set(new Set());
      return;
    }
    this.action.emit({ id, selectedId: this.selectedId() });
  }

  private rowId(row: T): string | null {
    if (row == null || typeof row !== 'object') return null;
    const rec = row as Record<string, unknown>;
    const id = rec['id'] ?? rec['key'];
    return id == null ? null : String(id);
  }
}
