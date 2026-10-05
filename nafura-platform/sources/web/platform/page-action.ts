import type { ButtonVariant } from '../lib/anatomy/components/atoms/button';
import type { FormFieldConfig } from '../lib/anatomy/types';

export type Row = Record<string, unknown>;

/**
 * What a toolbar action can do, shared by a list (`ListingAction`) and a record (`RecordAction`).
 * A list or a record never copies this contract.
 */
export interface PageAction<T = Row> {
  id: string;
  label: string;
  icon?: string;
  variant?: ButtonVariant;
  /** Hidden unless the user holds it. */
  permission?: string;
  /** Offered only when true. */
  when?: (item: T) => boolean;
  /** Navigate (no request). */
  route?: string | ((item: T) => string);
  confirm?: { title: string; message: string; confirmLabel?: string; danger?: boolean };
  form?: PageForm<T>;
  request?: PageRequest;
  /** After the request: a secret of the response shown once (API key, signing secret). */
  reveal?: { field: string; title: string; message: string };
  /** Toast after success. */
  success?: string;
  /** The request answered but reports a failure (e.g. a webhook test): toast `failure` instead. */
  failed?: (response: Row) => boolean;
  failure?: string;
}

export interface PageForm<T = Row> {
  title: string;
  fields: FormFieldConfig[];
  /** Initial values: from the selected row (edit), or defaults when creating (`item` undefined). */
  values?: (item?: T) => Record<string, unknown>;
  /** Form values → request body (default: the values). */
  body?: (values: Record<string, unknown>, item?: T) => unknown;
}

export interface PageRequest {
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** Default: the listing endpoint, plus `/{id}` for row actions. `{id}` is the selected row id. */
  url?: string;
}

/** A tree view loads every row. Otherwise the server pages, unless `paging: 'client'`. */
export function effectivePaging(config: { paging?: 'server' | 'client' }, view?: { layout?: string }): 'server' | 'client' {
  if (view?.layout === 'tree') return 'client';
  return config.paging ?? 'server';
}
