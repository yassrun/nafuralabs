import type { TranslateService } from '@ngx-translate/core';

import type { FilterFieldConfig } from '@lib/anatomy/types';
import {
  FACTURE_STATUS_KEYS,
  FACTURE_TYPE_KEYS,
} from '@applications/erp/shell/i18n-labels';

const PAIEMENT_MODES: ReadonlyArray<{ value: string; key: string }> = [
  { value: 'VIREMENT', key: 'ventes.modePaiement.virement' },
  { value: 'CHEQUE', key: 'ventes.modePaiement.cheque' },
  { value: 'EFFET', key: 'ventes.modePaiement.effet' },
  { value: 'ESPECES', key: 'ventes.modePaiement.especes' },
];

export function buildFactureFilters(t: TranslateService): FilterFieldConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'status',
      label: tr('ventes.facture.list.filters.status'),
      type: 'select',
      options: (Object.keys(FACTURE_STATUS_KEYS) as Array<keyof typeof FACTURE_STATUS_KEYS>).map(
        (value) => ({ value, label: tr(FACTURE_STATUS_KEYS[value]) }),
      ),
    },
    {
      key: 'type',
      label: tr('ventes.facture.list.filters.type'),
      type: 'select',
      options: (Object.keys(FACTURE_TYPE_KEYS) as Array<keyof typeof FACTURE_TYPE_KEYS>).map(
        (value) => ({ value, label: tr(FACTURE_TYPE_KEYS[value]) }),
      ),
    },
    {
      key: 'clientId',
      label: tr('ventes.facture.list.filters.client'),
      type: 'select',
      lookupKey: 'clients',
    },
    {
      key: 'chantierId',
      label: tr('ventes.facture.list.filters.chantier'),
      type: 'select',
      lookupKey: 'chantiers',
    },
    {
      key: 'modePaiement',
      label: tr('ventes.facture.list.filters.modePaiement'),
      type: 'select',
      options: PAIEMENT_MODES.map((m) => ({ value: m.value, label: tr(m.key) })),
    },
    { key: 'dateFrom', label: tr('ventes.facture.list.filters.dateFrom'), type: 'date' },
    { key: 'dateTo', label: tr('ventes.facture.list.filters.dateTo'), type: 'date' },
    { key: 'montantMin', label: tr('ventes.facture.list.filters.netMin'), type: 'number' },
    { key: 'montantMax', label: tr('ventes.facture.list.filters.netMax'), type: 'number' },
  ];
}
