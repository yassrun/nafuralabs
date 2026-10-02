import type { ListingEmptyState, ListingFlatFeatures } from '../../lib/anatomy/components/organisms/listing-flat';
import type { ListingTreeActionLabels } from '../../lib/anatomy/components/organisms/listing-tree';
import type { ColumnConfig, FilterFieldConfig, FormFieldConfig, ListingSegment } from '../../lib/anatomy/types';
import type { ButtonVariant } from '../../lib/anatomy/components/atoms/button';

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

export type Row = Record<string, unknown>;

export interface ListingAction<T = Row> {
  id: string;
  label: string;
  icon?: string;
  variant?: ButtonVariant;
  /** Hidden unless the user holds it. */
  permission?: string;
  /** Acts on the selected row instead of the whole list. */
  row?: boolean;
  /** Row actions: offered only when true for the selected row. */
  when?: (item: T) => boolean;
  /** Navigate (no request). */
  route?: string | ((item: T) => string);
  confirm?: { title: string; message: string; confirmLabel?: string; danger?: boolean };
  form?: ListingForm<T>;
  request?: ListingRequest;
  /** After the request: a secret of the response shown once (API key, signing secret). */
  reveal?: { field: string; title: string; message: string };
  /** Toast after success. */
  success?: string;
  /** The request answered but reports a failure (e.g. a webhook test): toast `failure` instead. */
  failed?: (response: Row) => boolean;
  failure?: string;
}

export interface ListingForm<T = Row> {
  title: string;
  fields: FormFieldConfig[];
  /** Initial values: from the selected row (edit), or defaults when creating (`item` undefined). */
  values?: (item?: T) => Record<string, unknown>;
  /** Form values → request body (default: the values). */
  body?: (values: Record<string, unknown>, item?: T) => unknown;
}

export interface ListingRequest {
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** Default: the listing endpoint, plus `/{id}` for row actions. `{id}` is the selected row id. */
  url?: string;
}
