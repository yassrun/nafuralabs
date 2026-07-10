import { Routes } from '@angular/router';

export const CHANTIERS_ROUTES: Routes = [
  {
    path: 'chantiers',
    pathMatch: 'full',
    loadComponent: () =>
      import('../pages/chantiers/chantiers-listing/chantiers-listing.page').then(
        (m) => m.ChantiersListingPage,
      ),
    data: { title: 'Mes chantiers', breadcrumb: 'Chantiers' },
  },
  {
    path: 'chantiers/planning',
    loadComponent: () =>
      import('../pages/chantiers/planning/chantiers-planning.page').then(
        (m) => m.ChantiersPlanningPage,
      ),
    data: { title: 'Planning', breadcrumb: 'Planning' },
  },
  {
    path: 'chantiers/avancements',
    loadChildren: () =>
      import('../pages/chantiers/avancements/avancements.routes').then(
        (m) => m.AVANCEMENTS_ROUTES,
      ),
  },
  {
    path: 'chantiers/situations',
    loadChildren: () =>
      import('../pages/chantiers/situations/situations.routes').then(
        (m) => m.SITUATIONS_ROUTES,
      ),
  },
  {
    path: 'chantiers/attachements/saisie',
    loadComponent: () =>
      import('../pages/chantiers/attachements/attachement-saisie/attachement-saisie.page').then(
        (m) => m.AttachementSaisiePage,
      ),
    data: { title: 'Saisie attachement', breadcrumb: 'Saisie' },
  },
  {
    path: 'chantiers/attachements',
    loadComponent: () =>
      import('../pages/chantiers/attachements/attachement-listing/attachement-listing.page').then(
        (m) => m.AttachementListingPage,
      ),
    data: { title: 'Carnets d\'attachement', breadcrumb: 'Attachements' },
  },
  {
    path: 'chantiers/journal',
    loadComponent: () =>
      import('../pages/chantiers/journal/journal-chantier.page').then(
        (m) => m.JournalChantierPage,
      ),
    data: { title: 'Journal de chantier', breadcrumb: 'Journal' },
  },
  {
    path: 'chantiers/sous-traitance',
    loadChildren: () =>
      import('../pages/chantiers/sous-traitance/sous-traitance.routes').then(
        (m) => m.SOUS_TRAITANCE_ROUTES,
      ),
  },
  {
    path: 'chantiers/documents',
    loadChildren: () =>
      import('../pages/chantiers/documents/documents.routes').then(
        (m) => m.CHANTIER_DOCUMENTS_ROUTES,
      ),
  },
  {
    path: 'chantiers/new',
    loadComponent: () =>
      import('../pages/chantiers/create/chantier-create.page').then((m) => m.ChantierCreatePage),
    data: { title: 'Nouveau chantier', breadcrumb: 'Création' },
  },
  {
    path: 'chantiers/:id/edit',
    loadComponent: () =>
      import('../pages/chantiers/edit/chantier-edit.page').then((m) => m.ChantierEditPage),
    data: { title: 'Modifier chantier', breadcrumb: 'Modifier' },
  },
  {
    path: 'chantiers/:id',
    loadComponent: () =>
      import('../pages/chantiers/chantier-detail/chantier-detail.page').then(
        (m) => m.ChantierDetailPage,
      ),
    data: { title: 'Chantier', breadcrumb: 'Détail' },
  },
];
