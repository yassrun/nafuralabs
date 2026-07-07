import { InjectionToken, Type } from '@angular/core';

/** Optional product-specific block above the platform notification inbox. */
export const NOTIFICATION_CENTER_EXTRA = new InjectionToken<Type<unknown>>(
  'NOTIFICATION_CENTER_EXTRA',
);
