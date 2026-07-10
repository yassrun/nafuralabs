import type { TranslateService } from '@ngx-translate/core';

import type { DetailSectionConfig } from '@lib/anatomy/types';
import type { Devise } from '@applications/erp/finance/models';

export function buildDeviseSections(t: TranslateService): DetailSectionConfig<Devise>[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      id: 'general',
      title: tr('finance.devise.sections.general'),
      icon: 'tag',
      fields: ['code', 'libelle', 'symbole', 'precisionDecimales'],
      columns: 2,
    },
    {
      id: 'statut',
      title: tr('finance.devise.sections.statut'),
      icon: 'flag',
      fields: ['isDeviseDeReference', 'isActive'],
      columns: 2,
    },
  ];
}
