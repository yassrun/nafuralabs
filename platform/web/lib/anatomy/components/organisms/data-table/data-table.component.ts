import {
  Component,
  input,
  output,
  computed,
  contentChild,
  TemplateRef,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SelectionModel } from '@angular/cdk/collections';
import { TranslateModule } from '@ngx-translate/core';
import { BadgeVariant, ColumnConfig, SortDirection } from '../../../types';
import { SpinnerComponent } from '../../atoms/spinner';
import { BadgeComponent } from '../../atoms/badge';
import { EmptyStateComponent } from '../../molecules/empty-state';
import { MadCurrencyPipe } from '../../../pipes/mad-currency.pipe';
import { PaginationComponent, type PageChangeEvent } from '../../molecules/pagination/pagination.component';

/**
 * Selection mode types.
 */
export type SelectableMode = boolean | 'single' | 'multiple';

/**
 * Sort change event.
 */
export interface SortChangeEvent {
  column: string;
  direction: SortDirection | null;
}

/**
 * Row action event.
 */
export interface RowActionEvent<T> {
  action: string;
  item: T;
}

/**
 * Data Table Component
 *
 * Full-featured data table (wraps Material Table).
 *
 * @example
 * <nf-data-table
 *   [items]="items()"
 *   [columns]="columns"
 *   [loading]="isLoading()"
 *   [selectable]="'multiple'"
 *   [selection]="selectedItems()"
 *   (selectionChange)="onSelectionChange($event)"
 *   (sortChange)="onSortChange($event)"
 *   (rowClick)="onRowClick($event)">
 * </nf-data-table>
 */
@Component({
  selector: 'nf-data-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatCheckboxModule,
    TranslateModule,
    SpinnerComponent,
    BadgeComponent,
    EmptyStateComponent,
    MadCurrencyPipe,
    PaginationComponent,
  ],
  template: `
    <div class="nf-data-table" [class.nf-data-table--loading]="loading()">
      @if (loading()) {
        <div class="nf-data-table__loading-overlay">
          <nf-spinner size="md"></nf-spinner>
        </div>
      }

      @if (items().length === 0 && !loading()) {
        <nf-empty-state
          icon="inbox"
          [title]="emptyMessage() | translate"
        ></nf-empty-state>
      } @else {
        <table
          mat-table
          [dataSource]="pagedItems()"
          matSort
          [matSortActive]="sortColumn() || ''"
          [matSortDirection]="matSortDirection()"
          (matSortChange)="onSortChange($event)"
          [class.nf-data-table__table--clickable]="rowClickable()"
        >
          <!-- Selection column (checkboxes only in multiple mode; single mode uses row highlight only) -->
          @if (showSelectionColumn()) {
            <ng-container matColumnDef="select">
              <th mat-header-cell *matHeaderCellDef>
                @if (selectable() === 'multiple') {
                  <mat-checkbox
                    [checked]="isAllSelected()"
                    [indeterminate]="isSomeSelected()"
                    (change)="toggleAllRows()"
                  ></mat-checkbox>
                }
              </th>
              <td mat-cell *matCellDef="let row">
                <mat-checkbox
                  [checked]="isSelected(row)"
                  data-no-click="true"
                  (click)="$event.stopPropagation()"
                  (change)="toggleRow(row)"
                ></mat-checkbox>
              </td>
            </ng-container>
          }

          <!-- Data columns -->
          @for (col of columns(); track col.key) {
            <ng-container [matColumnDef]="col.key">
              <th
                mat-header-cell
                *matHeaderCellDef
                [mat-sort-header]="col.sortable ? col.key : ''"
                [disabled]="!col.sortable"
                [style.width]="col.width"
                [ngClass]="col.cssClass"
              >
                {{ col.label | translate }}
              </th>
              <td
                mat-cell
                *matCellDef="let row"
                [style.width]="col.width"
                [ngClass]="col.cssClass"
              >
                @if (col.cellAction) {
                  <button
                    type="button"
                    class="nf-data-table__cell-action"
                    data-no-click="true"
                    (click)="onCellAction(col.cellAction, row, $event)">
                    @switch (col.type) {
                      @case ('badge') {
                        <nf-badge [variant]="getBadgeVariant(row, col)">
                          {{ getCellValue(row, col) }}
                        </nf-badge>
                      }
                    @case ('boolean') {
                      <nf-badge [variant]="getBooleanBadgeVariant(row, col)">
                        {{ getBooleanLabel(row, col) | translate }}
                      </nf-badge>
                    }
                      @case ('date') {
                        {{ $any(getFieldValue(row, col.field)) | date:'mediumDate' }}
                      }
                      @case ('datetime') {
                        {{ $any(getFieldValue(row, col.field)) | date:'medium' }}
                      }
                      @case ('currency') {
                        {{ $any(getFieldValue(row, col.field)) | mad }}
                      }
                      @case ('number') {
                        {{ $any(getFieldValue(row, col.field)) | number }}
                      }
                      @default {
                        {{ getCellValue(row, col) }}
                      }
                    }
                  </button>
                } @else {
                  @switch (col.type) {
                    @case ('badge') {
                      <nf-badge [variant]="getBadgeVariant(row, col)">
                        {{ getCellValue(row, col) }}
                      </nf-badge>
                    }
                    @case ('boolean') {
                      <nf-badge [variant]="getBooleanBadgeVariant(row, col)">
                        {{ getBooleanLabel(row, col) | translate }}
                      </nf-badge>
                    }
                    @case ('date') {
                      {{ $any(getFieldValue(row, col.field)) | date:'mediumDate' }}
                    }
                    @case ('datetime') {
                      {{ $any(getFieldValue(row, col.field)) | date:'medium' }}
                    }
                    @case ('currency') {
                      {{ $any(getFieldValue(row, col.field)) | mad }}
                    }
                    @case ('number') {
                      {{ $any(getFieldValue(row, col.field)) | number }}
                    }
                    @default {
                      {{ getCellValue(row, col) }}
                    }
                  }
                }
              </td>
            </ng-container>
          }

          <!-- Actions column -->
          @if (rowActionsTemplate()) {
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let row" class="nf-data-table__actions" data-no-click="true" (click)="$event.stopPropagation()">
                <ng-container
                  *ngTemplateOutlet="rowActionsTemplate()!; context: { $implicit: row }"
                ></ng-container>
              </td>
            </ng-container>
          }

          <tr mat-header-row *matHeaderRowDef="displayedColumns(); sticky: stickyHeader()"></tr>
          <tr
            mat-row
            *matRowDef="let row; columns: displayedColumns()"
            [class.nf-data-table__row--selected]="isSelected(row)"
            [class.nf-data-table__row--cv-auto]="useRowContentVisibility()"
            (click)="onRowClicked(row, $event)"
            (dblclick)="onRowDblClicked(row)"
          ></tr>
        </table>
        @if (isPaginated()) {
          <nf-pagination
            [total]="items().length"
            [page]="_page()"
            [pageSize]="_pageSize()"
            (pageChange)="onPageChange($event)">
          </nf-pagination>
        }
      }
    </div>
  `,
  styles: [`
    .nf-data-table {
      position: relative;
      display: block;
      width: 100%;
      min-width: 0;
      overflow: auto;
    }

    .nf-data-table--loading {
      min-height: 200px;
    }

    .nf-data-table__loading-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: rgba(255, 255, 255, 0.7);
      z-index: 10;
    }

    table {
      width: max-content;
      min-width: 100%;
    }

    .nf-data-table__table--clickable tr {
      cursor: pointer;
    }

    .nf-data-table__row--selected {
      background-color: var(--nf-table-row-selected-bg);
    }

    /* Selected row keeps selected background on hover so selection stays visually distinct */
    tr.mat-mdc-row.nf-data-table__row--selected:hover {
      background-color: var(--nf-table-row-selected-bg);
    }

    th.mat-mdc-header-cell {
      font-weight: var(--nf-table-header-font-weight);
      color: var(--nf-table-header-color);
      background-color: var(--nf-table-header-bg);
    }

    td.mat-mdc-cell {
      color: var(--nf-text-primary);
    }

    .nf-data-table__actions {
      text-align: end;
      white-space: nowrap;
    }

    .nf-data-table__cell-action {
      display: inline-flex;
      align-items: center;
      gap: var(--nf-space-1, 4px);
      padding: 0;
      border: 0;
      background: transparent;
      color: var(--nf-color-primary-600);
      cursor: pointer;
      font: inherit;
      text-align: start;
    }

    .nf-data-table__cell-action nf-badge {
      pointer-events: none;
    }

    .nf-data-table__cell-action:hover {
      text-decoration: underline;
    }

    .nf-data-table__cell-action:focus-visible {
      outline: 2px solid var(--nf-border-focus);
      outline-offset: 2px;
      border-radius: 6px;
    }

    tr.mat-mdc-row:hover {
      background-color: var(--nf-table-row-hover-bg);
    }

    tr.mat-mdc-row.nf-data-table__row--cv-auto {
      content-visibility: auto;
      contain-intrinsic-size: 48px 1px;
    }
  `],
})
export class DataTableComponent<T = unknown> {
  // Content children
  rowActionsTemplate = contentChild<TemplateRef<{ $implicit: T }>>('rowActions');

  // Inputs
  items = input<T[]>([]);
  columns = input.required<ColumnConfig[]>();
  loading = input<boolean>(false);
  /** Auto-paginate when total rows exceed this threshold. 0 = no pagination. */
  paginateAfter = input<number>(25);
  selectable = input<SelectableMode>(false);
  selection = input<T[]>([]);
  sortColumn = input<string | undefined>(undefined);
  sortDirection = input<SortDirection | undefined>(undefined);
  stickyHeader = input<boolean>(true);
  rowClickable = input<boolean>(false);
  emptyMessage = input<string>('shared.dataTable.empty.title');
  trackBy = input<((item: T) => unknown) | undefined>(undefined);

  /**
   * When set (e.g. Master–Slave openOnRowClick), the row with this id is highlighted
   * as selected for styling, without using checkbox selection. Ensures selection effect
   * is visible even when selection array uses different references.
   */
  activeRowId = input<string | null>(null);

  // Outputs
  selectionChange = output<T[]>();
  sortChange = output<SortChangeEvent>();
  rowClick = output<T>();
  rowDblClick = output<T>();
  rowAction = output<RowActionEvent<T>>();

  // Pagination state
  readonly _page = signal(1);
  readonly _pageSize = signal(25);

  readonly isPaginated = computed(() => this.paginateAfter() > 0 && this.items().length > this.paginateAfter());
  readonly pagedItems = computed<T[]>(() => {
    if (!this.isPaginated()) return this.items();
    const start = (this._page() - 1) * this._pageSize();
    return this.items().slice(start, start + this._pageSize());
  });

  /** Offscreen row paint skipping when many rows are rendered without pagination (F-19 complement). */
  readonly useRowContentVisibility = computed(
    () => !this.isPaginated() && this.items().length > 50,
  );

  onPageChange(e: PageChangeEvent): void {
    this._page.set(e.page);
    this._pageSize.set(e.pageSize);
  }

  // Computed
  isSelectable = computed(() => {
    const sel = this.selectable();
    return sel === true || sel === 'single' || sel === 'multiple';
  });

  /** True when checkboxes should be shown (multiple or legacy true); false for single (row highlight only). */
  showSelectionColumn = computed(() => {
    const sel = this.selectable();
    return sel === 'multiple' || sel === true;
  });

  displayedColumns = computed(() => {
    const cols = this.columns().map((c) => c.key);

    if (this.showSelectionColumn()) {
      cols.unshift('select');
    }

    if (this.rowActionsTemplate()) {
      cols.push('actions');
    }

    return cols;
  });

  matSortDirection = computed(() => {
    const dir = this.sortDirection();
    if (dir === 'asc') return 'asc';
    if (dir === 'desc') return 'desc';
    return '';
  });

  // Selection helpers (activeRowId takes precedence for row highlight when set)
  isSelected(row: T): boolean {
    const activeId = this.activeRowId();
    if (activeId != null) {
      const rowId = (row as { id?: string }).id;
      return rowId === activeId;
    }
    return this.selection().includes(row);
  }

  isAllSelected(): boolean {
    const items = this.items();
    const selection = this.selection();
    return items.length > 0 && items.every((item) => selection.includes(item));
  }

  isSomeSelected(): boolean {
    const selection = this.selection();
    return selection.length > 0 && !this.isAllSelected();
  }

  toggleRow(row: T): void {
    const current = [...this.selection()];
    const index = current.indexOf(row);

    if (this.selectable() === 'single') {
      this.selectionChange.emit(index >= 0 ? [] : [row]);
    } else {
      if (index >= 0) {
        current.splice(index, 1);
      } else {
        current.push(row);
      }
      this.selectionChange.emit(current);
    }
  }

  toggleAllRows(): void {
    if (this.isAllSelected()) {
      this.selectionChange.emit([]);
    } else {
      this.selectionChange.emit([...this.items()]);
    }
  }

  // Cell value helpers
  getFieldValue(row: T, field: string): unknown {
    const parts = field.split('.');
    let value: unknown = row;

    for (const part of parts) {
      if (value == null) return undefined;
      value = (value as Record<string, unknown>)[part];
    }

    return value;
  }

  getCellValue(row: T, col: ColumnConfig): string {
    const value = this.getFieldValue(row, col.field);

    if (col.transform) {
      return col.transform(value, row);
    }

    return value != null ? String(value) : '';
  }

  getBadgeVariant(row: T, col: ColumnConfig): BadgeVariant {
    const value = this.getFieldValue(row, col.field);
    const badgeVariant = col.badgeVariant;

    if (typeof badgeVariant === 'function') {
      return badgeVariant(value, row);
    }

    if (badgeVariant) {
      return badgeVariant;
    }

    return 'default';
  }

  getBooleanLabel(row: T, col: ColumnConfig): string {
    return this.toBoolean(this.getFieldValue(row, col.field))
      ? 'shared.dataTable.boolean.yes'
      : 'shared.dataTable.boolean.no';
  }

  getBooleanBadgeVariant(row: T, col: ColumnConfig): BadgeVariant {
    return this.toBoolean(this.getFieldValue(row, col.field)) ? 'success' : 'default';
  }

  private toBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      return normalized === 'true' || normalized === '1' || normalized === 'yes';
    }
    return false;
  }

  // Event handlers
  onSortChange(sort: Sort): void {
    this.sortChange.emit({
      column: sort.active,
      direction: sort.direction === '' ? null : sort.direction as SortDirection,
    });
  }

  /** Pending single-click timeout; cleared on double-click so double-click only triggers rowDblClick. */
  private _rowClickTimeoutId: ReturnType<typeof setTimeout> | null = null;

  onRowClicked(row: T, event: MouseEvent): void {
    if (!this.rowClickable()) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest('[data-no-click="true"]')) {
      return;
    }
    // No selection UX: open detail on first click (skip dblclick guard delay).
    if (!this.selectable()) {
      this.rowClick.emit(row);
      return;
    }
    if (this._rowClickTimeoutId) clearTimeout(this._rowClickTimeoutId);
    this._rowClickTimeoutId = setTimeout(() => {
      this._rowClickTimeoutId = null;
      this.rowClick.emit(row);
    }, 250);
  }

  onRowDblClicked(row: T): void {
    if (!this.rowClickable()) return;
    if (this._rowClickTimeoutId) {
      clearTimeout(this._rowClickTimeoutId);
      this._rowClickTimeoutId = null;
    }
    this.rowDblClick.emit(row);
  }

  onCellAction(action: string, row: T, event: Event): void {
    event.stopPropagation();
    this.rowAction.emit({ action, item: row });
  }
}
