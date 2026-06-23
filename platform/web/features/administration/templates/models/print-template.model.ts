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

/** Variable available in templates for a given entity type. */
export interface TemplateVariable {
  path: string;
  label?: string;
  sampleValue?: string;
  group: 'entity' | 'tenant' | 'system';
}

export interface TemplateVariablesResponse {
  entityType: string;
  variables: TemplateVariable[];
}
