import { InjectionToken } from '@angular/core';

/**
 * Maps entityType → detail route prefix (without id).
 * Empty in platform; products provide their maps via DI.
 */
export const ENTITY_TYPE_ROUTE_PREFIX = new InjectionToken<Record<string, string>>(
  'ENTITY_TYPE_ROUTE_PREFIX',
  { providedIn: 'root', factory: () => ({}) },
);

export function getEntityDetailRoute(
  entityType: string,
  entityId: string,
  routePrefixByType: Record<string, string>,
): string[] {
  const prefix = routePrefixByType[entityType];
  if (prefix) {
    return [prefix, entityId];
  }
  return [];
}
