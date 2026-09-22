import { InjectionToken } from '@angular/core';

import { TenantSettingsModuleConfig } from '@core/shell/platform-app-shell.types';

export const TENANT_SETTINGS_CONFIG =
  new InjectionToken<TenantSettingsModuleConfig>('TENANT_SETTINGS_CONFIG');
