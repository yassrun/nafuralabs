import type { TranslateService } from '@ngx-translate/core';

import { buildDetailConfig } from '@lib/anatomy';
import type { FamilleArticleConfig } from '../../models';

import { buildFamilleFields } from './fields';
import { buildFamilleSections } from './sections';
import { ROUTES } from './routes';

export function buildFamilleDetailConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildDetailConfig<FamilleArticleConfig>(
    {
      entityName: tr('inventory.configuration.famille.entityName'),
      icon: 'folder',
      permissionPrefix: 'inventory.famille',
      fields: buildFamilleFields(t),
      routes: ROUTES,
    },
    {
      sections: buildFamilleSections(t),
      saveSuccessMessage: (item) =>
        tr('inventory.configuration.famille.saveSuccess').replace('{name}', String(item.name)),
      deleteConfirm: {
        title: tr('inventory.configuration.famille.deleteConfirm.title'),
        message: (item) =>
          tr('inventory.configuration.famille.deleteConfirm.message').replace('{name}', String(item.name)),
      },
    }
  );
}
