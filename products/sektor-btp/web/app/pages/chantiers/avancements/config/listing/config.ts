import type { TranslateService } from '@ngx-translate/core';

import { buildListingConfig } from '@lib/anatomy';

import type { AvancementListItem } from '../../models';
import { buildAvancementColumns } from './columns';
import { buildAvancementFilters } from './filters';
import { ROUTES } from './routes';

export function buildAvancementsListingConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return {
    ...buildListingConfig<AvancementListItem>(
      {
        entityName: tr('chantiers.avancement.entityName'),
        entityNamePlural: tr('chantiers.avancement.entityNamePlural'),
        columns: buildAvancementColumns(t),
        routes: ROUTES,
        permissionPrefix: 'chantiers.avancement',
      },
      {
        filters: buildAvancementFilters(t),
        defaultSort: {
          column: 'date',
          direction: 'desc',
        },
        features: {
          refresh: false,
        },
        customActions: [
          {
            id: 'refresh',
            label: tr('chantiers.avancement.listing.actions.refresh'),
            icon: 'refresh-cw',
            scope: 'global',
            variant: 'secondary',
            permission: 'chantiers.avancement.read',
          },
          {
            id: 'saisir',
            label: tr('chantiers.avancement.listing.actions.saisir'),
            icon: 'plus',
            scope: 'global',
            variant: 'primary',
            permission: 'chantiers.avancement.saisir',
          },
        ],
        emptyState: {
          icon: 'activity',
          title: tr('chantiers.avancement.listing.emptyState.title'),
          message: tr('chantiers.avancement.listing.emptyState.message'),
          actionLabel: tr('chantiers.avancement.listing.emptyState.actionLabel'),
          actionId: 'saisir',
        },
      },
    ),
    rowActions: [
      {
        id: 'voir-photos',
        icon: 'image',
        label: tr('chantiers.avancement.listing.actions.voirPhotos'),
        visible: (item: unknown) => ((item as AvancementListItem).photosCount ?? 0) > 0,
      },
      {
        id: 'modifier',
        icon: 'square-pen',
        label: tr('chantiers.avancement.listing.actions.modifier'),
      },
    ],
  };
}
