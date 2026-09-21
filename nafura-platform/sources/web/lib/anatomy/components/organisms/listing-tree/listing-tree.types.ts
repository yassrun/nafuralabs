import type { FilterFieldConfig } from '../../../types';
import type { ListingActionItem } from '../../molecules/listing-actions';
import type { SelectionAction } from '../../molecules/selection-bar';
import type { NfTreeNode, NfTreeTableColumn } from '../tree-table';

export interface ListingTreeFeatures {
  search: boolean;
  /**
   * Column/type filters — deferred. Default off; search is the only tree query for now.
   */
  filters: boolean;
  /** Column visibility (single header row). */
  columnToggle: boolean;
  /** Expand / collapse / add-node / add-child / delete in the view toolbar. */
  treeActions: boolean;
  /** Left toggle: checkbox column + bulk delete. */
  bulkSelect: boolean;
}

export interface ListingTreeAction {
  id: string;
  selectedId: string | null;
  /** Set when `id` is `delete-many` (root keys only). */
  selectedIds?: string[];
}

/** Selected row at emit time — listing-tree owns selection, so labels can be functions. */
export interface ListingTreeActionContext<T = unknown> {
  selected: T | null;
}

export type ListingTreeLabel<T = unknown> =
  | string
  | ((ctx: ListingTreeActionContext<T>) => string);

/**
 * Built-in chrome copy. Contextual ones (`addNode`, `addChild`, `delete`)
 * may depend on the selected row — e.g. « Ajouter un article ».
 */
export interface ListingTreeActionLabels<T = unknown> {
  expandAll?: string;
  collapseAll?: string;
  bulkSelect?: string;
  cancelSelect?: string;
  addNode?: ListingTreeLabel<T>;
  addChild?: ListingTreeLabel<T>;
  delete?: ListingTreeLabel<T>;
  deleteConfirmTitle?: string;
  deleteConfirmMessage?: ListingTreeLabel<T>;
  deleteConfirmLabel?: string;
  deleteConfirmCancelLabel?: string;
  deleteManyConfirmMessage?: (count: number) => string;
}

export interface ListingTreeConfig<T = unknown> {
  columns: NfTreeTableColumn<T>[];
  treeColumnKey: string;
  /** Deferred — tree query is search-only for now. */
  filters?: FilterFieldConfig[];
  features?: Partial<ListingTreeFeatures>;
  emptyMessage?: string;
  searchFields?: string[];
  /**
   * First non-empty tree: expand every branch (`all`, default) or leave collapsed (`none`).
   * Later node reloads retain the current expanded keys.
   */
  initialExpand?: 'all' | 'none';
  /**
   * Global read-only: hides mutate actions (right) and bulk select.
   * Search, fold and column visibility stay available.
   */
  readonly?: boolean;
  /**
   * Type-level rule: may this node receive children?
   * Default: `node.allowsChildren !== false`.
   * Example: `(n) => n.data.type !== 'ARTICLE'`.
   */
  allowsChildren?: (node: NfTreeNode<T>) => boolean;
  /**
   * Extra toolbar actions, or same-id overrides of built-ins
   * (`add-node`, `add-child`, `delete`).
   * `{ id: 'add-node', label: 'Ajouter un article' }` relabels the built-in.
   * `{ id: 'add-node', visible: false }` hides it.
   */
  actions?: ListingActionItem[];
  /** Bulk selection bar. Default: delete. */
  selectionActions?: SelectionAction[];
  /** i18n / contextual labels for built-ins. Overlay `actions` still wins on same id. */
  actionLabels?: ListingTreeActionLabels<T>;
}

export const DEFAULT_LISTING_TREE_FEATURES: ListingTreeFeatures = {
  search: true,
  filters: false,
  columnToggle: true,
  treeActions: true,
  bulkSelect: true,
};

export const DEFAULT_LISTING_TREE_LABELS = {
  expandAll: 'Tout déplier',
  collapseAll: 'Tout replier',
  bulkSelect: 'Sélection multiple',
  cancelSelect: 'Annuler la sélection',
  addNode: 'Ajouter un nœud',
  addChild: 'Ajouter un enfant',
  delete: 'Supprimer',
  deleteConfirmTitle: 'Confirmer la suppression',
  deleteConfirmMessage:
    'Supprimer ce nœud et ses enfants ? Cette action est irréversible.',
  deleteConfirmLabel: 'Supprimer',
  deleteConfirmCancelLabel: 'Annuler',
} as const;

export function resolveTreeLabel<T>(
  value: ListingTreeLabel<T> | undefined,
  fallback: string,
  ctx: ListingTreeActionContext<T>
): string {
  if (value == null) return fallback;
  return typeof value === 'function' ? value(ctx) : value;
}
