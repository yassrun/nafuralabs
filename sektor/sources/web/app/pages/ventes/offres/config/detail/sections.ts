import type { DetailSectionConfig } from '@lib/anatomy/types';

export const SECTIONS: DetailSectionConfig[] = [
  {
    id: 'identification',
    title: 'Identification',
    icon: 'file-text',
    fields: ['numero', 'clientId', 'chantierId', 'dateEmission', 'dateValidite'],
    columns: 3,
  },
  {
    id: 'details',
    title: 'Détails',
    icon: 'align-left',
    fields: ['objet', 'tvaTaux', 'notes'],
    columns: 2,
  },
];
