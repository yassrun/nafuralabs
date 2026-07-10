import type { TranslateService } from '@ngx-translate/core';

import { buildDetailConfig } from '@lib/anatomy';
import type { Materiel } from '../../models';

import type { DetailRouteConfig } from '@lib/anatomy/types';

import { buildMaterielFields } from './fields';
import { buildMaterielSections } from './sections';
import { ROUTES } from './routes';

export function buildMaterielDetailConfig(
  t: TranslateService,
  routes: DetailRouteConfig<Materiel> = ROUTES,
) {
  const tr = (k: string) => t.instant(k);
  return buildDetailConfig<Materiel>(
    {
      entityName: tr('inventory.catalogue.materiel.entityName'),
      permissionPrefix: 'inventory.materiel',
      fields: buildMaterielFields(t),
      routes,
    },
    {
      sections: buildMaterielSections(t),
      saveSuccessMessage: (item) => {
        const label = (item as any).name || (item as any).code || item.id;
        return tr('inventory.catalogue.materiel.saveSuccess').replace('{name}', String(label));
      },
      deleteConfirm: {
        title: tr('inventory.catalogue.materiel.deleteConfirm.title'),
        message: (item) => {
          const label = (item as any).name || (item as any).code || item.id;
          return tr('inventory.catalogue.materiel.deleteConfirm.message').replace('{name}', String(label));
        },
      },
    }
  );
}
