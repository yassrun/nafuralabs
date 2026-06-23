import type { DetailSectionConfig } from '@lib/anatomy/types';
import type { Metre } from '@applications/erp/etudes/models';

export const SECTIONS: DetailSectionConfig<Metre>[] = [
  {
    id: 'identite',
    title: 'Identité',
    icon: 'tag',
    fields: ['numero', 'projetNom', 'ville', 'dateMetre', 'metreurId', 'status'],
    columns: 2,
  },
  {
    id: 'details',
    title: 'Détails',
    icon: 'file-text',
    fields: ['notes'],
    columns: 1,
  },
  {
    id: 'lignes',
    title: 'Tableau de métré',
    icon: 'ruler',
    fields: ['lignes'],
    columns: 1,
  },
];
