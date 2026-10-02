import { buildListingConfig } from '@lib/anatomy';
import type { ListingPageConfig } from '@lib/anatomy/types';

import type { RoleListItem } from '../../models';
import { COLUMNS } from './columns';
import { FILTERS } from './filters';
import { ROUTES } from './routes';

export function createRolesListingConfig(
  allowCustomRoles: boolean
): ListingPageConfig<RoleListItem> {
  return buildListingConfig<RoleListItem>(
    {
      entityName: 'Role',
      entityNamePlural: 'Roles',
      columns: COLUMNS,
      routes: ROUTES,
      permissionPrefix: 'administration.role',
    },
    {
      filters: FILTERS,
      defaultVisibleColumns: ['name', 'description', 'isSystem', 'memberCount'],
      defaultSort: {
        column: 'priority',
        direction: 'asc',
      },
      pagination: {
        defaultPageSize: 25,
        pageSizeOptions: [10, 25],
      },
      actions: {
        hideActions: ['new', 'edit', 'duplicate', 'delete'],
        appendActions: [
          ...(allowCustomRoles
            ? [
                {
                  id: 'create-role',
                  label: 'administration.roles.create',
                  icon: 'shield-plus',
                  scope: 'global' as const,
                  variant: 'primary' as const,
                  permission: 'tenant.roles.write',
                },
              ]
            : []),
          {
            id: 'delete-role',
            label: 'common.actions.delete',
            icon: 'trash-2',
            scope: 'single' as const,
            variant: 'danger' as const,
            permission: 'tenant.roles.write',
            visible: (selection) =>
              !(selection[0] as RoleListItem | undefined)?.isSystem,
          },
        ],
      },
      emptyState: {
        icon: 'shield-check',
        title: 'Aucun rôle',
        message: 'Les rôles viennent des modules de l’application ; vous pouvez aussi créer des rôles personnalisés.',
      },
    }
  );
}
