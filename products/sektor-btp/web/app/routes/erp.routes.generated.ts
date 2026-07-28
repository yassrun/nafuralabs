/**
 * Auto-generated application routes for 'erp'.
 * Source: naf/src/spec/applications/erp/erp.application.json + domains
 * Do not edit manually.
 */

import { Routes } from '@angular/router';

import { CHANTIERS_ROUTES } from '@app/features/chantiers/chantiers.routes';
import { STOCK_BTP_ROUTES } from '@app/features/stock/stock.routes';
import { ETUDES_ROUTES } from '@app/features/etudes/etudes.routes';
import { FINANCE_ROUTES } from '@app/features/finance/finance.routes';
import { VENTES_ROUTES } from '@app/features/ventes/ventes.routes';
import { ACHATS_ROUTES } from '@app/features/achats/achats.routes';
import { RH_ROUTES } from '@app/features/rh/rh.routes';
import { HSE_ROUTES } from '@app/features/hse/hse.routes';
import { ANALYTICS_ROUTES } from '@app/features/analytics/analytics.routes';
import { MARCHES_ROUTES } from '@app/features/marches/marches.routes';
import { APPROBATIONS_ERP_ROUTES } from '@app/features/approbations/approbations.routes';
import { PILOTAGE_ROUTES } from '@app/features/pilotage/pilotage.routes';

export const ERP_ROUTES: Routes = [
  {
    path: 'finance/configuration/currencies',
    loadChildren: () => import('@app/features/finance/pages/configuration/currencies/currency.routes').then(m => m.CURRENCY_ROUTES),
  },
  {
    path: 'stock/mouvements/inventory-txes',
    loadChildren: () => import('@app/features/stock/pages/mouvements/inventory-txes/inventory-tx.routes').then(m => m.INVENTORY_TX_ROUTES),
  },
  {
    path: 'stock/configuration/item-categories',
    loadChildren: () => import('@app/features/stock/pages/configuration/item-categories/item-category.routes').then(m => m.ITEM_CATEGORY_ROUTES),
  },
  {
    path: 'finance/configuration/exchange-rates',
    loadChildren: () => import('@app/features/finance/pages/configuration/exchange-rates/exchange-rate.routes').then(m => m.EXCHANGE_RATE_ROUTES),
  },
  {
    path: 'stock/suivi/stock-balances',
    loadChildren: () => import('@app/features/stock/pages/suivi/stock-balances/stock-balance.routes').then(m => m.STOCK_BALANCE_ROUTES),
  },
  {
    path: 'stock/configuration/item-types',
    loadChildren: () => import('@app/features/stock/pages/configuration/item-types/item-type.routes').then(m => m.ITEM_TYPE_ROUTES),
  },
  {
    path: 'stock/catalogue/items',
    loadChildren: () => import('@app/features/stock/pages/catalogue/items/item.routes').then(m => m.ITEM_ROUTES),
  },
  {
    path: 'stock/units-of-measure',
    loadChildren: () => import('@app/features/stock/pages/configuration/unit-of-measures/unit-of-measure.routes').then(m => m.UNIT_OF_MEASURE_ROUTES),
  },
  {
    path: 'stock/configuration/unit-of-measures',
    loadChildren: () => import('@app/features/stock/pages/configuration/unit-of-measures/unit-of-measure.routes').then(m => m.UNIT_OF_MEASURE_ROUTES),
  },
  {
    path: 'stock/configuration/uo-mcategories',
    loadChildren: () => import('@app/features/stock/pages/configuration/uo-mcategories/uo-mcategory.routes').then(m => m.UO_MCATEGORY_ROUTES),
  },
  {
    path: 'finance/configuration/payment-terms',
    loadChildren: () => import('@app/features/finance/pages/configuration/payment-terms/payment-term.routes').then(m => m.PAYMENT_TERM_ROUTES),
  },
  {
    path: 'chantiers/budget',
    loadChildren: () => import('@app/features/chantiers/pages/budget/budget-chantier.routes').then(m => m.BUDGET_CHANTIER_ROUTES),
  },
  {
    path: 'stock/catalogue/item-prices',
    loadChildren: () => import('@app/features/stock/pages/catalogue/item-prices/item-price.routes').then(m => m.ITEM_PRICE_ROUTES),
  },
  {
    path: 'stock/mouvements/inventory-tx-lines',
    loadChildren: () => import('@app/features/stock/pages/mouvements/inventory-tx-lines/inventory-tx-line.routes').then(m => m.INVENTORY_TX_LINE_ROUTES),
  },
  ...CHANTIERS_ROUTES,
  ...STOCK_BTP_ROUTES,
  ...ETUDES_ROUTES,
  ...VENTES_ROUTES,
  ...MARCHES_ROUTES,
  ...APPROBATIONS_ERP_ROUTES,
  ...PILOTAGE_ROUTES,
  ...ACHATS_ROUTES,
  ...RH_ROUTES,
  ...HSE_ROUTES,
  ...ANALYTICS_ROUTES,
  {
    path: 'dashboard',
    loadComponent: () =>
      import('@app/features/dashboard/pages/dashboard.page').then((m) => m.DashboardPage),
    data: { title: 'Tableau de bord', breadcrumb: 'Accueil' },
  },
  ...FINANCE_ROUTES,
];
