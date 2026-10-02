import type { ColumnConfig } from '@lib/anatomy/types';

import type { EmailTemplate } from '../../models';

export const COLUMNS: ColumnConfig[] = [
  {
    key: 'name',
    label: 'administration.emailTemplates.columns.name',
    field: 'name',
    translate: true,
    // System templates are seeded in English: show them by code; custom names are user data.
    transform: (value: unknown, item: unknown) => {
      const template = item as EmailTemplate;
      return template.isSystem ? `administration.emailTemplates.systemNames.${template.code}` : String(value ?? '');
    },
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
