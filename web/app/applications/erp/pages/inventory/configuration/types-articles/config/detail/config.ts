import type { TranslateService } from '@ngx-translate/core';

import { buildDetailConfig } from '@lib/anatomy';
import type { TypeArticleConfig } from '../../models';

import { buildTypeArticleFields } from './fields';
import { buildTypeArticleSections } from './sections';
import { ROUTES } from './routes';

export function buildTypeArticleDetailConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildDetailConfig<TypeArticleConfig>(
    {
      entityName: tr('inventory.configuration.typeArticle.entityName'),
      icon: 'tag',
      permissionPrefix: 'inventory.typeArticle',
      fields: buildTypeArticleFields(t),
      routes: ROUTES,
    },
    {
      sections: buildTypeArticleSections(t),
      saveSuccessMessage: (item) =>
        tr('inventory.configuration.typeArticle.saveSuccess').replace('{name}', String(item.name)),
      deleteConfirm: {
        title: tr('inventory.configuration.typeArticle.deleteConfirm.title'),
        message: (item) =>
          tr('inventory.configuration.typeArticle.deleteConfirm.message').replace('{name}', String(item.name)),
      },
    }
  );
}
