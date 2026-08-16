import { buildListingConfig } from '@lib/anatomy';
import type { ListingPageConfig } from '@lib/anatomy/types';

import type { PrintTemplate } from '../../models';
import { COLUMNS } from './columns';
import { FILTERS } from './filters';
import { ROUTES } from './routes';

export const TEMPLATES_LISTING_CONFIG: ListingPageConfig<PrintTemplate> =
  buildListingConfig<PrintTemplate>(
    {
      entityName: 'Print Template',
      entityNamePlural: 'Print templates',
      columns: COLUMNS,
      routes: ROUTES,
      permissionPrefix: 'administration.templates',
    },
    {
      filters: FILTERS,
      defaultSort: {
        column: 'updatedAt',
        direction: 'desc',
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
            label: 'administration.templates.create',
            icon: 'plus',
            scope: 'global',
            variant: 'primary',
            permission: 'administration.templates.write',
          },
          {
            id: 'clone-template',
            label: 'administration.templates.clone',
            icon: 'copy',
            scope: 'single',
            variant: 'secondary',
            permission: 'administration.templates.write',
            visible: (selection) =>
              (selection[0] as PrintTemplate | undefined)?.isSystem === true,
          },
          {
            id: 'delete-template',
            label: 'common.actions.delete',
            icon: 'trash-2',
            scope: 'single',
            variant: 'danger',
            permission: 'administration.templates.write',
            visible: (selection) =>
              !(selection[0] as PrintTemplate | undefined)?.isSystem,
          },
        ],
      },
      emptyState: {
        icon: 'file-text',
        title: 'administration.templates.empty',
        message: 'administration.templates.emptyMessage',
      },
    }
  );
