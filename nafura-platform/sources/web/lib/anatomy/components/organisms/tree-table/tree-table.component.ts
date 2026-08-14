import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  contentChild,
  input,
  output,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { TranslateModule } from '@ngx-translate/core';

import { SpinnerComponent } from '../../atoms/spinner';
import { EmptyStateComponent } from '../../molecules/empty-state';

export interface NfTreeNode<T> {
  key: string;
  data: T;
  children?: NfTreeNode<T>[];
  expanded?: boolean;
  leaf?: boolean;
}

export interface NfTreeTableColumn<T = unknown> {
  key: string;
  label: string;
  field?: string;
  width?: string;
  /** Fixe la colonne à droite pendant le scroll horizontal. */
  stickyEnd?: boolean;
  align?: 'start' | 'center' | 'end';
  cssClass?: string;
  value?: (data: T) => unknown;
}

export interface NfTreeTableCellContext<T> {
  $implicit: T;
  column: NfTreeTableColumn<T>;
  node: NfTreeNode<T>;
}

export interface NfTreeTableDetailContext<T> {
  $implicit: T;
  node: NfTreeNode<T>;
  colspan: number;
}

type RowClassValue = string | string[] | Set<string> | Record<string, boolean>;

interface NfTreeFlatRow<T> {
  key: string;
  data: T;
  node: NfTreeNode<T>;
  depth: number;
  expandable: boolean;
  expanded: boolean;
}

/**
 * Generic hierarchical data table.
 *
 * Material table behind this wrapper so feature code only depends on Nafura
 * types, templates and design tokens.
 */
@Component({
  selector: 'nf-tree-table',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    SpinnerComponent,
    EmptyStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="nf-tree-table" [class.nf-tree-table--loading]="loading()">
      @if (loading()) {
        <div class="nf-tree-table__loading" aria-live="polite">
          <nf-spinner size="md" />
        </div>
      }

      @if (!loading() && nodes().length === 0) {
        <nf-empty-state
          icon="account_tree"
          [title]="emptyMessage() | translate" />
      } @else {
        <div
          class="nf-tree-table__scroll"
          [style.max-height]="scrollHeight()"
          [class.nf-tree-table__scroll--constrained]="scrollHeight()">
          <table
            mat-table
            [dataSource]="flatRows()"
            [style.min-width]="minWidth()"
            class="nf-tree-table__engine"
            multiTemplateDataRows>
            @for (column of columns(); track column.key) {
              <ng-container [matColumnDef]="column.key">
                <th
                  mat-header-cell
                  *matHeaderCellDef
                  [style.width]="column.width"
                  [style.right]="stickyEndOffset(column)"
                  [class]="column.cssClass ?? ''"
                  [class.nf-tree-table__cell--center]="column.align === 'center'"
                  [class.nf-tree-table__cell--end]="column.align === 'end'"
                  [class.nf-tree-table__cell--sticky-end]="!!column.stickyEnd">
                  {{ column.label | translate }}
                </th>
                <td
                  mat-cell
                  *matCellDef="let row"
                  [style.width]="column.width"
                  [style.right]="stickyEndOffset(column)"
                  [class]="column.cssClass ?? ''"
                  [class.nf-tree-table__cell--center]="column.align === 'center'"
                  [class.nf-tree-table__cell--end]="column.align === 'end'"
                  [class.nf-tree-table__cell--sticky-end]="!!column.stickyEnd">
                  @if (column.key === treeColumnKey()) {
                    <span class="nf-tree-table__tree-cell" [style.padding-inline-start.px]="row.depth * 18">
                      <button
                        type="button"
                        class="nf-tree-table__toggler"
                        [class.nf-tree-table__toggler--leaf]="!row.expandable"
                        [attr.aria-expanded]="row.expandable ? row.expanded : null"
                        [attr.aria-label]="row.expanded ? 'Collapse' : 'Expand'"
                        [disabled]="!row.expandable"
                        (click)="onToggle($event, row)">
                        @if (row.expandable) {
                          <mat-icon>{{ row.expanded ? 'expand_more' : 'chevron_right' }}</mat-icon>
                        }
                      </button>
                      @if (cellTemplate(); as template) {
                        <ng-container
                          *ngTemplateOutlet="template; context: {
                            $implicit: row.data,
                            column: column,
                            node: row.node
                          }" />
                      } @else {
                        {{ cellValue(row.data, column) }}
                      }
                    </span>
                  } @else if (cellTemplate(); as template) {
                    <ng-container
                      *ngTemplateOutlet="template; context: {
                        $implicit: row.data,
                        column: column,
                        node: row.node
                      }" />
                  } @else {
                    {{ cellValue(row.data, column) }}
                  }
                </td>
              </ng-container>
            }

            <ng-container matColumnDef="expandedDetail">
              <td
                mat-cell
                *matCellDef="let row"
                [attr.colspan]="columns().length">
                @if (detailTemplate(); as template) {
                  <ng-container
                    *ngTemplateOutlet="template; context: {
                      $implicit: row.data,
                      node: row.node,
                      colspan: columns().length
                    }" />
                }
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns(); sticky: true"></tr>
            <tr
              mat-row
              *matRowDef="let row; columns: displayedColumns()"
              [ngClass]="resolveRowClass(row.data)"
              [attr.title]="resolveRowTitle(row.data)"
              [class.nf-tree-table__row--clickable]="rowClickable()"
              (click)="onRowClicked(row.data)"
              (dblclick)="rowDblClick.emit(row.data)"></tr>
            <tr
              mat-row
              *matRowDef="let row; columns: ['expandedDetail']; when: isDetailRow"
              class="nf-tree-table__detail-row"></tr>
          </table>
          @if (footerTemplate()) {
            <div class="nf-tree-table__footer">
              <ng-container *ngTemplateOutlet="footerTemplate()!" />
            </div>
          }
        </div>
      }
    </section>
  `,
  styles: [`
    :host { display: block; min-width: 0; }
    .nf-tree-table {
      position: relative;
      min-width: 0;
      color: var(--nf-color-text-primary);
    }
    .nf-tree-table--loading { min-height: 12rem; }
    .nf-tree-table__loading {
      position: absolute;
      inset: 0;
      z-index: 2;
      display: grid;
      place-items: center;
      background: color-mix(in srgb, var(--nf-color-surface) 78%, transparent);
    }
    .nf-tree-table__scroll {
      width: 100%;
      overflow: auto;
      border: 1px solid var(--nf-color-border);
      border-radius: .75rem;
    }
    .nf-tree-table__scroll--constrained {
      overscroll-behavior: contain;
      overflow-x: auto;
      overflow-y: auto;
      box-sizing: border-box;
    }
    .nf-tree-table__scroll--constrained[style*='100%'] {
      height: 100%;
    }
    .nf-tree-table__engine {
      width: 100%;
    }
    .nf-tree-table__tree-cell {
      display: inline-flex;
      align-items: center;
      min-width: 0;
      gap: .15rem;
    }
    .nf-tree-table__toggler {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: 0 0 28px;
      width: 28px;
      height: 28px;
      padding: 0;
      border: 0;
      background: transparent;
      color: var(--nf-color-text-secondary);
      cursor: pointer;
      border-radius: 4px;
    }
    .nf-tree-table__toggler--leaf {
      visibility: hidden;
      pointer-events: none;
    }
    .nf-tree-table__toggler:focus-visible {
      outline: 2px solid var(--nf-border-focus);
      outline-offset: 2px;
    }
    .nf-tree-table__toggler mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    .nf-tree-table__row--clickable { cursor: pointer; }
    .nf-tree-table__cell--center { text-align: center; }
    .nf-tree-table__cell--end {
      text-align: end;
      font-variant-numeric: tabular-nums;
    }
    .nf-tree-table__cell--sticky-end {
      position: sticky;
      z-index: 2;
      background: var(--nf-color-surface, #fff);
      box-shadow: -6px 0 8px -6px color-mix(in srgb, #000 18%, transparent);
    }
    :host ::ng-deep .nf-tree-table__engine .mat-mdc-header-row .mat-mdc-header-cell {
      position: sticky;
      top: 0;
      z-index: 4;
      background: var(--nf-color-surface, #fff);
    }
    :host ::ng-deep .nf-tree-table__engine .mat-mdc-header-cell.nf-tree-table__cell--sticky-end {
      z-index: 5;
    }
    .nf-tree-table__detail-row > td {
      padding-top: 0;
      background: var(--nf-color-surface);
    }
    .nf-tree-table__footer {
      position: sticky;
      bottom: 0;
      background: var(--nf-color-bg-subtle);
      border-top: 2px solid var(--nf-color-border);
    }
  `],
})
export class TreeTableComponent<T = unknown> {
  readonly cellTemplate =
    contentChild<TemplateRef<NfTreeTableCellContext<T>>>('cell');
  readonly detailTemplate =
    contentChild<TemplateRef<NfTreeTableDetailContext<T>>>('detail');
  readonly footerTemplate = contentChild<TemplateRef<unknown>>('footer');

  readonly nodes = input<NfTreeNode<T>[]>([]);
  readonly columns = input.required<NfTreeTableColumn<T>[]>();
  readonly treeColumnKey = input.required<string>();
  readonly loading = input(false);
  readonly emptyMessage = input('shared.dataTable.empty.title');
  readonly minWidth = input('48rem');
  readonly scrollHeight = input<string | null>(null);
  readonly rowClickable = input(false);
  readonly expandedKeys = input<ReadonlySet<string> | null>(null);
  readonly rowClass = input<((data: T) => RowClassValue) | null>(null);
  readonly rowTitle = input<((data: T) => string | null) | null>(null);
  readonly showDetail = input<((data: T) => boolean) | null>(null);

  readonly expandedKeysChange = output<Set<string>>();
  readonly rowClick = output<T>();
  readonly rowDblClick = output<T>();

  /** Expand state when the parent does not bind `expandedKeys`. */
  private readonly unboundExpanded = signal<Set<string> | null>(null);

  readonly displayedColumns = computed(() => this.columns().map((column) => column.key));

  readonly effectiveExpandedKeys = computed(() => this.expandedKeys() ?? this.unboundExpanded());

  readonly flatRows = computed(() =>
    flattenVisible(this.nodes(), this.effectiveExpandedKeys()),
  );

  /** Offsets `right` cumulés pour les colonnes stickyEnd (de la droite vers la gauche). */
  readonly stickyEndOffsets = computed(() => {
    const cols = this.columns();
    const map = new Map<string, string>();
    let acc = 0;
    for (let i = cols.length - 1; i >= 0; i--) {
      const col = cols[i];
      if (!col.stickyEnd) continue;
      map.set(col.key, `${acc}px`);
      acc += this.parseWidthPx(col.width) || 72;
    }
    return map;
  });

  readonly isDetailRow = (_index: number, row: NfTreeFlatRow<T>): boolean =>
    !!this.detailTemplate() && this.shouldShowDetail(row.data);

  stickyEndOffset(column: NfTreeTableColumn<T>): string | null {
    if (!column.stickyEnd) return null;
    return this.stickyEndOffsets().get(column.key) ?? '0px';
  }

  cellValue(data: T, column: NfTreeTableColumn<T>): unknown {
    if (column.value) return column.value(data);
    if (!column.field) return '';
    return column.field.split('.').reduce<unknown>((value, segment) => {
      if (value == null || typeof value !== 'object') return undefined;
      return (value as Record<string, unknown>)[segment];
    }, data);
  }

  resolveRowClass(data: T): RowClassValue {
    return this.rowClass()?.(data) ?? '';
  }

  resolveRowTitle(data: T): string | null {
    return this.rowTitle()?.(data) ?? null;
  }

  shouldShowDetail(data: T): boolean {
    return this.showDetail()?.(data) ?? false;
  }

  onRowClicked(data: T): void {
    if (this.rowClickable()) this.rowClick.emit(data);
  }

  onToggle(event: Event, row: NfTreeFlatRow<T>): void {
    event.stopPropagation();
    if (!row.expandable) return;
    this.updateExpandedKey(row.key, !row.expanded);
  }

  private parseWidthPx(width: string | undefined): number {
    if (!width) return 0;
    const rem = width.match(/^([\d.]+)rem$/);
    if (rem) return Math.round(parseFloat(rem[1]) * 16);
    const px = width.match(/^([\d.]+)px$/);
    if (px) return Math.round(parseFloat(px[1]));
    return 0;
  }

  private updateExpandedKey(key: string, expanded: boolean): void {
    const current = this.effectiveExpandedKeys() ?? collectExpandedKeys(this.nodes());
    const next = new Set(current);
    if (expanded) next.add(key);
    else next.delete(key);
    if (this.expandedKeys()) {
      this.expandedKeysChange.emit(next);
    } else {
      this.unboundExpanded.set(next);
      this.expandedKeysChange.emit(next);
    }
  }
}

function isExpandable<T>(node: NfTreeNode<T>): boolean {
  return !node.leaf && (node.children?.length ?? 0) > 0;
}

function flattenVisible<T>(
  nodes: NfTreeNode<T>[],
  expandedKeys: ReadonlySet<string> | null,
  depth = 0,
): NfTreeFlatRow<T>[] {
  const rows: NfTreeFlatRow<T>[] = [];
  for (const node of nodes) {
    const expandable = isExpandable(node);
    const expanded = expandable && (expandedKeys ? expandedKeys.has(node.key) : !!node.expanded);
    rows.push({
      key: node.key,
      data: node.data,
      node,
      depth,
      expandable,
      expanded,
    });
    if (expanded && node.children?.length) {
      rows.push(...flattenVisible(node.children, expandedKeys, depth + 1));
    }
  }
  return rows;
}

function collectExpandedKeys<T>(nodes: NfTreeNode<T>[]): Set<string> {
  const keys = new Set<string>();
  const visit = (items: NfTreeNode<T>[]) => {
    for (const node of items) {
      if (node.expanded) keys.add(node.key);
      if (node.children) visit(node.children);
    }
  };
  visit(nodes);
  return keys;
}
