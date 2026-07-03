/**
 * UnitOfMeasure Routes — Generated once (wrapper file).
 */

import { Routes } from '@angular/router';

export const UNIT_OF_MEASURE_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./unit-of-measure-listing').then(m => m.UnitOfMeasureListingPage),
        data: { title: 'Unit Of Measures', breadcrumb: 'Unit Of Measures' },
      },
      {
        path: 'new',
        loadComponent: () =>
          import('./unit-of-measure-detail').then(m => m.UnitOfMeasureDetailPage),
        data: { title: 'New Unit Of Measure', breadcrumb: 'New' },
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./unit-of-measure-detail').then(m => m.UnitOfMeasureDetailPage),
        data: { title: 'Edit Unit Of Measure', breadcrumb: 'Edit' },
      },
    ],
  },
];
