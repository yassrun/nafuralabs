import type { ColumnConfig } from '@lib/anatomy/types';

import type { EmailTemplate } from '../../models';

export const COLUMNS: ColumnConfig[] = [
  {
    key: 'name',
    label: 'administration.emailTemplates.columns.name',
    field: 'name',
    sortable: true,
  },
  {
    key: 'code',
    label: 'administration.emailTemplates.columns.code',
    field: 'code',
    sortable: true,
  },
  {
    key: 'isSystem',
    label: 'administration.emailTemplates.columns.type',
    field: 'isSystem',
    type: 'badge',
    badgeVariant: (value: unknown) => (value === true ? 'default' : 'info'),
    transform: (value: unknown) =>
      value === true
        ? 'administration.emailTemplates.type.system'
        : 'administration.emailTemplates.type.custom',
    sortable: true,
  },
  {
    key: 'entityType',
    label: 'administration.emailTemplates.columns.entityType',
    field: 'entityType',
    type: 'badge',
    transform: (value: unknown) => (value == null || value === '' ? '—' : String(value)),
    sortable: true,
  },
  {
    key: 'updatedAt',
    label: 'administration.emailTemplates.columns.updatedAt',
    field: 'updatedAt',
    type: 'datetime',
    sortable: true,
    transform: (value: unknown) => (value == null ? '—' : String(value)),
  },
];
