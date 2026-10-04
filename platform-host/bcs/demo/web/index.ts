import type { BusinessContextManifest } from '@platform/platform/manifest';
import type { HostBusinessContext } from '@platform/platform/host';
import { ListingPageComponent } from '@platform/platform/listing';
import { recordRoute } from '@platform/platform/record';
import { ScreenPageComponent } from '@platform/platform/screen/screen-page.component';
import { routePermissionGuard } from '@platform/core/security/guards/permission.guard';

import manifest from '../bc.manifest.json';
import { SupplierOverviewComponent } from './screens/supplier-overview/supplier-overview.component';
import { CATEGORIES_LISTING } from './categories';
import { ITEMS_LISTING, ITEM_RECORD } from './items';
import { NOTES_LISTING } from './notes.listing';
import { PROJECTS_LISTING, PROJECT_RECORD } from './projects';
import { PURCHASE_REQUESTS_LISTING, PURCHASE_REQUEST_RECORD } from './purchase-requests';
import { SUPPLIERS_LISTING, SUPPLIER_RECORD } from './suppliers';

const listing = (path: string, config: unknown) => ({ path, component: ListingPageComponent, data: { listing: config } });

/** The demo business context: configuration only — every screen is a platform archetype. */
export const demoBusinessContext: HostBusinessContext = {
  manifest: manifest as BusinessContextManifest,
  routes: [
    { path: '', pathMatch: 'full', redirectTo: 'suppliers' },
    listing('suppliers', SUPPLIERS_LISTING),
    recordRoute('suppliers/:id', SUPPLIER_RECORD),
    {
      path: 'suppliers/:id/overview',
      component: ScreenPageComponent,
      canActivate: [routePermissionGuard],
      data: {
        permissions: ['demo.purchasing.supplier.read'],
        screen: {
          id: 'supplier-overview',
          title: 'Synthèse fournisseur',
          icon: 'chart-column',
          back: { label: 'Fournisseur', route: '/demo/suppliers/{id}' },
          component: SupplierOverviewComponent,
        },
      },
    },
    listing('items', ITEMS_LISTING),
    recordRoute('items/:id', ITEM_RECORD),
    listing('categories', CATEGORIES_LISTING),
    listing('purchase-requests', PURCHASE_REQUESTS_LISTING),
    recordRoute('purchase-requests/:id', PURCHASE_REQUEST_RECORD),
    listing('projects', PROJECTS_LISTING),
    recordRoute('projects/:id', PROJECT_RECORD),
    listing('notes', NOTES_LISTING),
  ],
  records: {
    'demo.purchase-request': '/demo/purchase-requests/{id}',
    'demo.project': '/demo/projects/{id}',
  },
};

export default demoBusinessContext;
