import { InjectionToken, type Signal, type Type } from '@angular/core';

import type { RecordFilter } from './listing-properties';

/** Aggregate request: keys map to `sum` / `avg` / `count` property lists (same as `/aggregate`). */
export type ListingAggregateSpec = Partial<Record<'sum' | 'avg' | 'count', string[]>>;

/**
 * What a listing `header` component receives from `nf-listing-page`.
 * Shown between the toolbar and the rows, for every view.
 */
export interface ListingHeaderContext {
  /** Effective filter: list + view + quick filters + free filters. */
  readonly filter: Signal<RecordFilter | null>;
  readonly q: Signal<string>;
  /**
   * Calls `GET {endpoint}/aggregate` with the current filter.
   * `extra` is ANDed on top (e.g. overdue within the filtered set).
   */
  aggregate(spec: ListingAggregateSpec, extra?: RecordFilter | null): Promise<Record<string, Record<string, number>>>;
}

export const LISTING_HEADER = new InjectionToken<ListingHeaderContext>('LISTING_HEADER');

/** Lazy loader of a declared screen component (`placement: "listing-header"`). */
export type ListingHeaderLoader = () => Promise<Type<unknown>>;
