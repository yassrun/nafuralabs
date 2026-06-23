import { Routes } from '@angular/router';

import { routePermissionGuard } from '@core/security/guards/permission.guard';

export const SCHEDULED_JOBS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./scheduled-jobs-listing.page').then(
        (m) => m.ScheduledJobsListingPage
      ),
    canActivate: [routePermissionGuard],
    data: {
      permissions: ['administration.scheduled-jobs.read'],
      title: 'administration.scheduledJobs.title',
    },
  },
  {
    path: ':key',
    loadComponent: () =>
      import('./scheduled-job-detail.page').then(
        (m) => m.ScheduledJobDetailPage
      ),
    canActivate: [routePermissionGuard],
    data: {
      permissions: ['administration.scheduled-jobs.read'],
      title: 'administration.scheduledJobs.detail.title',
    },
  },
];

