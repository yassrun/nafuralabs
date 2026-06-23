/**
 * Default Detail Page Actions Configuration
 *
 * Standard actions for entity detail/form pages.
 * Individual entities can override, add, or hide actions using the builder.
 */

import type { DetailActionConfig } from '../types';

/**
 * Default actions for entity detail pages.
 * Provides standard operations that can be customized per entity.
 */
export const DEFAULT_DETAIL_ACTIONS: DetailActionConfig<any>[] = [
  // ─── Left Side Actions ──────────────────────────────────────────────────────
  // Only back/cancel on left

  {
    id: 'cancel',
    label: '',
    icon: 'arrow-left',
    scope: 'all',
    variant: 'ghost',
    builtin: 'cancel',
    position: 'left',
    ariaLabel: 'Retour',
    tooltip: 'Retour',
  },

  // ─── Right Side Actions ─────────────────────────────────────────────────────
  // All action buttons on right (same style as listing toolbar)

  {
    id: 'delete',
    label: '',
    icon: 'trash-2',
    scope: 'edit+view',
    variant: 'danger',
    builtin: 'delete',
    position: 'right',
    ariaLabel: 'Delete',
    tooltip: 'Delete',
  },
  {
    id: 'duplicate',
    label: '',
    icon: 'copy-plus',
    scope: 'edit+view',
    variant: 'tertiary',
    builtin: 'duplicate',
    position: 'right',
    ariaLabel: 'Duplicate',
    tooltip: 'Duplicate',
  },
  {
    id: 'save',
    label: '',
    icon: 'save',
    scope: 'create+edit',
    variant: 'primary',
    builtin: 'save',
    position: 'right',
    ariaLabel: 'Save',
    tooltip: 'Save changes',
    // Invalid forms stay clickable so Save can surface validation (error summary + touched fields).
    // In edit mode, still require dirty to avoid no-op saves.
    disabled: (ctx) => ctx.mode === 'edit' && !ctx.isDirty,
  },
];
