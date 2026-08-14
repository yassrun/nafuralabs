import type { JsonSchemaRoot } from '../../doc-extractor/models/json-schema.model';
import type { UiSchema } from '../../doc-extractor/models/ui-schema.model';
import type { FieldIssue } from '../../doc-extractor/models/extraction.model';

export type SmartImportPhase =
  | 'IDLE'
  | 'PREFLIGHT'
  | 'EXTRACTING'
  | 'REVIEWING'
  | 'COMPLETED'
  | 'FAILED';

export type SmartImportRowStatus =
  | 'READY'
  | 'NEEDS_REVIEW'
  | 'IGNORED'
  | 'DUPLICATE';

export type SmartImportPolicy = 'PARTIAL' | 'STRICT';

export interface SmartImportConfig {
  importPolicy: SmartImportPolicy;
  acceptedExtensions: string[];
  acceptedMimeTypes: string[];
  maxFileSizeBytes: number;
}

export const DEFAULT_SMART_IMPORT_CONFIG: SmartImportConfig = {
  importPolicy: 'PARTIAL',
  acceptedExtensions: ['.xlsx', '.xls', '.csv', '.pdf'],
  acceptedMimeTypes: [
    'application/pdf',
    'text/csv',
    'application/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  maxFileSizeBytes: 15 * 1024 * 1024,
};

/** Light schema contract for review / help UI (no catalog DocTypeDefinition). */
export interface SmartImportSchemaView {
  name: string;
  description?: string;
  jsonSchema: JsonSchemaRoot;
  uiSchema: UiSchema;
  instructions?: string;
  version?: number;
}

/**
 * Screen-owned extraction contract. It contains presentation and review rules
 * only; persistence and ERP payload mapping deliberately live outside platform.
 *
 * Three extension points (flat import = their defaults):
 * row classes (one `record`) · hierarchy (`NONE`) · product-side business validation.
 */
export interface ExtractionDefinition<TData extends Record<string, unknown> = Record<string, unknown>> {
  key: string;
  name: string;
  description?: string;
  dataSchema: JsonSchemaRoot;
  presentationSchema: UiSchema;
  instructions?: string;
  /**
   * Primary collection. Kept so existing screens need no data migration.
   * Prefer {@link arrayPaths} when several collections exist.
   */
  arrayPath: string;
  /** Collections at the object root. Absent → `[arrayPath]`. */
  arrayPaths?: string[];
  /** Label → field. Declared empty in wave 1, implemented in wave 2. */
  anchors?: ReadingAnchor[];
  /** Default: one class `{ record }`. Bordereau supplies several. */
  rowClasses?: ReadingRowClass[];
  /** Default `NONE`. `LEARNED` means infer parentage — not a output format. */
  hierarchy?: ReadingHierarchy;
  /** Named, unresolved until matrix wave. */
  depivot?: ReadingDepivot;
  config?: Partial<SmartImportConfig>;
  /** Optional key used to flag duplicates inside the reviewed file. */
  dedupeKey?(row: Record<string, unknown>): string | null;
  validateRow?(row: Record<string, unknown>, rowIndex: number): FieldIssue[];
  formatRowLabel?(row: Record<string, unknown>, rowIndex: number): string;
  /** Compile-time marker for the reviewed root JSON type. */
  readonly __dataType?: TData;
}

export type ReadingHierarchy = 'NONE' | 'LEARNED';
export type ReadingDepivot = 'RESERVED';

export interface ReadingAnchor {
  label: string;
  field: string;
}

export interface ReadingRowClass {
  name: string;
  signal: string;
}

export const DEFAULT_ROW_CLASS: ReadingRowClass = { name: 'record', signal: 'default' };

/** Primary collection: `arrayPaths[0]` or legacy `arrayPath`. */
export function primaryArrayPath(definition: ExtractionDefinition): string {
  const paths = resolvedArrayPaths(definition);
  return paths[0] ?? definition.arrayPath;
}

export function resolvedArrayPaths(definition: ExtractionDefinition): string[] {
  if (definition.arrayPaths && definition.arrayPaths.length > 0) {
    return definition.arrayPaths;
  }
  return definition.arrayPath ? [definition.arrayPath] : [];
}

/**
 * Plan-shaped defaults for a definition. Flat import is the degenerate
 * complex case — not a separate branch.
 */
export function readingDefaults(definition: ExtractionDefinition): {
  arrayPaths: string[];
  anchors: ReadingAnchor[];
  rowClasses: ReadingRowClass[];
  hierarchy: ReadingHierarchy;
  depivot: ReadingDepivot;
} {
  return {
    arrayPaths: resolvedArrayPaths(definition),
    anchors: definition.anchors ?? [],
    rowClasses: definition.rowClasses?.length ? definition.rowClasses : [DEFAULT_ROW_CLASS],
    hierarchy: definition.hierarchy ?? 'NONE',
    depivot: definition.depivot ?? 'RESERVED',
  };
}

export interface SmartImportRow {
  sourceIndex: number;
  data: Record<string, unknown>;
  originalData: Record<string, unknown>;
  label: string;
  status: SmartImportRowStatus;
  issues: FieldIssue[];
  corrected: boolean;
}

export interface SmartImportSession {
  definition: ExtractionDefinition;
  schema: SmartImportSchemaView;
  arrayPath: string;
  config: SmartImportConfig;
  rows: SmartImportRow[];
  phase: SmartImportPhase;
  /** Full extraction root object, kept in sync with editable rows. */
  rootData: Record<string, unknown>;
  requestId?: string;
}

export interface ReviewedExtraction<
  TData extends Record<string, unknown> = Record<string, unknown>,
> {
  /** Reviewed root JSON. Its array contains accepted rows only. */
  data: TData;
  acceptedRows: Record<string, unknown>[];
  ignoredRows: Record<string, unknown>[];
  duplicateRows: Record<string, unknown>[];
  corrected: number;
  requestId?: string;
}

export interface SmartImportProgress {
  phase: SmartImportPhase;
  processedRows?: number;
  totalRows?: number;
}

export function schemaViewFromDefinition(
  definition: ExtractionDefinition,
): SmartImportSchemaView {
  return {
    name: definition.name,
    description: definition.description,
    jsonSchema: definition.dataSchema,
    uiSchema: definition.presentationSchema,
    instructions: definition.instructions,
  };
}
