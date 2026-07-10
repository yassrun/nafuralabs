import { InjectionToken } from '@angular/core';

import { AdministrationModuleConfig } from '@core/shell/platform-app-shell.types';

export const ADMINISTRATION_CONFIG =
  new InjectionToken<AdministrationModuleConfig>('ADMINISTRATION_CONFIG');
