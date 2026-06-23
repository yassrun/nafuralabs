import { Routes } from '@angular/router';

export const PAIE_ROUTES: Routes = [
  {
    path: 'journal',
    loadComponent: () =>
      import('./paie-journal/paie-journal.page').then((m) => m.PaieJournalPage),
    data: { titleKey: 'rh.routes.paieJournal.title', breadcrumbKey: 'rh.routes.paieJournal.breadcrumb' },
  },
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./paie-listing').then((m) => m.PaieListingPage),
    data: { titleKey: 'rh.routes.paie.title', breadcrumbKey: 'rh.routes.paie.breadcrumb' },
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./paie-detail').then((m) => m.PaieDetailPage),
    data: { titleKey: 'rh.routes.paieNew.title', breadcrumbKey: 'rh.routes.paieNew.breadcrumb' },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./paie-detail').then((m) => m.PaieDetailPage),
    data: { titleKey: 'rh.routes.paieDetail.title', breadcrumbKey: 'rh.routes.paieDetail.breadcrumb' },
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./paie-detail').then((m) => m.PaieDetailPage),
    data: { titleKey: 'rh.routes.paieEdit.title', breadcrumbKey: 'rh.routes.paieEdit.breadcrumb', editMode: true },
  },
  {
    path: 'declarations/damancom',
    loadComponent: () =>
      import('./declarations/damancom.page').then((m) => m.DamancomPage),
    data: { titleKey: 'rh.routes.damancom.title', breadcrumbKey: 'rh.routes.damancom.breadcrumb' },
  },
  {
    path: 'declarations/igr',
    loadComponent: () =>
      import('./declarations/igr-etat-9421.page').then((m) => m.IgrEtat9421Page),
    data: { titleKey: 'rh.routes.etat9421.title', breadcrumbKey: 'rh.routes.etat9421.breadcrumb' },
  },
  {
    path: 'declarations/etat-1208',
    loadComponent: () =>
      import('./declarations/etat-1208.page').then((m) => m.Etat1208Page),
    data: { titleKey: 'rh.routes.etat1208.title', breadcrumbKey: 'rh.routes.etat1208.breadcrumb' },
  },
];
