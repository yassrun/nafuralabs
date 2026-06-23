import type { DetailSectionConfig } from '@lib/anatomy/types';
import type { Devis } from '@applications/erp/etudes/models';

export const SECTIONS: DetailSectionConfig<Devis>[] = [
  {
    id: 'identite',
    title: 'En-tête',
    icon: 'tag',
    fields: ['numero', 'version', 'clientId', 'contactClient', 'objet', 'ville'],
    columns: 2,
  },
  {
    id: 'dates',
    title: 'Dates et conditions',
    icon: 'calendar',
    fields: [
      'dateEmission',
      'dateValidite',
      'metreId',
      'delaiExecutionJours',
      'conditionsPaiement',
    ],
    columns: 2,
  },
  {
    id: 'totaux',
    title: 'Totaux',
    icon: 'calculator',
    fields: ['tvaTaux', 'remiseGlobalePercent', 'totalHt', 'totalTva', 'totalTtc'],
    columns: 3,
  },
  {
    id: 'lignes',
    title: 'DPGF',
    icon: 'list',
    fields: ['lignes'],
    columns: 1,
  },
  {
    id: 'autres',
    title: 'Notes & motifs',
    icon: 'file-text',
    fields: ['motifRefus', 'notes'],
    columns: 1,
  },
];
