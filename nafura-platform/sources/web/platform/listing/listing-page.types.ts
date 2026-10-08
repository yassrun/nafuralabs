import type { Type } from '@angular/core';

import type { ListingEmptyState, ListingFlatFeatures } from '../../lib/anatomy/components/organisms/listing-flat';
import type { ListingTreeActionLabels } from '../../lib/anatomy/components/organisms/listing-tree';
import type { PageAction, PageForm, PageRequest, Row } from '../page-action';
import type { ListingHeaderLoader } from './listing-header.context';
import type { RecordFilter } from './listing-properties';

export type { PageAction, PageForm, PageRequest, Row };
export type { RecordFilter };

/**
 * `table`, `board`, `calendar` and `tree` are drawn. `timeline`, `gallery` and `list` are named by the contract and
 * built when a business context needs them: choosing one fails validation.
 */
export type ListingLayout = 'table' | 'board' | 'calendar' | 'tree' | 'timeline' | 'gallery' | 'list';

export type ListingAggregate = 'sum' | 'avg' | 'count';

/**
 * One tab of the list: how its rows are laid out and which ones it keeps. Properties are referenced by key;
 * their type and label come from `GET {endpoint}/properties`.
 */
export interface ListingView {
  id: string;
  label: string;
  layout: ListingLayout;
  /** Fixed filter of the view (the grammar of the API). */
  filter?: RecordFilter;
  /** `[{ neededBy: 'asc' }, { amount: 'desc' }]`: all levels, in priority order (Notion multi-sort). */
  sort?: Array<Record<string, 'asc' | 'desc'>>;
  /** Table: visible properties, in order. */
  show?: string[];
  /** Table: totals of the whole filtered result under the table. */
  footer?: Record<string, ListingAggregate>;
  /** Board: the property giving the columns. `status` moves cards by firing transitions; any other does not move. */
  groupBy?: string;
  /** Board: columns not shown (rarely consulted terminal states). */
  hide?: string[];
  /** Board and calendar: properties on a card — title, subtitle, badge, meta. */
  card?: string[];
  /** Calendar: the date property placing a row on a day. */
  date?: string;
  /** Tree: rows nested by `parentField`; « Ajouter » runs `create` with the parent pre-filled, a double click runs `edit`. */
  tree?: {
    parentField: string;
    create?: string;
    edit?: string;
    /** Toast after a delete. */
    deleted?: string;
    labels?: ListingTreeActionLabels;
  };
  /** Quick filters of the list hidden on this view (`id`, or `property` of a dropdown). */
  hideQuickFilters?: string[];
}

/**
 * A filter offered by the editor: a pill (`id`, `label`, `filter`) the user switches on or off, or a dropdown pinned on
 * a property whose values come from the property (`operator: 'in'` for several). `on`: a property of the relation's
 * target, searched by « contains » (`{ property: 'contacts', on: 'name' }`).
 */
export type ListingQuickFilter =
  | { id: string; label: string; filter: RecordFilter }
  | { property: string; operator?: 'is' | 'in'; on?: string; label?: string };

/**
 * A listing screen as configuration: where the rows come from, the views over them, what one can do.
 * Labels are i18n keys or text. Rendered by `nf-listing-page` (route data `listing`).
 */
export interface ListingPageConfig<T = Row> {
  title: string;
  subtitle?: string;
  icon?: string;
  /** A `RecordController` path: rows, `/properties`, `/aggregate`, `/lifecycle`. */
  endpoint: string;
  /** Fixed filter of the whole list (e.g. a related list inside a record: `{ supplierId: { is: id } }`). */
  filter?: RecordFilter;
  quickFilters?: ListingQuickFilter[];
  /** The tabs; the first is the default. `?view=<id>` in the URL. */
  views: ListingView[];
  emptyMessage?: string;
  /** Shown instead of the table while the list has no row at all. */
  emptyState?: ListingEmptyState;
  pageSize?: number;
  /** `server` (default) asks the API for the page, sort, search and filters. `client` loads every row (small lists). */
  paging?: 'server' | 'client';
  features?: Partial<ListingFlatFeatures>;
  /** Toolbar actions, and row actions (`row: true`) offered on the selected row. */
  actions?: ListingAction<T>[];
  /** Route opened by a click on a row (its checkbox selects it). */
  open?: (item: T) => string;
  /**
   * Declared screen (`placement: "listing-header"`) between the toolbar and the rows.
   * Prefer {@link loadHeader} so the chunk loads on demand.
   */
  header?: Type<unknown>;
  /** Lazy loader of the header screen component. */
  loadHeader?: ListingHeaderLoader;
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
