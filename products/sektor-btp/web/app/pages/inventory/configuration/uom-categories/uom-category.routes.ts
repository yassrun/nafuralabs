import { Routes } from '@angular/router';

export const UOM_CATEGORY_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./uom-category-listing').then((m) => m.UomCategoryListingPage),
        data: { title: 'inventory.routes.uomCategories.title', breadcrumb: 'inventory.routes.uomCategories.breadcrumb' },
      },
      {
        path: 'new',
        loadComponent: () =>
          import('./uom-category-detail').then((m) => m.UomCategoryDetailPage),
        data: { title: 'inventory.routes.uomCategories.new', breadcrumb: 'inventory.routes.articles.newBreadcrumb' },
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./uom-category-detail').then((m) => m.UomCategoryDetailPage),
        data: { title: 'inventory.routes.uomCategories.detail', breadcrumb: 'inventory.routes.articles.detailBreadcrumb' },
      },
    ],
  },
];
