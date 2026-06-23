import type { TranslateService } from '@ngx-translate/core';

import type { FilterFieldConfig } from '@lib/anatomy/types';
import { CT_STATUS_KEYS } from '@applications/erp/shell/i18n-labels';

export function buildContratFilters(t: TranslateService): FilterFieldConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'status', label: tr('achats.contrat.list.filters.status'), type: 'select',
      options: [
        { value: 'BROUILLON', label: tr(CT_STATUS_KEYS.BROUILLON) },
        { value: 'SIGNE', label: tr(CT_STATUS_KEYS.SIGNE) },
        { value: 'EN_COURS', label: tr(CT_STATUS_KEYS.EN_COURS) },
        { value: 'ECHU', label: tr(CT_STATUS_KEYS.ECHU) },
        { value: 'RESILIE', label: tr(CT_STATUS_KEYS.RESILIE) },
      ],
    },
    { key: 'fournisseurId', label: tr('achats.contrat.list.filters.fournisseur'), type: 'select', lookupKey: 'fournisseurs' },
  ];
}
