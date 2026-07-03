/**
 * Minimal JSON Schema (draft-07-ish) model for our dynamic form generator.
 *
 * We intentionally keep this small and focused on what we support:
 * - primitives: string/number/integer/boolean
 * - string format: date
 * - enum
 * - nested objects up to depth 2
 * - arrays of objects (line items)
 */

export type JsonSchemaType =
  | 'object'
  | 'array'
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'null';

export interface JsonSchemaBase {
  type?: JsonSchemaType | JsonSchemaType[];
  title?: string;
  description?: string;
  default?: unknown;
  enum?: unknown[];
  format?: string; // e.g. 'date'
  readOnly?: boolean;
}

export interface JsonSchemaObject extends JsonSchemaBase {
  type: 'object';
  properties?: Record<string, JsonSchema>;
  required?: string[];
  additionalProperties?: boolean | JsonSchema;
}

export interface JsonSchemaArray extends JsonSchemaBase {
  type: 'array';
  items?: JsonSchema;
  minItems?: number;
  maxItems?: number;
}

export interface JsonSchemaString extends JsonSchemaBase {
  type: 'string';
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

export interface JsonSchemaNumber extends JsonSchemaBase {
  type: 'number' | 'integer';
  minimum?: number;
  maximum?: number;
}

export interface JsonSchemaBoolean extends JsonSchemaBase {
  type: 'boolean';
}

export type JsonSchema =
  | JsonSchemaObject
  | JsonSchemaArray
  | JsonSchemaString
  | JsonSchemaNumber
  | JsonSchemaBoolean
  | JsonSchemaBase;

export interface JsonSchemaRoot extends JsonSchemaObject {
  $schema?: string;
  $id?: string;
}

