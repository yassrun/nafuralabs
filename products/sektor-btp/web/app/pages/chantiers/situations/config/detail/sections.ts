import type { DetailSectionConfig } from '@lib/anatomy/types';
import type { Situation } from '@applications/erp/chantiers/models';

export const SECTIONS: DetailSectionConfig<Situation>[] = [
  {
    id: 'entete',
    title: 'En-tête',
    icon: 'tag',
    fields: [
      'numero',
      'numeroOrdre',
      'chantierId',
      'dateEmission',
      'datePeriodeDebut',
      'datePeriodeFin',
    ],
    columns: 3,
  },
  {
    id: 'lots',
    title: 'Lots & avancement cumulé',
    icon: 'list',
    fields: ['lignes'],
    columns: 1,
  },
  {
    id: 'decompte',
    title: 'Décompte',
    icon: 'calculator',
    fields: [
      'cumulPrecedentHt',
      'cumulCourantHt',
      'travauxPeriodeHt',
      'retenueGarantiePercent',
      'retenueGarantieMontant',
      'retenueAvancePercent',
      'retenueAvanceMontant',
      'tvaTaux',
      'netAPayerHt',
      'netAPayerTtc',
    ],
    columns: 3,
  },
  {
    id: 'moa',
    title: 'Validation MOA',
    icon: 'check-circle',
    fields: ['approbateurMOAName', 'approbationDate', 'motifRejet'],
    columns: 2,
  },
  {
    id: 'notes',
    title: 'Notes',
    icon: 'file-text',
    fields: ['notes'],
    columns: 1,
  },
];
