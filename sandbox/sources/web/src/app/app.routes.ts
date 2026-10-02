import { Injectable } from '@angular/core';
import {
  Routes,
  type RouteReuseStrategy,
  type ActivatedRouteSnapshot,
  type DetachedRouteHandle,
} from '@angular/router';

import { LabLoginPage, labAuthGuard } from '@platform/platform/lab-auth';
import { SandboxShellComponent } from './sandbox-shell.component';
import { HomePage } from './pages/home.page';
import { BcSlotPage } from './pages/bc-slot.page';
import { PlatformNotificationCenterComponent } from '@platform/platform/notifications';

/** Remount when params/data change so sidebar clicks always refresh the view. */
@Injectable()
export class SandboxNoReuseStrategy implements RouteReuseStrategy {
  shouldDetach(_route: ActivatedRouteSnapshot): boolean {
    return false;
  }
  store(_route: ActivatedRouteSnapshot, _handle: DetachedRouteHandle | null): void {}
  shouldAttach(_route: ActivatedRouteSnapshot): boolean {
    return false;
  }
  retrieve(_route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    return null;
  }
  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    return (
      future.routeConfig === curr.routeConfig &&
      future.paramMap.get('name') === curr.paramMap.get('name') &&
      future.paramMap.get('id') === curr.paramMap.get('id') &&
      future.data['title'] === curr.data['title']
    );
  }
}

export const APP_ROUTES: Routes = [
  { path: 'login', component: LabLoginPage },
  {
    path: '',
    component: SandboxShellComponent,
    canActivate: [labAuthGuard],
    children: [
      { path: '', component: HomePage },
      {
        path: 'showroom',
        loadChildren: () =>
          import('./bc/showroom/showroom.routes').then((m) => m.SHOWROOM_ROUTES),
      },
      {
        path: 'achats',
        component: BcSlotPage,
        data: { title: 'Achats' },
      },
      {
        path: 'chantiers',
        component: BcSlotPage,
        data: { title: 'Chantiers' },
      },
      { path: 'notifications', component: PlatformNotificationCenterComponent },
      {
        path: 'user-settings',
        loadChildren: () =>
          import('@platform/features/user-settings/user-settings.routes').then(
            (m) => m.USER_SETTINGS_ROUTES,
          ),
      },
      {
        path: 'organization',
        children: [
          {
            path: 'settings',
            loadChildren: () =>
              import('@platform/features/app-settings/app-settings.routes').then(
                (m) => m.APP_SETTINGS_ROUTES,
              ),
          },
          {
            path: 'identity',
            loadChildren: () =>
              import('@platform/features/organization-identity/organization-identity.routes').then(
                (m) => m.ORGANIZATION_IDENTITY_ROUTES,
              ),
          },
        ],
      },
      {
        path: 'administration/settings',
        redirectTo: '/organization/settings',
        pathMatch: 'full',
      },
      {
        path: 'administration/documents/templates',
        loadChildren: () =>
          import('@platform/features/administration/templates/templates.routes').then(
            (m) => m.TEMPLATES_ROUTES,
          ),
      },
      {
        path: 'administration/numbering-sequences',
        loadChildren: () =>
          import(
            '@platform/features/administration/numbering-sequences/numbering-sequences.routes'
          ).then((m) => m.NUMBERING_SEQUENCES_ROUTES),
      },
      { path: '**', redirectTo: '' },
    ],
  },
];
