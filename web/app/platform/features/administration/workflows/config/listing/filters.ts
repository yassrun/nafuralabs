import type { FilterFieldConfig } from '@lib/anatomy/types';

export const FILTERS: FilterFieldConfig[] = [
  {
    key: 'search',
    label: 'administration.workflows.filters.search',
    type: 'text',
  },
  {
    key: 'entityType',
    label: 'administration.workflows.filters.entityType',
    type: 'select',
    lookupKey: 'entityTypes',
  },
  {
    key: 'isActive',
    label: 'administration.workflows.filters.status',
    type: 'select',
    options: [
      { label: 'common.all', value: '' },
      { label: 'administration.workflows.status.active', value: 'true' },
      { label: 'administration.workflows.status.inactive', value: 'false' },
    ],
  },
];
