import type { TranslateService } from '@ngx-translate/core';

import type { FilterFieldConfig } from '@lib/anatomy/types';
import { DA_STATUS_KEYS } from '@applications/erp/shell/i18n-labels';

export function buildDemandeFilters(t: TranslateService): FilterFieldConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'status', label: tr('achats.demande.list.filters.status'), type: 'select',
      options: [
        { value: 'BROUILLON', label: tr(DA_STATUS_KEYS.BROUILLON) },
        { value: 'SOUMISE', label: tr(DA_STATUS_KEYS.SOUMISE) },
        { value: 'APPROUVEE', label: tr(DA_STATUS_KEYS.APPROUVEE) },
        { value: 'REJETEE', label: tr(DA_STATUS_KEYS.REJETEE) },
        { value: 'CONVERTIE', label: tr(DA_STATUS_KEYS.CONVERTIE) },
      ],
    },
    { key: 'chantierId', label: tr('achats.demande.list.filters.chantier'), type: 'select', lookupKey: 'chantiers' },
    { key: 'dateFrom', label: tr('achats.demande.list.filters.dateFrom'), type: 'date' },
    { key: 'dateTo', label: tr('achats.demande.list.filters.dateTo'), type: 'date' },
  ];
}
