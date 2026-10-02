import type { TranslateService } from '@ngx-translate/core';

import { buildListingConfig } from '@platform/lib/anatomy';
import type { DemandeAchat } from '@app/achats/models';

import { buildDemandeColumns } from './columns';
import { buildDemandeFilters } from './filters';
import { ROUTES } from './routes';

export function buildDemandesListingConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildListingConfig<DemandeAchat>(
    {
      entityName: tr('achats.demande.entityName'),
      entityNamePlural: tr('achats.demande.entityNamePlural'),
      columns: buildDemandeColumns(t),
      routes: ROUTES,
      permissionPrefix: 'achats.demande',
    },
    {
      filters: buildDemandeFilters(t),
      segments: [
        { id: 'ALL', label: 'achats.demande.chips.all' },
        { id: 'A_APPROUVER', label: 'achats.demande.chips.aApprouver', filters: { quick: 'A_APPROUVER' } },
        { id: 'NON_CONVERTIES', label: 'achats.demande.chips.nonConverties', filters: { quick: 'NON_CONVERTIES' } },
        { id: 'URGENT', label: 'achats.demande.chips.urgent', filters: { quick: 'URGENT' } },
        { id: 'MES_DEMANDES', label: 'achats.demande.chips.mesDemandes', filters: { quick: 'MES_DEMANDES' } },
      ],
      defaultSort: { column: 'createdAt', direction: 'desc' },
      features: { search: true, filters: true, columnToggle: true, refresh: true },
      emptyState: {
        icon: 'shopping-cart',
        title: tr('achats.demande.list.emptyState.title'),
        message: tr('achats.demande.list.emptyState.message'),
        actionLabel: tr('achats.demande.list.emptyState.actionLabel'),
        actionId: 'create',
      },
    },
  );
}
