/**
 * UI schema contract used by the frontend to render the workspace.
 *
 * Backend owns this structure. We provide safe defaults so the UI can still
 * function even if some optional fields are missing.
 */

export interface UiSchema {
  /**
   * Form sections rendered in the record dialog.
   */
  sections: UiSection[];

  /**
   * Main workspace grid columns.
   * If omitted, the UI will derive a small set of columns from jsonSchema.
   */
  gridColumns?: UiGridColumn[];

  /**
   * Arrays of objects rendered as line-item tables.
   * Each entry points to a JSON path in the root record (e.g. "items").
   */
  arrays?: UiArrayConfig[];
}

export interface UiSection {
  title: string;
  /**
   * Visual column count for the section. Defaults to 2.
   */
  columns?: number;
  fields: UiField[];
}

export interface UiField {
  /**
   * Dotted JSON path relative to the record root (e.g. "sender.name").
   * For nested objects, dot paths are supported up to depth 2 (1–2).
   */
  path: string;

  label: string;

  placeholder?: string;
  hint?: string;
  appearance?: 'fill' | 'outline';
  readonly?: boolean;

  /**
   * Optional grouping hint (e.g. for nested object blocks).
   * Not required for MVP; renderer may ignore.
   */
  group?: string;
}

export interface UiGridColumn {
  /**
   * Dotted JSON path relative to record root.
   */
  path: string;
  label: string;
  widthPx?: number;
}

export interface UiArrayConfig {
  /**
   * Root path to the array in the record JSON (e.g. "lineItems").
   */
  path: string;
  title: string;
  columns: UiArrayColumn[];
}

export interface UiArrayColumn {
  /**
   * Dotted JSON path relative to the array item (e.g. "sku", "qty").
   */
  path: string;
  label: string;
  widthPx?: number;
}

