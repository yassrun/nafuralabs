import type { FilterFieldConfig } from '@lib/anatomy/types';

export const FILTERS: FilterFieldConfig[] = [
  {
    key: 'chantierId',
    label: 'Chantier',
    type: 'select',
    lookupKey: 'chantiers',
  },
  {
    key: 'status',
    label: 'Statut',
    type: 'select',
    options: [
      { value: 'BROUILLON', label: 'Brouillon' },
      { value: 'SOUMISE', label: 'Soumise' },
      { value: 'VALIDEE_MOA', label: 'Validée MOA' },
      { value: 'FACTUREE', label: 'Facturée' },
      { value: 'PAYEE', label: 'Payée' },
      { value: 'REJETEE', label: 'Rejetée' },
    ],
  },
  {
    key: 'dateFrom',
    label: 'Émise du',
    type: 'date',
  },
  {
    key: 'dateTo',
    label: 'Émise au',
    type: 'date',
  },
  {
    key: 'montantMin',
    label: 'Net min HT',
    type: 'number',
  },
  {
    key: 'montantMax',
    label: 'Net max HT',
    type: 'number',
  },
];
