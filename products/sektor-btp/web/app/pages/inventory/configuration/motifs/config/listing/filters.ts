import type { TranslateService } from '@ngx-translate/core';

import type { FilterFieldConfig } from '@lib/anatomy/types';

export function buildMotifFilters(t: TranslateService): FilterFieldConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'code',
      label: tr('inventory.configuration.motif.list.columns.code'),
      type: 'text',
    },
    {
      key: 'name',
      label: tr('inventory.configuration.motif.list.columns.name'),
      type: 'text',
    },
    {
      key: 'txType',
      label: tr('inventory.configuration.motif.list.filters.txType'),
      type: 'select',
      options: [
        { value: 'RECEPTION', label: tr('inventory.enums.txType.RECEPTION') },
        { value: 'TRANSFERT', label: tr('inventory.enums.txType.TRANSFERT') },
        { value: 'RETOUR', label: tr('inventory.enums.txType.RETOUR') },
        { value: 'INVENTAIRE', label: tr('inventory.enums.txType.INVENTAIRE') },
        { value: 'PERTE', label: tr('inventory.enums.txType.PERTE') },
        { value: 'SORTIE', label: tr('inventory.enums.txType.SORTIE') },
      ],
    },
  ];
}
