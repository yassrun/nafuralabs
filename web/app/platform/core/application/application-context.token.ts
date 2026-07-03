/**
 * Application Context Token
 */

import { InjectionToken, inject } from '@angular/core';
import { ApplicationKey } from './application-key';
import { ApplicationContextService } from './application-context.service';

export const APPLICATION_KEY = new InjectionToken<() => ApplicationKey>('APPLICATION_KEY', {
  providedIn: 'root',
  factory: () => {
    const applicationContext = inject(ApplicationContextService);
    return () => applicationContext.applicationKey();
  },
});
