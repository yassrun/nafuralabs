/**
 * Print template (document template) model for listing and editor.
 * Aligns with backend DocumentTemplate and design spec 06.
 */

export interface PrintTemplate {
  id: string;
  name: string;
  code: string;
  entityType: string;
  isSystem: boolean;
  templateBody: string;
  paperSize?: string;
  orientation?: string;
  marginsCss?: string;
  /** JSON: headerHtml, footerHtml, marginTop, marginRight, marginBottom, marginLeft */
  metadata?: string;
  isDefault?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PrintTemplateCreate {
  name: string;
  code: string;
  entityType: string;
  templateBody: string;
  format?: string;
  paperSize?: string;
  orientation?: string;
  marginsCss?: string;
  metadata?: string;
  /** When set, clone from this template id (system template). */
  cloneFromId?: string;
}

export interface PrintTemplateUpdate {
  name?: string;
  code?: string;
  entityType?: string;
  templateBody?: string;
  paperSize?: string;
  orientation?: string;
  marginsCss?: string;
  metadata?: string;
  isActive?: boolean;
}

/** Variable groups exposed by the backend catalog. */
export type TemplateVariableGroup = 'entity' | 'tenant' | 'system';

/**
 * A printable document type declared by a product module.
 * The registry is the only source: no hardcoded list, an empty result means no module
 * declared one.
 */
export interface PrintEntityType {
  code: string;
  labelKey: string;
  module: string;
  supportsRealPreview: boolean;
}

/** A real record offered in the "preview with" picker. */
export interface SampleRecord {
  id: string;
  label: string;
}

/** A template failure the author can act on. */
export interface TemplateRenderError {
  message: string;
  line?: number;
  column?: number;
  expression?: string;
  phase: 'PARSE' | 'EXPRESSION' | 'PDF';
}

/**
 * Variable available in templates for a given entity type.
 * Mirrors backend `TemplateVariableDescriptor` (path, label, type, example);
 * `group` is added client-side from the response key it came under.
 */
export interface TemplateVariable {
  path: string;
  label?: string;
  /** Value kind, drives how the variable is inserted: string | number | date | datetime | image. */
  type?: string;
  example?: string;
  group: TemplateVariableGroup;
}

/** Backend `TemplateVariableCatalogResponse`: one list per group. */
export interface TemplateVariableCatalogResponse {
  entity?: TemplateVariableDescriptor[];
  tenant?: TemplateVariableDescriptor[];
  system?: TemplateVariableDescriptor[];
}

/** Backend `TemplateVariableDescriptor`, as sent on the wire (no group field). */
export interface TemplateVariableDescriptor {
  path: string;
  label?: string;
  type?: string;
  example?: string;
}
