import { buildListingConfig } from '@lib/anatomy';
import type { ListingPageConfig } from '@lib/anatomy/types';
import type { WorkflowTemplate } from '../../models';
import { COLUMNS } from './columns';
import { FILTERS } from './filters';
import { ROUTES } from './routes';

export const WORKFLOWS_LISTING_CONFIG: ListingPageConfig<WorkflowTemplate> =
  buildListingConfig<WorkflowTemplate>(
    {
      entityName: 'Workflow Template',
      entityNamePlural: 'Workflow templates',
      columns: COLUMNS,
      routes: ROUTES,
      permissionPrefix: 'administration.workflows',
    },
    {
      filters: FILTERS,
      defaultSort: {
        column: 'name',
        direction: 'asc',
      },
      pagination: {
        defaultPageSize: 20,
        pageSizeOptions: [10, 20, 50],
      },
      actions: {
        hideActions: ['new', 'edit', 'duplicate', 'delete'],
        appendActions: [
          {
            id: 'new-template',
            label: 'administration.workflows.create',
            icon: 'plus',
            scope: 'global',
            variant: 'primary',
            permission: 'administration.workflows.write',
          },
          {
            id: 'toggle-active',
            label: 'administration.workflows.toggleActive',
            icon: 'toggle-left',
            scope: 'single',
            variant: 'secondary',
            permission: 'administration.workflows.write',
          },
          {
            id: 'delete-template',
            label: 'common.actions.delete',
            icon: 'trash-2',
            scope: 'single',
            variant: 'danger',
            permission: 'administration.workflows.write',
          },
        ],
      },
      emptyState: {
        icon: 'git-branch',
        title: 'administration.workflows.empty',
        message: 'administration.workflows.emptyMessage',
      },
    }
  );
