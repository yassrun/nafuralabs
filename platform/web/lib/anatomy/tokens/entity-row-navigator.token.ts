import { InjectionToken } from '@angular/core';

/**
 * Optional hook: resolve a listing row to an entity detail navigation.
 * Implemented by the product app (entity drilldown / row navigation).
 *
 * @returns true if the action was handled (navigation or user feedback).
 */
export const ENTITY_ROW_NAVIGATOR = new InjectionToken<(row: unknown) => boolean>(
  'ENTITY_ROW_NAVIGATOR',
);

/** @deprecated Use ENTITY_ROW_NAVIGATOR */
export const CHANTIER_ROW_NAVIGATOR = ENTITY_ROW_NAVIGATOR;
