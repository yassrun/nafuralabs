/**
 * Doc Extractor Module Sidebar Declaration
 * 
 * This file declares the navigation structure for the Doc Extractor module.
 * The module owns its sidebar nodes.
 * Core collects and composes all module declarations.
 * 
 * Navigation Structure (V1):
 * - Extraction: Entry point for doc type selection, extraction workflow, and records
 * - Document Types: Browse system (Doxura) and custom (tenant) doc type definitions
 * - Settings: Workspace/tenant settings
 */

import { ModuleSidebarDeclaration, SidebarNode } from '../../../../core/navigation/sidebar.types';
import { DOC_EXTRACTOR_MODULE_ID, DocExtractorPermissions } from '../permissions/doc-extractor.permissions';

/**
 * Doc Extractor module sidebar nodes.
 * Labels use translation keys that will be resolved by the sidebar component.
 */
const docExtractorNodes: SidebarNode[] = [
  {
    id: 'doc-extractor',
    label: 'docExtractor.navigation.title',
    icon: 'sparkles',
    moduleId: DOC_EXTRACTOR_MODULE_ID,
    zone: 'work',
    order: 25, // Position between Documents and Inventory
    children: [
      {
        id: 'doc-extractor.extraction',
        label: 'docExtractor.navigation.extraction',
        icon: 'search',
        route: '/doc-extractor/extraction',
        permissions: [DocExtractorPermissions.EXTRACTION.READ],
        order: 10,
        tooltip: 'Start extracting data from documents',
      },
      {
        id: 'doc-extractor.doc-types',
        label: 'docExtractor.navigation.docTypes',
        icon: 'file-text',
        route: '/doc-extractor/doc-types',
        permissions: [DocExtractorPermissions.EXTRACTION.READ],
        order: 20,
        tooltip: 'Browse and manage document type definitions',
      },
      {
        id: 'doc-extractor.settings',
        label: 'docExtractor.navigation.settings',
        icon: 'settings',
        route: '/doc-extractor/settings',
        permissions: [DocExtractorPermissions.EXTRACTION.READ],
        order: 30,
        dividerBefore: true,
      },
    ],
  },
];

/**
 * Doc Extractor module sidebar declaration.
 * 
 * Register this with the sidebar registry:
 * ```typescript
 * providers: [
 *   {
 *     provide: SIDEBAR_DECLARATIONS,
 *     useValue: docExtractorSidebarDeclaration,
 *     multi: true
 *   }
 * ]
 * ```
 */
export const docExtractorSidebarDeclaration: ModuleSidebarDeclaration = {
  moduleId: DOC_EXTRACTOR_MODULE_ID,
  nodes: docExtractorNodes,
  order: 25, // Position in the sidebar (lower = higher priority)
};

