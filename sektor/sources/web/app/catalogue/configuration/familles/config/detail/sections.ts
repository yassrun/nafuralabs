import type { TranslateService } from '@ngx-translate/core';

import type { DetailSectionConfig } from '@platform/lib/anatomy/types';
import type { FamilleArticleConfig } from '../../models';

export function buildFamilleSections(t: TranslateService): DetailSectionConfig<FamilleArticleConfig>[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      id: 'general',
      title: tr('inventory.configuration.famille.sections.identification'),
      fields: ['code', 'name', 'description', 'parentId', 'isActive'],
      columns: 2,
    },
  ];
}
