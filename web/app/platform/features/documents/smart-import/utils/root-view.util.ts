import type { JsonSchemaObject, JsonSchemaRoot } from '../../doc-extractor/models/json-schema.model';
import type { UiRootView, UiSchema, UiTreeConfig } from '../../doc-extractor/models/ui-schema.model';

function primaryType(schema: { type?: unknown } | null | undefined): string | null {
  if (!schema) return null;
  const t = schema.type;
  return Array.isArray(t) ? (t.find((x) => x !== 'null') as string) ?? null : (t as string) ?? null;
}

function itemObjectSchema(
  root: JsonSchemaRoot | Record<string, unknown>,
  arrayPath: string,
): JsonSchemaObject | null {
  const properties = (root as JsonSchemaRoot).properties ?? {};
  const arraySchema = properties[arrayPath] as { items?: JsonSchemaObject } | undefined;
  const items = arraySchema?.items;
  if (!items || primaryType(items) !== 'object') return null;
  return items;
}

function hasNestedArrays(itemSchema: JsonSchemaObject | null): boolean {
  if (!itemSchema?.properties) return false;
  return Object.values(itemSchema.properties).some((prop) => primaryType(prop) === 'array');
}

/**
 * Resolve Smart Import review layout from presentationSchema, with auto-detect fallback.
 */
export function resolveRootView(
  uiSchema: UiSchema,
  jsonSchema: JsonSchemaRoot,
  arrayPath: string,
): UiRootView {
  if (uiSchema.rootView) return uiSchema.rootView;

  const hasSections = (uiSchema.sections?.length ?? 0) > 0;
  const itemSchema = itemObjectSchema(jsonSchema, arrayPath);
  if (hasNestedArrays(itemSchema)) return 'TREE_TABLE';
  if (hasSections && (uiSchema.arrays?.length ?? 0) > 0) return 'RECORD_TABLE';
  if (arrayPath) return 'DATA_TABLE';
  return 'RECORD_TABLE';
}

export function resolveTreeConfig(
  uiSchema: UiSchema,
  arrayPath: string,
): UiTreeConfig {
  if (uiSchema.tree) return uiSchema.tree;
  const columns =
    uiSchema.arrays?.find((a) => a.path === arrayPath)?.columns ??
    uiSchema.arrays?.[0]?.columns ??
    [
      { path: 'code', label: 'Code', widthPx: 120 },
      { path: 'designation', label: 'Désignation' },
    ];
  return {
    path: arrayPath,
    childrenPaths: ['sousLots', 'postes', 'children', 'items'],
    columns,
  };
}
