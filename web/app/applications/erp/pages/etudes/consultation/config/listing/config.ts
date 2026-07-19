import type { TranslateService } from '@ngx-translate/core';

import { buildListingConfig } from '@lib/anatomy';
import type { Consultation } from '../../models';

import { buildConsultationColumns } from './columns';
import { ROUTES } from './routes';

export function buildConsultationListingConfig(t: TranslateService) {
  return buildListingConfig<Consultation>(
    {
      entityName: 'Consultation',
      entityNamePlural: 'Consultations',
      columns: buildConsultationColumns(t),
      routes: ROUTES,
      permissionPrefix: 'consultation',
    },
    {
      defaultSort: { column: 'createdAt', direction: 'desc' },
      features: {
        search: true,
        filters: false,
        columnToggle: true,
        selectionMode: 'none',
        viewModeToggle: false,
        refresh: true,
      },
      emptyState: {
        icon: 'clipboard-list',
        title: 'Aucune consultation',
        message: 'Créez une consultation pour construire le bordereau à partir du CPS et du BPU.',
        actionLabel: 'Nouvelle consultation',
        actionId: 'create',
      },
    },
  );
}
