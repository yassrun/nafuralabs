/**
 * nf-listing-tree — presentation for a hierarchical collection.
 * Same chrome as nf-listing-flat: compact search + xs actions on one toolbar, card view.
 * Navigate to a node with {@link ListingTreeComponent.reveal} / `[revealKey]`.
 * Built-in actions (`add-node`, `add-child`, `delete`) are overridable via `config.actions` / `actionLabels`.
 */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
  TemplateRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import {
  TreeTableComponent,
  expandAncestorKeys,
  findTreeNode,
  nodeAllowsChildren,
  selectedRootKeys,
  type NfTreeNode,
  type NfTreeTableCellContext,
  type NfTreeTableColumn,
} from '../tree-table';
import { ButtonComponent } from '../../atoms/button';
import {
  ListingControlsComponent,
  type ListingControlsColumn,
} from '../../molecules/listing-controls';
import {
  ListingActionsComponent,
  type ListingActionItem,
} from '../../molecules/listing-actions';
import { type SelectionAction } from '../../molecules/selection-bar';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import {
  collectExpandableKeys,
  filterTreeNodes,
  matchesSearch,
} from '../listing-flat/listing-query.util';
import {
  DEFAULT_LISTING_TREE_FEATURES,
  DEFAULT_LISTING_TREE_LABELS,
  resolveTreeLabel,
  type ListingTreeAction,
  type ListingTreeActionContext,
  type ListingTreeConfig,
} from './listing-tree.types';

@Component({
  selector: 'nf-listing-tree',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    ListingControlsComponent,
    ListingActionsComponent,
    ButtonComponent,
    TreeTableComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="nf-listing-tree">
      @if (showToolbar()) {
        <div class="nf-listing-tree__actions-row">
          <div class="nf-listing-tree__actions-left">
            @if (canBulkSelect()) {
              <nf-button
                variant="secondary"
                size="xs"
                iconLibrary="lucide"
                [icon]="bulkSelectMode() ? 'x' : 'list-checks'"
                [active]="bulkSelectMode()"
                [tooltip]="bulkSelectMode() ? labels().cancelSelect : labels().bulkSelect"
                [attr.aria-label]="bulkSelectMode() ? labels().cancelSelect : labels().bulkSelect"
                (clicked)="toggleBulkSelect()"
              />
              @if (bulkSelectMode() && selectedKeys().size > 0) {
                <span class="nf-listing-tree__selcount">
                  {{ selectedKeys().size }} {{ 'selected' | translate }}
                </span>
              }
            }
            @if (features().treeActions) {
              <nf-button
                variant="secondary"
                size="xs"
                iconLibrary="lucide"
                [icon]="expandedKeys().size > 0 ? 'chevrons-up' : 'chevrons-down'"
                [tooltip]="expandedKeys().size > 0 ? labels().collapseAll : labels().expandAll"
                [attr.aria-label]="expandedKeys().size > 0 ? labels().collapseAll : labels().expandAll"
                (clicked)="onTreeAction(expandedKeys().size > 0 ? 'collapse-all' : 'expand-all')"
              />
            }
            @if (features().columnToggle) {
              <nf-listing-controls
                size="xs"
                [columns]="controlColumns()"
                [hiddenColumnsCount]="hiddenCount()"
                [showColumnsButton]="true"
                [showSearch]="false"
                [showFilterButton]="false"
                (columnsChange)="onColumnsChange($event)"
              />
            }
            @if (features().search) {
              <nf-listing-controls
                size="xs"
                [columns]="controlColumns()"
                [hiddenColumnsCount]="hiddenCount()"
                [showColumnsButton]="false"
                [search]="search()"
                [showSearch]="true"
                [showFilterButton]="false"
                [showFilterReset]="false"
                (searchChange)="search.set($event)"
              />
            }
          </div>
          <div class="nf-listing-tree__actions-right">
            @if (!isReadonly()) {
              <ng-content select="[nfListingTreeActions]" />
            }
            @if (!isReadonly() && bulkSelectMode()) {
              <nf-listing-actions
                size="xs"
                [selectionActions]="bulkListingActions()"
                [requireDeleteConfirm]="false"
                (actionClick)="onBulkToolbarAction($event)"
              />
            } @else if (showRightActions()) {
              <nf-listing-actions
                mode="tree"
                size="xs"
                [showFoldActions]="false"
                [showMutateActions]="features().treeActions && !isReadonly()"
                [actions]="extraActions()"
                [selectedId]="selectedId()"
                [canAddChild]="selectedAllowsChildren()"
                [addNodeLabel]="labels().addNode"
                [addChildLabel]="labels().addChild"
                [deleteLabel]="labels().delete"
                [deleteConfirmTitle]="labels().deleteConfirmTitle"
                [deleteConfirmMessage]="labels().deleteConfirmMessage"
                [deleteConfirmLabel]="labels().deleteConfirmLabel"
                [deleteConfirmCancelLabel]="labels().deleteConfirmCancelLabel"
                (actionClick)="onTreeAction($event)"
              />
            }
          </div>
        </div>
      }

      <div
        class="nf-listing-tree__view"
        [class.nf-listing-tree__view--fill]="fillView()"
      >
        <nf-tree-table
          [nodes]="filteredNodes()"
          [columns]="visibleColumns()"
          [treeColumnKey]="config().treeColumnKey"
          [loading]="loading()"
          [rowClickable]="rowClickable() || bulkSelectMode()"
          [activeKey]="bulkSelectMode() ? null : (selectedKey() ?? selectedId())"
          [selectable]="canBulkSelect() && bulkSelectMode() ? 'multiple' : false"
          [selectedKeys]="selectedKeys()"
          [expandedKeys]="expandedKeys()"
          [isSelectable]="isSelectable()"
          [rowClass]="rowClass()"
          [rowTitle]="rowTitle()"
          [minWidth]="minWidth()"
          [scrollHeight]="fillView() ? null : scrollHeight()"
          [emptyMessage]="config().emptyMessage ?? 'No items'"
          (expandedKeysChange)="expandedKeys.set($event)"
          (selectedKeysChange)="selectedKeys.set($event)"
          (rowClick)="onRowClick($event)"
          (rowDblClick)="rowDblClick.emit($event)"
        >
          @if (cellTemplate(); as tpl) {
            <ng-template #cell let-row let-column="column" let-node="node">
              <ng-container
                *ngTemplateOutlet="tpl; context: { $implicit: row, column: column, node: node }"
              />
            </ng-template>
          }
        </nf-tree-table>
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
      .nf-listing-tree__actions-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: nowrap;
        gap: 8px;
        flex: 0 0 auto;
      }
      .nf-listing-tree__actions-left {
        display: flex;
        align-items: center;
        flex-wrap: nowrap;
        gap: 4px;
        min-height: 26px;
        min-width: 0;
        flex: 1 1 auto;
      }
      .nf-listing-tree__actions-left ::ng-deep .nf-listing-controls {
        gap: 4px;
        flex-wrap: nowrap;
      }
      .nf-listing-tree__actions-left ::ng-deep .nf-listing-controls__search {
        flex: 0 1 200px;
      }
      .nf-listing-tree__selcount {
        display: inline-flex;
        align-items: center;
        height: 26px;
        padding: 0 10px;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 500;
        white-space: nowrap;
        color: var(--nf-primary, #2563eb);
        border: 1px solid var(--nf-primary-200, #bfdbfe);
        background: var(--nf-primary-light, #eff6ff);
      }
      .nf-listing-tree__actions-right {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: flex-end;
        flex: 1 1 auto;
        gap: 4px;
        margin-left: auto;
      }
      .nf-listing-tree__view {
        flex: 1 1 auto;
        min-height: 0;
        overflow: auto;
        border: 1px solid var(--nf-border-default, #e5e7eb);
        border-radius: var(--nf-radius-md, 8px);
        background: var(--nf-surface-section, #fff);
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
      }
      .nf-listing-tree__view--fill {
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      .nf-listing-tree__view--fill ::ng-deep nf-tree-table {
        display: flex;
        flex-direction: column;
        flex: 1 1 auto;
        min-height: 0;
        height: 100%;
      }
      .nf-listing-tree__view--fill ::ng-deep .nf-tree-table {
        display: flex;
        flex-direction: column;
        flex: 1 1 auto;
        min-height: 0;
        height: 100%;
        overflow: hidden;
      }
      .nf-listing-tree__view--fill ::ng-deep .nf-tree-table__scroll {
        flex: 1 1 auto;
        min-height: 0;
        height: auto;
        max-height: none;
        overflow: auto;
      }
      .nf-listing-tree__view ::ng-deep .nf-tree-table__scroll {
        border: 0;
        border-radius: 0;
      }
    `,
  ],
})
export class ListingTreeComponent<T = unknown> {
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly config = input.required<ListingTreeConfig<T>>();
  readonly nodes = input<NfTreeNode<T>[]>([]);
  readonly loading = input<boolean>(false);
  /** Bind to jump to a node (same as {@link reveal}). Re-set to retry. */
  readonly revealKey = input<string | null>(null);
  /** Screen-level lock; also `config.readonly`. Hides mutate + bulk select. */
  readonly readonly = input(false);
  /** Parent-owned current row (e.g. open poste). Falls back to click selection. */
  readonly selectedKey = input<string | null>(null);
  readonly rowClickable = input(true);
  readonly rowClass =
    input<((data: T) => string | string[] | Set<string> | Record<string, boolean>) | null>(
      null,
    );
  readonly rowTitle = input<((data: T) => string | null) | null>(null);
  readonly isSelectable = input<((data: T) => boolean) | null>(null);
  readonly minWidth = input('48rem');
  readonly scrollHeight = input<string | null>(null);

  readonly rowClick = output<T>();
  readonly rowDblClick = output<T>();
  readonly action = output<ListingTreeAction>();
  readonly revealed = output<T>();

  readonly cellTemplate =
    contentChild<TemplateRef<NfTreeTableCellContext<T>>>('cell');
  private readonly table = viewChild(TreeTableComponent);

  readonly search = signal('');
  readonly selectedId = signal<string | null>(null);
  readonly selectedKeys = signal<Set<string>>(new Set());
  readonly bulkSelectMode = signal(false);
  readonly expandedKeys = signal<ReadonlySet<string>>(new Set());
  readonly controlColumns = signal<ListingControlsColumn[]>([]);
  private expandedPrimed = false;

  constructor() {
    effect(() => {
      const cols = this.config().columns.filter((c) => !!c.label?.trim());
      const next = cols.map((c) => ({
        key: c.key,
        label: c.label,
        visible: true,
      }));
      untracked(() => {
        const prev = this.controlColumns();
        if (
          prev.length === next.length &&
          prev.every((p, i) => p.key === next[i].key && p.label === next[i].label)
        ) {
          return;
        }
        this.controlColumns.set(next);
      });
    });
    effect(() => {
      const nodes = this.nodes();
      untracked(() => this.retainExpandedKeys(nodes));
    });
    effect(() => {
      const nodes = this.nodes();
      if (this.expandedPrimed || nodes.length === 0) return;
      this.expandedPrimed = true;
      if (this.config().initialExpand === 'none') return;
      this.expandedKeys.set(collectExpandableKeys(nodes));
    });
    effect(() => {
      const key = this.revealKey();
      const ready = this.nodes().length > 0;
      if (!key || !ready) return;
      untracked(() => this.reveal(key));
    });
    effect(() => {
      if (!this.isReadonly()) return;
      untracked(() => {
        if (this.bulkSelectMode()) this.exitBulkSelect();
      });
    });
  }

  readonly features = computed(() => ({
    ...DEFAULT_LISTING_TREE_FEATURES,
    ...this.config().features,
  }));

  readonly isReadonly = computed(
    () => this.readonly() || this.config().readonly === true
  );

  readonly canBulkSelect = computed(
    () => this.features().bulkSelect && !this.isReadonly()
  );

  readonly extraActions = computed(() =>
    (this.config().actions ?? []).filter((a) => a.visible !== false)
  );

  readonly fillView = computed(
    () => this.scrollHeight() === '100%' || this.scrollHeight() === '100vh'
  );

  readonly showRightActions = computed(
    () =>
      this.extraActions().length > 0 ||
      (!this.isReadonly() && (this.features().treeActions || this.extraActions().length > 0))
  );

  readonly showToolbar = computed(
    () =>
      this.features().search ||
      this.features().treeActions ||
      this.features().bulkSelect ||
      this.features().columnToggle ||
      this.extraActions().length > 0
  );

  readonly actionCtx = computed((): ListingTreeActionContext<T> => ({
    selected: findTreeNode(this.nodes(), this.selectedId())?.data ?? null,
  }));

  readonly labels = computed(() => {
    const a = this.config().actionLabels;
    const ctx = this.actionCtx();
    const d = DEFAULT_LISTING_TREE_LABELS;
    return {
      expandAll: a?.expandAll ?? d.expandAll,
      collapseAll: a?.collapseAll ?? d.collapseAll,
      bulkSelect: a?.bulkSelect ?? d.bulkSelect,
      cancelSelect: a?.cancelSelect ?? d.cancelSelect,
      addNode: resolveTreeLabel(a?.addNode, d.addNode, ctx),
      addChild: resolveTreeLabel(a?.addChild, d.addChild, ctx),
      delete: resolveTreeLabel(a?.delete, d.delete, ctx),
      deleteConfirmTitle: a?.deleteConfirmTitle ?? d.deleteConfirmTitle,
      deleteConfirmMessage: resolveTreeLabel(
        a?.deleteConfirmMessage,
        d.deleteConfirmMessage,
        ctx
      ),
      deleteConfirmLabel: a?.deleteConfirmLabel ?? d.deleteConfirmLabel,
      deleteConfirmCancelLabel:
        a?.deleteConfirmCancelLabel ?? d.deleteConfirmCancelLabel,
    };
  });

  readonly selectedAllowsChildren = computed(() => {
    const node = findTreeNode(this.nodes(), this.selectedId());
    return nodeAllowsChildren(node, this.config().allowsChildren);
  });

  readonly hiddenCount = computed(
    () => this.controlColumns().filter((c) => !c.visible).length
  );

  readonly bulkActions = computed((): SelectionAction[] => {
    const custom = this.config().selectionActions;
    if (custom) return custom;
    return [
      {
        id: 'delete',
        label: this.labels().delete,
        icon: 'trash-2',
        variant: 'danger',
      },
    ];
  });

  readonly bulkListingActions = computed((): ListingActionItem[] => {
    const empty = this.selectedKeys().size === 0;
    return this.bulkActions().map((a) => ({
      id: a.id,
      label: a.label,
      icon: a.icon,
      variant: a.variant,
      disabled: a.disabled || empty,
    }));
  });

  readonly bulkDeleteConfirmMessage = computed(() => {
    const ids = this.bulkRootIds();
    const many = this.config().actionLabels?.deleteManyConfirmMessage;
    if (many) return many(ids.length || 1);
    if (ids.length <= 1) return this.labels().deleteConfirmMessage;
    return `Supprimer ${ids.length} éléments et leurs enfants ? Cette action est irréversible.`;
  });

  readonly visibleColumns = computed((): NfTreeTableColumn<T>[] => {
    const toggleable = new Set(this.controlColumns().map((c) => c.key));
    const visible = new Set(
      this.controlColumns()
        .filter((c) => c.visible)
        .map((c) => c.key)
    );
    const cols = this.config().columns.filter(
      (c) => !toggleable.has(c.key) || visible.has(c.key)
    );
    const treeKey = this.config().treeColumnKey;
    if (cols.some((c) => c.key === treeKey)) return cols;
    const treeCol = this.config().columns.find((c) => c.key === treeKey);
    return treeCol ? [treeCol, ...cols] : cols;
  });

  readonly filteredNodes = computed(() => {
    const searchFields = this.config().searchFields;
    const q = this.search();
    if (!q.trim()) return this.nodes();
    return filterTreeNodes(this.nodes(), (data) => matchesSearch(data, q, searchFields));
  });

  onColumnsChange(cols: ListingControlsColumn[]): void {
    this.controlColumns.set(cols);
  }

  /**
   * Navigate to a node: isolate its branch (collapse every other path),
   * expand ancestors, select, scroll.
   * `key` is `node.key` or `data.id`.
   */
  reveal(key: string | null | undefined): boolean {
    if (!key) return false;
    const node = findTreeNode(this.nodes(), key);
    if (!node) return false;
    if (!findTreeNode(this.filteredNodes(), node.key)) {
      this.search.set('');
    }
    this.selectedId.set(this.rowId(node.data) ?? node.key);
    this.expandedKeys.set(expandAncestorKeys(this.nodes(), node.key));
    const scroll = () => this.table()?.scrollToKey(node.key);
    scroll();
    queueMicrotask(scroll);
    this.revealed.emit(node.data);
    return true;
  }

  /**
   * Replace the expanded set (e.g. métier “voir les incomplets”).
   */
  setExpandedKeys(keys: ReadonlySet<string>): void {
    this.expandedKeys.set(new Set(keys));
  }

  onRowClick(row: T): void {
    const id = this.rowId(row);
    if (this.bulkSelectMode()) {
      if (!id) return;
      const pred = this.isSelectable();
      if (pred && !pred(row)) return;
      const next = new Set(this.selectedKeys());
      if (next.has(id)) next.delete(id);
      else next.add(id);
      this.selectedKeys.set(next);
      return;
    }
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
    if (id === 'toggle-select') {
      this.toggleBulkSelect();
      return;
    }
    if (this.isReadonly()) return;
    if (id === 'add-child' && !this.selectedAllowsChildren()) {
      return;
    }
    this.action.emit({ id, selectedId: this.selectedId() });
  }

  toggleBulkSelect(): void {
    if (this.isReadonly()) return;
    if (this.bulkSelectMode()) {
      this.exitBulkSelect();
      return;
    }
    this.bulkSelectMode.set(true);
  }

  exitBulkSelect(): void {
    this.bulkSelectMode.set(false);
    this.selectedKeys.set(new Set());
  }

  async onBulkToolbarAction(id: string): Promise<void> {
    if (this.isReadonly()) return;
    const ids = this.bulkRootIds();
    if (!ids.length) return;
    if (id === 'delete') {
      const ok = await this.confirmDialog.confirm({
        title: this.labels().deleteConfirmTitle,
        message: this.bulkDeleteConfirmMessage(),
        confirmLabel: this.labels().deleteConfirmLabel,
        cancelLabel: this.labels().deleteConfirmCancelLabel,
        variant: 'danger',
        icon: 'delete',
      });
      if (!ok) return;
      this.action.emit({
        id: 'delete-many',
        selectedId: this.selectedId(),
        selectedIds: ids,
      });
      this.exitBulkSelect();
      return;
    }
    this.action.emit({
      id,
      selectedId: this.selectedId(),
      selectedIds: ids,
    });
  }

  private bulkRootIds(): string[] {
    const selected = this.selectedKeys();
    if (!selected.size) return [];
    const ids = selectedRootKeys(this.nodes(), selected);
    return ids.length ? ids : [...selected];
  }

  private retainExpandedKeys(nodes: NfTreeNode<T>[]): void {
    const prev = this.expandedKeys();
    if (!prev.size) return;
    const valid = collectExpandableKeys(nodes);
    let dropped = false;
    const next = new Set<string>();
    for (const k of prev) {
      if (valid.has(k)) next.add(k);
      else dropped = true;
    }
    if (dropped) this.expandedKeys.set(next);
  }

  private rowId(row: T): string | null {
    if (row == null || typeof row !== 'object') return null;
    const rec = row as Record<string, unknown>;
    const id = rec['key'] ?? rec['id'];
    return id == null ? null : String(id);
  }
}
