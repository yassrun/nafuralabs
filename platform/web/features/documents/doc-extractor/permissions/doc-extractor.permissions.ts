/**
 * Doc Extractor Module Permissions
 * 
 * Centralized permission definitions for the Doc Extractor module.
 * Modules own their permission strings.
 * 
 * Naming convention: module.feature.action
 */

import { buildPermission, PermissionActions } from '../../../../core/security/models/user.models';

/**
 * Doc Extractor module identifier.
 */
export const DOC_EXTRACTOR_MODULE_ID = 'doc-extractor';

/**
 * Doc Extractor feature identifiers.
 */
export const DocExtractorFeatures = {
  EXTRACTION: 'extraction',
  DOC_TYPE_DEFINITION: 'doc_type_definition',
} as const;

/**
 * Doc Extractor permissions.
 * 
 * Usage:
 * ```typescript
 * import { DocExtractorPermissions } from './doc-extractor.permissions';
 * 
 * @Component({...})
 * export class ExtractionPage {
 *   canView = this.permissionService.hasPermission(DocExtractorPermissions.EXTRACTION.READ);
 * }
 * ```
 */
export const DocExtractorPermissions = {
  // Extraction
  EXTRACTION: {
    READ: buildPermission(DocExtractorFeatures.EXTRACTION, PermissionActions.READ, DOC_EXTRACTOR_MODULE_ID),
    CREATE: buildPermission(DocExtractorFeatures.EXTRACTION, PermissionActions.CREATE, DOC_EXTRACTOR_MODULE_ID),
    UPDATE: buildPermission(DocExtractorFeatures.EXTRACTION, PermissionActions.UPDATE, DOC_EXTRACTOR_MODULE_ID),
    DELETE: buildPermission(DocExtractorFeatures.EXTRACTION, PermissionActions.DELETE, DOC_EXTRACTOR_MODULE_ID),
    EXPORT: buildPermission(DocExtractorFeatures.EXTRACTION, PermissionActions.EXPORT, DOC_EXTRACTOR_MODULE_ID),
  },

  // Doc Type Definition
  DOC_TYPE_DEFINITION: {
    READ: buildPermission(DocExtractorFeatures.DOC_TYPE_DEFINITION, PermissionActions.READ, DOC_EXTRACTOR_MODULE_ID),
    CREATE: buildPermission(DocExtractorFeatures.DOC_TYPE_DEFINITION, PermissionActions.CREATE, DOC_EXTRACTOR_MODULE_ID),
    UPDATE: buildPermission(DocExtractorFeatures.DOC_TYPE_DEFINITION, PermissionActions.UPDATE, DOC_EXTRACTOR_MODULE_ID),
    DELETE: buildPermission(DocExtractorFeatures.DOC_TYPE_DEFINITION, PermissionActions.DELETE, DOC_EXTRACTOR_MODULE_ID),
  },
} as const;

/**
 * All doc extractor permissions as flat array.
 * Useful for role configuration UIs.
 */
export const ALL_DOC_EXTRACTOR_PERMISSIONS = [
  ...Object.values(DocExtractorPermissions.EXTRACTION),
  ...Object.values(DocExtractorPermissions.DOC_TYPE_DEFINITION),
];

/**
 * Permission groups for role templates.
 */
export const DocExtractorPermissionGroups = {
  /** View-only access to doc extractor features */
  VIEWER: [
    DocExtractorPermissions.EXTRACTION.READ,
    DocExtractorPermissions.DOC_TYPE_DEFINITION.READ,
  ],

  /** Standard user permissions */
  USER: [
    DocExtractorPermissions.EXTRACTION.READ,
    DocExtractorPermissions.EXTRACTION.CREATE,
    DocExtractorPermissions.EXTRACTION.UPDATE,
    DocExtractorPermissions.DOC_TYPE_DEFINITION.READ,
    DocExtractorPermissions.DOC_TYPE_DEFINITION.CREATE,
    DocExtractorPermissions.DOC_TYPE_DEFINITION.UPDATE,
  ],

  /** Full admin permissions */
  ADMIN: ALL_DOC_EXTRACTOR_PERMISSIONS,
};

