import type { TranslateService } from '@ngx-translate/core';

import { buildListingConfig } from '@platform/lib/anatomy';
import type { Situation } from '@app/chantiers/models';

import { buildSituationsColumns } from './columns';
import { FILTERS } from './filters';
import { ROUTES } from './routes';

export function buildSituationsListingConfig(t: TranslateService) {
  return buildListingConfig<Situation>(
    {
      entityName: 'Situation',
      entityNamePlural: t.instant('chantiers.situation.title'),
      columns: buildSituationsColumns(t),
      routes: ROUTES,
      permissionPrefix: 'chantiers.situation',
    },
    {
      filters: FILTERS,
      segments: [
        { id: 'ALL', label: 'Toutes' },
        { id: 'BROUILLON', label: 'Brouillons', filters: { quick: 'BROUILLON' } },
        { id: 'A_VALIDER', label: 'À valider', filters: { quick: 'A_VALIDER' } },
        { id: 'A_FACTURER', label: 'À facturer', filters: { quick: 'A_FACTURER' } },
        { id: 'EN_RETARD_PAIEMENT', label: 'En retard paiement', filters: { quick: 'EN_RETARD_PAIEMENT' } },
        { id: 'MES_SITUATIONS', label: 'Mes situations', filters: { quick: 'MES_SITUATIONS' } },
      ],
      defaultSort: { column: 'dateEmission', direction: 'desc' },
      features: {
        search: true,
        filters: true,
        columnToggle: true,
        viewModeToggle: false,
        importExport: true,
        refresh: true,
      },
      emptyState: {
        icon: 'description',
        title: 'Aucune situation',
        message:
          'Émettez vos décomptes mensuels par chantier pour suivre les facturations progressives.',
        actionLabel: 'Nouvelle situation',
        actionId: 'create',
      },
    },
  );
}
