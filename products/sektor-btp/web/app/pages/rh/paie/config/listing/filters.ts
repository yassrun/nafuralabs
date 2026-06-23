import type { TranslateService } from '@ngx-translate/core';

import type { FilterFieldConfig } from '@lib/anatomy/types';

export function buildPaieFilters(t: TranslateService): FilterFieldConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'status', label: tr('rh.paie.filters.statut'), type: 'select',
      options: [
        { value: 'BROUILLON', label: tr('rh.paie.statuses.BROUILLON') },
        { value: 'VALIDEE', label: tr('rh.paie.statuses.VALIDEE') },
        { value: 'PAYEE', label: tr('rh.paie.statuses.PAYEE') },
      ],
    },
    { key: 'mois', label: tr('rh.paie.filters.mois'), type: 'text' },
  ];
}
