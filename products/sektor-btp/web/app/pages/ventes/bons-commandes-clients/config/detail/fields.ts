import type { DetailFieldConfig } from '@lib/anatomy/types';

export const FIELDS: DetailFieldConfig[] = [
  { key: 'numero', label: 'N° BCC', type: 'text', readonly: true },
  { key: 'numeroClient', label: 'Réf. client *', type: 'text', required: true },
  { key: 'clientId', label: 'Client *', type: 'select', lookupKey: 'clients', required: true },
  { key: 'chantierId', label: 'Chantier', type: 'select', lookupKey: 'chantiers' },
  { key: 'dateReception', label: 'Date réception *', type: 'date', required: true },
  { key: 'dateFinPrevue', label: 'Date fin prévue', type: 'date' },
  { key: 'tvaTaux', label: 'TVA (%)', type: 'number' },
  { key: 'notes', label: 'Notes', type: 'textarea' },
];
