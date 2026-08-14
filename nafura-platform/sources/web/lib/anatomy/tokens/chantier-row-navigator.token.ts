/**
 * Optional hook: resolve a listing row to a related-entity detail navigation.
 * Implemented by the host product app when a listing cell action needs custom navigation.
 */
import { InjectionToken } from '@angular/core';

export const LISTING_ROW_NAVIGATOR = new InjectionToken<(row: unknown) => boolean>(
  'LISTING_ROW_NAVIGATOR',
);

/** @deprecated Use {@link LISTING_ROW_NAVIGATOR} */
export const CHANTIER_ROW_NAVIGATOR = LISTING_ROW_NAVIGATOR;
