import { Routes } from '@angular/router';

export const ANALYTICS_ROUTES: Routes = [
  {
    path: 'analytics',
    pathMatch: 'full',
    redirectTo: 'analytics/chantiers',
  },
  {
    path: 'analytics/chantiers',
    loadComponent: () =>
      import('../pages/analytics/tableau-chantiers/tableau-chantiers.page').then(
        (m) => m.TableauChantiersPage,
      ),
    data: { title: 'Analytics Chantiers', breadcrumb: 'Chantiers' },
  },
  {
    path: 'analytics/achats',
    loadComponent: () =>
      import('../pages/analytics/tableau-achats/tableau-achats.page').then(
        (m) => m.TableauAchatsPage,
      ),
    data: { title: 'Analytics Achats', breadcrumb: 'Achats' },
  },
  {
    path: 'analytics/rh',
    loadComponent: () =>
      import('../pages/analytics/tableau-rh/tableau-rh.page').then(
        (m) => m.TableauRhPage,
      ),
    data: { title: 'Analytics RH', breadcrumb: 'RH' },
  },
  {
    path: 'analytics/hse',
    loadComponent: () =>
      import('../pages/analytics/tableau-hse/tableau-hse.page').then(
        (m) => m.TableauHsePage,
      ),
    data: { title: 'Analytics HSE', breadcrumb: 'HSE' },
  },
  {
    path: 'analytics/stock',
    loadComponent: () =>
      import('../pages/analytics/tableau-stock/tableau-stock.page').then(
        (m) => m.TableauStockPage,
      ),
    data: { title: 'Analytics Stock', breadcrumb: 'Stock' },
  },
  {
    path: 'analytics/financier',
    loadComponent: () =>
      import('../pages/analytics/tableau-financier/tableau-financier.page').then(
        (m) => m.TableauFinancierPage,
      ),
    data: { title: 'Analytics Financier', breadcrumb: 'Financier' },
  },
];
