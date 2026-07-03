import type { FilterFieldConfig } from '@lib/anatomy/types';

export const FILTERS: FilterFieldConfig[] = [
  {
    key: 'type',
    label: 'administration.emailTemplates.filters.type',
    type: 'select',
    options: [
      { label: 'common.all', value: '' },
      { label: 'administration.emailTemplates.type.system', value: 'system' },
      { label: 'administration.emailTemplates.type.custom', value: 'custom' },
    ],
  },
  {
    key: 'entityType',
    label: 'administration.emailTemplates.filters.entityType',
    type: 'text',
  },
];
