import type { FilterFieldConfig } from '@lib/anatomy/types';

export const FILTERS: FilterFieldConfig[] = [
  {
    key: 'search',
    label: 'administration.templates.filters.search',
    type: 'text',
  },
  {
    key: 'entityType',
    label: 'administration.templates.filters.entityType',
    type: 'select',
    lookupKey: 'entityTypes',
  },
  {
    key: 'type',
    label: 'administration.templates.filters.type',
    type: 'select',
    options: [
      { label: 'common.all', value: '' },
      { label: 'administration.templates.type.system', value: 'system' },
      { label: 'administration.templates.type.custom', value: 'custom' },
    ],
  },
];
