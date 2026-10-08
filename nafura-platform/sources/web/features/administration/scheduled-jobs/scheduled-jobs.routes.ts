import { Routes } from '@angular/router';

import { routePermissionGuard } from '@core/security/guards/permission.guard';
import { ListingPageComponent } from '../../../platform/listing';
import { SCHEDULED_JOBS_LISTING } from './scheduled-jobs.listing';

export const SCHEDULED_JOBS_ROUTES: Routes = [
  {
    path: '',
    component: ListingPageComponent,
    canActivate: [routePermissionGuard],
    data: {
      permissions: ['administration.operations.scheduled-jobs.read'],
      title: 'administration.scheduledJobs.title',
      listing: SCHEDULED_JOBS_LISTING,
    },
  },
  {
    path: ':key',
    loadComponent: () =>
      import('./scheduled-job-detail.page').then((m) => m.ScheduledJobDetailPage),
    canActivate: [routePermissionGuard],
    data: {
      permissions: ['administration.operations.scheduled-jobs.read'],
      title: 'administration.scheduledJobs.detail.title',
    },
  },
];
