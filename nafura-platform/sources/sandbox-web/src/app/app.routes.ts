import { Injectable } from '@angular/core';
import {
  Routes,
  type RouteReuseStrategy,
  type ActivatedRouteSnapshot,
  type DetachedRouteHandle,
} from '@angular/router';

import { HomePage } from './pages/home.page';
import { StubPage } from './pages/stub.page';
import { ListingFlatPage } from './archetypes/listing-flat.page';
import { ProductDetailPage } from './archetypes/product-detail.page';
import { Details1nPage } from './archetypes/details-1n.page';
import { MasterSlavePage } from './archetypes/master-slave.page';
import { ListingTreePage } from './archetypes/listing-tree.page';
import { ComponentDemoPage } from './components/component-demo.page';

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
  { path: '', component: HomePage },
  { path: 'archetypes/listing', component: ListingFlatPage },
  { path: 'archetypes/listing-tree', component: ListingTreePage },
  { path: 'archetypes/details/:id', component: ProductDetailPage },
  { path: 'archetypes/details-1n/:id', component: Details1nPage },
  { path: 'archetypes/master-slave', component: MasterSlavePage },
  { path: 'archetypes/tree', redirectTo: 'archetypes/listing-tree', pathMatch: 'full' },
  {
    path: 'archetypes/wizard',
    component: StubPage,
    data: { title: 'nf-wizard', hint: 'ConfigDrivenWizardPage' },
  },
  {
    path: 'archetypes/settings',
    component: StubPage,
    data: { title: 'nf-settings', hint: 'ConfigDrivenSettingsPage' },
  },
  {
    path: 'archetypes/dashboard',
    component: StubPage,
    data: { title: 'nf-dashboard', hint: 'ConfigDrivenDashboardPage' },
  },
  {
    path: 'archetypes/document-workspace',
    component: StubPage,
    data: { title: 'nf-document-workspace', hint: 'ConfigDrivenDocumentWorkspacePage' },
  },
  { path: 'components/atoms/:name', component: ComponentDemoPage },
  { path: 'components/molecules/:name', component: ComponentDemoPage },
  { path: 'components/organisms/:name', component: ComponentDemoPage },
  { path: '**', redirectTo: '' },
];
