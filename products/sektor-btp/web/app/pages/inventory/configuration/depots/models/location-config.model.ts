/**
 * Configuration magasins / dépôts — aligné sur le référentiel `Location` du module inventory (spec §05).
 */

import type { Location } from '../../../../../inventory/models';

export type LocationConfig = Location;
export type LocationConfigListItem = Location;
export type LocationConfigCreate = Omit<Location, 'id'>;
export type LocationConfigUpdate = Partial<LocationConfigCreate>;
