import { InjectionToken, Provider } from '@angular/core';

import { AppShellNavigationSection } from './app-shell.types';
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
  readonly userMenu?: boolean;
}

export interface AppShellNotificationsConfig {
  readonly enabled?: boolean;
}

export interface AppShellFeatureConfig {
  readonly product: AppShellProductConfig;
  readonly topBar?: AppShellTopBarConfig;
  readonly sidebar: AppShellSidebarConfig;
  readonly notifications?: AppShellNotificationsConfig;
}

export const DEFAULT_APP_SHELL_FEATURE_CONFIG: AppShellFeatureConfig = {
  product: { name: 'Application' },
  topBar: { enabled: true, pageContext: true },
  sidebar: { enabled: true, navigation: [], userMenu: true },
  notifications: { enabled: false },
};

export const APP_SHELL_CONFIG = new InjectionToken<AppShellFeatureConfig>(
  'APP_SHELL_CONFIG',
  { factory: () => DEFAULT_APP_SHELL_FEATURE_CONFIG },
);

export function provideAppShell(config: AppShellFeatureConfig): Provider[] {
  return [
    { provide: APP_SHELL_CONFIG, useValue: config },
    PlatformNotificationsService,
  ];
}
