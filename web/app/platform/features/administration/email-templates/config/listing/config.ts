import { buildListingConfig } from '@lib/anatomy';
import type { ListingPageConfig } from '@lib/anatomy/types';

import type { EmailTemplate } from '../../models';
import { COLUMNS } from './columns';
import { FILTERS } from './filters';
import { ROUTES } from './routes';

export const EMAIL_TEMPLATES_LISTING_CONFIG: ListingPageConfig<EmailTemplate> =
  buildListingConfig<EmailTemplate>(
    {
      entityName: 'Email Template',
      entityNamePlural: 'Email templates',
      columns: COLUMNS,
      routes: ROUTES,
      permissionPrefix: 'administration.email',
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
            id: 'new-email-template',
            label: 'administration.emailTemplates.create',
            icon: 'plus',
            scope: 'global',
            variant: 'primary',
            permission: 'administration.email.write',
          },
          {
            id: 'delete-email-template',
            label: 'common.actions.delete',
            icon: 'trash-2',
            scope: 'single',
            variant: 'danger',
            permission: 'administration.email.write',
            visible: (selection) =>
              !(selection[0] as EmailTemplate | undefined)?.isSystem,
          },
        ],
      },
      emptyState: {
        icon: 'mail',
        title: 'administration.emailTemplates.empty',
        message: 'administration.emailTemplates.emptyMessage',
      },
    }
  );
