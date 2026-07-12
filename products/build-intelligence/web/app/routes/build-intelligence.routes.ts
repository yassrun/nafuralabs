import { Routes } from '@angular/router';

export const BUILD_INTELLIGENCE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/documents/documents.page').then((m) => m.DocumentsPage),
  },
  {
    path: 'review',
    loadComponent: () =>
      import('../pages/review/review.page').then((m) => m.ReviewPage),
  },
  {
    path: 'catalog',
    loadComponent: () =>
      import('../pages/catalog/catalog.page').then((m) => m.CatalogPage),
  },
  {
    path: 'search',
    loadComponent: () =>
      import('../pages/search/search.page').then((m) => m.SearchPage),
  },
  {
    path: 'generation',
    loadComponent: () =>
      import('../pages/generation/generation.page').then((m) => m.GenerationPage),
  },
];
