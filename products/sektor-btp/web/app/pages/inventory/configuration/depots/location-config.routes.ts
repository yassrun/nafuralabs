import { Routes } from '@angular/router';

export const LOCATION_CONFIG_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./location-listing').then((m) => m.LocationListingPage),
        data: { title: 'inventory.routes.depots.title', breadcrumb: 'inventory.routes.depots.breadcrumb' },
      },
      {
        path: 'new',
        loadComponent: () =>
          import('./location-detail').then((m) => m.LocationDetailPage),
        data: { title: 'inventory.routes.depots.new', breadcrumb: 'inventory.routes.articles.newBreadcrumb' },
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./location-detail').then((m) => m.LocationDetailPage),
        data: { title: 'inventory.routes.depots.detail', breadcrumb: 'inventory.routes.articles.detailBreadcrumb' },
      },
    ],
  },
];
