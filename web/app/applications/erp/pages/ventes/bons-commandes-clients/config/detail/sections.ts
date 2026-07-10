import type { DetailSectionConfig } from '@lib/anatomy/types';

export const SECTIONS: DetailSectionConfig[] = [
  {
    id: 'commande',
    title: 'Commande',
    icon: 'shopping-bag',
    fields: ['numero', 'numeroClient', 'clientId', 'chantierId', 'dateReception', 'dateFinPrevue'],
    columns: 3,
  },
  {
    id: 'informations',
    title: 'Informations',
    icon: 'info',
    fields: ['tvaTaux', 'notes'],
    columns: 2,
  },
];
