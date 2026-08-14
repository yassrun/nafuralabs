import { Routes } from '@angular/router';

export const FAMILLE_ARTICLE_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./famille-tree').then((m) => m.FamilleTreePage),
        data: { title: 'inventory.routes.familles.title', breadcrumb: 'inventory.routes.familles.breadcrumb' },
      },
      {
        path: 'new',
        loadComponent: () =>
          import('./famille-detail').then((m) => m.FamilleDetailPage),
        data: { title: 'inventory.routes.familles.new', breadcrumb: 'inventory.routes.articles.newBreadcrumb' },
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./famille-detail').then((m) => m.FamilleDetailPage),
        data: { title: 'inventory.routes.familles.detail', breadcrumb: 'inventory.routes.articles.detailBreadcrumb' },
      },
    ],
  },
];
