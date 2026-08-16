/**
 * DocTypeBuilderEngine - Frontend mirror of the backend engine.
 * 
 * This provides live preview capability by generating schemas client-side.
 * The backend is the source of truth, but this allows instant preview.
 */

import { 
  BuilderState, 
  BuilderField, 
  BuilderSection, 
  BuilderGridColumn, 
  BuilderArrayConfig,
  FieldConstraints
} from '../models/builder-state.model';
import { JsonSchemaRoot, JsonSchemaObject, JsonSchema } from '../models/json-schema.model';
import { UiSchema, UiSection, UiField, UiGridColumn, UiArrayConfig, UiArrayColumn } from '../models/ui-schema.model';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Build JSON Schema from BuilderState.
 */
export function buildDataSchema(state: BuilderState): JsonSchemaRoot {
  const root: JsonSchemaRoot = {
    type: 'object',
    properties: {},
    required: [],
  };

  for (const field of state.fields) {
    const fieldSchema = buildFieldSchema(field);
    root.properties![field.key] = fieldSchema;

    if (field.required) {
      root.required!.push(field.key);
    }
  }

  if (root.required!.length === 0) {
    delete root.required;
  }

  return root;
}

/**
 * Build schema for a single field.
 */
function buildFieldSchema(field: BuilderField): JsonSchema {
  switch (field.type) {
    case 'string':
      return {
        type: 'string',
        title: field.label,
        description: field.description,
        ...(field.constraints?.minLength !== undefined && { minLength: field.constraints.minLength }),
        ...(field.constraints?.maxLength !== undefined && { maxLength: field.constraints.maxLength }),
        ...(field.constraints?.pattern && { pattern: field.constraints.pattern }),
      };

    case 'date':
      return {
        type: 'string',
        format: 'date',
        title: field.label,
      };

    case 'number':
      return {
        type: 'number',
        title: field.label,
        ...(field.constraints?.minimum !== undefined && { minimum: field.constraints.minimum }),
        ...(field.constraints?.maximum !== undefined && { maximum: field.constraints.maximum }),
      };

    case 'integer':
      return {
        type: 'integer',
        title: field.label,
        ...(field.constraints?.minimum !== undefined && { minimum: field.constraints.minimum }),
        ...(field.constraints?.maximum !== undefined && { maximum: field.constraints.maximum }),
      };

    case 'boolean':
      return {
        type: 'boolean',
        title: field.label,
      };

    case 'enum':
      return {
        type: 'string',
        title: field.label,
        enum: field.constraints?.enumValues || [],
      };

    case 'object': {
      const objSchema: JsonSchemaObject = {
        type: 'object',
        title: field.label,
        properties: {},
        required: [],
      };

      for (const nested of field.nestedFields || []) {
        objSchema.properties![nested.key] = buildFieldSchema(nested);
        if (nested.required) {
          objSchema.required!.push(nested.key);
        }
      }

      if (objSchema.required!.length === 0) {
        delete objSchema.required;
      }

      return objSchema;
    }

    case 'array': {
      const itemSchema: JsonSchemaObject = {
        type: 'object',
        properties: {},
        required: [],
      };

      for (const itemField of field.arrayItemFields || []) {
        itemSchema.properties![itemField.key] = buildFieldSchema(itemField);
        if (itemField.required) {
          itemSchema.required!.push(itemField.key);
        }
      }

      if (itemSchema.required!.length === 0) {
        delete itemSchema.required;
      }

      return {
        type: 'array',
        title: field.label,
        items: itemSchema,
        ...(field.constraints?.minItems !== undefined && { minItems: field.constraints.minItems }),
        ...(field.constraints?.maxItems !== undefined && { maxItems: field.constraints.maxItems }),
      };
    }

    default:
      return { type: 'string', title: field.label };
  }
}

/**
 * Build UI Schema from BuilderState.
 */
export function buildUiSchema(state: BuilderState): UiSchema {
  const sections: UiSection[] = state.sections.map(section => ({
    title: section.title,
    columns: section.columns || 2,
    fields: section.controls.map(control => ({
      path: control.fieldPath,
      label: control.label || resolveLabel(state, control.fieldPath),
      hint: control.hint,
    })),
  }));

  const gridColumns: UiGridColumn[] = state.gridColumns.map(col => ({
    path: col.fieldPath,
    label: col.label || resolveLabel(state, col.fieldPath),
    widthPx: col.widthPx,
  }));

  const arrays: UiArrayConfig[] = state.arrays.map(arr => ({
    path: arr.path,
    title: arr.title,
    columns: arr.columns.map(col => ({
      path: col.fieldPath,
      label: col.label || col.fieldPath,
      widthPx: col.widthPx,
    })),
  }));

  return { sections, gridColumns, arrays };
}

/**
 * Resolve label from field path.
 */
function resolveLabel(state: BuilderState, fieldPath: string): string {
  const parts = fieldPath.split('.');
  let currentFields = state.fields;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const found = currentFields.find(f => f.key === part);

    if (!found) {
      return fieldPath; // Fallback to path
    }

    if (i === parts.length - 1) {
      return found.label || found.key;
    }

    // Navigate to nested fields
    if (found.type === 'object' && found.nestedFields) {
      currentFields = found.nestedFields;
    } else if (found.type === 'array' && found.arrayItemFields) {
      currentFields = found.arrayItemFields;
    } else {
      return fieldPath;
    }
  }

  return fieldPath;
}

/**
 * Validate a BuilderState for consistency.
 */
export function validateBuilderState(state: BuilderState): ValidationResult {
  const errors: string[] = [];
  
  // Ensure state has required arrays (handle undefined/null)
  const fields = state?.fields || [];
  const sections = state?.sections || [];
  const gridColumns = state?.gridColumns || [];
  const arrays = state?.arrays || [];
  
  const validPaths = collectValidFieldPaths(fields, '');

  // Validate fields
  validateFields(fields, '', errors);

  // Validate sections reference valid fields
  for (const section of sections) {
    if (!section.title?.trim()) {
      errors.push('Section missing title');
    }
    for (const control of section.controls || []) {
      if (!validPaths.has(control.fieldPath)) {
        errors.push(`Section '${section.title}' control references unknown field: ${control.fieldPath}`);
      }
    }
  }

  // Validate grid columns
  for (const col of gridColumns) {
    if (!validPaths.has(col.fieldPath)) {
      errors.push(`Grid column references unknown field: ${col.fieldPath}`);
    }
  }

  // Validate array configs
  for (const arrayConfig of arrays) {
    const arrayField = findFieldByPath(fields, arrayConfig.path);
    if (!arrayField || arrayField.type !== 'array') {
      errors.push(`Array config references non-existent or non-array field: ${arrayConfig.path}`);
      continue;
    }

    const itemPaths = collectValidFieldPaths(arrayField.arrayItemFields || [], '');
    for (const col of arrayConfig.columns || []) {
      if (!itemPaths.has(col.fieldPath)) {
        errors.push(`Array '${arrayConfig.path}' column references unknown field: ${col.fieldPath}`);
      }
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validate fields recursively.
 */
function validateFields(fields: BuilderField[] | undefined | null, prefix: string, errors: string[]): void {
  if (!fields) return;
  
  const keys = new Set<string>();

  for (const field of fields) {
    const path = prefix ? `${prefix}.${field.key}` : field.key;

    // Check for duplicate keys
    if (keys.has(field.key)) {
      errors.push(`Duplicate field key: ${path}`);
    }
    keys.add(field.key);

    // Validate key format
    if (!field.key || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(field.key)) {
      errors.push(`Invalid field key format: ${field.key}`);
    }

    // Validate type
    if (!field.type) {
      errors.push(`Field missing type: ${path}`);
    }

    // Validate nested fields
    if (field.type === 'object' && field.nestedFields) {
      validateFields(field.nestedFields, path, errors);
    }

    // Validate array item fields
    if (field.type === 'array' && field.arrayItemFields) {
      validateFields(field.arrayItemFields, path, errors);
    }

    // Validate enum has values
    if (field.type === 'enum') {
      if (!field.constraints?.enumValues?.length) {
        errors.push(`Enum field missing values: ${path}`);
      }
    }
  }
}

/**
 * Collect all valid field paths.
 */
function collectValidFieldPaths(fields: BuilderField[] | undefined | null, prefix: string): Set<string> {
  const paths = new Set<string>();

  if (!fields) return paths;

  for (const field of fields) {
    const path = prefix ? `${prefix}.${field.key}` : field.key;
    paths.add(path);

    if (field.type === 'object' && field.nestedFields) {
      const nestedPaths = collectValidFieldPaths(field.nestedFields, path);
      nestedPaths.forEach(p => paths.add(p));
    }
  }

  return paths;
}

/**
 * Find field by dotted path.
 */
function findFieldByPath(fields: BuilderField[] | undefined | null, path: string): BuilderField | null {
  if (!fields) return null;
  
  const parts = path.split('.');
  let current = fields;

  for (const part of parts) {
    const found = current.find(f => f.key === part);
    if (!found) return null;

    if (found.type === 'object' && found.nestedFields) {
      current = found.nestedFields;
    } else if (found.type === 'array') {
      return found;
    } else {
      return found;
    }
  }

  return null;
}

/**
 * Import BuilderState from existing schemas.
 */
export function importFromSchemas(dataSchema: JsonSchemaRoot, uiSchema: UiSchema): BuilderState {
  const state: BuilderState = {
    fields: [],
    sections: [],
    gridColumns: [],
    arrays: [],
  };

  // Import fields from data schema
  if (dataSchema.properties) {
    const required = new Set(dataSchema.required || []);
    state.fields = importFields(dataSchema.properties, required);
  }

  // Import sections from UI schema
  if (uiSchema.sections) {
    state.sections = uiSchema.sections.map((section, i) => ({
      id: `section-${i}`,
      title: section.title,
      columns: section.columns || 2,
      controls: section.fields.map(field => ({
        fieldPath: field.path,
        label: field.label,
        hint: field.hint,
      })),
    }));
  }

  // Import grid columns
  if (uiSchema.gridColumns) {
    state.gridColumns = uiSchema.gridColumns.map(col => ({
      fieldPath: col.path,
      label: col.label,
      widthPx: col.widthPx,
    }));
  }

  // Import arrays
  if (uiSchema.arrays) {
    state.arrays = uiSchema.arrays.map(arr => ({
      path: arr.path,
      title: arr.title,
      columns: arr.columns.map(col => ({
        fieldPath: col.path,
        label: col.label,
        widthPx: col.widthPx,
      })),
    }));
  }

  return state;
}

/**
 * Import fields from JSON Schema properties.
 */
function importFields(properties: Record<string, JsonSchema>, required: Set<string>): BuilderField[] {
  const fields: BuilderField[] = [];

  for (const [key, prop] of Object.entries(properties)) {
    const field = importField(key, prop, required.has(key));
    fields.push(field);
  }

  // Sort alphabetically for deterministic output
  fields.sort((a, b) => a.key.localeCompare(b.key));

  return fields;
}

/**
 * Import a single field from JSON Schema.
 */
function importField(key: string, prop: JsonSchema, isRequired: boolean): BuilderField {
  const field: BuilderField = {
    key,
    label: (prop as any).title || key,
    type: 'string',
    required: isRequired,
    description: (prop as any).description,
  };

  const type = Array.isArray(prop.type) ? prop.type[0] : prop.type;
  const format = (prop as any).format;

  // Determine field type
  if (type === 'string' && format === 'date') {
    field.type = 'date';
  } else if (type === 'string' && prop.enum) {
    field.type = 'enum';
    field.constraints = { enumValues: prop.enum as string[] };
  } else if (type === 'object') {
    field.type = 'object';
    const objProp = prop as JsonSchemaObject;
    if (objProp.properties) {
      const nestedRequired = new Set<string>(objProp.required || []);
      field.nestedFields = importFields(objProp.properties, nestedRequired);
    }
  } else if (type === 'array') {
    field.type = 'array';
    const arrProp = prop as any;
    if (arrProp.items?.properties) {
      const itemRequired = new Set<string>(arrProp.items.required || []);
      field.arrayItemFields = importFields(arrProp.items.properties, itemRequired);
    }
    if (arrProp.minItems !== undefined || arrProp.maxItems !== undefined) {
      field.constraints = {
        minItems: arrProp.minItems,
        maxItems: arrProp.maxItems,
      };
    }
  } else {
    field.type = type as any || 'string';

    // Import constraints
    const constraints: FieldConstraints = {};
    let hasConstraints = false;

    if ((prop as any).minLength !== undefined) {
      constraints.minLength = (prop as any).minLength;
      hasConstraints = true;
    }
    if ((prop as any).maxLength !== undefined) {
      constraints.maxLength = (prop as any).maxLength;
      hasConstraints = true;
    }
    if ((prop as any).pattern) {
      constraints.pattern = (prop as any).pattern;
      hasConstraints = true;
    }
    if ((prop as any).minimum !== undefined) {
      constraints.minimum = (prop as any).minimum;
      hasConstraints = true;
    }
    if ((prop as any).maximum !== undefined) {
      constraints.maximum = (prop as any).maximum;
      hasConstraints = true;
    }

    if (hasConstraints) {
      field.constraints = constraints;
    }
  }

  return field;
}
