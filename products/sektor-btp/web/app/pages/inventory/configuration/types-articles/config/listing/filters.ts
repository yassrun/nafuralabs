import type { TranslateService } from '@ngx-translate/core';

import type { FilterFieldConfig } from '@lib/anatomy/types';

export function buildTypeArticleFilters(t: TranslateService): FilterFieldConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'code',
      label: tr('inventory.configuration.typeArticle.list.columns.code'),
      type: 'text',
    },
    {
      key: 'name',
      label: tr('inventory.configuration.typeArticle.list.columns.name'),
      type: 'text',
    },
    {
      key: 'articleType',
      label: tr('inventory.configuration.typeArticle.list.filters.articleType'),
      type: 'select',
      options: [
        { value: 'MATERIAU', label: tr('inventory.enums.articleType.MATERIAU') },
        { value: 'CONSOMMABLE', label: tr('inventory.enums.articleType.CONSOMMABLE') },
        { value: 'ENGIN', label: tr('inventory.enums.articleType.ENGIN') },
        { value: 'OUTILLAGE', label: tr('inventory.enums.articleType.OUTILLAGE') },
      ],
    },
  ];
}
