/**
 * UI schema contract used by the frontend to render the workspace / Smart Import review.
 *
 * Backend may echo this structure. We provide safe defaults so the UI can still
 * function even if some optional fields are missing.
 */

export type UiRootView = 'RECORD_TABLE' | 'DATA_TABLE' | 'TREE_TABLE';

export interface UiSchema {
  /**
   * Import policy for smart import: PARTIAL (skip invalid rows) or STRICT.
   */
  importPolicy?: 'PARTIAL' | 'STRICT';

  /**
   * Review layout for Smart Import. When omitted, the UI auto-detects from the data schema.
   */
  rootView?: UiRootView;

  /**
   * Tree layout config (lot → sous-lot → poste). Used when rootView is TREE_TABLE.
   */
  tree?: UiTreeConfig;

  /**
   * Form sections rendered in the record dialog / RECORD_TABLE header.
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

  /**
   * Optional hierarchy description for Magic Import help (e.g. lot → sous-lot → poste).
   */
  hierarchyHint?: UiHierarchyHint[];
}

export interface UiTreeConfig {
  /**
   * Root array path relative to extraction root (usually same as arrayPath).
   */
  path: string;
  /**
   * Child array property names expanded at every object node (display order).
   * Example: ['sousLots', 'postes'].
   */
  childrenPaths: string[];
  /**
   * Shared columns rendered on every tree row.
   */
  columns: UiArrayColumn[];
  /**
   * Optional badge label per array key (root path + each childrenPath).
   */
  levelLabels?: Record<string, string>;
}

export interface UiHierarchyHint {
  level: string;
  label: string;
  fields: string[];
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
