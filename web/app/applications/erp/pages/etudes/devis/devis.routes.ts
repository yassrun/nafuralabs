import { Routes } from '@angular/router';
import { unsavedChangesGuard } from '@core/guards/unsaved-changes.guard';


export const DEVIS_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./devis-listing').then((m) => m.DevisListingPage),
    data: { title: 'Devis', breadcrumb: 'Devis' },
  },
  {
    path: 'from-dpgf/:dpgfId',
    loadComponent: () =>
      import('./devis-from-dpgf/devis-from-dpgf.page').then((m) => m.DevisFromDpgfPage),
    data: { title: 'Devis depuis DPGF', breadcrumb: 'DPGF' },
  },
  {
    path: 'new',
    canDeactivate: [unsavedChangesGuard],
    loadComponent: () => import('./devis-detail').then((m) => m.DevisDetailPage),
    data: { title: 'Nouveau devis', breadcrumb: 'Nouveau' },
  },
  {
    path: ':id',
    loadComponent: () => import('./devis-detail').then((m) => m.DevisDetailPage),
    data: { title: 'Détail devis', breadcrumb: 'Détail' },
  },
];
