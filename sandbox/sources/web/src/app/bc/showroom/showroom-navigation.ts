import type { AppShellNavigationSection } from '@platform/platform/app-shell';

import { CATALOG_ALL } from './catalog/sandbox-catalog';

const ARCHETYPE_ITEMS = [
  { id: 'listing', label: 'Listing', route: '/showroom/archetypes/listing', icon: 'list' },
  {
    id: 'listing-tree',
    label: 'Arbre / Listing arborescent',
    route: '/showroom/archetypes/listing-tree',
    icon: 'list-checks',
  },
  {
    id: 'file-slots',
    label: 'File slots',
    route: '/showroom/archetypes/file-slots',
    icon: 'file',
  },
  {
    id: 'master-slave',
    label: 'Master-detail',
    route: '/showroom/archetypes/master-slave',
    icon: 'layout-dashboard',
  },
  {
    id: 'products',
    label: 'Product listing',
    route: '/showroom/archetypes/products',
    icon: 'table-2',
  },
  {
    id: 'product-detail',
    label: 'Product detail',
    route: '/showroom/archetypes/products/prd-01',
    icon: 'file-text',
  },
  {
    id: 'details-1n',
    label: 'Detail 1-N',
    route: '/showroom/archetypes/details/prd-01',
    icon: 'list-ordered',
  },
  {
    id: 'details-tabs',
    label: 'Details tabs 1-N',
    route: '/showroom/archetypes/details-tabs/supplier-01',
    icon: 'layout-dashboard',
  },
] as const;

function componentItems(layer: 'atoms' | 'molecules' | 'organisms') {
  return CATALOG_ALL
    .filter((entry) => entry.layer === layer)
    .map((entry) => ({
      id: `component-${entry.layer}-${entry.id}`,
      label: entry.id,
      route: `/showroom/components/${entry.layer}/${entry.id}`,
      icon: layer === 'atoms' ? 'circle-plus' : layer === 'molecules' ? 'layers' : 'layout-grid',
    }));
}

export const SHOWROOM_NAVIGATION: readonly AppShellNavigationSection[] = [
  { id: 'showroom-archetypes', label: 'Archétypes', items: ARCHETYPE_ITEMS },
  { id: 'showroom-atoms', label: 'Composants · Atomes', items: componentItems('atoms') },
  {
    id: 'showroom-molecules',
    label: 'Composants · Molécules',
    items: componentItems('molecules'),
  },
  {
    id: 'showroom-organisms',
    label: 'Composants · Organismes',
    items: componentItems('organisms'),
  },
];
