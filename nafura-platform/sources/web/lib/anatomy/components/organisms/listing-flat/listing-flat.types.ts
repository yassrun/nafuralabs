import type { ColumnConfig, FilterFieldConfig, ListingPreset, ListingSegment } from '../../../types';
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
  /** Offered only when true for every selected row (e.g. Revoke only on active keys). */
  when?: (item: any) => boolean;
  /** Offered only when true for the whole selection. */
  visibleFor?: (selection: any[]) => boolean;
  /** Shown but disabled when true for the whole selection. */
  disabledFor?: (selection: any[]) => boolean;
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
  /** Row click: `select` toggles the row (default), `open` only emits `rowClick` (master–detail). */
  rowClick?: 'select' | 'open';
}

/** Shown instead of the table when the list has no row at all (no search, no filter). */
export interface ListingEmptyState {
  icon?: string;
  title: string;
  message?: string;
  /** Button label; the button emits `actionClick(actionId)`. */
  actionLabel?: string;
  actionId?: string;
}

export interface ListingFlatConfig {
  columns: ColumnConfig[];
  /** Column keys visible by default (all when omitted); the others stay in the columns menu. */
  defaultVisibleColumns?: string[];
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
   * `advanced` (default): Notion builder with operators and AND/OR groups.
   * `simple`: one value per field — for backends that only take `field=value`.
   */
  filterMode?: 'advanced' | 'simple';
  /** Quick views as tabs above the table (first one active unless `defaultSegment`). */
  segments?: ListingSegment[];
  defaultSegment?: string;
  /** Ready-made filters shown as pills next to the pinned filters; the active ids are in `query.presets`. */
  presets?: ListingPreset[];
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
  emptyState?: ListingEmptyState;
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
  selection: 'single',
  selectionToggle: false,
  selectionToggleDefaultActive: true,
  pagination: true,
};
