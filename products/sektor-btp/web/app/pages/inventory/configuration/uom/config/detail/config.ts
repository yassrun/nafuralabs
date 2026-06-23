import type { TranslateService } from '@ngx-translate/core';

import { buildDetailConfig } from '@lib/anatomy';
import type { UomConfig } from '../../models';

import { buildUomFields } from './fields';
import { buildUomSections } from './sections';
import { ROUTES } from './routes';

export function buildUomDetailConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildDetailConfig<UomConfig>(
    {
      entityName: tr('inventory.configuration.uom.entityName'),
      icon: 'ruler',
      permissionPrefix: 'inventory.uom',
      fields: buildUomFields(t),
      routes: ROUTES,
    },
    {
      sections: buildUomSections(t),
      saveSuccessMessage: (item) =>
        tr('inventory.configuration.uom.saveSuccess').replace('{name}', String(item.name)),
      deleteConfirm: {
        title: tr('inventory.configuration.uom.deleteConfirm.title'),
        message: (item) =>
          tr('inventory.configuration.uom.deleteConfirm.message').replace('{name}', String(item.name)),
      },
    }
  );
}
