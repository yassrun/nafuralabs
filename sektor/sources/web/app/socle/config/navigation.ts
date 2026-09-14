/**
 * Sektor BTP — registre sidebar par application.
 * Source : shell/erp-sidebar.config.ts
 * Après un changement de route : npm run ai:catalog
 */

import { GeneratedZoneConfig, SidebarNode } from '@platform/core/navigation/sidebar.types';
import { ERP_SIDEBAR, ERP_SIDEBAR_ZONES } from '../shell/erp-sidebar.config';

export const APPLICATION_NAVIGATION_BY_ID: Record<string, SidebarNode[]> = {
  erp: [...ERP_SIDEBAR],
};

export const APPLICATION_ZONE_CONFIG_BY_ID: Record<string, GeneratedZoneConfig[]> = {
  erp: [...ERP_SIDEBAR_ZONES],
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
