import type { TranslateService } from '@ngx-translate/core';

import { buildListingConfig } from '@platform/lib/anatomy';
import type { ContratAchat } from '@app/achats/models';

import { buildContratColumns } from './columns';
import { buildContratFilters } from './filters';
import { ROUTES } from './routes';

export function buildContratsListingConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildListingConfig<ContratAchat>(
    {
      entityName: tr('achats.contrat.entityName'),
      entityNamePlural: tr('achats.contrat.entityNamePlural'),
      columns: buildContratColumns(t),
      routes: ROUTES,
      permissionPrefix: 'achats.contrat',
    },
    {
      filters: buildContratFilters(t),
      segments: [
        { id: 'ALL', label: 'achats.contrat.chips.all' },
        { id: 'ACTIFS', label: 'achats.contrat.chips.actifs', filters: { quick: 'ACTIFS' } },
        { id: 'EXPIRATION_PROCHE', label: 'achats.contrat.chips.expirationProche', filters: { quick: 'EXPIRATION_PROCHE' } },
        { id: 'ECHUS', label: 'achats.contrat.chips.echus', filters: { quick: 'ECHUS' } },
      ],
      defaultSegment: 'ACTIFS',
      defaultSort: { column: 'dateDebut', direction: 'desc' },
      features: { search: true, filters: true, columnToggle: true, refresh: true },
      emptyState: {
        icon: 'file-check',
        title: tr('achats.contrat.list.emptyState.title'),
        message: tr('achats.contrat.list.emptyState.message'),
        actionLabel: tr('achats.contrat.list.emptyState.actionLabel'),
        actionId: 'create',
      },
    },
  );
}
