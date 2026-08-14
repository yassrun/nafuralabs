import type { TranslateService } from '@ngx-translate/core';

import type { FilterFieldConfig } from '@lib/anatomy/types';

export function buildReceptionFilters(t: TranslateService): FilterFieldConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'status',
      label: tr('inventory.mouvement.reception.list.filters.status'),
      type: 'select',
      options: [
        { label: tr('inventory.mouvement.reception.list.filters.all'), value: '' },
        { label: tr('inventory.mouvement.reception.status.BROUILLON'), value: 'BROUILLON' },
        { label: tr('inventory.mouvement.reception.status.VALIDE'), value: 'VALIDE' },
        { label: tr('inventory.mouvement.reception.status.ANNULE'), value: 'ANNULE' },
      ],
    },
    {
      key: 'fournisseurId',
      label: tr('inventory.mouvement.reception.list.filters.fournisseur'),
      type: 'select',
      lookupKey: 'fournisseursLookup',
    },
    {
      key: 'destLocationId',
      label: tr('inventory.mouvement.reception.list.filters.depot'),
      type: 'select',
      lookupKey: 'locationsDepot',
    },
    {
      key: 'txDateFrom',
      label: tr('inventory.mouvement.reception.list.filters.from'),
      type: 'date',
    },
    {
      key: 'txDateTo',
      label: tr('inventory.mouvement.reception.list.filters.to'),
      type: 'date',
    },
  ];
}
