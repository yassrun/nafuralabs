import { Routes } from '@angular/router';

export const SOUS_TRAITANCE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./sous-traitance-listing/sous-traitance-listing.page').then(
        (m) => m.SousTraitanceListingPage,
      ),
    data: { title: 'Sous-traitance', breadcrumb: 'Sous-traitance' },
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./sous-traitance-create/sous-traitance-create.page').then(
        (m) => m.SousTraitanceCreatePage,
      ),
    data: { title: 'Nouveau contrat', breadcrumb: 'Création' },
  },
];
