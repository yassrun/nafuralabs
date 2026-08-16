import { JsonSchemaRoot } from './json-schema.model';
import { UiSchema } from './ui-schema.model';

/**
 * Version status of a provided schema (received, not composed here).
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

