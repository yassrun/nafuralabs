import type { FilterFieldConfig } from '@lib/anatomy/types';

export const FILTERS: FilterFieldConfig[] = [
  {
    key: 'type',
    label: 'administration.roles.filters.type',
    type: 'select',
    options: [
      { label: 'common.all', value: '' },
      { label: 'administration.roles.type.system', value: 'system' },
      { label: 'administration.roles.type.custom', value: 'custom' },
    ],
  },
];
