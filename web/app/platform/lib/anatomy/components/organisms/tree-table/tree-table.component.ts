import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  contentChild,
  input,
  output,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TreeTableModule } from 'primeng/treetable';

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

/**
 * Generic hierarchical data table.
 *
 * PrimeNG is deliberately kept behind this wrapper so feature code only
 * depends on Nafura types, templates and design tokens.
 */
@Component({
  selector: 'nf-tree-table',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    TreeTableModule,
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
          <p-treetable
            styleClass="nf-tree-table__engine"
            [value]="$any(engineNodes())"
            [columns]="$any(columns())"
            [tableStyle]="{ 'min-width': minWidth() }"
            (onNodeExpand)="onNodeExpanded($event)"
            (onNodeCollapse)="onNodeCollapsed($event)">
            <ng-template #header let-columns>
              <tr>
                @for (column of columns; track column.key) {
                  <th
                    [style.width]="column.width"
                    [class]="column.cssClass ?? ''"
                    [class.nf-tree-table__cell--center]="column.align === 'center'"
                    [class.nf-tree-table__cell--end]="column.align === 'end'">
                    {{ column.label | translate }}
                  </th>
                }
              </tr>
            </ng-template>

            <ng-template #body let-rowNode let-rowData="rowData" let-columns="columns">
              <tr
                [ttRow]="rowNode"
                [ngClass]="resolveRowClass(rowData)"
                [attr.title]="resolveRowTitle(rowData)"
                [class.nf-tree-table__row--clickable]="rowClickable()"
                (click)="onRowClicked(rowData)"
                (dblclick)="rowDblClick.emit(rowData)">
                @for (column of columns; track column.key) {
                  <td
                    [style.width]="column.width"
                    [class]="column.cssClass ?? ''"
                    [class.nf-tree-table__cell--center]="column.align === 'center'"
                    [class.nf-tree-table__cell--end]="column.align === 'end'">
                    @if (column.key === treeColumnKey()) {
                      <p-treetable-toggler [rowNode]="rowNode" />
                    }
                    @if (cellTemplate(); as template) {
                      <ng-container
                        *ngTemplateOutlet="template; context: {
                          $implicit: rowData,
                          column: column,
                          node: rowNode.node
                        }" />
                    } @else {
                      {{ cellValue(rowData, column) }}
                    }
                  </td>
                }
              </tr>
              @if (detailTemplate() && shouldShowDetail(rowData)) {
                <tr class="nf-tree-table__detail-row">
                  <td [attr.colspan]="columns.length">
                    <ng-container
                      *ngTemplateOutlet="detailTemplate()!; context: {
                        $implicit: rowData,
                        node: rowNode.node,
                        colspan: columns.length
                      }" />
                  </td>
                </tr>
              }
            </ng-template>
          </p-treetable>
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
    .nf-tree-table__scroll--constrained { overscroll-behavior: contain; }
    .nf-tree-table__row--clickable { cursor: pointer; }
    .nf-tree-table__cell--center { text-align: center; }
    .nf-tree-table__cell--end {
      text-align: end;
      font-variant-numeric: tabular-nums;
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

  readonly engineNodes = computed(() =>
    this.applyExpandedKeys(this.nodes(), this.expandedKeys()),
  );

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

  onNodeExpanded(event: { node?: { key?: string } }): void {
    this.updateExpandedKey(event.node?.key, true);
  }

  onNodeCollapsed(event: { node?: { key?: string } }): void {
    this.updateExpandedKey(event.node?.key, false);
  }

  private updateExpandedKey(key: string | undefined, expanded: boolean): void {
    if (!key) return;
    const next = new Set(this.expandedKeys() ?? this.collectExpandedKeys(this.engineNodes()));
    if (expanded) next.add(key);
    else next.delete(key);
    this.expandedKeysChange.emit(next);
  }

  private applyExpandedKeys(
    nodes: NfTreeNode<T>[],
    expandedKeys: ReadonlySet<string> | null,
  ): NfTreeNode<T>[] {
    if (!expandedKeys) return nodes;
    return nodes.map((node) => ({
      ...node,
      expanded: expandedKeys.has(node.key),
      children: node.children
        ? this.applyExpandedKeys(node.children, expandedKeys)
        : undefined,
    }));
  }

  private collectExpandedKeys(nodes: NfTreeNode<T>[]): Set<string> {
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
}
