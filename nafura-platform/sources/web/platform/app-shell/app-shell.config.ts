import { InjectionToken, Provider, type Signal } from '@angular/core';

import { AppShellNavigationSection } from './app-shell.types';
import type { NavigationAccess } from './navigation-access';
import { PlatformNotificationsService } from '../notifications';

/** Product identity, owned by the product (`app.nafura.json` spec.product, files in its web `public/`). */
export interface AppShellProductConfig {
  readonly name: string;
  readonly tagline?: string;
  /** Square icon (sidebar, login, favicon), e.g. `/brand/mark.svg`; without it the initial of `name`. */
  readonly mark?: string;
  /** Wide logo replacing mark + name in the expanded sidebar. */
  readonly logo?: string;
}

export interface AppShellTopBarConfig {
  readonly enabled?: boolean;
  readonly pageContext?: boolean;
}

export interface AppShellSidebarConfig {
  readonly enabled?: boolean;
  readonly navigation: readonly AppShellNavigationSection[];
  /** @deprecated Prefer `userMenu.enabled`. */
  readonly userMenu?: boolean;
}

/** Entries of `nf-user-menu`. Absent or false = the row is not rendered. */
export interface AppShellUserMenuConfig {
  readonly enabled?: boolean;
  readonly userSettings?: boolean;
  readonly userSettingsRoute?: string;
}

/** Entries of `nf-tenant-menu` — tenant / org preferences live here. */
export interface AppShellTenantMenuConfig {
  readonly enabled?: boolean;
  readonly tenantSettings?: boolean;
  readonly tenantSettingsRoute?: string;
  readonly organizationIdentity?: boolean;
  readonly organizationIdentityRoute?: string;
  /** Label when auth has no current tenant (lab). */
  readonly fallbackName?: string;
  readonly fallbackKey?: string;
}

export interface AppShellNotificationsConfig {
  readonly enabled?: boolean;
}

/** Top-bar AI toggle + side panel. */
export interface AppShellAiConfig {
  readonly enabled?: boolean;
  readonly initiallyOpen?: boolean;
}

export interface AppShellFeatureConfig {
  readonly product: AppShellProductConfig;
  readonly topBar?: AppShellTopBarConfig;
  readonly sidebar: AppShellSidebarConfig;
  readonly userMenu?: AppShellUserMenuConfig;
  readonly tenantMenu?: AppShellTenantMenuConfig;
  readonly notifications?: AppShellNotificationsConfig;
  readonly ai?: AppShellAiConfig;
}

export const DEFAULT_APP_SHELL_FEATURE_CONFIG: AppShellFeatureConfig = {
  product: { name: 'Application' },
  topBar: { enabled: true, pageContext: true },
  sidebar: { enabled: true, navigation: [], userMenu: true },
  userMenu: { enabled: true },
  tenantMenu: { enabled: false },
  notifications: { enabled: false },
  ai: { enabled: false },
};

export const APP_SHELL_CONFIG = new InjectionToken<AppShellFeatureConfig>(
  'APP_SHELL_CONFIG',
  { factory: () => DEFAULT_APP_SHELL_FEATURE_CONFIG },
);

/**
 * What the signed-in user may open: effective permissions (`null` while loading) and the domains the
 * organization disabled. When provided, guarded navigation entries are hidden unless granted; without
 * it nothing is filtered (the backend enforces).
 */
export const APP_SHELL_ACCESS = new InjectionToken<Signal<NavigationAccess>>('APP_SHELL_ACCESS');

export function provideAppShell(config: AppShellFeatureConfig): Provider[] {
  return [
    { provide: APP_SHELL_CONFIG, useValue: config },
    PlatformNotificationsService,
  ];
}
