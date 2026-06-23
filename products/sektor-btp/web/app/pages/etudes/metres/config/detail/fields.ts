import type { DetailFieldConfig } from '@lib/anatomy/types';
import type { Metre } from '@applications/erp/etudes/models';

export const FIELDS: DetailFieldConfig<Metre>[] = [
  {
    key: 'numero',
    label: 'N° métré',
    type: 'text',
    readonly: true,
    width: 'md',
    placeholder: 'Auto-généré',
  },
  {
    key: 'projetNom',
    label: 'Nom du projet',
    type: 'text',
    required: true,
    width: 'lg',
  },
  {
    key: 'ville',
    label: 'Ville',
    type: 'text',
    width: 'md',
  },
  {
    key: 'dateMetre',
    label: 'Date du métré',
    type: 'date',
    required: true,
    width: 'md',
  },
  {
    key: 'metreurId',
    label: 'Métreur',
    type: 'select',
    required: true,
    width: 'md',
    lookupKey: 'metreurs',
  },
  {
    key: 'status',
    label: 'Statut',
    type: 'select',
    width: 'sm',
    defaultValue: 'BROUILLON',
    options: [
      { value: 'BROUILLON', label: 'Brouillon' },
      { value: 'TERMINE', label: 'Terminé' },
    ],
  },
  {
    key: 'notes',
    label: 'Notes',
    type: 'textarea',
    width: 'full',
  },
  {
    key: 'lignes',
    label: 'Lignes du métré',
    type: 'custom',
    width: 'full',
    defaultValue: [],
  },
];
