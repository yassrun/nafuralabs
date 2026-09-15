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
  export: boolean;
  selection: ListingFlatSelection;
  /** Toolbar button that switches the table to multi-selection on demand. */
  selectionToggle: boolean;
  /** When the selection toggle is shown, whether it starts in multi-select mode. */
  selectionToggleDefaultActive?: boolean;
  pagination: boolean;
}

export interface ListingFlatConfig {
  columns: ColumnConfig[];
  /**
   * Toolbar layout.
   * - `chips` (default, proposal A): row 1 = filter chips + « + Filtre » + search,
   *   row 2 = table controls + actions.
   * - `split` (proposal C): row 1 = search + chips + « + Filtre » + table controls
   *   (everything that changes the view), row 2 = actions only (selection pill on
   *   the left). On mobile the actions row becomes a sticky bottom bar.
   */
  toolbarLayout?: 'chips' | 'split';
  filters?: FilterFieldConfig[];
  /**
   * Filters applied at init (demo / saved view).
   * @deprecated Prefer `query.filters` on the listing query input.
   */
  initialFilters?: Record<string, unknown>;
  /** Enables saved-views overflow when `resourceKey` is set on the component. */
  savedViews?: boolean;
  features?: Partial<ListingFlatFeatures>;
  pageSize?: number;
  pageSizeOptions?: number[];
  emptyMessage?: string;
  /** Fields used by the search box. Defaults to all column fields. */
  searchFields?: string[];
  /** Export filename (without .csv). Defaults to 'export'. */
  exportFilename?: string;
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
  export: false,
  selection: 'none',
  selectionToggle: false,
  selectionToggleDefaultActive: true,
  pagination: true,
};
