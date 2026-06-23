import type { FilterFieldConfig } from '@lib/anatomy/types';

export const FILTERS: FilterFieldConfig[] = [
  {
    key: 'status',
    label: 'Statut',
    type: 'select',
    options: [
      { value: 'BROUILLON', label: 'Brouillon' },
      { value: 'TERMINE', label: 'Terminé' },
    ],
  },
  {
    key: 'metreurId',
    label: 'Métreur',
    type: 'select',
    lookupKey: 'metreurs',
  },
  {
    key: 'dateFrom',
    label: 'Du',
    type: 'date',
  },
  {
    key: 'dateTo',
    label: 'Au',
    type: 'date',
  },
];
