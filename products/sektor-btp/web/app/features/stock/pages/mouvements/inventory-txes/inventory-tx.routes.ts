/**
 * InventoryTx Routes — Generated once (wrapper file).
 */

import { Routes } from '@angular/router';

export const INVENTORY_TX_ROUTES: Routes = [
  {
    path: 'new',
    loadComponent: () =>
      import('./inventory-tx/inventory-tx.page').then((m) => m.InventoryTxPage),
    data: {
      titleKey: 'inventory.mouvement.tx.titleNew',
      breadcrumbKey: 'inventory.mouvement.tx.titleNew',
    },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./inventory-tx/inventory-tx.page').then((m) => m.InventoryTxPage),
    data: {
      titleKey: 'inventory.mouvement.tx.titleDetail',
      breadcrumbKey: 'inventory.mouvement.tx.titleDetail',
    },
  },
  {
    path: '',
    loadComponent: () =>
      import('./inventory-tx/inventory-tx.page').then((m) => m.InventoryTxPage),
    data: { titleKey: 'inventory.mouvement.tx.title', breadcrumbKey: 'inventory.mouvement.tx.title' },
  },
];
