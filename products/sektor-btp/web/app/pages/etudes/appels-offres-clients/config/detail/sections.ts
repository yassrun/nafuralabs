import type { DetailSectionConfig } from '@lib/anatomy/types';
import type { AppelOffreClient } from '@applications/erp/etudes/models';

export const SECTIONS: DetailSectionConfig<AppelOffreClient>[] = [
  {
    id: 'identite',
    title: 'Identité',
    icon: 'tag',
    fields: ['numero', 'reference', 'donneurOrdre', 'objet', 'type', 'ville'],
    columns: 2,
  },
  {
    id: 'dates',
    title: 'Dates clés',
    icon: 'calendar',
    fields: ['dateLimiteDepot', 'dateOuverturePlis', 'delaiExecutionJours'],
    columns: 3,
  },
  {
    id: 'cautions',
    title: 'Cautions',
    icon: 'shield',
    fields: [
      'estimationMoaHt',
      'cautionProvisoire',
      'cautionDefinitive',
      'cautionRetenueGarantie',
    ],
    columns: 2,
  },
  {
    id: 'etude',
    title: 'Étude',
    icon: 'book-open',
    fields: ['metreId', 'devisId'],
    columns: 2,
  },
  {
    id: 'resultat',
    title: 'Résultat',
    icon: 'award',
    fields: [
      'resultatRangNotre',
      'resultatNbPlis',
      'resultatAttributaire',
      'resultatMontantHt',
    ],
    columns: 2,
    visible: (form) =>
      ['SOUMIS', 'ATTRIBUE', 'PERDU', 'INFRUCTUEUX'].includes(String(form.status)),
  },
  {
    id: 'notes',
    title: 'Notes',
    icon: 'file-text',
    fields: ['notes'],
    columns: 1,
  },
];
