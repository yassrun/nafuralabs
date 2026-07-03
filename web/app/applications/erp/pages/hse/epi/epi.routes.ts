import { Routes } from '@angular/router';

export const EPI_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./epi-shell.page').then((m) => m.EpiShellPage),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'reference' },
      {
        path: 'reference',
        loadComponent: () =>
          import('./epi-volet.page').then((m) => m.EpiVoletPage),
        data: { epiVolet: 'reference' },
      },
      {
        path: 'attribution',
        loadComponent: () =>
          import('./epi-volet.page').then((m) => m.EpiVoletPage),
        data: { epiVolet: 'attribution' },
      },
      {
        path: 'verification',
        loadComponent: () =>
          import('./epi-volet.page').then((m) => m.EpiVoletPage),
        data: { epiVolet: 'verification' },
      },
    ],
  },
];
