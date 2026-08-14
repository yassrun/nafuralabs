import type { TranslateService } from '@ngx-translate/core';

import { buildDetailConfig } from '@lib/anatomy';
import type { LocationConfig } from '../../models';

import { buildDepotFields } from './fields';
import { buildDepotSections } from './sections';
import { ROUTES } from './routes';

export function buildDepotDetailConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildDetailConfig<LocationConfig>(
    {
      entityName: tr('inventory.configuration.depot.entityName'),
      icon: 'warehouse',
      permissionPrefix: 'inventory.location',
      fields: buildDepotFields(t),
      routes: ROUTES,
    },
    {
      sections: buildDepotSections(t),
      saveSuccessMessage: (item) =>
        tr('inventory.configuration.depot.saveSuccess').replace('{name}', String(item.name)),
      deleteConfirm: {
        title: tr('inventory.configuration.depot.deleteConfirm.title'),
        message: (item) =>
          tr('inventory.configuration.depot.deleteConfirm.message').replace('{name}', String(item.name)),
      },
    }
  );
}
