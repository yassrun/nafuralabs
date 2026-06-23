import type { TranslateService } from '@ngx-translate/core';

import type { FilterFieldConfig } from '@lib/anatomy/types';

export function buildDepotFilters(t: TranslateService): FilterFieldConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'code',
      label: tr('inventory.configuration.depot.list.filters.code'),
      type: 'text',
    },
    {
      key: 'name',
      label: tr('inventory.configuration.depot.list.filters.name'),
      type: 'text',
    },
    {
      key: 'type',
      label: tr('inventory.configuration.depot.list.filters.type'),
      type: 'select',
      options: [
        { value: 'DEPOT', label: tr('inventory.enums.locationType.DEPOT') },
        { value: 'ENTREPOT', label: tr('inventory.enums.locationType.ENTREPOT') },
        { value: 'CHANTIER', label: tr('inventory.enums.locationType.CHANTIER') },
        { value: 'TRANSIT', label: tr('inventory.enums.locationType.TRANSIT') },
        { value: 'VIRTUEL', label: tr('inventory.enums.locationType.VIRTUEL') },
      ],
    },
  ];
}
