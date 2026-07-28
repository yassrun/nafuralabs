/**
 * État des Stocks — Column Configuration
 */

import type { ColumnConfig } from '@lib/anatomy/types';
import type { TranslateService } from '@ngx-translate/core';

export function buildEtatStocksColumns(t: TranslateService): ColumnConfig[] {
  return [
    {
      key: 'articleCode',
      label: t.instant('inventory.suivi.etatStock.columns.articleCode'),
      field: 'articleCode',
      sortable: true,
      width: '120px',
    },
    {
      key: 'articleName',
      label: t.instant('inventory.suivi.etatStock.columns.articleName'),
      field: 'articleName',
      sortable: true,
    },
    {
      key: 'familleName',
      label: t.instant('inventory.suivi.etatStock.columns.familleName'),
      field: 'familleName',
      sortable: true,
      width: '140px',
    },
    {
      key: 'location',
      label: t.instant('inventory.suivi.etatStock.columns.locationName'),
      field: 'locationName',
      sortable: true,
    },
    {
      key: 'locationType',
      label: t.instant('inventory.suivi.etatStock.columns.locationType'),
      field: 'locationType',
      width: '90px',
    },
    {
      key: 'quantityAvailable',
      label: t.instant('inventory.suivi.etatStock.columns.stockAvailable'),
      field: 'quantityAvailable',
      type: 'number',
      sortable: true,
      width: '110px',
    },
    {
      key: 'quantityReserved',
      label: t.instant('inventory.suivi.etatStock.columns.stockReserved'),
      field: 'quantityReserved',
      type: 'number',
      sortable: true,
      width: '110px',
    },
    {
      key: 'quantityTotal',
      label: t.instant('inventory.suivi.etatStock.columns.stockOnHand'),
      field: 'quantityTotal',
      type: 'number',
      sortable: true,
      width: '100px',
    },
    {
      key: 'unit',
      label: t.instant('inventory.suivi.etatStock.columns.uomCode'),
      field: 'unit',
      width: '70px',
    },
    {
      key: 'stockValue',
      label: t.instant('inventory.suivi.etatStock.columns.valueMad'),
      field: 'stockValue',
      type: 'currency',
      sortable: true,
      width: '120px',
    },
    {
      key: 'lastMovementDate',
      label: t.instant('inventory.suivi.etatStock.columns.derniereOperation'),
      field: 'lastMovementDate',
      type: 'date',
      sortable: true,
      width: '110px',
    },
  ];
}
