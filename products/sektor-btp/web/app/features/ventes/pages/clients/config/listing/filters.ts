import type { FilterFieldConfig } from '@lib/anatomy/types';

export const FILTERS: FilterFieldConfig[] = [
  {
    key: 'type',
    label: 'Forme juridique',
    type: 'select',
    options: [
      { value: 'SA', label: 'SA' },
      { value: 'SARL', label: 'SARL' },
      { value: 'SAS', label: 'SAS' },
      { value: 'Particulier', label: 'Particulier' },
      { value: 'Administration', label: 'Administration' },
      { value: 'Cooperative', label: 'Coopérative' },
    ],
  },
  {
    key: 'actif',
    label: 'Statut',
    type: 'select',
    options: [
      { value: 'true', label: 'Actif' },
      { value: 'false', label: 'Inactif' },
    ],
  },
];
