import { buildListingConfig } from '@lib/anatomy';
import type { ListingPageConfig } from '@lib/anatomy/types';
import type { ScheduledJobSummary } from './scheduled-jobs.models';

export const SCHEDULED_JOBS_LISTING_CONFIG: ListingPageConfig<ScheduledJobSummary> =
  buildListingConfig<ScheduledJobSummary>(
    {
      entityName: 'Scheduled Job',
      entityNamePlural: 'Scheduled Jobs',
      columns: [
        {
          key: 'description',
          label: 'administration.scheduledJobs.columns.name',
          field: 'description',
        },
        {
          key: 'key',
          label: 'administration.scheduledJobs.columns.key',
          field: 'key',
          cssClass: 'nf-monospace',
        },
        {
          key: 'schedule',
          label: 'administration.scheduledJobs.columns.schedule',
          field: 'cron',
        },
        {
          key: 'tenantScoped',
          label: 'administration.scheduledJobs.columns.tenantScoped',
          field: 'tenantScoped',
          type: 'badge',
          badgeVariant: (value: unknown) => (value ? 'info' : 'default'),
          transform: (value: unknown) => (value ? 'Yes' : 'No'),
        },
        {
          key: 'status',
          label: 'administration.scheduledJobs.columns.status',
          field: 'lastExecution.status',
          type: 'badge',
          badgeVariant: (value: unknown) => {
            if (value === 'SUCCESS') return 'success';
            if (value === 'FAILED') return 'danger';
            if (value === 'RUNNING') return 'info';
            return 'default';
          },
        },
        {
          key: 'lastRun',
          label: 'administration.scheduledJobs.columns.lastRun',
          field: 'lastExecution.startedAt',
          type: 'datetime',
        },
        {
          key: 'enabled',
          label: 'administration.scheduledJobs.columns.enabled',
          field: 'enabled',
          type: 'boolean',
        },
      ],
      routes: {
        detail: (item) =>
          item ? ['/administration/scheduled-jobs', item.key] : ['/administration/scheduled-jobs'],
        create: ['/administration/scheduled-jobs'],
      },
      permissionPrefix: 'administration.scheduled-jobs',
    },
    {
      pagination: {
        defaultPageSize: 20,
        pageSizeOptions: [10, 20, 50],
      },
      actions: {
        hideActions: ['new', 'edit', 'duplicate', 'delete'],
        appendActions: [
          {
            id: 'run-now',
            label: 'administration.scheduledJobs.actions.runNow',
            icon: 'play',
            scope: 'single',
            variant: 'secondary',
            permission: 'administration.scheduled-jobs.write',
          },
        ],
      },
      emptyState: {
        icon: 'clock',
        title: 'administration.scheduledJobs.title',
        message: 'administration.scheduledJobs.subtitle',
      },
    }
  );
