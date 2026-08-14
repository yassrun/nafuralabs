/**
 * Default Listing Actions Configuration
 *
 * Standard CRUD actions that most entity listings will use.
 * Individual entities can override, add, or hide actions using the builder.
 */

import type { EntityActionConfig } from '../types';

/**
 * Default actions for entity listings.
 * Provides standard CRUD operations that can be customized per entity.
 */
export const DEFAULT_LISTING_ACTIONS: EntityActionConfig<any>[] = [
  // ─── Global Actions (Always Visible) ───────────────────────────────────────
  {
    id: 'new',
    label: 'listing.action.new',
    icon: 'plus',
    scope: 'global',
    variant: 'primary',
    ariaLabel: 'listing.action.newAria',
  },

  // ─── Single Selection Actions ──────────────────────────────────────────────
  {
    id: 'edit',
    label: '',
    icon: 'edit',
    scope: 'single',
    builtin: 'edit',
    variant: 'tertiary',
    ariaLabel: 'Edit',
  },
  {
    id: 'duplicate',
    label: '',
    icon: 'copy-plus',
    scope: 'single',
    builtin: 'duplicate',
    variant: 'tertiary',
    ariaLabel: 'Duplicate',
  },

  // ─── Single + Bulk Actions ─────────────────────────────────────────────────
  {
    id: 'delete',
    label: '',
    icon: 'trash-2',
    scope: 'single+bulk',
    builtin: 'delete',
    variant: 'danger',
    confirm: true,
    ariaLabel: 'Delete',
  },
];
