/**
 * Doc Extractor Module Routes
 * 
 * Route configuration for the Doc Extractor module.
 * Uses guards for permission and module access control.
 * 
 * Route Structure (V1):
 * - /extraction                              - Entry page (discovery + fast path)
 * - /extraction/workspace/:domain/:docType   - Workspace for specific doc type (includes records)
 * - /doc-types                               - Document type definitions
 * - /doc-types/:domainKey/:docTypeKey        - Document type builder/editor
 * - /settings                                - General extraction settings
 */

import { Routes } from '@angular/router';
import { permissionGuard } from '../../../../core/security/guards/permission.guard';
import { featureEnabledGuard } from '../../../../core/tenant/tenant.guard';
import { DOC_EXTRACTOR_MODULE_ID, DocExtractorPermissions } from '../permissions/doc-extractor.permissions';

/**
 * Doc Extractor module routes.
 * 
 * These routes are lazy-loaded when the doc-extractor module is accessed.
 * The parent route guards ensure the module is enabled for the tenant.
 */
export const DOC_EXTRACTOR_ROUTES: Routes = [
  {
    path: '',
    // Ensure feature is enabled for tenant
    canActivate: [featureEnabledGuard(DOC_EXTRACTOR_MODULE_ID)],
    children: [
      {
        path: '',
        redirectTo: 'extraction',
        pathMatch: 'full',
      },

      // Legacy redirect (keep for backwards compatibility)
      {
        path: 'extract',
        redirectTo: 'extraction',
        pathMatch: 'full',
      },

      // Extraction Entry Page (discovery + fast path)
      {
        path: 'extraction',
        loadComponent: () =>
          import('../pages/extraction-entry-page/extraction-entry-page.component').then(
            m => m.ExtractionEntryPage
          ),
        canActivate: [permissionGuard([DocExtractorPermissions.EXTRACTION.READ])],
      },

      // Extraction Workspace (for specific doc type)
      {
        path: 'extraction/workspace/:domainKey/:docTypeKey',
        loadComponent: () =>
          import('../pages/extraction-workspace-page/extraction-workspace-page.component').then(
            m => m.ExtractionWorkspacePage
          ),
        canActivate: [permissionGuard([DocExtractorPermissions.EXTRACTION.READ])],
      },


      // Legacy routes: redirect to extraction
      {
        path: 'documents',
        redirectTo: 'extraction',
        pathMatch: 'full',
      },
      {
        path: 'records',
        redirectTo: 'extraction',
        pathMatch: 'full',
      },

      // Document Types Page (definitions management)
      {
        path: 'doc-types',
        loadComponent: () =>
          import('../pages/doc-types-page/doc-types-page.component').then(
            m => m.DocTypesPage
          ),
        canActivate: [permissionGuard([DocExtractorPermissions.EXTRACTION.READ])],
      },

      // Document Type Builder / Editor (moved out of Settings)
      {
        path: 'doc-types/:domainKey/:docTypeKey',
        loadComponent: () =>
          import('../pages/extraction-settings-doc-type-page/extraction-settings-doc-type-page.component').then(
            m => m.ExtractionSettingsDocTypePage
          ),
        canActivate: [permissionGuard([DocExtractorPermissions.EXTRACTION.READ])],
      },

      // Extraction Settings
      {
        path: 'settings',
        canActivate: [permissionGuard([DocExtractorPermissions.EXTRACTION.READ])],
        loadComponent: () =>
          import('../pages/extraction-settings-shell-page/extraction-settings-shell-page.component').then(
            m => m.ExtractionSettingsShellPage
          ),
        children: [
          {
            path: '',
            redirectTo: 'general',
            pathMatch: 'full',
          },
          {
            path: 'general',
            loadComponent: () =>
              import('../pages/extraction-settings-general-page/extraction-settings-general-page.component').then(
                m => m.ExtractionSettingsGeneralPage
              ),
          },
        ],
      },
    ],
  },
];

