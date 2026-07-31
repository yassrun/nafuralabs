import { InjectionToken } from '@angular/core';

import type { BadgeVariant } from '../../../types';

export interface StatusDef {
  label: string;
  variant: BadgeVariant;
  icon?: string;
  tooltip: string;
}

export type StatusMap = Record<string, StatusDef>;

/**
 * Product status catalogs. Empty in platform; the product app provides via DI.
 */
export const STATUS_MAPPING_CATALOG = new InjectionToken<Record<string, StatusMap>>(
  'STATUS_MAPPING_CATALOG',
  { providedIn: 'root', factory: () => ({}) },
);

/** @deprecated Prefer inject(STATUS_MAPPING_CATALOG) — kept for static Storybook samples. */
export const STATUS_MAPPING: Record<string, StatusMap> = {};

export function resolveStatus(
  entityType: string,
  status: string,
  catalog: Record<string, StatusMap> = STATUS_MAPPING,
): StatusDef {
  return catalog[entityType]?.[status] ?? {
    label: status,
    variant: 'default' as BadgeVariant,
    tooltip: status,
  };
}
