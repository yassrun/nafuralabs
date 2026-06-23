import type { ListingRouteConfig } from '@lib/anatomy/types';

import type { AuditLogEntry } from '../../models';

export const ROUTES: ListingRouteConfig<AuditLogEntry> = {
  list: ['/administration/audit'],
  detail: () => [], // Detail shown in side panel, no route
  create: [], // Read-only
};
