import { Routes } from '@angular/router';

/** Personal settings: every signed-in user. */
export const USER_SETTINGS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./user-settings.page').then((m) => m.UserSettingsPage),
    data: {
      title: 'Mes paramètres',
    },
  },
];
