import { Routes } from '@angular/router';

export const UOM_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./uom-listing').then((m) => m.UomListingPage),
        data: { title: 'inventory.routes.uom.title', breadcrumb: 'inventory.routes.uom.breadcrumb' },
      },
      {
        path: 'new',
        loadComponent: () =>
          import('./uom-detail').then((m) => m.UomDetailPage),
        data: { title: 'inventory.routes.uom.new', breadcrumb: 'inventory.routes.articles.newBreadcrumb' },
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./uom-detail').then((m) => m.UomDetailPage),
        data: { title: 'inventory.routes.uom.detail', breadcrumb: 'inventory.routes.articles.detailBreadcrumb' },
      },
    ],
  },
];
