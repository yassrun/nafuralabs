import { Routes } from '@angular/router';

export const VIREMENTS_ROUTES: Routes = [
  {
    path: 'remise',
    loadComponent: () =>
      import('./virement-remise/virement-remise.page').then(
        (m) => m.VirementRemisePage,
      ),
    data: { title: 'Remise virements XML', breadcrumb: 'Remise XML' },
  },
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./virement-listing/virement-listing.page').then((m) => m.VirementListingPage),
    data: { title: 'Virements internes', breadcrumb: 'Virements' },
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./virement-detail/virement-detail.page').then((m) => m.VirementDetailPage),
    data: { title: 'Nouveau virement interne', breadcrumb: 'Nouveau' },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./virement-detail/virement-detail.page').then((m) => m.VirementDetailPage),
    data: { title: 'Virement interne', breadcrumb: 'Détail' },
  },
];
