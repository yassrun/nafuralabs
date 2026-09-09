/**
 * Full Components catalog for the Anatomy showroom.
 * Drives the sidebar + demo routing (`/components/{layer}/{id}`).
 */

export type CatalogLayer = 'atoms' | 'molecules' | 'organisms';
export type CatalogStatus = 'live' | 'partial' | 'stub';

export interface CatalogEntry {
  id: string;
  selector: string;
  layer: CatalogLayer;
  status: CatalogStatus;
  /** Short note shown in nav / stub */
  note?: string;
}

export const CATALOG_ATOMS: CatalogEntry[] = [
  { id: 'button', selector: 'nf-button', layer: 'atoms', status: 'live' },
  { id: 'badge', selector: 'nf-badge', layer: 'atoms', status: 'live' },
  { id: 'input', selector: 'nf-input', layer: 'atoms', status: 'live' },
  { id: 'textarea', selector: 'nf-textarea', layer: 'atoms', status: 'live' },
  { id: 'spinner', selector: 'nf-spinner', layer: 'atoms', status: 'live' },
  { id: 'avatar', selector: 'nf-avatar', layer: 'atoms', status: 'live' },
  { id: 'divider', selector: 'nf-divider', layer: 'atoms', status: 'live' },
  { id: 'skeleton', selector: 'nf-skeleton', layer: 'atoms', status: 'live' },
  { id: 'icon', selector: 'nf-icon', layer: 'atoms', status: 'partial', note: 'sizes + names' },
  { id: 'select', selector: 'nf-select', layer: 'atoms', status: 'live', note: 'native + lookup combo' },
  { id: 'status-badge', selector: 'nf-status-badge', layer: 'atoms', status: 'stub' },
  { id: 'money-input', selector: 'nf-money-input', layer: 'atoms', status: 'stub' },
  { id: 'phone-ma-input', selector: 'nf-phone-ma-input', layer: 'atoms', status: 'stub' },
  { id: 'ice-input', selector: 'nf-ice-input', layer: 'atoms', status: 'stub' },
  { id: 'rib-input', selector: 'nf-rib-input', layer: 'atoms', status: 'stub' },
  { id: 'ville-ma-select', selector: 'nf-ville-ma-select', layer: 'atoms', status: 'stub' },
  { id: 'tooltip', selector: '[nfTooltip]', layer: 'atoms', status: 'partial', note: 'via nf-button tooltip' },
];

export const CATALOG_MOLECULES: CatalogEntry[] = [
  { id: 'alert', selector: 'nf-alert', layer: 'molecules', status: 'live' },
  { id: 'page-header', selector: 'nf-page-header', layer: 'molecules', status: 'live' },
  { id: 'empty-state', selector: 'nf-empty-state', layer: 'molecules', status: 'live' },
  { id: 'error-state', selector: 'nf-error-state', layer: 'molecules', status: 'live' },
  { id: 'loading-state', selector: 'nf-loading-state', layer: 'molecules', status: 'live' },
  { id: 'breadcrumb', selector: 'nf-breadcrumb', layer: 'molecules', status: 'live' },
  { id: 'tabs', selector: 'nf-tabs', layer: 'molecules', status: 'stub' },
  { id: 'button-list', selector: 'nf-button-list', layer: 'molecules', status: 'live' },
  { id: 'action-bar', selector: 'nf-action-bar', layer: 'molecules', status: 'live' },
  { id: 'selection-bar', selector: 'nf-selection-bar', layer: 'molecules', status: 'live' },
  { id: 'search-input', selector: 'nf-search-input', layer: 'molecules', status: 'stub' },
  { id: 'listing-controls', selector: 'nf-listing-controls', layer: 'molecules', status: 'live' },
  { id: 'listing-actions', selector: 'nf-listing-actions', layer: 'molecules', status: 'live', note: 'top-right · + slot nf-smart-import-action' },
  { id: 'action-menu', selector: 'nf-action-menu', layer: 'molecules', status: 'live', note: 'cascade (Status ▸) + overflow ⋯ récursif' },
  { id: 'stat-card', selector: 'nf-stat-card', layer: 'molecules', status: 'stub' },
  { id: 'kpi-strip', selector: 'nf-kpi-strip', layer: 'molecules', status: 'stub' },
  { id: 'address', selector: 'nf-address-form', layer: 'molecules', status: 'stub', note: 'sandbox dédié plus tard' },
  { id: 'filter-builder', selector: 'nf-filter-builder', layer: 'molecules', status: 'partial', note: 'via nf-listing-controls' },
  { id: 'data-state', selector: 'nf-data-state', layer: 'molecules', status: 'stub' },
  { id: 'status-machine', selector: 'nf-status-machine', layer: 'molecules', status: 'stub' },
];

export const CATALOG_ORGANISMS: CatalogEntry[] = [
  { id: 'data-table', selector: 'nf-data-table', layer: 'organisms', status: 'live' },
  { id: 'page-shell', selector: 'nf-page-shell', layer: 'organisms', status: 'live', note: 'layout; full pages → archetypes' },
  { id: 'tree-editor', selector: 'nf-tree-editor', layer: 'organisms', status: 'partial', note: 'plan simple — études = nf-tree-table' },
  { id: 'tree-table', selector: 'nf-tree-table', layer: 'organisms', status: 'live', note: '→ archetype tree (études)' },
  { id: 'master-slave-shell', selector: 'nf-master-slave-shell', layer: 'organisms', status: 'live', note: '→ archetype' },
  { id: 'listing-flat', selector: 'nf-listing-flat', layer: 'organisms', status: 'live', note: 'toolbar + action bar + table + pager' },
  { id: 'listing-tree', selector: 'nf-listing-tree', layer: 'organisms', status: 'live', note: '→ archetype listing-tree' },
  { id: 'entity-listing', selector: 'nf-entity-listing', layer: 'organisms', status: 'partial', note: 'legacy · → listing-flat' },
  { id: 'entity-detail', selector: 'nf-entity-detail', layer: 'organisms', status: 'stub' },
  { id: 'drawer', selector: 'nf-drawer', layer: 'organisms', status: 'stub' },
  { id: 'modal', selector: 'nf-modal', layer: 'organisms', status: 'stub' },
  { id: 'pagination', selector: 'nf-pagination', layer: 'organisms', status: 'stub' },
  { id: 'filter-bar', selector: 'nf-filter-bar', layer: 'organisms', status: 'stub' },
  { id: 'form', selector: 'nf-form', layer: 'organisms', status: 'stub' },
  { id: 'wizard-shell', selector: 'nf-wizard-shell', layer: 'organisms', status: 'stub' },
  { id: 'dashboard-grid', selector: 'nf-dashboard-grid', layer: 'organisms', status: 'stub' },
  { id: 'document-workspace', selector: 'nf-document-workspace-shell', layer: 'organisms', status: 'stub' },
  { id: 'chart', selector: 'nf-chart', layer: 'organisms', status: 'stub' },
  { id: 'toast', selector: 'nf-toast', layer: 'organisms', status: 'stub' },
  { id: 'confirm-dialog', selector: 'nf-confirm-dialog', layer: 'organisms', status: 'stub' },
];

export const CATALOG_ALL: CatalogEntry[] = [
  ...CATALOG_ATOMS,
  ...CATALOG_MOLECULES,
  ...CATALOG_ORGANISMS,
];

export function catalogRoute(entry: CatalogEntry): string {
  if (entry.id === 'tree-table' || entry.id === 'tree-editor' || entry.id === 'listing-tree') {
    return '/archetypes/listing-tree';
  }
  if (entry.id === 'master-slave-shell') return '/archetypes/master-slave';
  if (entry.id === 'entity-listing' || entry.id === 'listing-flat') return '/archetypes/listing';
  return `/components/${entry.layer}/${entry.id}`;
}
