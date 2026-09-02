import type { JsonSchema, JsonSchemaObject } from '../../models/json-schema.model';
import type { NafuraFieldPresence } from '../../models/json-schema.model';

function primaryType(schema: JsonSchema | null | undefined): string | null {
  if (!schema) return null;
  const t = schema.type;
  return Array.isArray(t) ? (t.find((x) => x !== 'null') as string) ?? null : (t as string) ?? null;
}

/** Resolve presence for a property on an object schema. */
export function fieldPresence(
  propertySchema: JsonSchema | undefined,
  fieldName: string,
  required: Set<string>,
): NafuraFieldPresence {
  const explicit = propertySchema?.xNafura?.presence;
  if (explicit) return explicit;
  if (required.has(fieldName)) return 'extract';
  return 'optional';
}

/** Missing values on infer fields must not block row readiness. */
export function shouldBlockImportOnMissing(
  propertySchema: JsonSchema | undefined,
  fieldName: string,
  required: Set<string>,
): boolean {
  return fieldPresence(propertySchema, fieldName, required) === 'extract';
}

export function itemObjectProperties(
  root: JsonSchemaObject,
  arrayPath: string,
): { properties: Record<string, JsonSchema>; required: Set<string> } {
  const arraySchema = root.properties?.[arrayPath] as { items?: JsonSchemaObject } | undefined;
  const items = arraySchema?.items;
  const itemSchema =
    items && primaryType(items) === 'object' ? (items as JsonSchemaObject) : undefined;
  const required = new Set(
    Array.isArray(itemSchema?.required) ? (itemSchema.required as string[]) : [],
  );
  return { properties: itemSchema?.properties ?? {}, required };
}
