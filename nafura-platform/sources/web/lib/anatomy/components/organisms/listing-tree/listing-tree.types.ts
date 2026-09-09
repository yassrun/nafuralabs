import type { FilterFieldConfig } from '../../../types';
import type { NfTreeTableColumn } from '../tree-table';

export interface ListingTreeFeatures {
  search: boolean;
  filters: boolean;
  /** Column visibility (single header row). */
  columnToggle: boolean;
  /** Expand / collapse / add-node / add-child / delete in the view toolbar. */
  treeActions: boolean;
}

export interface ListingTreeConfig<T = unknown> {
  columns: NfTreeTableColumn<T>[];
  treeColumnKey: string;
  filters?: FilterFieldConfig[];
  features?: Partial<ListingTreeFeatures>;
  emptyMessage?: string;
  searchFields?: string[];
}

export const DEFAULT_LISTING_TREE_FEATURES: ListingTreeFeatures = {
  search: true,
  filters: true,
  columnToggle: true,
  treeActions: true,
};
