import { buildListingConfig } from '@lib/anatomy';
import type { ListingPageConfig } from '@lib/anatomy/types';

import type { MemberListItem } from '../../models';
import { COLUMNS } from './columns';
import { FILTERS } from './filters';
import { ROUTES } from './routes';

export const MEMBER_LISTING_CONFIG: ListingPageConfig<MemberListItem> =
  buildListingConfig<MemberListItem>(
    {
      entityName: 'Member',
      entityNamePlural: 'Members',
      columns: COLUMNS,
      routes: ROUTES,
      permissionPrefix: 'administration.members',
    },
    {
      filters: FILTERS,
      defaultSort: {
        column: 'joinedAt',
        direction: 'desc',
      },
      pagination: {
        defaultPageSize: 25,
        pageSizeOptions: [10, 25, 50],
      },
      actions: {
        hideActions: ['new', 'edit', 'duplicate', 'delete'],
        appendActions: [
          {
            id: 'invite',
            label: 'administration.members.invite',
            icon: 'user-plus',
            scope: 'global',
            variant: 'primary',
            permission: 'administration.members.write',
          },
          {
            id: 'view-detail',
            label: 'administration.members.actions.viewDetail',
            icon: 'eye',
            scope: 'single',
            variant: 'tertiary',
          },
          {
            id: 'deactivate',
            label: 'administration.members.actions.deactivate',
            icon: 'user-x',
            scope: 'single',
            variant: 'danger',
            permission: 'administration.members.write',
            visible: (selection) =>
              (selection[0] as MemberListItem | undefined)?.status === 'active',
          },
          {
            id: 'bulk-deactivate',
            label: 'administration.members.actions.deactivateSelected',
            icon: 'users',
            scope: 'single+bulk',
            variant: 'danger',
            permission: 'administration.members.write',
            visible: (selection) =>
              selection.some((item) => (item as MemberListItem).status === 'active'),
          },
          {
            id: 'reactivate',
            label: 'administration.members.actions.reactivate',
            icon: 'user-check',
            scope: 'single',
            variant: 'secondary',
            permission: 'administration.members.write',
            visible: (selection) =>
              (selection[0] as MemberListItem | undefined)?.status === 'suspended',
          },
          {
            id: 'resend-invitation',
            label: 'administration.members.actions.resendInvitation',
            icon: 'mail',
            scope: 'single',
            variant: 'secondary',
            permission: 'administration.members.write',
            visible: (selection) =>
              (selection[0] as MemberListItem | undefined)?.status === 'invited',
          },
          {
            id: 'remove',
            label: 'administration.members.actions.remove',
            icon: 'trash-2',
            scope: 'single',
            variant: 'danger',
            permission: 'administration.members.write',
            visible: (selection) =>
              (selection[0] as MemberListItem | undefined)?.status !== 'active',
          },
        ],
      },
      emptyState: {
        icon: 'users',
        title: 'administration.members.emptyTitle',
        message: 'administration.members.empty',
        actionLabel: 'administration.members.invite',
        actionId: 'invite',
      },
    }
  );
