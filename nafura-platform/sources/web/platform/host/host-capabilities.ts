import { InjectionToken } from '@angular/core';

/** Enabled capability ids of the running product (`spec.capabilities.disabled` already applied). */
export const HOST_CAPABILITIES = new InjectionToken<readonly string[]>('HOST_CAPABILITIES');
