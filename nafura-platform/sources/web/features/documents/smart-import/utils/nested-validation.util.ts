import type { FieldIssue, FieldIssueKind } from '../../doc-extractor/models/extraction.model';
import type { JsonSchema, JsonSchemaObject } from '../../doc-extractor/models/json-schema.model';

function primaryType(schema: JsonSchema | null | undefined): string | null {
  if (!schema) return null;
  const t = schema.type;
  return Array.isArray(t) ? (t.find((x) => x !== 'null') as string) ?? null : (t as string) ?? null;
}

function isMissing(value: unknown): boolean {
  return value == null || (typeof value === 'string' && !value.trim());
}

/**
 * Deep JSON-schema validation mirroring backend SchemaValidator paths
 * (e.g. lots[0].sousLots[1].postes[2].code).
 */
export function validateObjectDeep(
  data: Record<string, unknown> | null | undefined,
  schema: JsonSchemaObject,
  pathPrefix: string,
  rowIndex: number | null,
): FieldIssue[] {
  const issues: FieldIssue[] = [];
  validateNode(data, schema, pathPrefix, rowIndex, issues);
  return issues;
}

function validateNode(
  data: unknown,
  schema: JsonSchema,
  path: string,
  rowIndex: number | null,
  issues: FieldIssue[],
): void {
  const type = primaryType(schema);
  if (type === 'object') {
    validateObject(data, schema as JsonSchemaObject, path, rowIndex, issues);
    return;
  }
  if (type === 'array') {
    validateArray(data, schema, path, issues);
  }
}

function validateObject(
  data: unknown,
  schema: JsonSchemaObject,
  path: string,
  rowIndex: number | null,
  issues: FieldIssue[],
): void {
  const required = Array.isArray(schema.required) ? schema.required : [];
  const properties = schema.properties ?? {};
  const obj =
    data && typeof data === 'object' && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : null;

  for (const fieldName of required) {
    const fieldPath = path ? `${path}.${fieldName}` : fieldName;
    const value = obj?.[fieldName];
    if (isMissing(value)) {
      issues.push(issue(fieldPath, rowIndex, 'MISSING_REQUIRED', `Required field missing: ${fieldPath}`));
      continue;
    }
    const fieldSchema = properties[fieldName];
    if (fieldSchema) {
      validateValue(value, fieldSchema, fieldPath, rowIndex, issues);
    }
  }

  if (!obj) return;
  for (const [fieldName, fieldSchema] of Object.entries(properties)) {
    if (required.includes(fieldName)) continue;
    const value = obj[fieldName];
    if (isMissing(value)) continue;
    const fieldPath = path ? `${path}.${fieldName}` : fieldName;
    validateValue(value, fieldSchema, fieldPath, rowIndex, issues);
  }
}

function validateArray(
  data: unknown,
  schema: JsonSchema,
  path: string,
  issues: FieldIssue[],
): void {
  if (data == null) return;
  if (!Array.isArray(data)) {
    issues.push(issue(path, null, 'TYPE_MISMATCH', `Expected array at ${path}`));
    return;
  }
  const itemSchema = (schema as { items?: JsonSchema }).items;
  if (!itemSchema) return;
  data.forEach((item, index) => {
    const itemPath = `${path}[${index}]`;
    validateNode(item, itemSchema, itemPath, index, issues);
  });
}

function validateValue(
  value: unknown,
  schema: JsonSchema,
  path: string,
  rowIndex: number | null,
  issues: FieldIssue[],
): void {
  const type = primaryType(schema);
  if (type === 'object') {
    validateObject(value, schema as JsonSchemaObject, path, rowIndex, issues);
    return;
  }
  if (type === 'array') {
    validateArray(value, schema, path, issues);
    return;
  }
  if (!matchesType(value, schema)) {
    issues.push(issue(path, rowIndex, 'TYPE_MISMATCH', `Invalid type at ${path}`));
    return;
  }
  if (
    (schema as { format?: string }).format === 'date' &&
    typeof value === 'string' &&
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    issues.push(issue(path, rowIndex, 'FORMAT_INVALID', `Invalid date for ${path}`));
  }
}

function matchesType(value: unknown, schema: JsonSchema): boolean {
  if (value == null) return true;
  const raw = schema.type;
  const types = Array.isArray(raw) ? raw : [raw];
  return types.some((type) => {
    if (type === 'null') return value === null;
    if (type === 'string') return typeof value === 'string';
    if (type === 'number' || type === 'integer') {
      return typeof value === 'number' && Number.isFinite(value);
    }
    if (type === 'boolean') return typeof value === 'boolean';
    if (type === 'array') return Array.isArray(value);
    if (type === 'object') return typeof value === 'object' && !Array.isArray(value);
    return true;
  });
}

function issue(
  path: string,
  rowIndex: number | null,
  kind: FieldIssueKind,
  message: string,
): FieldIssue {
  return {
    path,
    rowIndex,
    kind,
    message,
    nature: kind === 'MISSING_REQUIRED' ? 'SOURCE_GAP' : 'EXTRACTION',
  };
}

/**
 * Keep issues that belong to a top-level array element at `arrayPath[index]`.
 */
export function issuesForRootIndex(
  issues: FieldIssue[],
  arrayPath: string,
  rootIndex: number,
): FieldIssue[] {
  const prefix = `${arrayPath}[${rootIndex}]`;
  return issues.filter((issueItem) => {
    const p = issueItem.path ?? '';
    if (p === prefix || p.startsWith(prefix + '.') || p.startsWith(prefix + '[')) {
      return true;
    }
    // Legacy: relative paths without array prefix (flat validation)
    if (!p.includes('[') && issueItem.rowIndex === rootIndex) {
      return true;
    }
    return false;
  });
}

/** Strip `arrayPath[i].` prefix so relative field paths can be shown on a row. */
export function toRelativeIssuePath(path: string, arrayPath: string, rootIndex: number): string {
  const prefix = `${arrayPath}[${rootIndex}].`;
  if (path.startsWith(prefix)) return path.slice(prefix.length);
  if (path === `${arrayPath}[${rootIndex}]`) return '';
  return path;
}
