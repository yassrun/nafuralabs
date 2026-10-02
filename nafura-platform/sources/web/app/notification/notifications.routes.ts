import { Routes } from '@angular/router';

/** The signed-in user's own inbox: no permission (the API is scoped to the recipient). */
export const NOTIFICATIONS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./notification-center.page').then((m) => m.NotificationCenterPage),
    data: {
      title: 'notifications.center.title',
    },
  },
];
