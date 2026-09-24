import { type Routes } from '@angular/router';

import { Details1nPage } from './archetypes/details-1n.page';
import { FileSlotsPage } from './archetypes/file-slots.page';
import { ListingFlatPage } from './archetypes/listing-flat.page';
import { ListingTreePage } from './archetypes/listing-tree.page';
import { MasterSlavePage } from './archetypes/master-slave.page';
import { ProductDetailPage } from './archetypes/product-detail.page';
import { ProductListingPage } from './archetypes/product-listing.page';
import { TreePage } from './archetypes/tree.page';
import { ComponentDemoPage } from './components/component-demo.page';

export const SHOWROOM_ROUTES: Routes = [
  { path: '', redirectTo: 'archetypes/listing', pathMatch: 'full' },
  { path: 'archetypes/listing', component: ListingFlatPage },
  { path: 'archetypes/listing-tree', component: ListingTreePage },
  { path: 'archetypes/tree', component: TreePage },
  { path: 'archetypes/file-slots', component: FileSlotsPage },
  { path: 'archetypes/master-slave', component: MasterSlavePage },
  { path: 'archetypes/products', component: ProductListingPage },
  { path: 'archetypes/products/:id', component: ProductDetailPage },
  { path: 'archetypes/details/:id', component: Details1nPage },
  { path: 'components/:layer/:id', component: ComponentDemoPage },
];