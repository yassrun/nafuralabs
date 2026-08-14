/**
 * BuilderState Model
 * 
 * The canonical in-memory model that the builder UI edits.
 * This single model is used to generate both:
 * 1. Data Schema JSON (jsonSchema)
 * 2. UI Schema JSON (uiSchema)
 * 
 * The frontend edits ONLY BuilderState; the backend generates the schemas.
 */

/**
 * Supported field types.
 */
export type FieldType = 
  | 'string' 
  | 'number' 
  | 'integer' 
  | 'boolean' 
  | 'date' 
  | 'enum' 
  | 'object' 
  | 'array';

/**
 * Field definition in the builder.
 */
export interface BuilderField {
  /**
   * Unique key for the field (used in JSON paths).
   * Must be a valid JavaScript identifier (alphanumeric + underscore).
   */
  key: string;

  /**
   * Display label for the field.
   */
  label: string;

  /**
   * Field type.
   */
  type: FieldType;

  /**
   * Whether this field is required.
   */
  required: boolean;

  /**
   * Optional description/help text.
   */
  description?: string;

  /**
   * Constraints based on type.
   */
  constraints?: FieldConstraints;

  /**
   * UI hints for rendering.
   */
  hints?: FieldHints;

  /**
   * For 'object' type: nested fields.
   */
  nestedFields?: BuilderField[];

  /**
   * For 'array' type: item field definition.
   */
  arrayItemFields?: BuilderField[];
}

/**
 * Field constraints based on type.
 */
export interface FieldConstraints {
  // String constraints
  minLength?: number;
  maxLength?: number;
  pattern?: string;

  // Number/integer constraints
  minimum?: number;
  maximum?: number;

  // Enum constraints
  enumValues?: string[];

  // Array constraints
  minItems?: number;
  maxItems?: number;
}

/**
 * UI hints for field rendering.
 */
export interface FieldHints {
  placeholder?: string;
  appearance?: 'fill' | 'outline';
  readonly?: boolean;
  widthPx?: number;
}

/**
 * Layout section definition.
 */
export interface BuilderSection {
  /**
   * Unique ID for the section.
   */
  id: string;

  /**
   * Section title.
   */
  title: string;

  /**
   * Number of columns in the section (1-4). Default: 2.
   */
  columns?: number;

  /**
   * Controls within this section, referencing field keys.
   */
  controls: BuilderControl[];
}

/**
 * A control in the layout, referencing a field.
 */
export interface BuilderControl {
  /**
   * Dotted path to the field (e.g., "sender.name").
   */
  fieldPath: string;

  /**
   * Optional label override (defaults to field label).
   */
  label?: string;

  /**
   * Optional hint text.
   */
  hint?: string;
}

/**
 * Grid column configuration for workspace table.
 */
export interface BuilderGridColumn {
  /**
   * Dotted path to the field.
   */
  fieldPath: string;

  /**
   * Column label (defaults to field label).
   */
  label?: string;

  /**
   * Column width in pixels.
   */
  widthPx?: number;
}

/**
 * Array table configuration.
 */
export interface BuilderArrayConfig {
  /**
   * Path to the array field (e.g., "items").
   */
  path: string;

  /**
   * Table title.
   */
  title: string;

  /**
   * Columns to display in the array table.
   */
  columns: BuilderArrayColumn[];
}

/**
 * Column in an array table.
 */
export interface BuilderArrayColumn {
  /**
   * Path within array item (e.g., "itemReference").
   */
  fieldPath: string;

  /**
   * Column label.
   */
  label?: string;

  /**
   * Column width in pixels.
   */
  widthPx?: number;
}

/**
 * The complete builder state that represents a DocType definition.
 */
export interface BuilderState {
  /**
   * Root-level field definitions.
   */
  fields: BuilderField[];

  /**
   * Form sections layout for the record dialog.
   */
  sections: BuilderSection[];

  /**
   * Grid columns for the workspace table.
   */
  gridColumns: BuilderGridColumn[];

  /**
   * Array table configurations.
   */
  arrays: BuilderArrayConfig[];
}

/**
 * Creates an empty builder state.
 */
export function createEmptyBuilderState(): BuilderState {
  return {
    fields: [],
    sections: [],
    gridColumns: [],
    arrays: [],
  };
}

/**
 * Creates a new field with defaults.
 */
export function createDefaultField(key: string, type: FieldType = 'string'): BuilderField {
  return {
    key,
    label: key,
    type,
    required: false,
  };
}

/**
 * Creates a new section with defaults.
 */
export function createDefaultSection(id: string, title: string): BuilderSection {
  return {
    id,
    title,
    columns: 2,
    controls: [],
  };
}
