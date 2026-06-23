/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LISTING CONFIG BUILDER
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Build listing page configurations with sensible defaults.
 * Only override what's different for each entity.
 *
 * ## Architecture
 *
 * ```
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │                        STANDARD CONFIG (this file)                          │
 * │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
 * │  │   Actions   │  │  Features   │  │ Pagination  │  │ Empty State │        │
 * │  │  (CRUD)     │  │  (toolbar)  │  │  (20/page)  │  │  (auto)     │        │
 * │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
 * └─────────────────────────────────────────────────────────────────────────────┘
 *                                    │
 *                                    ▼
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │                        CUSTOM CONFIG (per entity)                           │
 * │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
 * │  │  Columns    │  │   Routes    │  │  Filters    │  │  Overrides  │        │
 * │  │ (required)  │  │ (required)  │  │ (optional)  │  │ (optional)  │        │
 * │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
 * └─────────────────────────────────────────────────────────────────────────────┘
 * ```
 *
 * ## Quick Start
 *
 * ```typescript
 * // Minimal config (4 required fields)
 * export const ORDER_CONFIG = buildListingConfig({
 *   entityName: 'Order',
 *   entityNamePlural: 'Orders',
 *   columns: ORDER_COLUMNS,
 *   routes: ORDER_ROUTES,
 * });
 * ```
 *
 * ## Customization Guide
 *
 * See {@link ListingConfigOverrides} for all available options.
 *
 * @module
 */

import type {
  EntityActionConfig,
  ListingPageConfig,
  ColumnConfig,
  FilterFieldConfig,
  ListingRouteConfig,
  DeleteConfig,
  ImportExportConfig,
  EmptyStateConfig,
  PaginationConfig,
  ViewModesConfig,
  ListingFeatures,
  SortState,
} from '../types';
import { DEFAULT_LISTING_ACTIONS } from './default-listing-actions.config';

// ═══════════════════════════════════════════════════════════════════════════════
// STANDARD DEFAULTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Default pagination settings.
 *
 * | Property | Default |
 * |----------|---------|
 * | pageSize | 20 |
 * | options  | [10, 20, 50, 100] |
 */
export const DEFAULT_PAGINATION: PaginationConfig = {
  defaultPageSize: 20,
  pageSizeOptions: [10, 20, 50, 100],
};

/**
 * Default view modes configuration.
 *
 * | Property | Default |
 * |----------|---------|
 * | available | ['table'] |
 * | default  | 'table' |
 */
export const DEFAULT_VIEW_MODES: ViewModesConfig = {
  available: ['table'],
  default: 'table',
};

/**
 * Default feature flags (toolbar configuration).
 *
 * | Feature | Default | Description |
 * |---------|---------|-------------|
 * | search | true | Search input |
 * | filters | true | Filter panel |
 * | columnToggle | true | Column visibility menu |
 * | selectionMode | 'toggleable' | Row selection |
 * | viewModeToggle | false | Table/Card/Grid switcher |
 * | importExport | false | Import/Export buttons |
 * | refresh | true | Refresh button |
 */
export const DEFAULT_FEATURES: ListingFeatures = {
  search: true,
  filters: true,
  columnToggle: true,
  selectionMode: 'toggleable',
  viewModeToggle: false,
  importExport: true,
  refresh: true,
};

// ═══════════════════════════════════════════════════════════════════════════════
// ACTIONS BUILDER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Standard permission action types for CRUD operations.
 * Used to auto-generate permissions from `permissionPrefix`.
 */
const ACTION_PERMISSION_MAP: Record<string, string> = {
  new: 'create',
  edit: 'update',
  duplicate: 'create', // Creating a copy
  delete: 'delete',
};

/**
 * Options for customizing default actions.
 *
 * ## Default Actions (from DEFAULT_LISTING_ACTIONS)
 *
 * | ID | Scope | Permission |
 * |----|-------|------------|
 * | new | global | `${prefix}.create` |
 * | edit | single | `${prefix}.update` |
 * | duplicate | single | `${prefix}.create` |
 * | delete | single+bulk | `${prefix}.delete` |
 *
 * ## Examples
 *
 * ```typescript
 * // Hide edit action
 * actions: { hideActions: ['edit'] }
 *
 * // Add custom action with permission
 * actions: {
 *   appendActions: [{
 *     id: 'archive',
 *     label: 'Archive',
 *     icon: 'archive',
 *     scope: 'single+bulk',
 *     permission: 'inventory.product.archive',
 *   }]
 * }
 *
 * // Override delete confirmation
 * actions: {
 *   overrideActions: {
 *     delete: { confirmMessage: 'This is permanent!' }
 *   }
 * }
 * ```
 */
export interface ListingActionsOverrides<T> {
  /**
   * Actions to add BEFORE defaults.
   * Use for actions that should appear first (e.g., import/export).
   */
  prependActions?: EntityActionConfig<T>[];

  /**
   * Actions to add AFTER defaults.
   * Use for custom entity-specific actions.
   */
  appendActions?: EntityActionConfig<T>[];

  /**
   * Action IDs to remove from defaults.
   *
   * @example ['edit', 'duplicate'] // Remove edit and duplicate
   */
  hideActions?: string[];

  /**
   * Override properties of default actions.
   *
   * @example
   * {
   *   new: { label: '' },  // Icon-only new button
   *   delete: { confirmMessage: 'Permanent!' }
   * }
   */
  overrideActions?: Partial<Record<string, Partial<EntityActionConfig<T>>>>;
}

/**
 * Build actions array from defaults with customizations.
 *
 * @example
 * // Use all defaults
 * const actions = buildListingActions();
 *
 * @example
 * // With permission prefix
 * const actions = buildListingActions({}, 'inventory.product');
 * // Results in: new → 'inventory.product.create', delete → 'inventory.product.delete', etc.
 *
 * @example
 * // Hide edit, add archive
 * const actions = buildListingActions({
 *   hideActions: ['edit'],
 *   appendActions: [{ id: 'archive', ... }],
 * });
 *
 * @param overrides - Action customizations
 * @param permissionPrefix - Permission prefix for auto-generating permissions
 */
export function buildListingActions<T>(
  overrides: ListingActionsOverrides<T> = {},
  permissionPrefix?: string
): EntityActionConfig<T>[] {
  let actions = [...DEFAULT_LISTING_ACTIONS] as EntityActionConfig<T>[];

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
  if (overrides.hideActions?.length) {
    actions = actions.filter((a) => !overrides.hideActions!.includes(a.id));
  }

  // 3. Apply property overrides
  if (overrides.overrideActions) {
    actions = actions.map((a) => {
      const override = overrides.overrideActions![a.id];
      return override ? { ...a, ...override } : a;
    });
  }

  // 4. Prepend custom actions
  if (overrides.prependActions?.length) {
    actions = [...overrides.prependActions, ...actions];
  }

  // 5. Append custom actions
  if (overrides.appendActions?.length) {
    actions = [...actions, ...overrides.appendActions];
  }

  return actions;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIG BUILDER - TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Required fields for building a listing config.
 * These are entity-specific and cannot have defaults.
 */
export interface ListingConfigRequired<TItem> {
  /**
   * Entity name (singular).
   * Used for: page title, empty state, delete confirmation.
   *
   * @example 'Product'
   */
  entityName: string;

  /**
   * Entity name (plural).
   * Used for: empty state message.
   *
   * @example 'Products'
   */
  entityNamePlural: string;

  /**
   * Column configurations for table view.
   * Define each column's key, label, type, width, etc.
   *
   * @example
   * [
   *   { key: 'name', label: 'Name', sortable: true },
   *   { key: 'price', label: 'Price', type: 'currency' },
   * ]
   */
  columns: ColumnConfig[];

  /**
   * Route configuration for navigation.
   * Defines where to navigate for create/detail views.
   *
   * @example
   * {
   *   detail: (item) => ['/products', item.id],
   *   create: ['/products/new'],
   *   list: ['/products'],
   * }
   */
  routes: ListingRouteConfig<TItem>;

  /**
   * Permission prefix for auto-generating action permissions.
   * Follows Nafura's `module.feature` convention.
   *
   * Auto-generates permissions:
   * - `new` → `${prefix}.create`
   * - `edit` → `${prefix}.update`
   * - `duplicate` → `${prefix}.create`
   * - `delete` → `${prefix}.delete`
   *
   * @example 'inventory.product'
   * @example 'business.partner'
   */
  permissionPrefix?: string;
}

/**
 * Optional overrides for the listing config.
 * All fields have sensible defaults - only override what's different.
 *
 * ## Customization Categories
 *
 * ### Display
 * - `defaultVisibleColumns` - Which columns show by default
 * - `viewModes` - Enable card/grid views
 * - `emptyState` - Custom empty state message
 *
 * ### Toolbar Controls
 * - `features` - Enable/disable search, filters, etc.
 *
 * ### Actions
 * - `actions` - Customize CRUD actions
 * - `customActions` - Replace all defaults with custom
 *
 * ### Data
 * - `filters` - Filter field configurations
 * - `pagination` - Page size options
 * - `defaultSort` - Initial sort column
 *
 * ### Operations
 * - `delete` - Custom delete confirmation
 * - `importExport` - Import/export settings
 */
export interface ListingConfigOverrides<TItem> {
  // ─── Display ─────────────────────────────────────────────────────────────

  /**
   * Column keys visible by default.
   * @default All columns
   */
  defaultVisibleColumns?: string[];

  /**
   * View mode configuration.
   *
   * @default { available: ['table'], default: 'table' }
   *
   * @example
   * // Enable card view
   * viewModes: {
   *   available: ['table', 'cards'],
   *   card: {
   *     titleField: 'name',
   *     subtitleField: 'code',
   *     badgeField: 'status',
   *   }
   * }
   */
  viewModes?: Partial<ViewModesConfig>;

  /**
   * Empty state customization.
   *
   * @default Auto-generated from entityName
   *
   * @example
   * emptyState: {
   *   icon: 'shopping-cart',
   *   title: 'No orders yet',
   *   message: 'Orders will appear here',
   * }
   */
  emptyState?: Partial<EmptyStateConfig>;

  // ─── Toolbar Controls ────────────────────────────────────────────────────

  /**
   * Feature flags (toolbar configuration).
   * Merged with defaults - only specify what's different.
   *
   * @default See DEFAULT_FEATURES
   *
   * @example
   * // Disable filters, enable import/export
   * features: {
   *   filters: false,
   *   importExport: true,
   * }
   */
  features?: Partial<ListingFeatures>;

  // ─── Actions ─────────────────────────────────────────────────────────────

  /**
   * Customize default actions (New, Edit, Duplicate, Delete).
   * See {@link ListingActionsOverrides} for options.
   *
   * @example
   * // Hide edit, icon-only new button
   * actions: {
   *   hideActions: ['edit'],
   *   overrideActions: { new: { label: '' } },
   * }
   */
  actions?: ListingActionsOverrides<TItem>;

  /**
   * Replace ALL default actions with custom list.
   * Use when you need complete control.
   *
   * @example
   * customActions: [
   *   { id: 'approve', label: 'Approve', scope: 'single' },
   *   { id: 'reject', label: 'Reject', scope: 'single' },
   * ]
   */
  customActions?: EntityActionConfig<TItem>[];

  // ─── Data ────────────────────────────────────────────────────────────────

  /**
   * Filter field configurations.
   * 100% custom per entity - no defaults.
   *
   * @default [] (no filters)
   *
   * @example
   * filters: [
   *   { key: 'status', label: 'Status', type: 'select', options: [...] },
   *   { key: 'category', label: 'Category', type: 'select', options: [...] },
   * ]
   */
  filters?: FilterFieldConfig[];

  /**
   * Pagination settings.
   *
   * @default { defaultPageSize: 20, pageSizeOptions: [10, 20, 50, 100] }
   */
  pagination?: Partial<PaginationConfig>;

  /**
   * Default sort configuration.
   *
   * @default undefined (no default sort)
   *
   * @example
   * defaultSort: { column: 'createdAt', direction: 'desc' }
   */
  defaultSort?: SortState;

  // ─── Operations ──────────────────────────────────────────────────────────

  /**
   * Delete confirmation configuration.
   *
   * @default Auto-generated from entityName
   *
   * @example
   * delete: {
   *   title: 'Remove Product',
   *   getMessage: (item) => `Remove "${item.name}" from catalog?`,
   *   successMessage: 'Product removed',
   * }
   */
  delete?: DeleteConfig<TItem>;

}

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIG BUILDER - FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Build a complete listing page configuration.
 *
 * Provides sensible defaults for everything except entity-specific fields.
 * Only override what's different for your entity.
 *
 * ## Defaults Provided
 *
 * | Category | Defaults |
 * |----------|----------|
 * | Actions | New, Edit, Duplicate, Delete |
 * | Features | Search, filters, column toggle enabled |
 * | Pagination | 20 items/page, options [10,20,50,100] |
 * | Empty State | Auto-generated from entity name |
 * | Delete | Auto-generated confirmation |
 *
 * ## Examples
 *
 * ### Minimal (just required fields)
 * ```typescript
 * export const CONFIG = buildListingConfig({
 *   entityName: 'Order',
 *   entityNamePlural: 'Orders',
 *   columns: COLUMNS,
 *   routes: ROUTES,
 * });
 * ```
 *
 * ### With customizations
 * ```typescript
 * export const CONFIG = buildListingConfig(
 *   {
 *     entityName: 'Product',
 *     entityNamePlural: 'Products',
 *     columns: COLUMNS,
 *     routes: ROUTES,
 *   },
 *   {
 *     // Enable card view
 *     viewModes: { available: ['table', 'cards'], card: { titleField: 'name' } },
 *
 *     // Customize toolbar
 *     features: { importExport: true },
 *
 *     // Customize actions
 *     actions: { hideActions: ['edit'] },
 *
 *     // Add filters
 *     filters: FILTERS,
 *   }
 * );
 * ```
 *
 * @stable
 *
 * @param required - Entity-specific required fields
 * @param overrides - Optional customizations (merged with defaults)
 * @returns Complete listing page configuration
 */
export function buildListingConfig<TItem>(
  required: ListingConfigRequired<TItem>,
  overrides: ListingConfigOverrides<TItem> = {}
): ListingPageConfig<TItem> {
  const { entityName, entityNamePlural, columns, routes, permissionPrefix } = required;

  // ─── Build Actions ───────────────────────────────────────────────────────
  const actions = overrides.customActions
    ? overrides.customActions
    : buildListingActions<TItem>(overrides.actions ?? {}, permissionPrefix);

  // ─── Build View Modes ────────────────────────────────────────────────────
  const viewModes: ViewModesConfig = {
    ...DEFAULT_VIEW_MODES,
    ...overrides.viewModes,
  };

  // ─── Build Features ──────────────────────────────────────────────────────
  const features: ListingFeatures = {
    ...DEFAULT_FEATURES,
    ...overrides.features,
    // Auto-enable viewModeToggle if multiple view modes
    viewModeToggle:
      overrides.features?.viewModeToggle ?? viewModes.available.length > 1,
  };

  // ─── Build Pagination ────────────────────────────────────────────────────
  const pagination: PaginationConfig = {
    ...DEFAULT_PAGINATION,
    ...overrides.pagination,
  };

  // ─── Build Empty State ───────────────────────────────────────────────────
  const emptyState: EmptyStateConfig = {
    icon: overrides.emptyState?.icon ?? 'inbox',
    title:
      overrides.emptyState?.title ?? `No ${entityNamePlural.toLowerCase()} found`,
    message:
      overrides.emptyState?.message ??
      `Create your first ${entityName.toLowerCase()} to get started`,
    actionLabel: overrides.emptyState?.actionLabel ?? `Add ${entityName}`,
    actionId: overrides.emptyState?.actionId ?? 'create',
  };

  // ─── Build Delete Config ─────────────────────────────────────────────────
  const deleteConfig: DeleteConfig<TItem> | undefined = overrides.delete ?? {
    title: `Delete ${entityName}`,
    getMessage: (item: TItem) => {
      const name = (item as Record<string, unknown>)['name'] ?? entityName;
      return `Are you sure you want to delete "${name}"? This action cannot be undone.`;
    },
    confirmLabel: 'Delete',
    icon: 'delete',
    successMessage: `${entityName} deleted successfully`,
    errorMessage: `Failed to delete ${entityName.toLowerCase()}`,
  };

  // ─── Build Default Visible Columns ───────────────────────────────────────
  const defaultVisibleColumns =
    overrides.defaultVisibleColumns ?? columns.map((c) => c.key);

  // ─── Build Import/Export Config (auto-generated when enabled) ───────────
  const importExportConfig: ImportExportConfig | undefined = features.importExport
    ? {
        enableImportExport: true,
        entityName: entityNamePlural,
        importExplanation: `Import ${entityNamePlural.toLowerCase()} from a CSV file using the provided template.`,
        exportExplanation: `Export ${entityNamePlural.toLowerCase()} as a CSV file.`,
        templateColumns: columns.map((c) => ({ key: c.key })),
        allowedImportFormats: ['csv'],
        enableExport: true,
        enableSelectionExport: true,
      }
    : undefined;

  // ─── Assemble Final Config ───────────────────────────────────────────────
  return {
    // Required (entity-specific)
    entityName,
    entityNamePlural,
    columns,
    routes,

    // With defaults
    defaultVisibleColumns,
    viewModes,
    features,
    actions,
    filters: overrides.filters ?? [],
    pagination,
    delete: deleteConfig,
    emptyState,
    importExport: importExportConfig,

    // Optional (no defaults)
    defaultSort: overrides.defaultSort,
  };
}
