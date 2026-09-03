import type { TranslateService } from '@ngx-translate/core';

import { buildListingConfig } from '@platform/lib/anatomy';

import type { ConsultationAchat } from '../../services';
import { buildConsultationColumns } from './columns';
import { buildConsultationFilters } from './filters';
import { ROUTES } from './routes';

export function buildConsultationListingConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildListingConfig<ConsultationAchat>(
    {
      entityName: tr('achats.consultation.entityName'),
      entityNamePlural: tr('achats.consultation.entityNamePlural'),
      columns: buildConsultationColumns(t),
      routes: ROUTES,
      permissionPrefix: 'achats.consultation',
    },
    {
      filters: buildConsultationFilters(t),
      defaultSort: { column: 'createdAt', direction: 'desc' },
      features: {
        search: true,
        filters: true,
        columnToggle: true,
        refresh: true,
        importExport: false,
      },
      actions: {
        hideActions: ['edit', 'duplicate', 'delete'],
        overrideActions: {
          new: {
            label: tr('achats.consultation.list.cta'),
            ariaLabel: tr('achats.consultation.list.cta'),
          },
        },
      },
      emptyState: {
        icon: 'clipboard-list',
        title: tr('achats.consultation.list.emptyState.title'),
        message: tr('achats.consultation.list.emptyState.message'),
        actionLabel: tr('achats.consultation.list.emptyState.actionLabel'),
        actionId: 'create',
      },
    },
  );
}
