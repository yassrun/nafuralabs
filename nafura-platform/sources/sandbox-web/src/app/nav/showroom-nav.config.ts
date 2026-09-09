/**
 * Configurable showroom sidebar.
 * Archetypes (screen exposition) · Components (full nf-* catalog).
 */

import {
  CATALOG_ATOMS,
  CATALOG_MOLECULES,
  CATALOG_ORGANISMS,
  catalogRoute,
  type CatalogEntry,
} from '../catalog/showroom-catalog';

export type ShowroomNavKind = 'group' | 'link' | 'stub';

export interface ShowroomNavItem {
  id: string;
  label: string;
  kind?: ShowroomNavKind;
  route?: string;
  children?: ShowroomNavItem[];
  status?: 'live' | 'stub' | 'partial';
  description?: string;
}

export interface ShowroomNavSection {
  id: string;
  label: string;
  menu: 'archetypes' | 'components';
  items: ShowroomNavItem[];
}

function fromCatalog(entries: CatalogEntry[]): ShowroomNavItem[] {
  return entries.map((e) => ({
    id: e.id,
    label: e.selector,
    route: catalogRoute(e),
    status: e.status === 'partial' ? 'partial' : e.status,
    description: e.note,
  }));
}

export const SHOWROOM_NAV: ShowroomNavSection[] = [
  {
    id: 'archetypes',
    label: 'Archetypes',
    menu: 'archetypes',
    items: [
      {
        id: 'listing-flat',
        label: 'nf-listing-flat',
        route: '/archetypes/listing',
        status: 'live',
        description: 'Collection à plat · toolbar + pager',
      },
      {
        id: 'listing-tree',
        label: 'nf-listing-tree',
        route: '/archetypes/listing-tree',
        status: 'live',
        description: 'Hiérarchie · header colonnes',
      },
      {
        id: 'details',
        label: 'nf-details',
        route: '/archetypes/details/prd-01',
        status: 'live',
        description: 'Form create / edit / view',
      },
      {
        id: 'details-1n',
        label: 'nf-details-1n',
        route: '/archetypes/details-1n/ord-1042',
        status: 'live',
        description: 'Details + listing embarqué',
      },
      {
        id: 'master-slave',
        label: 'nf-master-slave',
        route: '/archetypes/master-slave',
        status: 'live',
        description: 'Split panes entity-focus',
      },
      {
        id: 'wizard',
        label: 'nf-wizard',
        route: '/archetypes/wizard',
        status: 'stub',
        description: 'Multi-step create',
      },
      {
        id: 'settings',
        label: 'nf-settings',
        route: '/archetypes/settings',
        status: 'stub',
        description: 'Config + save explicite',
      },
      {
        id: 'dashboard',
        label: 'nf-dashboard',
        route: '/archetypes/dashboard',
        status: 'stub',
        description: 'KPI / alertes',
      },
      {
        id: 'document-workspace',
        label: 'nf-document-workspace',
        route: '/archetypes/document-workspace',
        status: 'stub',
        description: 'Doc + lignes + ribbon',
      },
    ],
  },
  {
    id: 'components-atoms',
    label: 'Atoms',
    menu: 'components',
    items: fromCatalog(CATALOG_ATOMS),
  },
  {
    id: 'components-molecules',
    label: 'Molecules',
    menu: 'components',
    items: fromCatalog(CATALOG_MOLECULES),
  },
  {
    id: 'components-organisms',
    label: 'Organisms',
    menu: 'components',
    items: fromCatalog(CATALOG_ORGANISMS),
  },
];

export function flattenNavLinks(sections: ShowroomNavSection[] = SHOWROOM_NAV): ShowroomNavItem[] {
  return sections.flatMap((s) => s.items.filter((i) => !!i.route));
}
