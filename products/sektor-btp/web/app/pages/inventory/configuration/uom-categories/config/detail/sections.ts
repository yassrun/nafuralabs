import type { TranslateService } from '@ngx-translate/core';

import type { DetailSectionConfig } from '@lib/anatomy/types';
import type { UomCategoryConfig } from '../../models';

export function buildUomCategorySections(t: TranslateService): DetailSectionConfig<UomCategoryConfig>[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      id: 'general',
      title: tr('inventory.configuration.uomCategory.sections.identification'),
      fields: ['code', 'name', 'description', 'isActive'],
      columns: 2,
    },
  ];
}
