import type { FilterFieldConfig } from '@lib/anatomy/types';

export const FILTERS: FilterFieldConfig[] = [
  {
    key: 'status', label: 'Statut', type: 'select',
    options: [
      { value: 'RECU', label: 'Reçu' },
      { value: 'EN_COURS', label: 'En cours' },
      { value: 'PARTIELLEMENT_FACTURE', label: 'Partiellement facturé' },
      { value: 'FACTURE', label: 'Facturé' },
      { value: 'CLOTURE', label: 'Clôturé' },
      { value: 'ANNULE', label: 'Annulé' },
    ],
  },
];
