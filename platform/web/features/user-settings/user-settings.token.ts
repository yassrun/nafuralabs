import { InjectionToken } from '@angular/core';

import { UserSettingsModuleConfig } from '@core/shell/platform-app-shell.types';

export const USER_SETTINGS_CONFIG =
  new InjectionToken<UserSettingsModuleConfig>('USER_SETTINGS_CONFIG');
