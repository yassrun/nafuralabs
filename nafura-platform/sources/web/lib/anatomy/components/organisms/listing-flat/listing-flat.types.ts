import type { ColumnConfig, FilterFieldConfig } from '../../../types';
import type { ListingActionItem } from '../../molecules/listing-actions';

/** Row selection on the table. */
export type ListingFlatSelection = 'none' | 'single' | 'multiple';

/**
 * Selection-count visibility for a selection action.
 * - `single` — exactly 1 row selected (e.g. Dupliquer)
 * - `bulk` — 2+ rows (true bulk ops)
 * - `single+bulk` — 1+ rows (e.g. Supprimer) — default
 */
export type ListingSelectionScope = 'single' | 'bulk' | 'single+bulk';

export interface ListingSelectionAction extends ListingActionItem {
  /** Visibility by selection count. Default `single+bulk`. */
  scope?: ListingSelectionScope;
  /** Min rows required. bulk: default 2 · single+bulk: default 1 · single: forced 1. */
  minSelection?: number;
  /** Max rows allowed. single: forced 1. */
  maxSelection?: number;
}

export interface ListingFlatFeatures {
  search: boolean;
  filters: boolean;
  columnToggle: boolean;
  selection: ListingFlatSelection;
  /** Toolbar button that switches the table to multi-selection on demand. */
  selectionToggle: boolean;
  pagination: boolean;
}

export interface ListingFlatConfig {
  columns: ColumnConfig[];
  filters?: FilterFieldConfig[];
  /** Filters applied at init (demo / saved view). Re-applied when the value changes. */
  initialFilters?: Record<string, unknown>;
  features?: Partial<ListingFlatFeatures>;
  pageSize?: number;
  pageSizeOptions?: number[];
  emptyMessage?: string;
  /** Fields used by the search box. Defaults to all column fields. */
  searchFields?: string[];
  /** Right-side listing action bar (New, Export, …). */
  actions?: ListingActionItem[];
  /** Actions shown when rows are selected (scope gates by selection count). */
  selectionActions?: ListingSelectionAction[];
  /**
   * Host projects extras into the action bar (e.g. nf-smart-import-action).
   * Keeps the bar visible when `actions` / selection actions are empty.
   */
  projectedActions?: boolean;
}

export const DEFAULT_LISTING_FLAT_FEATURES: ListingFlatFeatures = {
  search: true,
  filters: true,
  columnToggle: true,
  selection: 'none',
  selectionToggle: false,
  pagination: true,
};
