import type { FilterFieldConfig } from '@lib/anatomy/types';

export const FILTERS: FilterFieldConfig[] = [
  {
    key: 'status',
    label: 'administration.members.filters.status',
    type: 'select',
    options: [
      { label: 'All', value: '' },
      { label: 'administration.members.status.active', value: 'active' },
      { label: 'administration.members.status.invited', value: 'invited' },
      { label: 'administration.members.status.suspended', value: 'suspended' },
    ],
  },
  {
    key: 'roleId',
    label: 'administration.members.filters.role',
    type: 'select',
    lookupKey: 'roles',
  },
];
