import type { FilterFieldConfig } from '@lib/anatomy/types';

export const FILTERS: FilterFieldConfig[] = [
  {
    key: 'search',
    label: 'administration.audit.filters.search',
    type: 'text',
  },
  {
    key: 'entityType',
    label: 'administration.audit.filters.entityType',
    type: 'select',
    lookupKey: 'entityTypes',
  },
  {
    key: 'action',
    label: 'administration.audit.filters.action',
    type: 'select',
    lookupKey: 'actions',
  },
  {
    key: 'actor',
    label: 'administration.audit.filters.actor',
    type: 'text',
  },
  {
    key: 'from',
    label: 'administration.audit.filters.from',
    type: 'date',
  },
  {
    key: 'to',
    label: 'administration.audit.filters.to',
    type: 'date',
  },
];
