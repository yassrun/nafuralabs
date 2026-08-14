import type { TranslateService } from '@ngx-translate/core';

import { buildDetailConfig } from '@lib/anatomy';
import type { MotifMouvementConfig } from '../../models';

import { buildMotifFields } from './fields';
import { buildMotifSections } from './sections';
import { ROUTES } from './routes';

export function buildMotifDetailConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildDetailConfig<MotifMouvementConfig>(
    {
      entityName: tr('inventory.configuration.motif.entityName'),
      icon: 'file-text',
      permissionPrefix: 'inventory.motif',
      fields: buildMotifFields(t),
      routes: ROUTES,
    },
    {
      sections: buildMotifSections(t),
      saveSuccessMessage: (item) =>
        tr('inventory.configuration.motif.saveSuccess').replace('{name}', String(item.name)),
      deleteConfirm: {
        title: tr('inventory.configuration.motif.deleteConfirm.title'),
        message: (item) =>
          tr('inventory.configuration.motif.deleteConfirm.message').replace('{name}', String(item.name)),
      },
    }
  );
}
