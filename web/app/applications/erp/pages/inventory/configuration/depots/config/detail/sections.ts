import type { TranslateService } from '@ngx-translate/core';

import type { DetailSectionConfig } from '@lib/anatomy/types';
import type { LocationConfig } from '../../models';

export function buildDepotSections(t: TranslateService): DetailSectionConfig<LocationConfig>[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      id: 'general',
      title: tr('inventory.configuration.depot.sections.identification'),
      fields: ['code', 'name', 'type', 'projectRef', 'budgetChantierId', 'isActive'],
      columns: 2,
    },
    {
      id: 'geo',
      title: tr('inventory.configuration.depot.sections.localisation'),
      fields: ['address', 'ville', 'latitude', 'longitude'],
      columns: 2,
    },
    {
      id: 'capacite',
      title: tr('inventory.configuration.depot.sections.capacite'),
      fields: ['capaciteM3', 'capaciteTonnes', 'responsableNom', 'notes'],
      columns: 2,
    },
    {
      id: 'hierarchy',
      title: tr('inventory.configuration.depot.sections.rattachement'),
      fields: ['parentId'],
      columns: 1,
    },
  ];
}
