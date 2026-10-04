import type { ListingEmptyState, ListingFlatFeatures } from '../../lib/anatomy/components/organisms/listing-flat';
import type { ListingTreeActionLabels } from '../../lib/anatomy/components/organisms/listing-tree';
import type { ColumnConfig, FilterFieldConfig, ListingSegment } from '../../lib/anatomy/types';
import type { PageAction, PageForm, PageRequest, Row } from '../page-action';

export type { PageAction, PageForm, PageRequest, Row };

/**
 * A listing screen as configuration: where the rows come from, how they show, what one can do.
 * Labels are i18n keys or text. Rendered by `nf-listing-page` (route data `listing`).
 */
export interface ListingPageConfig<T = Row> {
  title: string;
  subtitle?: string;
  icon?: string;
  /** GET endpoint; the rows are the array, or its `content` (Spring page) or `items`. */
  endpoint: string;
  /** Fixed query parameters of the GET (e.g. the parent of a related list: `{ supplierId }`). */
  query?: Record<string, string>;
  columns: ColumnConfig[];
  filters?: FilterFieldConfig[];
  /** Quick views as tabs above the table (first one active unless `defaultSegment`). */
  segments?: ListingSegment[];
  defaultSegment?: string;
  searchFields?: string[];
  emptyMessage?: string;
  /** Shown instead of the table while the list has no row at all. */
  emptyState?: ListingEmptyState;
  pageSize?: number;
  /**
   * `server` (default) asks the API for the current page, sort, search and equality filters.
   * `client` keeps every loaded row in the browser (small lists). A `tree` is always `client`.
   */
  paging?: 'server' | 'client';
  /**
   * Columns, one per lifecycle state. Exclusive with `tree`.
   * Cards move by firing the transition that reaches the target column.
   */
  board?: {
    /** Only source of columns in v1: the states of `GET {endpoint}/lifecycle`. */
    columns: 'lifecycle';
    /** States without a column (rarely consulted terminals). */
    hide?: string[];
    card: { title: string; subtitle?: string; badge?: string; meta?: string };
    /** Shown first when the list also has a table. Default `board`. */
    defaultView?: 'board' | 'table';
  };
  features?: Partial<ListingFlatFeatures>;
  /** Toolbar actions, and row actions (`row: true`) offered on the selected row. */
  actions?: ListingAction<T>[];
  /** Route opened by a click on a row (its checkbox selects it). */
  open?: (item: T) => string;
  /**
   * Hierarchy: rows nested by `parentField`, rendered by nf-listing-tree. « Ajouter » / « Ajouter un enfant »
   * run the action `create` (with the parent pre-filled), a double click runs `edit`, delete is built in.
   */
  tree?: {
    parentField: string;
    create?: string;
    edit?: string;
    /** Toast after a delete. */
    deleted?: string;
    labels?: ListingTreeActionLabels;
  };
}

/** A list action is a {@link PageAction} that may target the selected row. */
export interface ListingAction<T = Row> extends PageAction<T> {
  /** Acts on the selected row instead of the whole list. */
  row?: boolean;
}

/** @deprecated Use {@link PageForm}. Kept so existing imports stay valid. */
export type ListingForm<T = Row> = PageForm<T>;
/** @deprecated Use {@link PageRequest}. */
export type ListingRequest = PageRequest;
