import type { TranslateService } from '@ngx-translate/core';

import { buildDetailConfig } from '@lib/anatomy';
import type { CostingMethodConfig } from '../../models';

import { buildCostingMethodFields } from './fields';
import { buildCostingMethodSections } from './sections';
import { ROUTES } from './routes';

export function buildCostingMethodDetailConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildDetailConfig<CostingMethodConfig>(
    {
      entityName: tr('inventory.configuration.costingMethod.entityName'),
      icon: 'calculator',
      permissionPrefix: 'inventory.costingMethod',
      fields: buildCostingMethodFields(t),
      routes: ROUTES,
    },
    {
      sections: buildCostingMethodSections(t),
      saveSuccessMessage: (item) =>
        tr('inventory.configuration.costingMethod.saveSuccess').replace('{name}', String(item.name)),
      deleteConfirm: {
        title: tr('inventory.configuration.costingMethod.deleteConfirm.title'),
        message: (item) =>
          tr('inventory.configuration.costingMethod.deleteConfirm.message').replace('{name}', String(item.name)),
      },
    }
  );
}
