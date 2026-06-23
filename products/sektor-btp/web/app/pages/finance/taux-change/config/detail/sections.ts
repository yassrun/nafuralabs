import type { TranslateService } from '@ngx-translate/core';

import type { DetailSectionConfig } from '@lib/anatomy/types';
import type { TauxChange } from '@applications/erp/finance/models';

export function buildTauxChangeSections(t: TranslateService): DetailSectionConfig<TauxChange>[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      id: 'general',
      title: tr('finance.tauxChange.converter.title'),
      icon: 'arrow-right-left',
      fields: ['deviseDeCode', 'deviseVersCode', 'taux', 'dateValidite'],
      columns: 2,
    },
    {
      id: 'meta',
      title: tr('finance.common.labels.total'),
      icon: 'info',
      fields: ['source', 'isActive'],
      columns: 2,
    },
  ];
}
