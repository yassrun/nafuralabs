import { Routes } from '@angular/router';

export const AO_ROUTES: Routes = [
  { path: '', pathMatch: 'full', loadComponent: () => import('./ao-listing').then((m) => m.AoListingPage), data: { title: 'achats.routes.aoListTitle', breadcrumb: 'achats.routes.aoListCrumb' } },
  { path: 'new', loadComponent: () => import('./ao-detail').then((m) => m.AoDetailPage), data: { title: 'achats.routes.aoNewTitle', breadcrumb: 'achats.routes.aoNewCrumb' } },
  {
    path: ':id/comparatif',
    loadComponent: () => import('./ao-comparatif/ao-comparatif.page').then((m) => m.AoComparatifPage),
    data: { title: 'achats.routes.aoComparatifTitle', breadcrumb: 'achats.routes.aoComparatifCrumb' },
  },
  { path: ':id/edit', loadComponent: () => import('./ao-detail').then((m) => m.AoDetailPage), data: { title: 'achats.routes.aoEditTitle', breadcrumb: 'achats.routes.aoEditCrumb', editMode: true } },
  { path: ':id', loadComponent: () => import('./ao-detail').then((m) => m.AoDetailPage), data: { title: 'achats.routes.aoDetailTitle', breadcrumb: 'achats.routes.aoDetailCrumb' } },
];
