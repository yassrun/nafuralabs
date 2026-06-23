import type { TranslateService } from '@ngx-translate/core';

import type { DetailSectionConfig } from '@lib/anatomy/types';
import type { MotifMouvementConfig } from '../../models';

export function buildMotifSections(t: TranslateService): DetailSectionConfig<MotifMouvementConfig>[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      id: 'general',
      title: tr('inventory.configuration.motif.sections.identification'),
      fields: ['code', 'name', 'txType', 'isActive'],
      columns: 2,
    },
  ];
}
