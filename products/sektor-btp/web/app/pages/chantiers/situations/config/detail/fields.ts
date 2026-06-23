import type { DetailFieldConfig } from '@lib/anatomy/types';
import type { Situation } from '@applications/erp/chantiers/models';

export const FIELDS: DetailFieldConfig<Situation>[] = [
  // ─── En-tête ──────────────────────────────────────────────
  {
    key: 'numero',
    label: 'N° situation',
    type: 'text',
    readonly: true,
    width: 'md',
    placeholder: 'Auto-généré',
  },
  {
    key: 'numeroOrdre',
    label: 'N° ordre',
    type: 'number',
    readonly: true,
    width: 'sm',
    placeholder: 'Auto',
  },
  {
    key: 'chantierId',
    label: 'Chantier',
    type: 'select',
    required: true,
    width: 'lg',
    lookupKey: 'chantiers',
    searchable: true,
  },
  {
    key: 'dateEmission',
    label: 'Date émission',
    type: 'date',
    required: true,
    width: 'md',
  },
  {
    key: 'datePeriodeDebut',
    label: 'Période début',
    type: 'date',
    required: true,
    width: 'md',
  },
  {
    key: 'datePeriodeFin',
    label: 'Période fin',
    type: 'date',
    required: true,
    width: 'md',
  },

  // ─── Cumuls & Décompte ────────────────────────────────────
  {
    key: 'cumulPrecedentHt',
    label: 'Cumul N-1 HT (MAD)',
    type: 'money-ma',
    readonly: true,
    width: 'md',
    hint: 'Repris automatiquement de la situation précédente.',
  },
  {
    key: 'cumulCourantHt',
    label: 'Cumul N HT (MAD)',
    type: 'money-ma',
    readonly: true,
    width: 'md',
    hint: 'Calculé depuis les cumuls saisis sur les lots.',
  },
  {
    key: 'travauxPeriodeHt',
    label: 'Travaux période HT',
    type: 'money-ma',
    readonly: true,
    width: 'md',
  },
  {
    key: 'retenueGarantiePercent',
    label: 'Retenue garantie (%)',
    type: 'number',
    width: 'sm',
    defaultValue: 7,
  },
  {
    key: 'retenueGarantieMontant',
    label: 'Retenue garantie (MAD)',
    type: 'money-ma',
    readonly: true,
    width: 'md',
  },
  {
    key: 'retenueAvancePercent',
    label: 'Résorption avance (%)',
    type: 'number',
    width: 'sm',
  },
  {
    key: 'retenueAvanceMontant',
    label: 'Résorption avance (MAD)',
    type: 'money-ma',
    readonly: true,
    width: 'md',
  },
  {
    key: 'tvaTaux',
    label: 'TVA (%)',
    type: 'number',
    width: 'sm',
    defaultValue: 20,
  },
  {
    key: 'netAPayerHt',
    label: 'Net à payer HT (MAD)',
    type: 'money-ma',
    readonly: true,
    width: 'md',
  },
  {
    key: 'netAPayerTtc',
    label: 'Net à payer TTC (MAD)',
    type: 'money-ma',
    readonly: true,
    width: 'md',
  },

  // ─── MOA ─────────────────────────────────────────────────
  {
    key: 'approbateurMOAName',
    label: 'Approbateur MOA',
    type: 'text',
    width: 'md',
  },
  {
    key: 'approbationDate',
    label: 'Date approbation',
    type: 'date',
    width: 'md',
  },
  {
    key: 'motifRejet',
    label: 'Motif de rejet',
    type: 'textarea',
    width: 'full',
    visible: (form) => form.status === 'REJETEE',
  },

  // ─── Notes / Lots ─────────────────────────────────────────
  {
    key: 'notes',
    label: 'Notes & commentaires',
    type: 'textarea',
    width: 'full',
  },
  {
    key: 'lignes',
    label: 'Lots & avancement cumulé',
    type: 'custom',
    width: 'full',
    defaultValue: [],
  },
];
