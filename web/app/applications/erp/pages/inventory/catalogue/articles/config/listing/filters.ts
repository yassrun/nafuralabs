import type { TranslateService } from '@ngx-translate/core';

import type { FilterFieldConfig } from '@lib/anatomy/types';

export function buildArticleFilters(t: TranslateService): FilterFieldConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'familleId',
      label: tr('inventory.catalogue.article.list.filters.famille'),
      type: 'select',
      lookupKey: 'familleArticle',
    },
    {
      key: 'articleType',
      label: tr('inventory.catalogue.article.list.filters.type'),
      type: 'select',
      options: [
        { value: 'MATERIAU', label: tr('inventory.enums.articleType.MATERIAU') },
        { value: 'CONSOMMABLE', label: tr('inventory.enums.articleType.CONSOMMABLE') },
      ],
    },
    {
      key: 'isActive',
      label: tr('inventory.catalogue.article.list.filters.isActive'),
      type: 'select',
      options: [
        { value: true, label: tr('inventory.common.active') },
        { value: false, label: tr('inventory.common.inactive') },
      ],
    },
  ];
}
