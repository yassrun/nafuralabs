import type { TranslateService } from '@ngx-translate/core';

import { buildListingConfig } from '@platform/lib/anatomy';
import type { AppelOffre } from '@app/achats/models';

import { buildAoColumns } from './columns';
import { buildAoFilters } from './filters';
import { ROUTES } from './routes';

export function buildAoListingConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildListingConfig<AppelOffre>(
    {
      entityName: tr('achats.appelOffre.entityName'),
      entityNamePlural: tr('achats.appelOffre.entityNamePlural'),
      columns: buildAoColumns(t),
      routes: ROUTES,
      permissionPrefix: 'achats.ao',
    },
    {
      filters: buildAoFilters(t),
      segments: [
        { id: 'ALL', label: 'achats.appelOffre.chips.all' },
        { id: 'EN_COURS', label: 'achats.appelOffre.chips.enCours', filters: { quick: 'EN_COURS' } },
        { id: 'A_CLOTURER', label: 'achats.appelOffre.chips.aCloturer', filters: { quick: 'A_CLOTURER' } },
        { id: 'ATTRIBUES', label: 'achats.appelOffre.chips.attribues', filters: { quick: 'ATTRIBUES' } },
      ],
      defaultSort: { column: 'createdAt', direction: 'desc' },
      features: { search: true, filters: true, columnToggle: true, refresh: true },
      emptyState: {
        icon: 'clipboard-list',
        title: tr('achats.appelOffre.list.emptyState.title'),
        message: tr('achats.appelOffre.list.emptyState.message'),
        actionLabel: tr('achats.appelOffre.list.emptyState.actionLabel'),
        actionId: 'create',
      },
    },
  );
}
