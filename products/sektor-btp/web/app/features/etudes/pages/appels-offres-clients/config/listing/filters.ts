import type { FilterFieldConfig } from '@lib/anatomy/types';

export const FILTERS: FilterFieldConfig[] = [
  {
    key: 'status',
    label: 'Statut',
    type: 'select',
    options: [
      { value: 'A_ETUDIER', label: 'À étudier' },
      { value: 'EN_PREPARATION', label: 'En préparation' },
      { value: 'SOUMIS', label: 'Soumis' },
      { value: 'ATTRIBUE', label: 'Attribué' },
      { value: 'PERDU', label: 'Perdu' },
      { value: 'INFRUCTUEUX', label: 'Infructueux' },
      { value: 'ANNULE', label: 'Annulé' },
    ],
  },
  {
    key: 'type',
    label: 'Type',
    type: 'select',
    options: [
      { value: 'PUBLIC', label: 'Public' },
      { value: 'PRIVE', label: 'Privé' },
    ],
  },
  {
    key: 'donneurOrdre',
    label: "Donneur d'ordre",
    type: 'text',
  },
  {
    key: 'dateFrom',
    label: 'Limite à partir du',
    type: 'date',
  },
  {
    key: 'dateTo',
    label: "Limite jusqu'au",
    type: 'date',
  },
];
