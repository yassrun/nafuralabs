import type { TranslateService } from '@ngx-translate/core';

import { buildDetailConfig } from '@lib/anatomy';
import type { UomCategoryConfig } from '../../models';

import { buildUomCategoryFields } from './fields';
import { buildUomCategorySections } from './sections';
import { ROUTES } from './routes';

export function buildUomCategoryDetailConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildDetailConfig<UomCategoryConfig>(
    {
      entityName: tr('inventory.configuration.uomCategory.entityName'),
      permissionPrefix: 'inventory.uomCategory',
      fields: buildUomCategoryFields(t),
      routes: ROUTES,
    },
    {
      sections: buildUomCategorySections(t),
      saveSuccessMessage: (item) =>
        tr('inventory.configuration.uomCategory.saveSuccess').replace('{name}', String(item.name)),
      deleteConfirm: {
        title: tr('inventory.configuration.uomCategory.deleteConfirm.title'),
        message: (item) =>
          tr('inventory.configuration.uomCategory.deleteConfirm.message').replace('{name}', String(item.name)),
      },
    }
  );
}
