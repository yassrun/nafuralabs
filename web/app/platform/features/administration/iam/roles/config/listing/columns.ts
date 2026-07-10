import type { ColumnConfig } from '@lib/anatomy/types';
import type { RoleListItem } from '../../models';

export const COLUMNS: ColumnConfig[] = [
  {
    key: 'name',
    label: 'administration.roles.columns.name',
    field: 'name',
    sortable: true,
    transform: (value: unknown, item: unknown) => {
      const role = item as RoleListItem | undefined;
      const str = String(value ?? '');
      return role?.isSystem ? `**${str}**` : str;
    },
  },
  {
    key: 'description',
    label: 'administration.roles.columns.description',
    field: 'description',
    transform: (value: unknown) => {
      const str = String(value ?? '');
      return str.length > 100 ? `${str.substring(0, 100)}…` : str;
    },
  },
  {
    key: 'isSystem',
    label: 'administration.roles.columns.type',
    field: 'isSystem',
    type: 'badge',
    badgeVariant: (value: unknown) => (value === true ? 'default' : 'info'),
    transform: (value: unknown) =>
      value === true
        ? 'administration.roles.type.system'
        : 'administration.roles.type.custom',
    sortable: true,
  },
  {
    key: 'memberCount',
    label: 'administration.roles.columns.members',
    field: 'memberCount',
    type: 'number',
    sortable: true,
  },
  {
    key: 'priority',
    label: 'administration.roles.columns.priority',
    field: 'priority',
    type: 'number',
    sortable: true,
  },
  {
    key: 'createdAt',
    label: 'common.fields.createdAt',
    field: 'createdAt',
    type: 'datetime',
    sortable: true,
    transform: (value: unknown) => (value == null ? '—' : String(value)),
  },
];
