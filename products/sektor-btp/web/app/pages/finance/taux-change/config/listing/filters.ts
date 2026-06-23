import type { TranslateService } from '@ngx-translate/core';

import type { FilterFieldConfig } from '@lib/anatomy/types';

export function buildTauxChangeFilters(t: TranslateService): FilterFieldConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'deviseDeCode',
      label: tr('finance.tauxChange.list.filters.deviseBase'),
      type: 'select',
      lookupKey: 'deviseCode',
    },
    {
      key: 'deviseVersCode',
      label: tr('finance.tauxChange.list.filters.deviseCible'),
      type: 'select',
      lookupKey: 'deviseCode',
    },
    {
      key: 'source',
      label: tr('finance.tauxChange.list.filters.source'),
      type: 'select',
      lookupKey: 'tauxChangeSource',
    },
    {
      key: 'dateFrom',
      label: tr('finance.tauxChange.list.filters.dateFrom'),
      type: 'date',
    },
    {
      key: 'dateTo',
      label: tr('finance.tauxChange.list.filters.dateTo'),
      type: 'date',
    },
  ];
}
