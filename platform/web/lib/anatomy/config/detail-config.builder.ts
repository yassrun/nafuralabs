/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * DETAIL CONFIG BUILDER
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Build detail/form page configurations with sensible defaults.
 * Only override what's different for each entity.
 *
 * ## Architecture
 *
 * ```
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │                        STANDARD CONFIG (this file)                          │
 * │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
 * │  │   Actions   │  │   Layout    │  │  Messages   │  │ Permissions │        │
 * │  │(save,cancel)│  │ (2 cols)    │  │  (auto)     │  │  (auto)     │        │
 * │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
 * └─────────────────────────────────────────────────────────────────────────────┘
 *                                    │
 *                                    ▼
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │                        CUSTOM CONFIG (per entity)                           │
 * │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
 * │  │   Fields    │  │  Sections   │  │   Routes    │  │  Overrides  │        │
 * │  │ (required)  │  │ (optional)  │  │ (required)  │  │ (optional)  │        │
 * │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
 * └─────────────────────────────────────────────────────────────────────────────┘
 * ```
 *
 * ## Quick Start
 *
 * ```typescript
 * // Minimal config
 * export const PRODUCT_DETAIL_CONFIG = buildDetailConfig<Product>({
 *   entityName: 'Product',
 *   permissionPrefix: 'inventory.product',
 *   fields: PRODUCT_FIELDS,
 *   routes: PRODUCT_ROUTES,
 * });
 * ```
 *
 * @module
 */

import type {
  DetailActionConfig,
  DetailPageConfig,
  DetailFieldConfig,
  DetailSectionConfig,
  DetailRouteConfig,
  DetailPageFeatures,
  StatusMachineConfig,
} from '../types';
import { DEFAULT_DETAIL_ACTIONS } from './default-detail-actions.config';

// ═══════════════════════════════════════════════════════════════════════════════
// PERMISSION MAPPING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Standard permission action types for detail page operations.
 * Used to auto-generate permissions from `permissionPrefix`.
 */
const ACTION_PERMISSION_MAP: Record<string, string> = {
  save: 'update', // In edit mode; create mode handled separately
  delete: 'delete',
  duplicate: 'create',
};

// ═══════════════════════════════════════════════════════════════════════════════
// ACTIONS BUILDER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Options for customizing default detail actions.
 *
 * ## Default Actions
 *
 * | ID | Scope | Position | Description |
 * |----|-------|----------|-------------|
 * | cancel | all | left | Go back / cancel |
 * | delete | edit+view | right | Delete item |
 * | duplicate | edit+view | right | Duplicate item |
 * | save | create+edit | right | Save changes |
 *
 * ## Examples
 *
 * ```typescript
 * // Hide delete action
 * actions: { hideActions: ['delete'] }
 *
 * // Add custom action
 * actions: {
 *   appendActions: [{
 *     id: 'archive',
 *     label: 'Archive',
 *     icon: 'archive',
 *     scope: 'edit',
 *     position: 'right',
 *   }]
 * }
 *
 * // Override save label
 * actions: {
 *   overrideActions: {
 *     save: { label: 'Create Product' }
 *   }
 * }
 * ```
 */
export interface DetailActionsOverrides<T> {
  /**
   * Actions to add BEFORE defaults.
   */
  prependActions?: DetailActionConfig<T>[];

  /**
   * Actions to add AFTER defaults.
   */
  appendActions?: DetailActionConfig<T>[];

  /**
   * Action IDs to remove from defaults.
   */
  hideActions?: string[];

  /**
   * Override properties of default actions.
   */
  overrideActions?: Partial<Record<string, Partial<DetailActionConfig<T>>>>;

  /** Alias: actions rendered on the left zone. */
  left?: DetailActionConfig<T>[];

  /** Alias: actions rendered on the right zone. */
  right?: DetailActionConfig<T>[];

  /** Alias of hideActions. */
  hide?: string[];

  /** Alias of overrideActions. */
  override?: Partial<Record<string, Partial<DetailActionConfig<T>>>>;
}

/**
 * Build actions array from defaults with customizations.
 *
 * @param overrides - Action customizations
 * @param permissionPrefix - Permission prefix for auto-generating permissions
 */
export function buildDetailActions<T>(
  overrides: DetailActionsOverrides<T> = {},
  permissionPrefix?: string
): DetailActionConfig<T>[] {
  const hideActions = [...(overrides.hideActions ?? []), ...(overrides.hide ?? [])];
  const overrideActions = {
    ...(overrides.overrideActions ?? {}),
    ...(overrides.override ?? {}),
  };

  const prependActions = [
    ...(overrides.prependActions ?? []),
    ...((overrides.left ?? []).map((a) => ({ ...a, position: a.position ?? 'left' }))),
  ];

  const appendActions = [
    ...((overrides.right ?? []).map((a) => ({ ...a, position: a.position ?? 'right' }))),
    ...(overrides.appendActions ?? []),
  ];

  let actions = [...DEFAULT_DETAIL_ACTIONS] as DetailActionConfig<T>[];

  // 1. Apply permission prefix to default actions
  if (permissionPrefix) {
    actions = actions.map((a) => {
      const permissionAction = ACTION_PERMISSION_MAP[a.id];
      if (permissionAction) {
        return { ...a, permission: `${permissionPrefix}.${permissionAction}` };
      }
      return a;
    });
  }

  // 2. Remove hidden actions
  if (hideActions.length) {
    actions = actions.filter((a) => !hideActions.includes(a.id));
  }

  // 3. Apply property overrides
  if (Object.keys(overrideActions).length > 0) {
    actions = actions.map((a) => {
      const override = overrideActions[a.id];
      return override ? { ...a, ...override } : a;
    });
  }

  // 4. Prepend custom actions
  if (prependActions.length) {
    actions = [...prependActions, ...actions];
  }

  // 5. Append custom actions
  if (appendActions.length) {
    actions = [...actions, ...appendActions];
  }

  return actions;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIG BUILDER - TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Required fields for building a detail config.
 */
export interface DetailConfigRequired<TItem> {
  /**
   * Entity name (singular).
   * Used for: page title, messages.
   *
   * @example 'Product'
   */
  entityName: string;

  /**
   * Icon name (Lucide) — shown in breadcrumb parent item.
   *
   * @example 'package'
   */
  icon?: string;

  /**
   * Field configurations.
   */
  fields: DetailFieldConfig<TItem>[];

  /**
   * Route configuration.
   */
  routes: DetailRouteConfig<TItem>;

  /**
   * Permission prefix for auto-generating action permissions.
   * Follows Nafura's `module.feature` convention.
   *
   * @example 'inventory.product'
   */
  permissionPrefix?: string;

  /**
   * Status machine configuration.
   * When provided, the detail page renders a status badge + transition
   * action buttons. Status changes go through dedicated endpoints.
   */
  statusMachine?: StatusMachineConfig;
}

/**
 * Optional overrides for the detail config.
 */
export interface DetailConfigOverrides<TItem> {
  // ─── Layout ─────────────────────────────────────────────────────────────

  /**
   * Section configurations.
   * If omitted, fields are displayed in a flat grid.
   */
  sections?: DetailSectionConfig<TItem>[];

  /**
   * Default columns when no sections defined.
   * @default 2
   */
  defaultColumns?: 1 | 2 | 3 | 4;

  /**
   * Actions position.
   * @default 'header'
   */
  actionsPosition?: 'header' | 'footer';

  /**
   * View mode rendering style for built-in fields.
   * @default 'form'
   */
  viewModeAppearance?: 'form' | 'readonly';

  /** When true, status machine is rendered in the actions bar. */
  statusMachineInActionsBar?: boolean;

  /** Position of the status machine in the actions bar. @default 'right' */
  statusMachinePosition?: 'center' | 'right';

  // ─── Actions ────────────────────────────────────────────────────────────

  /**
   * Customize default actions.
   */
  actions?: DetailActionsOverrides<TItem>;

  /**
   * Replace ALL default actions with custom list.
   */
  customActions?: DetailActionConfig<TItem>[];

  // ─── Modes ──────────────────────────────────────────────────────────────

  /**
   * Supported modes.
   * @default { create: true, edit: true, view: false }
   */
  modes?: {
    create?: boolean;
    edit?: boolean;
    view?: boolean;
  };

  // ─── Messages ───────────────────────────────────────────────────────────

  /**
   * Success message for save.
   * @default `${entityName} saved successfully`
   */
  saveSuccessMessage?: string | ((item: TItem) => string);

  /**
   * Error message for save.
   * @default `Failed to save ${entityName.toLowerCase()}`
   */
  saveErrorMessage?: string;

  /**
   * Success message for delete.
   * @default `${entityName} deleted successfully`
   */
  deleteSuccessMessage?: string | ((item: TItem) => string);

  /**
   * Delete confirmation configuration.
   */
  deleteConfirm?: {
    title?: string;
    message?: string | ((item: TItem) => string);
    confirmLabel?: string;
  };

  /**
   * Feature flags (e.g. audit timeline). When audit is true, entityTypeForAudit is used for the Activity tab.
   */
  features?: DetailPageFeatures;

  /**
   * Entity type key for audit API (e.g. "role", "invoice"). Required when features.audit is true.
   */
  entityTypeForAudit?: string;

  /**
   * Entity type key for print templates API (e.g. "invoice", "product"). Required when features.print is true.
   */
  entityTypeForPrint?: string;

  /**
   * Entity type key for attachments API (e.g. "invoice", "product"). Required when features.attachments is true.
   */
  entityTypeForAttachments?: string;

  /**
   * Entity type key for workflow/approval API (e.g. "invoice", "product"). Required when features.workflow is true.
   */
  entityTypeForWorkflow?: string;

  /**
   * Entity type key for email templates (e.g. "invoice"). Required when features.email is true.
   */
  entityTypeForEmail?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIG BUILDER - FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Build a complete detail page configuration.
 *
 * ## Defaults Provided
 *
 * | Category | Defaults |
 * |----------|----------|
 * | Actions | Cancel, Delete, Duplicate, Save |
 * | Columns | 2 columns |
 * | Position | Header |
 * | Modes | Create + Edit |
 * | Messages | Auto-generated from entity name |
 *
 * ## Examples
 *
 * ### Minimal
 * ```typescript
 * export const CONFIG = buildDetailConfig({
 *   entityName: 'Product',
 *   fields: FIELDS,
 *   routes: ROUTES,
 * });
 * ```
 *
 * ### With sections
 * ```typescript
 * export const CONFIG = buildDetailConfig(
 *   {
 *     entityName: 'Product',
 *     permissionPrefix: 'inventory.product',
 *     fields: FIELDS,
 *     routes: ROUTES,
 *   },
 *   {
 *     sections: SECTIONS,
 *     actions: { hideActions: ['duplicate'] },
 *   }
 * );
 * ```
 *
 * @stable
 *
 * @param required - Entity-specific required fields
 * @param overrides - Optional customizations
 * @returns Complete detail page configuration
 */
export function buildDetailConfig<TItem>(
  required: DetailConfigRequired<TItem>,
  overrides: DetailConfigOverrides<TItem> = {}
): DetailPageConfig<TItem> {
  const { entityName, fields, routes, permissionPrefix } = required;

  // ─── Build Actions ──────────────────────────────────────────────────────
  let actions = overrides.customActions
    ? overrides.customActions
    : buildDetailActions<TItem>(overrides.actions ?? {}, permissionPrefix);

  // Append print action when features.print is true (requires entityTypeForPrint or entityTypeForAudit)
  if (overrides.features?.print && permissionPrefix) {
    const entityTypeForPrint =
      overrides.entityTypeForPrint ?? overrides.entityTypeForAudit;
    if (entityTypeForPrint) {
      actions = [
        ...actions,
        {
          id: 'print',
          label: 'Print',
          icon: 'printer',
          scope: 'edit+view' as const,
          variant: 'secondary' as const,
          position: 'right' as const,
          permission: `${permissionPrefix}.read`,
          ariaLabel: 'Print',
          tooltip: 'Print document',
        } as DetailActionConfig<TItem>,
      ];
    }
  }

  // Append Send Email action when features.email is true (requires entityTypeForEmail)
  if (overrides.features?.email && permissionPrefix && overrides.entityTypeForEmail) {
    actions = [
      ...actions,
      {
        id: 'sendEmail',
        label: 'Send Email',
        icon: 'mail',
        scope: 'edit+view' as const,
        variant: 'secondary' as const,
        position: 'right' as const,
        permission: `${permissionPrefix}.write`,
        ariaLabel: 'Send Email',
        tooltip: 'Send email',
      } as DetailActionConfig<TItem>,
    ];
  }

  // ─── Build Modes ────────────────────────────────────────────────────────
  const modes = {
    create: overrides.modes?.create ?? true,
    edit: overrides.modes?.edit ?? true,
    view: overrides.modes?.view ?? false,
  };

  // ─── Build Delete Confirm ───────────────────────────────────────────────
  const deleteConfirm = {
    title: overrides.deleteConfirm?.title ?? `Delete ${entityName}`,
    message:
      overrides.deleteConfirm?.message ??
      ((item: TItem) => {
        const name = (item as Record<string, unknown>)['name'] ?? entityName;
        return `Are you sure you want to delete "${name}"? This action cannot be undone.`;
      }),
    confirmLabel: overrides.deleteConfirm?.confirmLabel ?? 'Delete',
  };

  // ─── Assemble Final Config ──────────────────────────────────────────────
  return {
    // Required
    entityName,
    icon: required.icon,
    permissionPrefix,
    fields,
    routes,

    // Layout
    sections: overrides.sections,
    defaultColumns: overrides.defaultColumns ?? 2,
    actionsPosition: overrides.actionsPosition ?? 'header',
    viewModeAppearance: overrides.viewModeAppearance ?? 'form',
    statusMachineInActionsBar: overrides.statusMachineInActionsBar ?? false,
    statusMachinePosition: overrides.statusMachinePosition ?? 'right',

    // Actions
    actions,

    // Modes
    modes,

    // Messages
    saveSuccessMessage:
      overrides.saveSuccessMessage ?? `${entityName} saved successfully`,
    saveErrorMessage:
      overrides.saveErrorMessage ?? `Failed to save ${entityName.toLowerCase()}`,
    deleteSuccessMessage:
      overrides.deleteSuccessMessage ?? `${entityName} deleted successfully`,
    deleteConfirm,

    // Features
    features: overrides.features,
    entityTypeForAudit: overrides.entityTypeForAudit,
    entityTypeForPrint: overrides.entityTypeForPrint,
    entityTypeForAttachments: overrides.entityTypeForAttachments,
    entityTypeForWorkflow: overrides.entityTypeForWorkflow,
    entityTypeForEmail: overrides.entityTypeForEmail,

    // Status machine
    statusMachine: required.statusMachine,
  };
}
