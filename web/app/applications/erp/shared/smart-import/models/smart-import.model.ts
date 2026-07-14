import type { ExtractionValidation, FieldIssue } from '@platform/features/documents/doc-extractor/models/extraction.model';
import type {
  ImportHandler,
  SmartImportSchemaView,
} from '@platform/features/documents/smart-import/models/smart-import.model';

export type { ImportHandler, SmartImportSchemaView };

export interface SmartImportResult {
  imported: number;
  skippedDuplicates: number;
  skippedInvalid: number;
  corrected: number;
  failed: number;
}

export interface SmartImportCompletionDialogData {
  schema: SmartImportSchemaView;
  arrayPath: string;
  rows: Array<{ rowIndex: number; row: Record<string, unknown>; issues: FieldIssue[] }>;
}

export interface SmartImportCompletionDialogResult {
  rows: Record<string, unknown>[];
}

export interface RowValidationResult {
  valid: boolean;
  issues: FieldIssue[];
}

export function isExtractionFailed(status: string | undefined): boolean {
  return status === 'FAILED' || status === 'REJECTED';
}

export function isExtractionSuccess(status: string | undefined): boolean {
  return status === 'COMPLETED' || status === 'SUCCESS';
}

export function rowsWithIssues(validation: ExtractionValidation | undefined): Set<number> {
  const indexes = new Set<number>();
  for (const issue of validation?.issues ?? []) {
    if (issue.rowIndex != null) {
      indexes.add(issue.rowIndex);
    }
  }
  return indexes;
}

export function issuesForRow(validation: ExtractionValidation | undefined, rowIndex: number): FieldIssue[] {
  return (validation?.issues ?? []).filter((i) => i.rowIndex === rowIndex);
}

export function extractArrayRows(
  data: Record<string, unknown>,
  arrayPath: string,
): Record<string, unknown>[] {
  const raw = data[arrayPath];
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.filter((r): r is Record<string, unknown> => !!r && typeof r === 'object' && !Array.isArray(r));
}

export function validateRowRequired(
  row: Record<string, unknown>,
  requiredFields: string[],
  rowIndex: number,
): RowValidationResult {
  const issues: FieldIssue[] = [];
  for (const field of requiredFields) {
    const value = row[field];
    if (value == null || (typeof value === 'string' && value.trim() === '')) {
      issues.push({
        path: field,
        rowIndex,
        kind: 'MISSING_REQUIRED',
        message: `Required field missing: ${field}`,
      });
    }
  }
  return { valid: issues.length === 0, issues };
}

export function requiredFieldsFromArraySchema(
  schema: SmartImportSchemaView | { jsonSchema: SmartImportSchemaView['jsonSchema'] },
  arrayPath: string,
): string[] {
  const root = schema.jsonSchema as unknown as Record<string, unknown>;
  const properties = root['properties'] as Record<string, unknown> | undefined;
  const arraySchema = properties?.[arrayPath] as Record<string, unknown> | undefined;
  const items = arraySchema?.['items'] as Record<string, unknown> | undefined;
  const required = items?.['required'];
  return Array.isArray(required) ? required.filter((f): f is string => typeof f === 'string') : [];
}
