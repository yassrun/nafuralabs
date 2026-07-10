import { InjectionToken } from '@angular/core';

/**
 * Optional hook: resolve a listing row to a chantier detail navigation.
 * Implemented by the ERP app; absent in shells that have no chantier module.
 *
 * @returns true if the action was handled (navigation or user feedback).
 */
export const CHANTIER_ROW_NAVIGATOR = new InjectionToken<(row: unknown) => boolean>(
  'CHANTIER_ROW_NAVIGATOR',
);
