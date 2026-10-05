import { InjectionToken, type Signal } from '@angular/core';

import type { ListingAction, ListingPageConfig, ListingView, Row } from './listing-page.types';
import type { RecordFilter, RecordProperties } from './listing-properties';

export interface PageBody {
  content?: unknown;
  items?: unknown;
  totalElements?: number;
}

/** Rows of a list response: the array itself, a Spring page (`content`) or `{ items }`. */
export function rowsOf(response: unknown): Row[] {
  if (Array.isArray(response)) return response as Row[];
  const body = (response ?? {}) as PageBody;
  if (Array.isArray(body.content)) return body.content as Row[];
  if (Array.isArray(body.items)) return body.items as Row[];
  return [];
}

export function totalOf(response: unknown): number {
  if (Array.isArray(response)) return response.length;
  const total = (response as PageBody | null)?.totalElements;
  return typeof total === 'number' ? total : rowsOf(response).length;
}

/**
 * What `nf-listing-page` gives the view of its current layout (board, calendar, tree): the configuration, the
 * properties, the filter, and the way to load, open and act. Internal to `platform/listing`.
 */
export interface ListingPageContext {
  readonly config: Signal<ListingPageConfig>;
  readonly view: Signal<ListingView>;
  readonly properties: Signal<RecordProperties>;
  /** Rows loaded by the table and tree layouts. */
  readonly items: Signal<Row[]>;
  readonly loading: Signal<boolean>;
  /** Bumped at each reload of a board or a calendar (0 until the properties are known). */
  readonly loadTick: Signal<number>;
  /** An action offered to the user (permission granted). */
  action(id: string | undefined): ListingAction | undefined;
  /** The list's fixed filter, the view's, the active pills and the user's builder, as one filter of the grammar. */
  filter(): RecordFilter | null;
  /** One page of the list, sorted as the query asks; an error is toasted and gives an empty page. */
  fetchPage(filter: RecordFilter | null, page: number, size?: number): Promise<PageBody>;
  text(key: string | undefined, row: Row): string;
  open(row: Row): void;
  execute(action: ListingAction, item?: Row, defaults?: Row): Promise<void>;
  reload(): Promise<void>;
  url(path: string): string;
  message(error: unknown): string;
}

export const LISTING_PAGE = new InjectionToken<ListingPageContext>('LISTING_PAGE');
