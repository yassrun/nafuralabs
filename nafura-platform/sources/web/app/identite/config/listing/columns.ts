import type { ColumnConfig } from '@lib/anatomy/types';
import { formatRelativeTime } from '@lib/anatomy/utils/relative-time';

import type { MemberListItem } from '../../models';

export const COLUMNS: ColumnConfig[] = [
  {
    key: 'name',
    label: 'administration.members.columns.name',
    field: 'displayName',
    sortable: true,
    transform: (value: unknown, item: unknown) => {
      const row = item as MemberListItem;
      const fallback = `${row.firstName ?? ''} ${row.lastName ?? ''}`.trim();
      return String(value || fallback || row.email || '');
    },
  },
  {
    key: 'email',
    label: 'administration.members.columns.email',
    field: 'email',
    sortable: true,
  },
  {
    key: 'role',
    label: 'administration.members.columns.role',
    field: 'roles',
    type: 'badge',
    sortable: false,
    transform: (value: unknown) => {
      const roles = Array.isArray(value) ? value : [];
      if (roles.length === 0) {
        return '';
      }

      const primaryRole = roles[0] as { name?: string };
      const extraCount = roles.length - 1;
      return extraCount > 0
        ? `${primaryRole.name ?? ''} +${extraCount}`
        : `${primaryRole.name ?? ''}`;
    },
  },
  {
    key: 'status',
    label: 'administration.members.columns.status',
    field: 'status',
    type: 'badge',
    transform: (value: unknown, item: unknown) => {
      const row = item as MemberListItem;
      if (row.status === 'invited' && row.invitationEmailStatus === 'failed') {
        return 'administration.members.status.invitedEmailFailed';
      }
      return value ? `administration.members.status.${value}` : '';
    },
    badgeVariant: (_value: unknown, item?: unknown) => {
      const row = item as MemberListItem | undefined;
      if (row?.status === 'invited' && row.invitationEmailStatus === 'failed') {
        return 'danger';
      }
      if (row?.status === 'active' || _value === 'active') return 'success';
      if (row?.status === 'invited' || _value === 'invited') return 'warning';
      if (row?.status === 'suspended' || _value === 'suspended') return 'danger';
      return 'default';
    },
    sortable: true,
  },
  {
    key: 'lastActivityAt',
    label: 'administration.members.columns.lastActivity',
    field: 'lastActivityAt',
    type: 'text',
    transform: (value: unknown) => formatRelativeTime(value),
    sortable: true,
  },
  {
    key: 'joinedAt',
    label: 'administration.members.columns.joined',
    field: 'joinedAt',
    type: 'date',
    sortable: true,
  },
];
