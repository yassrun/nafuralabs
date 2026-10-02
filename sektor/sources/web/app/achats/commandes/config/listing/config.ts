import type { TranslateService } from '@ngx-translate/core';

import { buildListingConfig } from '@platform/lib/anatomy';
import type { BonCommande } from '@app/achats/models';

import { buildBcColumns } from './columns';
import { buildBcFilters } from './filters';
import { ROUTES } from './routes';

export function buildBcListingConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildListingConfig<BonCommande>(
    {
      entityName: tr('achats.commande.entityName'),
      entityNamePlural: tr('achats.commande.entityNamePlural'),
      columns: buildBcColumns(t),
      routes: ROUTES,
      permissionPrefix: 'achats.commande',
    },
    {
      filters: buildBcFilters(t),
      segments: [
        { id: 'ALL', label: 'achats.commande.chips.all' },
        { id: 'A_VALIDER', label: 'achats.commande.chips.aValider', filters: { quick: 'A_VALIDER' } },
        { id: 'EN_COURS_LIVRAISON', label: 'achats.commande.chips.enCoursLivraison', filters: { quick: 'EN_COURS_LIVRAISON' } },
        { id: 'EN_RETARD', label: 'achats.commande.chips.enRetard', filters: { quick: 'EN_RETARD' } },
        { id: 'A_FACTURER', label: 'achats.commande.chips.aFacturer', filters: { quick: 'A_FACTURER' } },
      ],
      defaultSort: { column: 'dateCreation', direction: 'desc' },
      features: { search: true, filters: true, columnToggle: true, refresh: true },
      emptyState: {
        icon: 'file-text',
        title: tr('achats.commande.list.emptyState.title'),
        message: tr('achats.commande.list.emptyState.message'),
        actionLabel: tr('achats.commande.list.emptyState.actionLabel'),
        actionId: 'create',
      },
    },
  );
}
