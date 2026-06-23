import type { TranslateService } from '@ngx-translate/core';

import type { DetailSectionConfig } from '@lib/anatomy/types';
import type { CostingMethodConfig } from '../../models';

export function buildCostingMethodSections(t: TranslateService): DetailSectionConfig<CostingMethodConfig>[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      id: 'general',
      title: tr('inventory.configuration.costingMethod.sections.identification'),
      fields: ['code', 'name', 'method', 'description'],
      columns: 2,
    },
    {
      id: 'settings',
      title: tr('inventory.configuration.costingMethod.sections.configuration'),
      fields: ['isActive', 'isDefault'],
      columns: 2,
    },
  ];
}
