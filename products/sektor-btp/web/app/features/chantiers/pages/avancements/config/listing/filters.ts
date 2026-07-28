import type { TranslateService } from '@ngx-translate/core';

import type { FilterFieldConfig } from '@lib/anatomy/types';

export function buildAvancementFilters(t: TranslateService): FilterFieldConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'chantierId',
      label: tr('chantiers.avancement.listing.filters.chantiers'),
      type: 'multiselect',
      lookupKey: 'chantiers',
    },
    {
      key: 'lotId',
      label: tr('chantiers.avancement.listing.filters.lots'),
      type: 'multiselect',
      lookupKey: 'lots',
    },
    {
      key: 'dateFrom',
      label: tr('chantiers.avancement.listing.filters.dateFrom'),
      type: 'date',
      defaultValue: (() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().slice(0, 10);
      })(),
    },
    {
      key: 'dateTo',
      label: tr('chantiers.avancement.listing.filters.dateTo'),
      type: 'date',
      defaultValue: new Date().toISOString().slice(0, 10),
    },
    {
      key: 'saisieParId',
      label: tr('chantiers.avancement.listing.filters.saisiPar'),
      type: 'select',
      lookupKey: 'employees',
    },
    {
      key: 'avecPhotos',
      label: tr('chantiers.avancement.listing.filters.avecPhotos'),
      type: 'boolean',
    },
  ];
}
