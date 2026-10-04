import type { FormFieldConfig } from '../../lib/anatomy/types';
import type { PageAction } from '../page-action';
import type { ListingPageConfig, Row } from '../listing/listing-page.types';

/**
 * One business record as configuration: where it is read and saved, how its form is laid out
 * (sections, tabs or steps), its related lists, and its lifecycle. Rendered by `nf-record-page`
 * (route data `record`, route param `id`; `new` creates).
 *
 * Saving is standard: a contextual save bar appears while the record has unsaved changes (Ctrl+S saves);
 * the toolbar carries the business actions (lifecycle transitions, delete).
 */
export interface RecordPageConfig<T extends Row = Row> {
  /** Header title of an existing record. */
  title: (record: T) => string;
  /** Header title while creating. */
  createTitle: string;
  subtitle?: (record: T) => string | undefined;
  icon?: string;
  /** REST resource: GET/PUT/DELETE `{endpoint}/{id}`, POST `{endpoint}`; `/lifecycle` and `/transitions` when `lifecycle`. */
  endpoint: string;
  /** Parent list (breadcrumb, after delete). */
  back: { label: string; route: string };
  /** Route of a record (after creation). */
  route: (id: string) => string;
  layout?: RecordLayout;
  /** Layout while creating (e.g. a 3-step wizard), when it differs from `layout`. */
  createLayout?: RecordLayout;
  /** Options of fields declared with `lookupKey`: `{ suppliers: '/api/v1/demo/suppliers/options' }` (`[{ value, label }]`). */
  lookups?: Record<string, string>;
  /** Without `update`, the record is read-only; without `create`, `new` is refused; `delete` adds the action. */
  permissions: { create?: string; update?: string; delete?: string };
  /** States, transitions and editability come from the backend lifecycle of the record. */
  lifecycle?: boolean;
  /** Values of a new record. */
  defaults?: Partial<T>;
  /**
   * Business actions that are not lifecycle transitions (duplicate, PDF, recalculate).
   * Same contract as a list action, plus where the button sits and what the response is.
   */
  actions?: RecordAction<T>[];
  /**
   * Create the record from a dropped document: the file is extracted, the form opens pre-filled,
   * nothing is stored until the user saves. `endpoint` is a BC extraction (`multipart` field `file`)
   * returning `{ fields: { [source]: { value, confidence? } } }`.
   */
  import?: {
    docType: { domain: string; type: string } | { endpoint: string };
    map: Record<string, string>;
    accept: string[];
    label: string;
    /** Attach the source file to the created record. Default true. */
    attach?: boolean;
  };
  /** Toasts. */
  messages?: { saved?: string; created?: string; deleted?: string; deleteConfirm?: string };
}

/** A record action reuses {@link PageAction}. `{id}` in `request.url` is the record id. */
export interface RecordAction<T = Row> extends PageAction<T> {
  /** Default `toolbar`. `menu` sits in « Plus ». */
  placement?: 'toolbar' | 'menu';
  /** `record` (default) replaces the screen with the response; `download` saves the file; `none` leaves the screen. */
  result?: 'record' | 'download' | 'none';
  /** Disabled while the record has unsaved edits. Default true. */
  requiresSaved?: boolean;
}

export type RecordLayout =
  | { kind: 'sections'; sections: RecordSection[] }
  | { kind: 'tabs'; tabs: RecordTab[] }
  /**
   * Steps: while creating, a wizard (each step validated before the next, « Créer » at the end).
   * With a lifecycle, the step of the current status is open, earlier steps stay reachable, later ones locked.
   */
  | { kind: 'steps'; steps: RecordStep[] };

export interface RecordTab {
  id: string;
  label: string;
  sections: RecordSection[];
}

export interface RecordStep {
  id: string;
  label: string;
  sections: RecordSection[];
  /** Lifecycle states this step covers. */
  states?: string[];
}

export interface RecordSection {
  title?: string;
  description?: string;
  /**
   * `fields` (default) shows `fields`, `listing` a related list, `attachments` the files of the record,
   * `comments` its notes. The entity key sent to the APIs is the lifecycle `entity` when the record has one,
   * otherwise the last segment of `endpoint`.
   */
  kind?: 'fields' | 'attachments' | 'comments';
  /** Accepted MIME types for `attachments` (defaults of the documents capability when omitted). */
  accept?: string[];
  maxSizeMb?: number;
  /** Form fields; two columns unless `columns: 1` (one column in narrow containers). */
  fields?: RecordField[];
  columns?: 1 | 2;
  /** A related list of the saved record (e.g. its contacts). */
  listing?: (record: Row) => ListingPageConfig;
}

/** A form field; `wide` spans the whole row (textarea defaults to wide). */
export type RecordField = FormFieldConfig & { wide?: boolean };
