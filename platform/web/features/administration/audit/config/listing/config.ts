import { buildListingConfig } from '@lib/anatomy';
import type { ListingPageConfig } from '@lib/anatomy/types';

import type { AuditLogEntry } from '../../models';
import { COLUMNS } from './columns';
import { FILTERS } from './filters';
import { ROUTES } from './routes';

export const AUDIT_LISTING_CONFIG: ListingPageConfig<AuditLogEntry> =
  buildListingConfig<AuditLogEntry>(
    {
      entityName: 'Audit Entry',
      entityNamePlural: 'Audit entries',
      columns: COLUMNS,
      routes: ROUTES,
      permissionPrefix: 'administration.audit',
    },
    {
      filters: FILTERS,
      defaultSort: {
        column: 'eventAt',
        direction: 'desc',
      },
      pagination: {
        defaultPageSize: 20,
        pageSizeOptions: [10, 20, 50, 100],
      },
      actions: {
        hideActions: ['new', 'edit', 'duplicate', 'delete'],
        appendActions: [
          {
            id: 'export-csv',
            label: 'administration.audit.export',
            icon: 'download',
            scope: 'global',
            variant: 'secondary',
            permission: 'administration.audit.read',
          },
        ],
      },
      emptyState: {
        icon: 'scroll-text',
        title: 'administration.audit.empty',
        message: 'administration.audit.empty',
      },
    }
  );
