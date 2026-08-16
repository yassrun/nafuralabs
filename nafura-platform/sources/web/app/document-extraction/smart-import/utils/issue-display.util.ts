import type { FieldIssue } from '../../models/extraction.model';
import type { UiArrayColumn, UiSchema } from '../../models/ui-schema.model';
import type { JsonSchemaObject, JsonSchemaRoot } from '../../models/json-schema.model';

const KIND_LABELS: Record<string, string> = {
  MISSING_REQUIRED: 'Champ obligatoire manquant',
  TYPE_MISMATCH: 'Type invalide',
  FORMAT_INVALID: 'Format invalide',
};

/**
 * Human-readable issue message (never raw JSON paths as primary UX).
 */
export function formatIssueMessage(
  issue: FieldIssue,
  opts?: {
    uiSchema?: UiSchema;
    jsonSchema?: JsonSchemaRoot | JsonSchemaObject;
    columns?: UiArrayColumn[];
  },
): string {
  const leaf = leafField(issue.path);
  const label =
    labelForField(leaf, opts?.uiSchema, opts?.columns) ??
    titleFromSchema(leaf, opts?.jsonSchema) ??
    humanizeLeaf(leaf);

  const kind = KIND_LABELS[issue.kind] ?? issue.kind;
  if (label) return `${kind} : ${label}`;
  return kind;
}

export function formatIssueList(
  issues: FieldIssue[],
  opts?: {
    uiSchema?: UiSchema;
    jsonSchema?: JsonSchemaRoot | JsonSchemaObject;
    columns?: UiArrayColumn[];
  },
): string[] {
  return issues.map((issue) => formatIssueMessage(issue, opts));
}

function leafField(path: string | null | undefined): string {
  if (!path) return '';
  const cleaned = path.replace(/\[\d+\]/g, '');
  const parts = cleaned.split('.').filter(Boolean);
  return parts[parts.length - 1] ?? '';
}

function labelForField(
  field: string,
  uiSchema?: UiSchema,
  columns?: UiArrayColumn[],
): string | null {
  if (!field) return null;
  for (const col of columns ?? []) {
    if (col.path === field || col.path.endsWith('.' + field)) return col.label;
  }
  for (const array of uiSchema?.arrays ?? []) {
    for (const col of array.columns) {
      if (col.path === field || col.path.endsWith('.' + field)) return col.label;
    }
  }
  for (const col of uiSchema?.tree?.columns ?? []) {
    if (col.path === field || col.path.endsWith('.' + field)) return col.label;
  }
  for (const section of uiSchema?.sections ?? []) {
    for (const f of section.fields) {
      if (f.path === field || f.path.endsWith('.' + field)) return f.label;
    }
  }
  return null;
}

function titleFromSchema(
  field: string,
  schema?: JsonSchemaRoot | JsonSchemaObject,
): string | null {
  if (!field || !schema) return null;
  const direct = schema.properties?.[field];
  if (direct && typeof (direct as { title?: string }).title === 'string') {
    return (direct as { title: string }).title;
  }
  // Search one level of nested object/array item properties
  for (const prop of Object.values(schema.properties ?? {})) {
    const items = (prop as { items?: JsonSchemaObject }).items;
    if (items?.properties?.[field]?.title) {
      return String(items.properties[field].title);
    }
    const nested = (prop as JsonSchemaObject).properties?.[field];
    if (nested && typeof (nested as { title?: string }).title === 'string') {
      return (nested as { title: string }).title;
    }
  }
  return null;
}

function humanizeLeaf(field: string): string {
  if (!field) return '';
  return field
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase());
}
