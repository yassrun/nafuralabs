/**
 * Anatomy Page Classes
 */

export { FeaturePageClass } from './feature-page.class';
export { FeatureListPageClass } from './feature-list-page.class';
export type { ListPageRouteConfig, ListPageDeleteConfig } from './feature-list-page.class';
export { FeatureDetailPageClass } from './feature-detail-page.class';

// Config-driven approach (recommended for new pages)
export {
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
} from './config-driven-listing-page.class';

export {
  ConfigDrivenDetailPage,
  ConfigDrivenDetailPageImports,
  ConfigDrivenDetailPageStyles,
} from './config-driven-detail-page.class';
export type { DetailFacade, CrudStyleFacade } from './config-driven-detail-page.class';
export { createDetailFacadeFromCrud } from './config-driven-detail-page.class';

export {
  ConfigDrivenMasterSlavePage,
  ConfigDrivenMasterSlavePageImports,
  ConfigDrivenMasterSlavePageStyles,
} from './config-driven-master-slave-page.class';
export type { PanelRouteConfig } from './config-driven-master-slave-page.class';

export {
  ConfigDrivenDashboardPage,
  ConfigDrivenDashboardPageImports,
  ConfigDrivenDashboardPageStyles,
} from './config-driven-dashboard-page.class';

export {
  ConfigDrivenSettingsPage,
  ConfigDrivenSettingsPageImports,
  ConfigDrivenSettingsPageStyles,
} from './config-driven-settings-page.class';

export {
  ConfigDrivenWizardPage,
  ConfigDrivenWizardPageImports,
  ConfigDrivenWizardPageStyles,
} from './config-driven-wizard-page.class';

export {
  ConfigDrivenDocumentWorkspacePage,
  ConfigDrivenDocumentWorkspacePageImports,
  ConfigDrivenDocumentWorkspacePageStyles,
} from './config-driven-document-workspace-page.class';
