import type { ListingPageConfig, Row } from '../../../platform/listing/listing-page.types';

const ENDPOINT = '/api/v1/platform/admin/scheduled-jobs';
const PERMISSION = 'administration.operations.scheduled-jobs';
const COLUMNS = ['nameKey', 'jobKey', 'cron', 'tenantScoped', 'lastStatus', 'lastStartedAt', 'enabled'];

/** Platform scheduled jobs — read-only record (trigger = update). */
export const SCHEDULED_JOBS_LISTING: ListingPageConfig = {
  title: 'administration.scheduledJobs.title',
  subtitle: 'administration.scheduledJobs.subtitle',
  icon: 'calendar-clock',
  endpoint: ENDPOINT,
  quickFilters: [{ property: 'tenantScoped' }, { property: 'lastStatus' }, { property: 'enabled' }],
  views: [
    {
      id: 'all',
      label: 'administration.scheduledJobs.views.all',
      layout: 'table',
      sort: [{ jobKey: 'asc' }],
      show: COLUMNS,
    },
  ],
  emptyState: {
    icon: 'clock',
    title: 'administration.scheduledJobs.title',
    message: 'administration.scheduledJobs.subtitle',
  },
  open: (row: Row) => `/administration/scheduled-jobs/${row['jobKey']}`,
  actions: [
    {
      id: 'run-now',
      row: true,
      label: 'administration.scheduledJobs.actions.runNow',
      icon: 'play',
      permission: `${PERMISSION}.update`,
      request: { method: 'POST', url: `${ENDPOINT}/{id}/trigger` },
      success: 'administration.scheduledJobs.actions.runNowSuccess',
    },
  ],
};
