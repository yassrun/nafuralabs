import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  TemplateRef,
  computed,
  contentChild,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';

import { SpinnerComponent } from '../../atoms/spinner';
import { EmptyStateComponent } from '../../molecules/empty-state';

export interface NfTreeNode<T> {
  key: string;
  data: T;
  children?: NfTreeNode<T>[];
  expanded?: boolean;
  /** Display: no expand chevron. Prefer deriving from `children` + `allowsChildren`. */
  leaf?: boolean;
  /**
   * Whether this node **kind** may receive children.
   * Independent of whether children exist today. Default `true`.
   * `false` = terminal node → hide « add child ».
   */
  allowsChildren?: boolean;
}

/** Selected node may receive a child (toolbar « add child »). */
export function nodeAllowsChildren<T>(
  node: NfTreeNode<T> | null | undefined,
  policy?: (node: NfTreeNode<T>) => boolean,
): boolean {
  if (!node) return false;
  if (policy) return policy(node);
  return node.allowsChildren !== false;
}

export function selectedRootKeys<T>(
  nodes: NfTreeNode<T>[],
  selected: ReadonlySet<string>,
): string[] {
  const out: string[] = [];
  const walk = (list: NfTreeNode<T>[], ancestorSelected: boolean) => {
    for (const node of list) {
      const sel = selected.has(node.key);
      if (sel && !ancestorSelected) out.push(node.key);
      if (node.children?.length) walk(node.children, ancestorSelected || sel);
    }
  };
  walk(nodes, false);
  return out;
}

export function findTreeNode<T>(
  nodes: NfTreeNode<T>[],
  key: string | null | undefined,
): NfTreeNode<T> | null {
  if (!key) return null;
  for (const node of nodes) {
    if (nodeMatches(node, key)) return node;
    const found = node.children?.length ? findTreeNode(node.children, key) : null;
    if (found) return found;
  }
  return null;
}

/** Ancestor keys to expand so `targetKey` becomes a visible row. */
export function expandAncestorKeys<T>(
  nodes: NfTreeNode<T>[],
  targetKey: string,
): Set<string> {
  const keys = new Set<string>();
  const walk = (list: NfTreeNode<T>[], trail: string[]): boolean => {
    for (const node of list) {
      if (nodeMatches(node, targetKey)) {
        trail.forEach((k) => keys.add(k));
        return true;
      }
      if (node.children?.length && walk(node.children, [...trail, node.key])) {
        keys.add(node.key);
        return true;
      }
    }
    return false;
  };
  walk(nodes, []);
  return keys;
}

function nodeMatches<T>(node: NfTreeNode<T>, key: string): boolean {
  if (node.key === key) return true;
  if (node.data != null && typeof node.data === 'object' && 'id' in node.data) {
    const id = (node.data as { id: unknown }).id;
    return id != null && String(id) === key;
  }
  return false;
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
    LucideAngularModule,
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
            @if (showSelectionColumn()) {
              <ng-container matColumnDef="select">
                <th
                  mat-header-cell
                  *matHeaderCellDef
                  class="nf-tree-table__cell--select">
                  <input
                    type="checkbox"
                    class="nf-table-checkbox"
                    [checked]="isAllVisibleSelected()"
                    [indeterminate]="isSomeVisibleSelected()"
                    [attr.aria-label]="'Select all'"
                    (change)="toggleAllVisible($any($event.target).checked)"
                    (click)="$event.stopPropagation()"
                  />
                </th>
                <td
                  mat-cell
                  *matCellDef="let row"
                  class="nf-tree-table__cell--select">
                  @if (rowSelectable(row.data)) {
                    <input
                      type="checkbox"
                      class="nf-table-checkbox"
                      [checked]="isSelected(row.key)"
                      [attr.aria-label]="'Select row'"
                      (click)="$event.stopPropagation()"
                      (change)="toggleRow(row.key, $any($event.target).checked)"
                    />
                  }
                </td>
              </ng-container>
            }
            @for (column of columns(); track column.key) {
              <ng-container [matColumnDef]="column.key">
                <th
                  mat-header-cell
                  *matHeaderCellDef
                  [style.width]="column.width"
                  [style.min-width]="column.width"
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
                  [style.min-width]="column.width"
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
                          @if (row.expanded) {
                            <lucide-icon name="chevron-down" [size]="16" aria-hidden="true"></lucide-icon>
                          } @else {
                            <lucide-icon name="chevron-right" [size]="16" aria-hidden="true"></lucide-icon>
                          }
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
                [attr.colspan]="displayedColumns().length">
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
              [attr.data-row-key]="row.key"
              [attr.title]="resolveRowTitle(row.data)"
              [attr.aria-selected]="isHighlighted(row)"
              [class.nf-tree-table__row--clickable]="rowClickable()"
              [class.nf-tree-table__row--selected]="isHighlighted(row)"
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
      min-width: 0;
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
      display: flex;
      align-items: center;
      min-width: 0;
      max-width: 100%;
      width: 100%;
      overflow: hidden;
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
    .nf-tree-table__toggler lucide-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 0;
    }
    .nf-tree-table__cell--select {
      width: 44px !important;
      max-width: 44px !important;
      min-width: 44px !important;
      padding: 0 0 0 16px !important;
      text-align: center;
      vertical-align: middle !important;
    }
    .nf-table-checkbox {
      appearance: none;
      -webkit-appearance: none;
      width: 15px;
      height: 15px;
      margin: 0;
      display: inline-block;
      vertical-align: middle;
      border: 1.5px solid var(--nf-border-default, #d1d5db);
      border-radius: 4px;
      background-color: var(--nf-surface-section, #ffffff);
      cursor: pointer;
      position: relative;
      transition: all 0.12s ease-in-out;
      outline: none;
    }
    .nf-table-checkbox:hover {
      border-color: var(--nf-primary, #2563eb);
    }
    .nf-table-checkbox:checked {
      background-color: var(--nf-primary, #2563eb);
      border-color: var(--nf-primary, #2563eb);
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12.2 4.8L6.5 10.5L3.8 7.8' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
      background-size: 11px 11px;
      background-position: center;
      background-repeat: no-repeat;
    }
    .nf-table-checkbox:indeterminate {
      background-color: var(--nf-primary, #2563eb);
      border-color: var(--nf-primary, #2563eb);
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M4 8H12' stroke='white' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E");
      background-size: 11px 11px;
      background-position: center;
      background-repeat: no-repeat;
    }
    .nf-table-checkbox:focus-visible {
      box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.25);
      border-color: var(--nf-primary, #2563eb);
    }
    .nf-tree-table__row--clickable { cursor: pointer; }
    :host ::ng-deep .nf-tree-table__engine .mat-mdc-row.nf-tree-table__row--selected > .mat-mdc-cell {
      background: var(--nf-primary-light, #eff6ff);
    }
    :host ::ng-deep .nf-tree-table__engine .mat-mdc-row.nf-tree-table__row--selected > .mat-mdc-cell:first-child {
      box-shadow: inset 3px 0 0 var(--nf-primary, #2563eb);
    }
    :host ::ng-deep .nf-tree-table__engine .mat-mdc-row.nf-tree-table__row--selected:hover > .mat-mdc-cell {
      background: #dbeafe;
    }
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
  private readonly host = inject(ElementRef<HTMLElement>);

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
  readonly selectable = input<boolean | 'multiple'>(false);
  readonly selectedKeys = input<ReadonlySet<string>>(new Set());
  /** Current row (click) — independent from checkbox `selectedKeys`. */
  readonly activeKey = input<string | null>(null);
  readonly isSelectable = input<((data: T) => boolean) | null>(null);

  readonly expandedKeysChange = output<Set<string>>();
  readonly selectedKeysChange = output<Set<string>>();
  readonly rowClick = output<T>();
  readonly rowDblClick = output<T>();

  /**
   * Live checkbox set. Parent `[selectedKeys]` is one CD behind, so toggles
   * must not re-read the input or rapid checks overwrite each other.
   */
  private readonly localSelected = linkedSignal(() => new Set(this.selectedKeys()));

  /** Expand state when the parent does not bind `expandedKeys`. */
  private readonly unboundExpanded = signal<Set<string> | null>(null);

  readonly showSelectionColumn = computed(
    () => this.selectable() === true || this.selectable() === 'multiple',
  );

  readonly displayedColumns = computed(() => {
    const cols = this.columns().map((column) => column.key);
    return this.showSelectionColumn() ? ['select', ...cols] : cols;
  });

  readonly visibleSelectableKeys = computed(() =>
    this.flatRows()
      .filter((row) => this.rowSelectable(row.data))
      .map((row) => row.key),
  );

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
    const path = column.field ?? column.key;
    if (!path) return '';
    return path.split('.').reduce<unknown>((value, segment) => {
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

  rowSelectable(data: T): boolean {
    return this.isSelectable()?.(data) ?? true;
  }

  isSelected(key: string): boolean {
    return this.localSelected().has(key);
  }

  isActiveRow(row: NfTreeFlatRow<T>): boolean {
    const active = this.activeKey();
    if (!active) return false;
    if (row.key === active) return true;
    if (row.data && typeof row.data === 'object') {
      const rec = row.data as Record<string, unknown>;
      const id = rec['id'];
      if (id != null && String(id) === active) return true;
    }
    return false;
  }

  isHighlighted(row: NfTreeFlatRow<T>): boolean {
    return this.isSelected(row.key) || this.isActiveRow(row);
  }

  isAllVisibleSelected(): boolean {
    const keys = this.visibleSelectableKeys();
    const selected = this.localSelected();
    return keys.length > 0 && keys.every((key) => selected.has(key));
  }

  isSomeVisibleSelected(): boolean {
    const keys = this.visibleSelectableKeys();
    const selected = this.localSelected();
    const n = keys.filter((key) => selected.has(key)).length;
    return n > 0 && n < keys.length;
  }

  toggleRow(key: string, checked: boolean): void {
    const next = new Set(this.localSelected());
    if (checked) next.add(key);
    else next.delete(key);
    this.localSelected.set(next);
    this.selectedKeysChange.emit(next);
  }

  toggleAllVisible(checked: boolean): void {
    const next = new Set(this.localSelected());
    for (const key of this.visibleSelectableKeys()) {
      if (checked) next.add(key);
      else next.delete(key);
    }
    this.localSelected.set(next);
    this.selectedKeysChange.emit(next);
  }

  onToggle(event: Event, row: NfTreeFlatRow<T>): void {
    event.stopPropagation();
    if (!row.expandable) return;
    this.updateExpandedKey(row.key, !row.expanded);
  }

  /**
   * Navigate to a node: isolate its branch, expand ancestors, scroll into view.
   * `key` is `node.key` (or `data.id` when present).
   */
  reveal(key: string | null | undefined): boolean {
    if (!key) return false;
    const node = findTreeNode(this.nodes(), key);
    if (!node) return false;
    this.setExpandedKeys(expandAncestorKeys(this.nodes(), node.key));
    this.scrollToKey(node.key);
    return true;
  }

  scrollToKey(key: string): void {
    const tryScroll = (): boolean => {
      const el = this.host.nativeElement.querySelector(`[data-row-key="${CSS.escape(key)}"]`);
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return !!el;
    };
    queueMicrotask(() => {
      if (tryScroll()) return;
      setTimeout(tryScroll, 80);
    });
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
    this.setExpandedKeys(next);
  }

  private setExpandedKeys(next: Set<string>): void {
    if (this.expandedKeys()) {
      this.expandedKeysChange.emit(next);
    } else {
      this.unboundExpanded.set(next);
      this.expandedKeysChange.emit(next);
    }
  }
}

function isExpandable<T>(node: NfTreeNode<T>): boolean {
  if (node.allowsChildren === false || node.leaf) return false;
  return (node.children?.length ?? 0) > 0;
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
