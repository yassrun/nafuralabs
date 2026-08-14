import { Routes } from '@angular/router';

export const AVANCEMENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./avancements-listing/avancements-listing.page').then(
        (m) => m.AvancementsListingPage,
      ),
    data: {
      titleKey: 'chantiers.avancement.listing.headerTitle',
      breadcrumbKey: 'chantiers.avancement.listing.breadcrumb',
    },
  },
  {
    path: 'saisie',
    loadComponent: () =>
      import('./avancement-saisie/avancement-saisie.page').then(
        (m) => m.AvancementSaisiePage,
      ),
    data: {
      titleKey: 'chantiers.avancement.title',
      breadcrumbKey: 'chantiers.avancement.saisie.breadcrumb',
    },
  },
  {
    path: 'saisie/:chantierId',
    loadComponent: () =>
      import('./avancement-saisie/avancement-saisie.page').then(
        (m) => m.AvancementSaisiePage,
      ),
    data: {
      titleKey: 'chantiers.avancement.title',
      breadcrumbKey: 'chantiers.avancement.saisie.breadcrumb',
    },
  },
];
