import { InjectionToken, Provider } from '@angular/core';

import {
  AppShellContextRailConfig,
  AppShellNavigationSection,
} from './app-shell.types';
import { AppShellContextRailService } from './context-rail.service';
import { PlatformNotificationsService } from '../notifications';

export interface AppShellProductConfig {
  readonly name: string;
  readonly logoUrl?: string;
  readonly tagline?: string;
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

export type {
  AppShellContextAdmin,
  AppShellContextRailConfig,
  AppShellContextSlot,
} from './app-shell.types';

export interface AppShellFeatureConfig {
  readonly product: AppShellProductConfig;
  readonly topBar?: AppShellTopBarConfig;
  readonly sidebar: AppShellSidebarConfig;
  readonly userMenu?: AppShellUserMenuConfig;
  readonly tenantMenu?: AppShellTenantMenuConfig;
  readonly notifications?: AppShellNotificationsConfig;
  readonly ai?: AppShellAiConfig;
  readonly contextRail?: AppShellContextRailConfig;
}

export const DEFAULT_APP_SHELL_FEATURE_CONFIG: AppShellFeatureConfig = {
  product: { name: 'Application' },
  topBar: { enabled: true, pageContext: true },
  sidebar: { enabled: true, navigation: [], userMenu: true },
  userMenu: { enabled: true },
  tenantMenu: { enabled: false },
  notifications: { enabled: false },
  ai: { enabled: false },
  contextRail: { enabled: false, slots: [] },
};

export const APP_SHELL_CONFIG = new InjectionToken<AppShellFeatureConfig>(
  'APP_SHELL_CONFIG',
  { factory: () => DEFAULT_APP_SHELL_FEATURE_CONFIG },
);

export function provideAppShell(config: AppShellFeatureConfig): Provider[] {
  return [
    { provide: APP_SHELL_CONFIG, useValue: config },
    {
      provide: AppShellContextRailService,
      useFactory: () => {
        const service = new AppShellContextRailService();
        service.load(config.contextRail);
        return service;
      },
    },
    PlatformNotificationsService,
  ];
}
