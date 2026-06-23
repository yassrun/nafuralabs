import type { TranslateService } from '@ngx-translate/core';

import type { DetailSectionConfig } from '@lib/anatomy/types';
import type { UomConfig } from '../../models';

export function buildUomSections(t: TranslateService): DetailSectionConfig<UomConfig>[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      id: 'general',
      title: tr('inventory.configuration.uom.sections.identification'),
      fields: ['code', 'name', 'uomCategoryId', 'isActive'],
      columns: 2,
    },
  ];
}
