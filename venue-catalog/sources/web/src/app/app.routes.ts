import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: 'auth/callback',
    loadComponent: () =>
      import('./pages/auth-callback/auth-callback.page').then((m) => m.AuthCallbackPage),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/admin-shell.component').then((m) => m.AdminShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'catalog/search' },
      {
        path: 'catalog/search',
        loadComponent: () =>
          import('./pages/catalog-search/catalog-search.page').then((m) => m.CatalogSearchPage),
      },
      {
        path: 'catalog/places/:placeId',
        loadComponent: () =>
          import('./pages/catalog-place-review/catalog-place-review.page').then(
            (m) => m.CatalogPlaceReviewPage
          ),
      },
    ],
  },
  { path: '**', redirectTo: 'catalog/search' },
];
