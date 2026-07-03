import type { TranslateService } from '@ngx-translate/core';

import type { DetailSectionConfig } from '@lib/anatomy/types';
import type { Article } from '../../models';

export function buildArticleSections(t: TranslateService): DetailSectionConfig<Article>[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      id: 'identification',
      title: tr('inventory.catalogue.article.sections.identification'),
      fields: ['code', 'name', 'description', 'familleId', 'articleType'],
      columns: 2,
    },
    {
      id: 'mesure-prix',
      title: tr('inventory.catalogue.article.sections.mesurePrix'),
      fields: [
        'uomId',
        'uomSecondaireId',
        'conversionFactor',
        'prixUnitaire',
        'prixAchatDernier',
        'pmp',
        'devise',
      ],
      columns: 2,
    },
    {
      id: 'appro',
      title: tr('inventory.catalogue.article.sections.appro'),
      fields: ['delaiReapproJours', 'posteBudgetId'],
      columns: 2,
    },
    {
      id: 'seuils-stock',
      title: tr('inventory.catalogue.article.sections.seuilsStock'),
      fields: ['stockMin', 'stockMax'],
      columns: 2,
    },
    {
      id: 'statut',
      title: tr('inventory.catalogue.article.sections.statut'),
      fields: ['isPerissable', 'isSerialise', 'isActive'],
      columns: 3,
    },
  ];
}
