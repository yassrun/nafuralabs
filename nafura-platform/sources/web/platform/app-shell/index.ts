/** Public entry point for the new configurable Platform App Shell. */
export { AppShellComponent } from './app-shell.component';
export {
  APP_SHELL_CONFIG,
  APP_SHELL_ACCESS,
  DEFAULT_APP_SHELL_FEATURE_CONFIG,
  provideAppShell,
  type AppShellFeatureConfig,
  type AppShellNotificationsConfig,
  type AppShellProductConfig,
  type AppShellSidebarConfig,
  type AppShellTopBarConfig,
  type AppShellUserMenuConfig,
  type AppShellTenantMenuConfig,
  type AppShellAiConfig,
} from './app-shell.config';
export * from '../notifications';
export * from '../identity';
export { AppShellTopBarComponent } from './top-bar/app-shell-top-bar.component';
export { TopBarApplicationIdentityComponent } from './top-bar/top-bar-application-identity.component';
export { TopBarMenuButtonComponent } from './top-bar/top-bar-menu-button.component';
export { AppShellSidebarComponent } from './sidebar/app-shell-sidebar.component';
export { AppShellAiPanelComponent } from './ai/app-shell-ai-panel.component';
export { domainOf, grants, toSidebar, visibleNavigation, type NavigationAccess } from './navigation-access';
export {
  type AppShellNavigationItem,
  type AppShellNavigationSection,
} from './app-shell.types';
