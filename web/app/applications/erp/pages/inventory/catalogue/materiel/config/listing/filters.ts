import type { TranslateService } from '@ngx-translate/core';

import type { FilterFieldConfig } from '@lib/anatomy/types';

export function buildMaterielFilters(t: TranslateService): FilterFieldConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'q',
      label: 'common.filters.search',
      type: 'text',
      placeholder: tr('inventory.catalogue.materiel.search'),
    },
    {
      key: 'familleId',
      label: tr('inventory.catalogue.materiel.list.filters.famille'),
      type: 'select',
      placeholder: tr('inventory.catalogue.materiel.allFem'),
      lookupKey: 'famillesArticle',
    },
    {
      key: 'status',
      label: tr('inventory.catalogue.materiel.list.filters.status'),
      type: 'select',
      placeholder: tr('inventory.catalogue.materiel.all'),
      options: [
        { value: 'DISPONIBLE', label: tr('inventory.enums.materielStatus.DISPONIBLE') },
        { value: 'AFFECTE', label: tr('inventory.enums.materielStatus.AFFECTE') },
        { value: 'MAINTENANCE', label: tr('inventory.enums.materielStatus.MAINTENANCE') },
        { value: 'HORS_SERVICE', label: tr('inventory.enums.materielStatus.HORS_SERVICE') },
      ],
    },
  ];
}
