import { Routes } from '@angular/router';

export const MOTIF_MOUVEMENT_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./motif-listing').then((m) => m.MotifListingPage),
        data: { title: 'inventory.routes.motifs.title', breadcrumb: 'inventory.routes.motifs.breadcrumb' },
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./motif-detail').then((m) => m.MotifDetailPage),
        data: { title: 'inventory.routes.motifs.detail', breadcrumb: 'inventory.routes.articles.detailBreadcrumb' },
      },
    ],
  },
];
