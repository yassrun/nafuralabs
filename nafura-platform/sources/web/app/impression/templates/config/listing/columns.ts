import type { ColumnConfig } from '@lib/anatomy/types';

import type { PrintTemplate } from '../../models';

export const COLUMNS: ColumnConfig[] = [
  {
    key: 'name',
    label: 'administration.templates.columns.name',
    field: 'name',
    sortable: true,
  },
  {
    key: 'entityType',
    label: 'administration.templates.columns.entityType',
    field: 'entityType',
    type: 'badge',
    sortable: true,
  },
  {
    key: 'isSystem',
    label: 'administration.templates.columns.type',
    field: 'isSystem',
    type: 'badge',
    badgeVariant: (value: unknown) => (value === true ? 'default' : 'info'),
    transform: (value: unknown) =>
      value === true
        ? 'administration.templates.type.system'
        : 'administration.templates.type.custom',
    sortable: true,
  },
  {
    key: 'paperSize',
    label: 'administration.templates.columns.paperSize',
    field: 'paperSize',
    transform: (value: unknown) => (value == null || value === '' ? '—' : String(value)),
    sortable: false,
  },
  {
    key: 'updatedAt',
    label: 'administration.templates.columns.updatedAt',
    field: 'updatedAt',
    type: 'datetime',
    sortable: true,
    transform: (value: unknown) => (value == null ? '—' : String(value)),
  },
];
