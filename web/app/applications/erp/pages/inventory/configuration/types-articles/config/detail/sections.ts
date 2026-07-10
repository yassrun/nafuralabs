import type { TranslateService } from '@ngx-translate/core';

import type { DetailSectionConfig } from '@lib/anatomy/types';
import type { TypeArticleConfig } from '../../models';

export function buildTypeArticleSections(t: TranslateService): DetailSectionConfig<TypeArticleConfig>[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      id: 'general',
      title: tr('inventory.configuration.typeArticle.sections.identification'),
      fields: ['code', 'name', 'articleType', 'isActive'],
      columns: 2,
    },
  ];
}
