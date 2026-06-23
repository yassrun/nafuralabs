import type { FilterFieldConfig } from '@lib/anatomy/types';

export const FILTERS: FilterFieldConfig[] = [
  {
    key: 'status',
    label: 'Statut',
    type: 'select',
    options: [
      { value: 'BROUILLON', label: 'Brouillon' },
      { value: 'EMIS', label: 'Émis' },
      { value: 'NEGOCIATION', label: 'Négociation' },
      { value: 'APPROUVE', label: 'Approuvé' },
      { value: 'PERDU', label: 'Perdu' },
      { value: 'ANNULE', label: 'Annulé' },
      { value: 'EXPIRE', label: 'Expiré' },
    ],
  },
  {
    key: 'clientId',
    label: 'Client',
    type: 'select',
    lookupKey: 'clients',
  },
  {
    key: 'dateFrom',
    label: 'Émis du',
    type: 'date',
  },
  {
    key: 'dateTo',
    label: 'Émis au',
    type: 'date',
  },
  {
    key: 'montantMin',
    label: 'Montant min HT',
    type: 'number',
  },
  {
    key: 'montantMax',
    label: 'Montant max HT',
    type: 'number',
  },
];
