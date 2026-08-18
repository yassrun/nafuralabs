import type { ColumnConfig } from '@lib/anatomy/types';

import type { MemberListItem } from '../../models';

function formatRelativeTime(value: unknown): string {
  if (!value) {
    return '';
  }

  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const now = Date.now();
  const diffMs = date.getTime() - now;
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

  const minutes = Math.round(diffMs / (1000 * 60));
  if (Math.abs(minutes) < 60) {
    return rtf.format(minutes, 'minute');
  }

  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) {
    return rtf.format(hours, 'hour');
  }

  const days = Math.round(hours / 24);
  if (Math.abs(days) < 30) {
    return rtf.format(days, 'day');
  }

  const months = Math.round(days / 30);
  if (Math.abs(months) < 12) {
    return rtf.format(months, 'month');
  }

  const years = Math.round(months / 12);
  return rtf.format(years, 'year');
}

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
    badgeVariant: (value: unknown) => {
      if (value === 'active') return 'success';
      if (value === 'invited') return 'warning';
      if (value === 'suspended') return 'danger';
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
