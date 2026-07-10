/**
 * InventoryTxLine Routes — Generated once (wrapper file).
 */

import { Routes } from '@angular/router';

export const INVENTORY_TX_LINE_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./inventory-tx-line-listing').then(m => m.InventoryTxLineListingPage),
        data: { titleKey: 'inventory.mouvement.txLines.title', breadcrumbKey: 'inventory.mouvement.txLines.title' },
      },
      {
        path: 'new',
        loadComponent: () =>
          import('./inventory-tx-line-detail').then(m => m.InventoryTxLineDetailPage),
        data: { titleKey: 'inventory.mouvement.txLines.new', breadcrumbKey: 'inventory.mouvement.txLines.newBreadcrumb' },
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./inventory-tx-line-detail').then(m => m.InventoryTxLineDetailPage),
        data: { titleKey: 'inventory.mouvement.txLines.edit', breadcrumbKey: 'inventory.mouvement.txLines.editBreadcrumb' },
      },
    ],
  },
];
