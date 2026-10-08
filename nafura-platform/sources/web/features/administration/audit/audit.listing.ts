import type { ListingPageConfig, Row } from '../../../platform/listing/listing-page.types';

const ENDPOINT = '/api/v1/platform/collaboration/audit/log';
const COLUMNS = ['eventAt', 'actor', 'action', 'entityType', 'entityId', 'details'];

/** Organisation audit journal — read-only record. */
export const AUDIT_LISTING: ListingPageConfig = {
  title: 'administration.audit.title',
  subtitle: 'administration.audit.subtitle',
  icon: 'scroll-text',
  endpoint: ENDPOINT,
  quickFilters: [{ property: 'entityType' }, { property: 'action' }],
  views: [
    {
      id: 'all',
      label: 'administration.audit.views.all',
      layout: 'table',
      sort: [{ eventAt: 'desc' }],
      show: COLUMNS,
    },
  ],
  emptyState: {
    icon: 'scroll-text',
    title: 'administration.audit.empty',
    message: 'administration.audit.empty',
  },
  open: (row: Row) => `/administration/audit/${row['id']}`,
  actions: [],
};
