import { Routes } from '@angular/router';

export const ARTICLES_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./article-listing').then(m => m.ArticleListingPage),
        data: { title: 'inventory.routes.articles.title', breadcrumb: 'inventory.routes.articles.breadcrumb' },
      },
      {
        path: 'new',
        loadComponent: () =>
          import('./article-detail').then(m => m.ArticleDetailPage),
        data: { title: 'inventory.routes.articles.new', breadcrumb: 'inventory.routes.articles.newBreadcrumb' },
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./article-detail').then(m => m.ArticleDetailPage),
        data: { title: 'inventory.routes.articles.detail', breadcrumb: 'inventory.routes.articles.detailBreadcrumb' },
      },
    ],
  },
];
