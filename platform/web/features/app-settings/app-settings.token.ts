import { InjectionToken } from '@angular/core';

import { AppSettingsModuleConfig } from '@core/shell/platform-app-shell.types';

export const APP_SETTINGS_CONFIG =
  new InjectionToken<AppSettingsModuleConfig>('APP_SETTINGS_CONFIG');
