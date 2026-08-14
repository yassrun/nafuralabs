import type { FilterFieldConfig } from '@lib/anatomy/types';
import type { TranslateService } from '@ngx-translate/core';

export function buildAlertesListingFilters(t: TranslateService): FilterFieldConfig[] {
  return [
    {
      key: 'locationId',
      label: t.instant('inventory.suivi.alertes.list.columns.locationName'),
      type: 'select',
      lookupKey: 'locations',
      placeholder: t.instant('inventory.suivi.alertes.list.filters.urgencyPlaceholder'),
    },
    {
      key: 'familleId',
      label: t.instant('inventory.catalogue.article.list.columns.familleName'),
      type: 'select',
      lookupKey: 'familles',
      placeholder: t.instant('inventory.suivi.alertes.list.filters.urgencyPlaceholder'),
    },
    {
      key: 'urgency',
      label: t.instant('inventory.suivi.alertes.list.columns.urgency'),
      type: 'select',
      options: [
        { label: t.instant('inventory.suivi.alertes.list.filters.allArticles'), value: '' },
        { label: t.instant('inventory.suivi.alertes.list.filters.allCritical'), value: 'CRITIQUE' },
        { label: t.instant('inventory.suivi.alertes.list.filters.allInAlert'), value: 'EN_ALERTE' },
      ],
    },
  ];
}
