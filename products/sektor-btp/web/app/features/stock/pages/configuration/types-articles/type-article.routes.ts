import { Routes } from '@angular/router';

export const TYPE_ARTICLE_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./type-article-listing').then((m) => m.TypeArticleListingPage),
        data: { title: 'inventory.routes.typesArticles.title', breadcrumb: 'inventory.routes.typesArticles.breadcrumb' },
      },
      {
        path: 'new',
        loadComponent: () =>
          import('./type-article-detail').then((m) => m.TypeArticleDetailPage),
        data: { title: 'inventory.routes.typesArticles.new', breadcrumb: 'inventory.routes.articles.newBreadcrumb' },
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./type-article-detail').then((m) => m.TypeArticleDetailPage),
        data: { title: 'inventory.routes.typesArticles.detail', breadcrumb: 'inventory.routes.articles.detailBreadcrumb' },
      },
    ],
  },
];
