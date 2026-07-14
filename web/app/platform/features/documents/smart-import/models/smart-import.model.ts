import type { JsonSchemaRoot } from '../../doc-extractor/models/json-schema.model';
import type { UiSchema } from '../../doc-extractor/models/ui-schema.model';
import type { FieldIssue } from '../../doc-extractor/models/extraction.model';
import type { SmartImportError } from './smart-import.errors';

export type SmartImportPhase =
  | 'IDLE'
  | 'PREFLIGHT'
  | 'EXTRACTING'
  | 'REVIEWING'
  | 'IMPORTING'
  | 'COMPLETED'
  | 'FAILED';

export type SmartImportRowStatus =
  | 'READY'
  | 'NEEDS_REVIEW'
  | 'IGNORED'
  | 'DUPLICATE'
  | 'IMPORTED'
  | 'FAILED';

export type SmartImportWriteMode = 'REVIEW_BEFORE_WRITE' | 'VALID_IMMEDIATELY';
export type SmartImportPolicy = 'PARTIAL' | 'STRICT';

export interface SmartImportConfig {
  writeMode: SmartImportWriteMode;
  importPolicy: SmartImportPolicy;
  acceptedExtensions: string[];
  acceptedMimeTypes: string[];
  maxFileSizeBytes: number;
  concurrency: number;
}

export const DEFAULT_SMART_IMPORT_CONFIG: SmartImportConfig = {
  writeMode: 'REVIEW_BEFORE_WRITE',
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
  concurrency: 3,
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

export interface ImportHandler<TCreate = unknown> {
  entityKey: string;
  dataSchema: JsonSchemaRoot;
  presentationSchema: UiSchema;
  instructions?: string;
  /** Display name used in help / toast contexts. */
  schemaName?: string;
  schemaDescription?: string;
  arrayPath: string;
  config?: Partial<SmartImportConfig>;
  mapRowToPayload(row: Record<string, unknown>): TCreate;
  create(payload: TCreate): Promise<unknown>;
  dedupeKey(row: Record<string, unknown>): string | null;
  loadExistingKeys?(): Promise<Set<string>>;
  validateRow?(row: Record<string, unknown>, rowIndex: number): FieldIssue[];
  formatRowLabel?(row: Record<string, unknown>, rowIndex: number): string;
}

export interface SmartImportRow {
  sourceIndex: number;
  data: Record<string, unknown>;
  originalData: Record<string, unknown>;
  label: string;
  status: SmartImportRowStatus;
  issues: FieldIssue[];
  error?: SmartImportError;
  corrected: boolean;
}

export interface SmartImportSession {
  entityKey: string;
  schema: SmartImportSchemaView;
  arrayPath: string;
  config: SmartImportConfig;
  rows: SmartImportRow[];
  existingKeys: Set<string>;
  phase: SmartImportPhase;
}

export interface SmartImportResult {
  imported: number;
  corrected: number;
  skippedDuplicates: number;
  skippedInvalid: number;
  skippedByUser: number;
  failed: number;
  rows: SmartImportRow[];
}

export interface SmartImportProgress {
  phase: SmartImportPhase;
  processedRows?: number;
  totalRows?: number;
}

export function emptySmartImportResult(rows: SmartImportRow[] = []): SmartImportResult {
  return {
    imported: 0,
    corrected: 0,
    skippedDuplicates: 0,
    skippedInvalid: 0,
    skippedByUser: 0,
    failed: 0,
    rows,
  };
}

export function schemaViewFromHandler(handler: ImportHandler<unknown>): SmartImportSchemaView {
  return {
    name: handler.schemaName ?? handler.entityKey,
    description: handler.schemaDescription,
    jsonSchema: handler.dataSchema,
    uiSchema: handler.presentationSchema,
    instructions: handler.instructions,
  };
}
