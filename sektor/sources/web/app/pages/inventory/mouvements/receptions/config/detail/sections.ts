import type { TranslateService } from '@ngx-translate/core';

import type { DetailSectionConfig } from '@lib/anatomy/types';

import type { InventoryTx } from '../../../../../../inventory/models';

export function buildReceptionDetailSections(t: TranslateService): DetailSectionConfig<InventoryTx>[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      id: 'identification',
      title: tr('inventory.mouvement.reception.sections.identification'),
      fields: ['txDate', 'fournisseurId', 'reference'],
      columns: 2,
    },
    {
      id: 'destination',
      title: tr('inventory.mouvement.reception.sections.destination'),
      fields: ['destLocationId', 'chantierLocationId', 'phaseRef', 'notes'],
      columns: 2,
    },
    {
      id: 'lines',
      title: tr('inventory.mouvement.reception.sections.lines'),
      fields: ['lines'],
      columns: 1,
    },
  ];
}
