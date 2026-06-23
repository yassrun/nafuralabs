import { JsonSchemaRoot } from './json-schema.model';
import { UiSchema } from './ui-schema.model';
import { BuilderState } from './builder-state.model';

/**
 * Version status for workflow control.
 */
export type DocTypeStatus = 'DRAFT' | 'PUBLISHED' | 'DEPRECATED';

/**
 * Origin of doc type: SYSTEM (Doxura-provided) or TENANT (user-created).
 */
export type DocTypeOrigin = 'SYSTEM' | 'TENANT';

/**
 * Full DocTypeDefinition including all fields.
 */
export interface DocTypeDefinition {
  id: string;
  domainKey: string;
  docTypeKey: string;
  version: number;
  name: string;
  description?: string;
  status: DocTypeStatus;
  origin: DocTypeOrigin;
  tenantId?: string;
  jsonSchema: JsonSchemaRoot;
  uiSchema: UiSchema;
  builderState?: BuilderState;
  promptTemplate?: string;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}

/**
 * Summary for listing versions.
 */
export interface DocTypeVersionSummary {
  id: string;
  version: number;
  status: DocTypeStatus;
  name: string;
  createdAt: string;
  createdBy?: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface DocTypeListItem {
  domainKey: string;
  docTypeKey: string;
  name: string;
  description?: string;
  activeVersion: number;
  origin: DocTypeOrigin;
  tenantId?: string;
}

export interface DomainDocTypes {
  domainKey: string;
  docTypes: DocTypeListItem[];
}

export interface DocTypesByDomain {
  domains: Record<string, DomainDocTypes>;
}

/**
 * Domain list item from backend API.
 */
export interface DomainListItem {
  domainKey: string;
  label: string;
}

/**
 * Request to create a new DocType (v1 draft).
 */
export interface CreateDocTypeRequest {
  domainKey: string;
  docTypeKey: string;
  name: string;
  description?: string;
  promptTemplate?: string;
  builderState?: BuilderState;
}

/**
 * Request to clone an existing version to a new draft.
 */
export interface CloneDocTypeRequest {
  fromVersionId: string;
}

/**
 * Request to save a draft.
 */
export interface SaveDraftRequest {
  name?: string;
  description?: string;
  promptTemplate?: string;
  builderState: BuilderState;
}

/**
 * Validation result from backend.
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

