/**
 * ItemCategory Routes — Generated once (wrapper file).
 */

import { Routes } from '@angular/router';

export const ITEM_CATEGORY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./item-category/item-category.page').then(m => m.ItemCategoryPage),
    data: { title: 'Item Category', breadcrumb: 'Item Category' },
  },
];
