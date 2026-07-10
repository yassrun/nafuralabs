/**
 * Auto-generated application routes for 'erp'.
 * Source: naf/src/spec/applications/erp/erp.application.json + domains
 * Do not edit manually.
 */

import { Routes } from '@angular/router';

import { CHANTIERS_ROUTES } from '../chantiers/chantiers.routes';
import { INVENTORY_BTP_ROUTES } from '../inventory/inventory.routes';
import { ETUDES_ROUTES } from '../etudes/etudes.routes';
import { FINANCE_ROUTES } from '../finance/finance.routes';
import { VENTES_ROUTES } from '../ventes/ventes.routes';
import { ACHATS_ROUTES } from '../achats/achats.routes';
import { RH_ROUTES } from '../rh/rh.routes';
import { HSE_ROUTES } from '../hse/hse.routes';
import { ANALYTICS_ROUTES } from '../analytics/analytics.routes';
import { MARCHES_ROUTES } from '../marches/marches.routes';
import { APPROBATIONS_ERP_ROUTES } from '../approbations/approbations.routes';
import { PILOTAGE_ROUTES } from '../pilotage/pilotage.routes';

export const ERP_ROUTES: Routes = [
  {
    path: 'finance/configuration/currencies',
    loadChildren: () => import('../pages/finance/configuration/currencies/currency.routes').then(m => m.CURRENCY_ROUTES),
  },
  {
    path: 'inventory/mouvements/inventory-txes',
    loadChildren: () => import('../pages/inventory/mouvements/inventory-txes/inventory-tx.routes').then(m => m.INVENTORY_TX_ROUTES),
  },
  {
    path: 'inventory/configuration/item-categories',
    loadChildren: () => import('../pages/inventory/configuration/item-categories/item-category.routes').then(m => m.ITEM_CATEGORY_ROUTES),
  },
  {
    path: 'finance/configuration/exchange-rates',
    loadChildren: () => import('../pages/finance/configuration/exchange-rates/exchange-rate.routes').then(m => m.EXCHANGE_RATE_ROUTES),
  },
  {
    path: 'inventory/suivi/stock-balances',
    loadChildren: () => import('../pages/inventory/suivi/stock-balances/stock-balance.routes').then(m => m.STOCK_BALANCE_ROUTES),
  },
  {
    path: 'inventory/configuration/item-types',
    loadChildren: () => import('../pages/inventory/configuration/item-types/item-type.routes').then(m => m.ITEM_TYPE_ROUTES),
  },
  {
    path: 'inventory/catalogue/items',
    loadChildren: () => import('../pages/inventory/catalogue/items/item.routes').then(m => m.ITEM_ROUTES),
  },
  {
    path: 'inventory/units-of-measure',
    loadChildren: () => import('../pages/inventory/configuration/unit-of-measures/unit-of-measure.routes').then(m => m.UNIT_OF_MEASURE_ROUTES),
  },
  {
    path: 'inventory/configuration/unit-of-measures',
    loadChildren: () => import('../pages/inventory/configuration/unit-of-measures/unit-of-measure.routes').then(m => m.UNIT_OF_MEASURE_ROUTES),
  },
  {
    path: 'inventory/configuration/uo-mcategories',
    loadChildren: () => import('../pages/inventory/configuration/uo-mcategories/uo-mcategory.routes').then(m => m.UO_MCATEGORY_ROUTES),
  },
  {
    path: 'finance/configuration/payment-terms',
    loadChildren: () => import('../pages/finance/configuration/payment-terms/payment-term.routes').then(m => m.PAYMENT_TERM_ROUTES),
  },
  {
    path: 'chantiers/budget',
    loadChildren: () => import('../pages/chantiers/budget/budget-chantier.routes').then(m => m.BUDGET_CHANTIER_ROUTES),
  },
  {
    path: 'inventory/catalogue/item-prices',
    loadChildren: () => import('../pages/inventory/catalogue/item-prices/item-price.routes').then(m => m.ITEM_PRICE_ROUTES),
  },
  {
    path: 'inventory/mouvements/inventory-tx-lines',
    loadChildren: () => import('../pages/inventory/mouvements/inventory-tx-lines/inventory-tx-line.routes').then(m => m.INVENTORY_TX_LINE_ROUTES),
  },
  ...CHANTIERS_ROUTES,
  ...INVENTORY_BTP_ROUTES,
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
      import('../pages/dashboard/dashboard.page').then((m) => m.DashboardPage),
    data: { title: 'Tableau de bord', breadcrumb: 'Accueil' },
  },
  ...FINANCE_ROUTES,
];
