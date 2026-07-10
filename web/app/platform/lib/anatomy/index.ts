/**
 * Anatomy Framework
 *
 * Nafura's internal UI framework for building feature pages.
 *
 * @example
 * ```typescript
 * import {
 *   // Pages
 *   FeatureListPageClass,
 *   FeatureDetailPageClass,
 *
 *   // Data
 *   FeatureApiService,
 *   FeatureFacade,
 *
 *   // Services
 *   PageTitleService,
 *   BreadcrumbService,
 *   LookupService,
 *
 *   // Types
 *   ListQuery,
 *   ListResponse,
 *   ColumnConfig,
 * } from '@lib/anatomy';
 * ```
 */

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export * from './types';

export { buildRouteBreadcrumbs } from './utils/route-breadcrumb.util';

export { CHANTIER_ROW_NAVIGATOR } from './tokens/chantier-row-navigator.token';
export { LOOKUP_LIST_ROUTES } from './tokens/lookup-list-routes.token';
export { LOOKUP_CREATE_ROUTES } from './tokens/lookup-create-routes.token';
export {
  LISTING_EXPORT_AUDIT,
  type ListingExportAuditPayload,
} from './tokens/listing-export-audit.token';

// ═══════════════════════════════════════════════════════════════════════════
// Config (Defaults & Builders)
// ═══════════════════════════════════════════════════════════════════════════

export {
  // Listing defaults
  DEFAULT_LISTING_ACTIONS,
  DEFAULT_PAGINATION,
  DEFAULT_VIEW_MODES,
  DEFAULT_FEATURES,
  // Listing builders
  buildListingActions,
  buildListingConfig,
  // Detail defaults
  DEFAULT_DETAIL_ACTIONS,
  // Detail builders
  buildDetailActions,
  buildDetailConfig,
} from './config';
export type {
  // Listing types
  ListingActionsOverrides,
  ListingConfigRequired,
  ListingConfigOverrides,
  // Detail types
  DetailActionsOverrides,
  DetailConfigRequired,
  DetailConfigOverrides,
} from './config';

// ═══════════════════════════════════════════════════════════════════════════
// Pages
// ═══════════════════════════════════════════════════════════════════════════

export {
  FeaturePageClass,
  FeatureListPageClass,
  FeatureDetailPageClass,
  // Config-driven (recommended)
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
  ConfigDrivenDetailPage,
  ConfigDrivenDetailPageImports,
  ConfigDrivenDetailPageStyles,
  ConfigDrivenMasterSlavePage,
  ConfigDrivenMasterSlavePageImports,
  ConfigDrivenMasterSlavePageStyles,
  ConfigDrivenDashboardPage,
  ConfigDrivenDashboardPageImports,
  ConfigDrivenDashboardPageStyles,
  ConfigDrivenSettingsPage,
  ConfigDrivenSettingsPageImports,
  ConfigDrivenSettingsPageStyles,
  ConfigDrivenWizardPage,
  ConfigDrivenWizardPageImports,
  ConfigDrivenWizardPageStyles,
  ConfigDrivenDocumentWorkspacePage,
  ConfigDrivenDocumentWorkspacePageImports,
  ConfigDrivenDocumentWorkspacePageStyles,
} from './pages';
export type { ListPageRouteConfig, ListPageDeleteConfig, DetailFacade, CrudStyleFacade, PanelRouteConfig } from './pages';
export { createDetailFacadeFromCrud } from './pages';

// ═══════════════════════════════════════════════════════════════════════════
// Data Layer
// ═══════════════════════════════════════════════════════════════════════════

export { FeatureApiService, FeatureFacade, GridFacade } from './data';
export type { CreateDto, UpdateDto } from './data';

// ═══════════════════════════════════════════════════════════════════════════
// Status Machine
// ═══════════════════════════════════════════════════════════════════════════

export { StatusMachineComponent } from './components/molecules/status-machine';
export { StatusTransitionDialogService, StatusTransitionDialogComponent } from './components/services/status-transition-dialog.service';
export type { StatusTransitionDialogOptions, StatusTransitionDialogResult } from './components/services/status-transition-dialog.service';

// ═══════════════════════════════════════════════════════════════════════════
// Services
// ═══════════════════════════════════════════════════════════════════════════

export { PageTitleService, BreadcrumbService, LookupService, LookupReferenceNavigationService } from './services';
export type { LookupRequest } from './services';

// ═══════════════════════════════════════════════════════════════════════════
// Components
// ═══════════════════════════════════════════════════════════════════════════

export * from './components';
