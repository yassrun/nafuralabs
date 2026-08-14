/**
 * Sektor BTP — sidebar navigation registry (hand-maintained).
 * Source of truth: shell/erp-nav.generated.ts
 */

import { GeneratedZoneConfig, SidebarNode } from '@platform/core/navigation/sidebar.types';
import { ERP_NAV_CONFIG_GENERATED, ERP_ZONE_CONFIG_GENERATED } from '../shell/erp-nav.generated';

export const APPLICATION_NAVIGATION_BY_ID: Record<string, SidebarNode[]> = {
  erp: [...ERP_NAV_CONFIG_GENERATED],
};

export const APPLICATION_ZONE_CONFIG_BY_ID: Record<string, GeneratedZoneConfig[]> = {
  erp: [...ERP_ZONE_CONFIG_GENERATED],
};

export function resolveApplicationNavigation(
  applicationId: string,
  options?: { allowMissing?: boolean }
): SidebarNode[] {
  const navigation = APPLICATION_NAVIGATION_BY_ID[applicationId];
  if (navigation) {
    return [...navigation];
  }
  if (options?.allowMissing) {
    return [];
  }
  throw new Error(`Missing navigation for application '${applicationId}'.`);
}

export function resolveApplicationZoneConfig(
  applicationId: string,
  options?: { allowMissing?: boolean }
): GeneratedZoneConfig[] {
  const zoneConfig = APPLICATION_ZONE_CONFIG_BY_ID[applicationId];
  if (zoneConfig) {
    return [...zoneConfig];
  }
  if (options?.allowMissing) {
    return [];
  }
  throw new Error(`Missing zone config for application '${applicationId}'.`);
}
