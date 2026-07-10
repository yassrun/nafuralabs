import type { TranslateService } from '@ngx-translate/core';

import { buildDetailConfig } from '@lib/anatomy';
import type { Article } from '../../models';

import { buildArticleFields } from './fields';
import { buildArticleSections } from './sections';
import { ROUTES } from './routes';

export function buildArticleDetailConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildDetailConfig<Article>(
    {
      entityName: tr('inventory.catalogue.article.entityName'),
      icon: 'package',
      permissionPrefix: 'inventory.article',
      fields: buildArticleFields(t),
      routes: ROUTES,
    },
    {
      sections: buildArticleSections(t),
      saveSuccessMessage: (item) => {
        const label = (item as any).name || (item as any).code || (item as any).id;
        return tr('inventory.catalogue.article.saveSuccess').replace('{name}', String(label));
      },
      deleteConfirm: {
        title: tr('inventory.catalogue.article.deleteConfirm.title'),
        message: (item) => {
          const label = (item as any).name || (item as any).code || (item as any).id;
          return tr('inventory.catalogue.article.deleteConfirm.message').replace('{name}', String(label));
        },
      },
    }
  );
}
