import type { FilterFieldConfig } from '@lib/anatomy/types';

export const FILTERS: FilterFieldConfig[] = [
  {
    key: 'category',
    label: 'Catégorie',
    type: 'select',
    lookupKey: 'ouvrageCategory',
  },
  {
    key: 'isActive',
    label: 'Statut',
    type: 'select',
    options: [
      { value: 'true', label: 'Actif' },
      { value: 'false', label: 'Inactif' },
    ],
  },
  {
    key: 'prixMin',
    label: 'PU min (MAD)',
    type: 'number',
  },
  {
    key: 'prixMax',
    label: 'PU max (MAD)',
    type: 'number',
  },
];
