import { Routes } from '@angular/router';

export const CHANTIER_DOCUMENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./documents-listing/documents-listing.page').then(
        (m) => m.DocumentsListingPage,
      ),
    data: { title: 'Documents chantiers', breadcrumb: 'Documents' },
  },
];
