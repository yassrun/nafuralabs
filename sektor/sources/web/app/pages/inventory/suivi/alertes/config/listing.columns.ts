import type { ColumnConfig } from '@lib/anatomy/types';
import type { TranslateService } from '@ngx-translate/core';

export function buildAlertesListingColumns(t: TranslateService): ColumnConfig[] {
  return [
    {
      key: 'article',
      label: t.instant('inventory.suivi.alertes.list.columns.articleCode'),
      field: 'articleCode',
      type: 'text',
      width: '200px',
      sortable: true,
    },
    {
      key: 'familleName',
      label: t.instant('inventory.catalogue.article.list.columns.familleName'),
      field: 'familleName',
      type: 'text',
      sortable: true,
      width: '140px',
    },
    {
      key: 'locationName',
      label: t.instant('inventory.suivi.alertes.list.columns.locationName'),
      field: 'locationName',
      type: 'text',
      sortable: true,
      width: '180px',
    },
    {
      key: 'currentQty',
      label: t.instant('inventory.suivi.alertes.list.columns.stockOnHand'),
      field: 'currentQty',
      type: 'number',
      sortable: true,
      width: '110px',
    },
    {
      key: 'minQty',
      label: t.instant('inventory.suivi.alertes.list.columns.stockMin'),
      field: 'minQty',
      type: 'number',
      sortable: true,
      width: '100px',
    },
    {
      key: 'shortage',
      label: t.instant('inventory.suivi.alertes.list.columns.deficit'),
      field: 'shortage',
      type: 'number',
      sortable: true,
      width: '100px',
    },
    {
      key: 'urgency',
      label: t.instant('inventory.suivi.alertes.list.columns.urgency'),
      field: 'urgency',
      type: 'badge',
      width: '110px',
      badgeVariant: (value: unknown) => {
        return value === 'CRITIQUE' ? 'danger' : 'warning';
      },
      transform: (value: unknown) => {
        return value === 'CRITIQUE'
          ? t.instant('inventory.enums.alertUrgency.CRITIQUE')
          : t.instant('inventory.enums.alertUrgency.EN_ALERTE');
      },
    },
    {
      key: 'lastReceptionDate',
      label: t.instant('inventory.mouvement.reception.entityName'),
      field: 'lastReceptionDate',
      type: 'date',
      sortable: true,
      width: '130px',
    },
  ];
}
