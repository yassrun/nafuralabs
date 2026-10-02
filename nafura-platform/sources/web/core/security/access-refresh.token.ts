import { InjectionToken } from '@angular/core';

/**
 * Reloads what the session may do (permissions, disabled domains) after an administrator changed it,
 * so navigation follows at once. Optional: without it the change applies at the next session.
 */
export const ACCESS_REFRESH = new InjectionToken<() => Promise<void>>('ACCESS_REFRESH');
