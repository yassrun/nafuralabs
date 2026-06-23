/**
 * Anatomy Types
 *
 * Shared type definitions for the Anatomy framework.
 */

import type { ButtonVariant, PageHeaderConfig } from '../components';

// ═══════════════════════════════════════════════════════════════════════════
// UX Pattern Types
// ═══════════════════════════════════════════════════════════════════════════

/**
 * UX pattern used by a page or route.
 * Enables IA/generators to pick the right template and components.
 */
export type UxPatternType =
  | 'listing'
  | 'detail'
  | 'masterSlave'
  | 'wizard'
  | 'settings'
  | 'dashboard'
  | 'documentWorkspace';

export type {
  DocumentActionKind,
  DocumentStatusSeverity,
  DocumentWorkflowStateUi,
  DocumentStatusRibbonConfig,
  DocumentTotalsItemConfig,
  DocumentTotalsBlockConfig,
  DocumentActionUiConfig,
  DocumentWorkspaceFeatureFlags,
  DocumentAttachmentZoneConfig,
  DocumentAuditZoneConfig,
  DocumentActionEvent,
} from './document-workspace.types';

// ═══════════════════════════════════════════════════════════════════════════
// Pagination
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Pagination state for list pages.
 */
export interface PaginationState {
  /** Current page (1-indexed) */
  page: number;

  /** Items per page */
  pageSize: number;

  /** Total items count */
  total: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// Sorting
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Sort direction.
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Sort state for list pages.
 */
export interface SortState {
  /** Column/field to sort by */
  column: string;

  /** Sort direction */
  direction: SortDirection;
}

// ═══════════════════════════════════════════════════════════════════════════
// Selection
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Selection mode for list pages.
 */
export type SelectionMode = 'none' | 'single' | 'multiple';

// ═══════════════════════════════════════════════════════════════════════════
// Loading State
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Loading state machine.
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// ═══════════════════════════════════════════════════════════════════════════
// Query & Response
// ═══════════════════════════════════════════════════════════════════════════

/**
 * List query parameters for API calls.
 */
export interface ListQuery {
  [key: string]: unknown;

  /** Page number (1-indexed) */
  page?: number;

  /** Page size */
  pageSize?: number;

  /** Sort column */
  sortBy?: string;

  /** Sort direction */
  sortDirection?: SortDirection;
}

/**
 * List response from API.
 */
export interface ListResponse<T> {
  /** Items for current page */
  items: T[];

  /** Total count */
  total: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// Lookups
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Single lookup item (key-value pair).
 */
export interface LookupItem {
  /** The value stored/sent to API */
  key: string | number | boolean;

  /** The display value shown to user */
  value: string;

  /** Optional: additional data */
  data?: Record<string, unknown>;
}

/**
 * Lookup context - map of lookup key to items.
 */
export interface LookupContext {
  [key: string]: LookupItem[];
}

// ═══════════════════════════════════════════════════════════════════════════
// Breadcrumbs
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Breadcrumb item.
 */
export interface BreadcrumbItem {
  /** Display label */
  label: string;

  /** Route path (optional - last item usually has no route) */
  route?: string;

  /** Icon (optional) */
  icon?: string;

  /** Query params (optional) */
  queryParams?: Record<string, string>;
}

// ═══════════════════════════════════════════════════════════════════════════
// Dashboard
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Dashboard page configuration.
 */
export interface DashboardPageConfig {
  /** Page header configuration */
  headerConfig: PageHeaderConfig;

  /** Panel layout configuration */
  panels: DashboardPanelConfig[];

  /** Auto-refresh interval (ms). Omit for manual refresh only. */
  refreshIntervalMs?: number;
}

/**
 * Dashboard panel configuration.
 */
export interface DashboardPanelConfig {
  id: string;
  titleKey: string;
  span: 'full' | 'half' | 'third';
  widget: DashboardWidgetType;
  order: number;
}

/**
 * Dashboard widget types.
 */
export type DashboardWidgetType =
  | 'kpi-strip'
  | 'alert-list'
  | 'activity-feed'
  | 'quick-actions'
  | 'chart'
  | 'custom';

/**
 * KPI strip item.
 */
export interface KpiItem {
  id: string;
  label: string;
  value: number | string;
  icon?: string;
  trend?: { value: number; direction: 'up' | 'down' };
  secondary?: { label: string; tooltip?: string };
}

/**
 * Activity feed configuration.
 */
export interface ActivityFeedConfig {
  columns: ColumnConfig[];
  maxRows?: number;
  maxHeight?: string;
  rowClickable?: boolean;
}

/**
 * Dashboard data provider.
 */
export interface DashboardDataProvider<TSnapshot = unknown> {
  loadSnapshot(): Promise<TSnapshot>;
  refreshSnapshot?(): Promise<TSnapshot>;
}

// ═══════════════════════════════════════════════════════════════════════════
// Settings
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Settings page configuration (composition-based).
 */
export interface SettingsPageConfig {
  headerTitleKey: string;
  headerSubtitleKey?: string;
  headerIcon?: string;
  tabs: SettingsTabConfig[];
  defaultTabId?: string;
  actions?: {
    left?: SettingsActionConfig[];
    right?: SettingsActionConfig[];
  };
}

/**
 * Settings tab configuration.
 */
export interface SettingsTabConfig {
  id: string;
  labelKey: string;
  icon?: string;
  disabled?: boolean;
  badgeKey?: string;
}

/**
 * Settings action configuration.
 */
export interface SettingsActionConfig {
  id: string;
  labelKey: string;
  icon?: string;
  ariaLabelKey?: string;
  tooltipKey?: string;
  variant?: ButtonVariant;
  disabled?: boolean;
  active?: boolean;
  loading?: boolean;
  visible?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// Wizard
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Wizard page configuration.
 */
export interface WizardPageConfig {
  headerTitleKey: string;
  headerSubtitleKey?: string;
  headerIcon?: string;
  steps: WizardStepDefinition[];
  actionLabels?: {
    backKey?: string;
    nextKey?: string;
    submitKey?: string;
  };
  actionIcons?: {
    backIcon?: string;
    nextIcon?: string;
    submitIcon?: string;
  };
}

/**
 * Wizard step definition (i18n-ready).
 */
export interface WizardStepDefinition {
  id: string;
  labelKey: string;
  icon?: string;
  descriptionKey?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Table
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Column type for data tables.
 */
export type ColumnType = 'text' | 'number' | 'date' | 'datetime' | 'boolean' | 'currency' | 'badge' | 'custom';

/**
 * Badge variants for table status chips.
 */
export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

/**
 * Table column configuration.
 */
export interface ColumnConfig {
  /** Column key (unique identifier) */
  key: string;

  /** Column header label */
  label: string;

  /** Field name to access from item */
  field: string;

  /** Column type for formatting */
  type?: ColumnType;

  /** Badge variant or resolver for badge columns */
  badgeVariant?: BadgeVariant | ((value: unknown, item: unknown) => BadgeVariant);

  /** Is column sortable */
  sortable?: boolean;

  /** Column width (CSS value) */
  width?: string;

  /** Custom CSS class */
  cssClass?: string;

  /** Value transform function */
  transform?: (value: unknown, item: unknown) => string;

  /** Emit rowAction when the cell is clicked (uses this as action id). */
  cellAction?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Form
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Form field type.
 */
export type FormFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'email'
  | 'password'
  | 'date'
  | 'datetime'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'radio'
  | 'file'
  | 'autocomplete'
  | 'custom';

/**
 * Form field configuration.
 */
export interface FormFieldConfig {
  /** Field key (unique identifier) */
  key: string;

  /** Field label */
  label: string;

  /** Field type */
  type: FormFieldType;

  /** Field name in form data */
  field: string;

  /** Placeholder text */
  placeholder?: string;

  /** Default value */
  defaultValue?: unknown;

  /** Is field required */
  required?: boolean;

  /** Is field disabled */
  disabled?: boolean;

  /** Is field readonly */
  readonly?: boolean;

  /** Options for select/multiselect/radio */
  options?: Array<{ label: string; value: unknown }>;

  /** Lookup key for dynamic options */
  lookupKey?: string;

  /** Validation rules */
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };

  /** Help text */
  helpText?: string;

  /** Column span in grid layout */
  colSpan?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// Detail Page / Form Builder
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Extended form field type for detail pages.
 *
 * Moroccan-specific atoms (rendered by `<nf-entity-detail>`):
 * - `ice`       — 15-digit ICE (Identifiant Commun de l'Entreprise) with checksum.
 * - `rib`       — 24-digit Moroccan RIB.
 * - `phone-ma`  — Moroccan phone (+212 6/7 XX XX XX XX, stored as E.164).
 * - `money-ma`  — Number stored as raw value, rendered with fr-MA formatting + MAD suffix.
 */
export type DetailFieldType =
  | 'text'
  | 'email'
  | 'password'
  | 'url'
  | 'tel'
  | 'number'
  | 'currency'
  | 'textarea'
  | 'select'
  | 'multi-select'
  | 'autocomplete'
  | 'checkbox'
  | 'toggle'
  | 'radio'
  | 'date'
  | 'datetime'
  | 'time'
  | 'daterange'
  | 'file'
  | 'image'
  | 'ice'
  | 'rib'
  | 'phone-ma'
  | 'money-ma'
  | 'custom';

/**
 * Field width presets for layout.
 */
export type DetailFieldWidth = 'xs' | 'sm' | 'md' | 'lg' | 'full';

/**
 * Detail page form field configuration.
 */
export interface DetailFieldConfig<TItem = unknown> {
  /** Field key (form control name) */
  key: string;

  /** Field label */
  label: string;

  /** Field type */
  type: DetailFieldType;

  /** Placeholder text */
  placeholder?: string;

  /** Hint text below field */
  hint?: string;

  /** Prefix text/icon (e.g., '$' for currency) */
  prefix?: string;

  /** Suffix text/icon (e.g., 'kg' for weight) */
  suffix?: string;

  /** Default value */
  defaultValue?: unknown;

  // ─── Layout ─────────────────────────────────────────────────────────────

  /** Field width preset. @default 'md' */
  width?: DetailFieldWidth;

  /** Override order within section */
  order?: number;

  // ─── Validation ─────────────────────────────────────────────────────────

  /** Is field required */
  required?: boolean;

  /** Validation rules */
  validators?: DetailValidatorConfig[];

  // ─── Options (for select, radio, autocomplete) ──────────────────────────

  /** Static options */
  options?: Array<{ label: string; value: unknown }>;

  /** Lookup key for dynamic options from facade.lookups$ */
  lookupKey?: string;

  /** API endpoint used to load lookup options dynamically */
  lookupEndpoint?: string;

  /** Field name used as option label in lookup response items */
  lookupDisplayField?: string;

  /** Field name used as option value in lookup response items */
  lookupValueField?: string;

  /** Optional query parameters appended to lookup endpoint */
  lookupParams?: Record<string, string | number | boolean>;

  /** Enable client-side search inside select dropdown (recommended for lookups). */
  searchable?: boolean;

  /** Allow clearing selected value back to null/empty (ignored when required=true). */
  clearable?: boolean;

  /** Optional route shortcut for reference fields (opens related config/list page). */
  referenceRoute?: string;

  /** Optional route to the referential listing (e.g. `/ventes/clients`). */
  listRoute?: string;

  /** @deprecated Use {@link listRoute} — optional route to create a new reference row. */
  createRoute?: string;

  // ─── Conditional ────────────────────────────────────────────────────────

  /**
   * Visibility condition.
   * If function, receives form value and returns boolean.
   */
  visible?: boolean | ((formValue: Partial<TItem>) => boolean);

  /**
   * Disabled condition.
   * If function, receives form value and returns boolean.
   */
  disabled?: boolean | ((formValue: Partial<TItem>) => boolean);

  // ─── Permissions ────────────────────────────────────────────────────────

  /**
   * Permission required to see this field.
   * @example 'inventory.product.cost.read'
   */
  permission?: string;

  // ─── State ──────────────────────────────────────────────────────────────

  /** Field is readonly when editing an existing record (e.g., 'code') */
  readonlyOnEdit?: boolean;

  /** Field is always readonly */
  readonly?: boolean;

  // ─── Custom ─────────────────────────────────────────────────────────────

  /** Template ID for type: 'custom' */
  templateId?: string;

  /** Additional field-specific config */
  config?: Record<string, unknown>;
}

/**
 * Validator configuration for detail fields.
 */
export interface DetailValidatorConfig {
  /** Validator type */
  type: 'min' | 'max' | 'minLength' | 'maxLength' | 'pattern' | 'email' | 'custom';

  /** Value for min/max/minLength/maxLength */
  value?: number;

  /** Pattern for pattern validator */
  pattern?: string;

  /** Custom validator function name */
  customFn?: string;

  /** Error message */
  message?: string;
}

/**
 * Form section configuration for layout.
 */
export interface DetailSectionConfig<TItem = unknown> {
  /** Section identifier */
  id: string;

  /** Section title */
  title?: string;

  /** Section description */
  description?: string;

  /** Section icon (Lucide icon name) */
  icon?: string;

  /** Field keys in this section */
  fields: string[];

  /** Number of columns in section grid. @default 2 */
  columns?: 1 | 2 | 3 | 4;

  /** Whether section is collapsible */
  collapsible?: boolean;

  /** Initial collapsed state */
  collapsed?: boolean;

  /**
   * Visibility condition.
   * If function, receives form value and returns boolean.
   */
  visible?: boolean | ((formValue: Partial<TItem>) => boolean);

  /** Permission required to see this section */
  permission?: string;
}

/**
 * Detail page mode.
 */
export type DetailPageMode = 'create' | 'edit' | 'view';

/**
 * Detail action scope.
 */
export type DetailActionScope = 'create' | 'edit' | 'view' | 'create+edit' | 'edit+view' | 'all';

/**
 * Detail page action configuration.
 */
export interface DetailActionConfig<TItem = unknown> {
  /** Action identifier */
  id: string;

  /** Action label */
  label: string;

  /** Icon name (Lucide icon) */
  icon?: string;

  /** Accessibility label */
  ariaLabel?: string;

  /** Action scope - determines visibility based on mode */
  scope: DetailActionScope;

  /**
   * Button variant.
   * Supports legacy variants and toolbar-friendly variants.
   */
  variant?:
    | 'primary'
    | 'secondary'
    | 'tertiary'
    | 'danger'
    | 'ghost'
    | 'flat'
    | 'stroked'
    | 'text'
    | 'icon';

  /** Optional semantic color for toolbar rendering. */
  color?: 'primary' | 'accent' | 'warn' | 'danger' | 'default';

  /** Built-in action type */
  builtin?: 'save' | 'cancel' | 'delete' | 'duplicate';

  /**
   * Visibility function based on form state.
   * Return false to hide the action.
   */
  visible?: (context: DetailActionContext<TItem>) => boolean;

  /** Explicit mode gating (alternative to scope). */
  showInModes?: DetailPageMode[];

  /**
   * Disabled function based on form state.
   * Return true to disable the action.
   */
  disabled?: boolean | ((context: DetailActionContext<TItem>) => boolean);

  /** Tooltip shown when disabled is true. */
  disabledTooltip?: string | ((context: DetailActionContext<TItem>) => string);

  /** Permission required */
  permission?: string;

  /** Tooltip text */
  tooltip?: string;

  /** Position: 'left' or 'right' of action bar */
  position?: 'left' | 'right';

  /**
   * Optional ordering hint within a zone.
   * Lower values are rendered first.
   */
  order?: number;

  /** Optional confirm dialog before emitting action event. */
  confirm?: {
    title: string;
    message: string | ((item: TItem | null) => string);
    confirmLabel?: string;
  };
}

/**
 * Context passed to action visibility/disabled functions.
 */
export interface DetailActionContext<TItem = unknown> {
  /** Current mode */
  mode: DetailPageMode;

  /** Form dirty state */
  isDirty: boolean;

  /** Form valid state */
  isValid: boolean;

  /** Current form value */
  formValue: Partial<TItem>;

  /** Original item (for edit/view modes) */
  item?: TItem;
}

/**
 * Route configuration for detail pages.
 */
export interface DetailRouteConfig<TItem = unknown> {
  /** Route to list page */
  list: string[];

  /** Route builder for view mode (if separate from edit) */
  view?: (item: TItem) => string[];

  /** Route builder for edit mode */
  edit?: (item: TItem) => string[];
}

/**
 * Attachment configuration for entity detail (when features.attachments is true).
 */
export interface AttachmentConfig {
  /** Maximum number of files per entity. @default 20 */
  maxFiles?: number;

  /** Maximum file size in bytes. @default 10 * 1024 * 1024 (10MB) */
  maxFileSize?: number;

  /** Allowed MIME types; use ['*'] for all. @default ['*'] */
  allowedTypes?: string[];
}

/**
 * Workflow (approval) configuration when features.workflow is true.
 */
export interface WorkflowConfig {
  /** Auto-select template when entity has only one template for this entity type. */
  templateCode?: string;

  /** Label for the trigger button. @default "Submit for Approval" */
  triggerAction?: string;
}

/**
 * Detail page feature flags.
 */
export interface DetailPageFeatures {
  /** When true, adds an "Activity" tab with the entity audit timeline */
  audit?: boolean;

  /** When true, adds a "Print" action button that opens the print dialog */
  print?: boolean;

  /** When true, adds an "Attachments" tab with upload/download/preview */
  attachments?: boolean;

  /** Optional attachment limits and allowed types. Used when attachments is true. */
  attachmentConfig?: AttachmentConfig;

  /** When true, shows approval status banner and Submit for Approval / Approve / Reject in entity detail */
  workflow?: boolean;

  /** Optional workflow config (template code, trigger button label). Used when workflow is true. */
  workflowConfig?: WorkflowConfig;

  /** When true, adds a "Send Email" action button that opens the email compose dialog */
  email?: boolean;
}

/**
 * Detail page configuration.
 */
// ═══════════════════════════════════════════════════════════════════════════
// Status Machine Types
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Confirmation options for a status transition.
 * Set to `true` for a simple confirm dialog, or provide an object for
 * a custom message and optional note field.
 */
export interface StatusTransitionConfirm {
  title: string;
  message: string | ((item: unknown) => string);
  confirmLabel?: string;
  /** If true, user must provide a note/reason before confirming */
  requireNote?: boolean;
  notePlaceholder?: string;
}

/**
 * A single status transition in a state machine.
 * `conditions` receives the item as `unknown` — cast inside if needed.
 */
export interface StatusTransition<TStatus extends string = string> {
  /** Source status or array of statuses that allow this transition */
  from: TStatus | TStatus[];
  /** Target status after transition */
  to: TStatus;
  /** Action ID — used to dispatch to the right facade method or endpoint */
  action: string;
  /** Backend endpoint suffix: POST /{basePath}/{id}/{endpoint} */
  endpoint: string;
  /** Button label */
  label: string;
  /** Lucide icon name */
  icon?: string;
  /** Button variant */
  variant?: ButtonVariant;
  /** Permission required to execute this transition */
  permission?: string;
  /** Confirmation dialog config. false = no dialog, true = simple confirm */
  confirm?: boolean | StatusTransitionConfirm;
  /** Additional conditions evaluated on the item (cast inside as needed) */
  conditions?: (item: unknown) => boolean;
}

/**
 * Status machine configuration for an entity.
 * Drives badge display and available transition actions.
 */
export interface StatusMachineConfig<TStatus extends string = string> {
  /** The field key that holds the status on the entity */
  field: string;
  /** Map of status value → display config */
  statuses: Record<TStatus, {
    label: string;
    variant: BadgeVariant;
  }>;
  /** All possible transitions */
  transitions: StatusTransition<TStatus>[];
}

/**
 * Event emitted by nf-status-machine when a transition is confirmed.
 */
export interface StatusTransitionEvent {
  action: string;
  endpoint: string;
  toStatus: string;
  note?: string;
}

export interface DetailPageConfig<TItem = unknown> {
  // === Identity ===
  /** Entity name (singular) */
  entityName: string;

  /** Icon name (Lucide) — shown in breadcrumb parent item */
  icon?: string;

  /** Permission prefix for auto-generating action permissions */
  permissionPrefix?: string;

  /** Feature flags (e.g. audit timeline, print). When audit is true, entityTypeForAudit is required. */
  features?: DetailPageFeatures;

  /** Entity type key for audit API (e.g. "role", "invoice"). Required when features.audit is true. */
  entityTypeForAudit?: string;

  /** Entity type key for print templates API (e.g. "invoice", "product"). Required when features.print is true. */
  entityTypeForPrint?: string;

  /** Entity type key for attachments API (e.g. "invoice", "product"). Required when features.attachments is true. */
  entityTypeForAttachments?: string;

  /** Entity type key for workflow/approval API (e.g. "invoice", "product"). Required when features.workflow is true. */
  entityTypeForWorkflow?: string;

  /** Entity type key for email templates (e.g. "invoice"). Required when features.email is true. */
  entityTypeForEmail?: string;

  // === Form ===
  /** Field configurations */
  fields: DetailFieldConfig<TItem>[];

  /** Section configurations (optional - flat layout if omitted) */
  sections?: DetailSectionConfig<TItem>[];

  // === Actions ===
  /** Action configurations */
  actions: DetailActionConfig<TItem>[];

  // === Navigation ===
  /** Route configuration */
  routes: DetailRouteConfig<TItem>;

  // === Modes ===
  /** Supported modes */
  modes?: {
    create?: boolean;
    edit?: boolean;
    view?: boolean;
  };

  // === Layout ===
  /** Default columns when no sections defined. @default 2 */
  defaultColumns?: 1 | 2 | 3 | 4;

  /** Actions position: 'header' or 'footer'. @default 'header' */
  actionsPosition?: 'header' | 'footer';

  /**
   * View mode rendering style for built-in field types.
   * 'form' keeps disabled form controls (legacy behavior).
   * 'readonly' renders plain read-only values for better scanability.
   * @default 'form'
   */
  viewModeAppearance?: 'form' | 'readonly';

  /**
   * When true, render status machine (badge + transitions) in the actions bar.
   * Keeps legacy nfActionCenter projection available for gradual migration.
   */
  statusMachineInActionsBar?: boolean;

  /**
   * Where to render the status machine in the actions bar.
   * 'center' = between left and right zones (recommended for workflow-heavy pages).
   * 'right' = grouped with CRUD actions (default, legacy behaviour).
   * @default 'right'
   */
  statusMachinePosition?: 'center' | 'right';

  // === Messages ===
  /** Success message for save */
  saveSuccessMessage?: string | ((item: TItem) => string);

  /** Error message for save */
  saveErrorMessage?: string;

  /** Success message for delete */
  deleteSuccessMessage?: string | ((item: TItem) => string);

  /** Delete confirmation */
  deleteConfirm?: {
    title?: string;
    message?: string | ((item: TItem) => string);
    confirmLabel?: string;
  };

  /**
   * Status machine configuration.
   * When provided, renders a status badge + transition action buttons
   * in the detail page header area. Status changes go through dedicated
   * endpoints (POST /{id}/{endpoint}), never via the PATCH update route.
   */
  statusMachine?: StatusMachineConfig;
}

/**
 * Action event emitted by detail page.
 */
export interface DetailActionEvent<TItem = unknown> {
  /** Action identifier */
  actionId: string;

  /** Current mode */
  mode: DetailPageMode;

  /** Current form value */
  formValue: Partial<TItem>;

  /** Original item (for edit/view modes) */
  item?: TItem;
}

// ═══════════════════════════════════════════════════════════════════════════
// Filter
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Filter field type.
 */
export type FilterFieldType = 'text' | 'number' | 'date' | 'daterange' | 'select' | 'multiselect' | 'boolean';

/**
 * Filter field configuration.
 */
export interface FilterFieldConfig {
  /** Field key */
  key: string;

  /** Field label */
  label: string;

  /** Field type */
  type: FilterFieldType;

  /** Placeholder */
  placeholder?: string;

  /** Options for select/multiselect */
  options?: Array<{ label: string; value: unknown }>;

  /** Lookup key for dynamic options */
  lookupKey?: string;

  /** Default value */
  defaultValue?: unknown;
}

// ═══════════════════════════════════════════════════════════════════════════
// Quick Edit
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Quick edit mode - how the edit UI is displayed.
 */
export type QuickEditMode = 'drawer' | 'modal' | 'inline';

/**
 * Quick edit operation type.
 */
export type QuickEditOperation = 'create' | 'edit' | 'view';

/**
 * Quick edit state for list pages.
 * Tracks which item is being edited and the current operation.
 */
export interface QuickEditState<T> {
  /** Whether quick edit is currently open */
  isOpen: boolean;

  /** The item being edited (null for create) */
  item: T | null;

  /** Current operation type */
  operation: QuickEditOperation;

  /** Whether a save operation is in progress */
  isSaving: boolean;

  /** Error message from last save attempt */
  error: string | null;
}

/**
 * Initial/empty quick edit state.
 */
export function createEmptyQuickEditState<T>(): QuickEditState<T> {
  return {
    isOpen: false,
    item: null,
    operation: 'create',
    isSaving: false,
    error: null,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// CRUD Facade
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Standard CRUD operations interface for facades.
 *
 * All module facades should implement this interface to enable
 * automatic data operations in FeatureListPageClass and FeatureDetailPageClass.
 *
 * @stable
 *
 * @typeParam TItem - Full item type (for single get, create, update responses)
 * @typeParam TListItem - List item type (often a subset of TItem for list views)
 * @typeParam TInput - Input type for create/update operations
 * @typeParam TQuery - Query parameters type for list operations
 * @typeParam TId - ID type (usually string or number)
 *
 * @example
 * ```typescript
 * @Injectable({ providedIn: 'root' })
 * export class ProductFacade implements CrudFacade<Product, ProductListItem, ProductInput, ProductQuery> {
 *   loadItems(query) { return this.api.getProducts(query); }
 *   getItem(id) { return this.api.getProduct(id); }
 *   createItem(input) { return this.api.createProduct(input); }
 *   updateItem(id, input) { return this.api.updateProduct(id, input); }
 *   deleteItem(id) { return this.api.deleteProduct(id); }
 * }
 * ```
 */
export interface CrudFacade<
  TItem,
  TListItem = TItem,
  TInput = Partial<TItem>,
  TQuery = Record<string, unknown>,
  TId = string
> {
  /**
   * Load a paginated list of items.
   * @param query - Query parameters (pagination, filters, sorting)
   */
  loadItems(query?: TQuery): Promise<ListResponse<TListItem>>;

  /**
   * Get a single item by ID.
   * @param id - Item identifier
   */
  getItem(id: TId): Promise<TItem>;

  /**
   * Create a new item.
   * @param input - Item data
   */
  createItem(input: TInput): Promise<TItem>;

  /**
   * Update an existing item.
   * @param id - Item identifier
   * @param input - Updated item data
   */
  updateItem(id: TId, input: Partial<TInput>): Promise<TItem>;

  /**
   * Delete an item.
   * @param id - Item identifier
   */
  deleteItem(id: TId): Promise<void>;
}

/**
 * Partial CRUD facade for read-only or limited operations.
 * Use when not all CRUD operations are available.
 *
 * @stable
 */
export interface PartialCrudFacade<
  TItem,
  TListItem = TItem,
  TInput = Partial<TItem>,
  TQuery = Record<string, unknown>,
  TId = string
> {
  loadItems?(query?: TQuery): Promise<ListResponse<TListItem>>;
  getItem?(id: TId): Promise<TItem>;
  createItem?(input: TInput): Promise<TItem>;
  updateItem?(id: TId, input: Partial<TInput>): Promise<TItem>;
  deleteItem?(id: TId): Promise<void>;
  /** Import from CSV file (backend parses and returns result). */
  importCsv?(file: File): Promise<ImportResult>;
  /** Export filtered list as CSV blob. */
  exportCsv?(query?: TQuery): Promise<Blob>;
}

// ═══════════════════════════════════════════════════════════════════════════
// Listing Toolbar Framework
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Toolbar selection state (framework-managed).
 *
 * Selection is a MODE, not an action:
 * - 'default': No checkboxes, dataset actions visible, "Select" trigger available
 * - 'selection': Checkbox column appears, bulk actions injected, "Cancel" visible
 */
export type ToolbarSelectionState = 'default' | 'selection';

/**
 * Action configuration for toolbar buttons.
 *
 * Actions are categorized by their target:
 * - dataset: Operates on filtered dataset (export, refresh, sync)
 * - selection: Operates on selected items (bulk delete, bulk export)
 * - overflow: Low-frequency actions (manage columns, saved views, preferences)
 */
export interface ToolbarActionConfig {
  /** Unique identifier for the action */
  id: string;

  /** Button label. Empty string = icon-only (requires ariaLabel) */
  label: string;

  /** Material icon name */
  icon?: string;

  /** Required for icon-only buttons (accessibility) */
  ariaLabel?: string;

  /** Whether the action is disabled */
  disabled?: boolean;

  /**
   * Button variant for semantic styling.
   * - 'secondary': Default neutral style
   * - 'danger': Destructive actions (delete, remove)
   * Default: 'secondary'
   */
  variant?: 'secondary' | 'danger';

  /**
   * Visibility rule based on selection state.
   * - 'always': Show in both states
   * - 'default': Show only in default state
   * - 'selection': Show only in selection state
   * Default: 'always'
   */
  visibleIn?: 'always' | 'default' | 'selection';
}

/**
 * Query zone configuration.
 *
 * Purpose: Shape the dataset query (search, filters, reset).
 * Rules: Stateless only. No dataset or selection actions allowed.
 */
export interface ToolbarQueryConfig {
  /** Show search input */
  search: boolean;

  /** Search placeholder text */
  searchPlaceholder?: string;

  /**
   * Filters are injected via FilterFieldConfig[].
   * The toolbar will render them using the filter-bar component.
   */
  filters: FilterFieldConfig[];
}

/**
 * Action zone configuration.
 *
 * Purpose: Act on dataset or selection.
 * Contains dataset-level actions and selection mode trigger.
 */
export interface ToolbarActionsConfig {
  /**
   * Dataset-level actions (export, refresh, sync).
   * These operate on the filtered dataset, NOT selection.
   */
  dataset: ToolbarActionConfig[];

  /**
   * Selection-mode bulk actions (bulk delete, bulk export).
   * Only visible when selection state is 'selection'.
   */
  selection: ToolbarActionConfig[];

  /**
   * Overflow menu actions (manage columns, saved views, import mapping).
   * Rendered in ⋮ menu. Auto-hidden when empty.
   */
  overflow?: ToolbarActionConfig[];
}

/**
 * View zone configuration.
 *
 * Purpose: Visual preferences only. Never affects dataset or selection.
 * Rules: Icon-only controls, lowest visual priority, always far right.
 */
export interface ToolbarViewConfig {
  /** Show density toggle (compact/comfortable/spacious) */
  density?: boolean;

  /** Show column visibility toggle */
  columns?: boolean;

  /** Show layout toggle (table/grid/cards) */
  layout?: boolean;
}

/**
 * Selection configuration.
 *
 * Defines whether selection mode is available for this listing.
 */
export interface ToolbarSelectionConfig {
  /** Whether selection mode can be activated */
  enabled: boolean;

  /**
   * Label for the "Select" trigger button.
   * Default: 'Select'
   */
  triggerLabel?: string;

  /**
   * Label for the "Cancel selection" button.
   * Default: 'Cancel'
   */
  cancelLabel?: string;
}

/**
 * Complete Listing Toolbar Configuration.
 *
 * The toolbar renders EXCLUSIVELY from this config.
 * No page-specific layout logic. No hardcoded actions.
 *
 * Layout (FROZEN):
 * [ Query Zone ]            [ Action Zone ]            [ View Zone ]
 *
 * Zones never reorder. Zones never collapse into each other.
 * Only content inside zones is configurable.
 */
export interface ListingToolbarConfig {
  /**
   * Query zone: search & filters.
   * LEFT side of toolbar.
   */
  query: ToolbarQueryConfig;

  /**
   * Action zone: dataset actions, selection actions, overflow.
   * RIGHT side of toolbar (primary).
   */
  actions: ToolbarActionsConfig;

  /**
   * Selection configuration.
   * Determines if selection mode is available.
   */
  selection: ToolbarSelectionConfig;

  /**
   * View zone: visual preferences.
   * RIGHT side of toolbar (secondary, last).
   */
  view: ToolbarViewConfig;
}

/**
 * Toolbar output events.
 */
export interface ToolbarActionEvent {
  /** Action ID that was triggered */
  actionId: string;

  /** Source zone of the action */
  source: 'dataset' | 'selection' | 'overflow' | 'view';
}

export interface ToolbarQueryEvent {
  /** Current search term */
  search: string;

  /** Current filter values */
  filters: Record<string, unknown>;
}

export interface ToolbarSelectionModeEvent {
  /** New selection state */
  state: ToolbarSelectionState;
}

// ═══════════════════════════════════════════════════════════════════════════
// Import / Export (standard listing module)
// ═══════════════════════════════════════════════════════════════════════════

/** Allowed import file formats. CSV mandatory; XLSX optional (converted to CSV). */
export type ImportExportFormat = 'csv' | 'xlsx';

/** Template column: stable technical key for CSV header (not translated). */
export interface ImportExportTemplateColumn {
  key: string;
  label?: string;
}

/**
 * Import/Export configuration per entity (listing page).
 * Enables the single "Import / Export" toolbar button and modal behavior.
 */
export interface ImportExportConfig {
  /** Enable the Import / Export button and modal. */
  enableImportExport: boolean;

  /** Display name for modal title: "Import / Export {entityName}". */
  entityName: string;

  /** One-line explanation for Import tab. */
  importExplanation: string;

  /** One-line explanation for Export tab. */
  exportExplanation: string;

  /** Columns for CSV template and validation (stable keys). */
  templateColumns: ImportExportTemplateColumn[];

  /** Allowed import formats. CSV mandatory. */
  allowedImportFormats?: ImportExportFormat[];

  /** Enable "Export current view" (filters + sort). */
  enableExport?: boolean;

  /** Enable "Export selected rows" when selection mode exists. */
  enableSelectionExport?: boolean;
}

/** Single import error (row-level). */
export interface ImportResultError {
  row: number;
  field?: string;
  message: string;
}

/** Result of an import run (created, updated, skipped, failed). */
export interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  totalRows?: number;
  errors?: ImportResultError[];
}

/** Pre-import validation summary. */
export interface ImportValidationSummary {
  totalRows: number;
  validRows: number;
  errorRows: number;
  errors: Array<{ row: number; message: string }>;
  schemaValid: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// Entity Listing Page Configuration
// ═══════════════════════════════════════════════════════════════════════════

/**
 * View mode for listing pages.
 */
export type ViewMode = 'table' | 'cards' | 'grid' | 'list';

/**
 * Card view configuration.
 */
export interface CardViewConfig {
  /** Field containing image URL (optional) */
  imageField?: string;

  /** Field for card title */
  titleField: string;

  /** Field for card subtitle (optional) */
  subtitleField?: string;

  /** Field for badge display (optional) */
  badgeField?: string;

  /** Where to place action buttons */
  actionsPosition?: 'overlay' | 'footer';

  /** Placeholder image when imageField is empty */
  placeholderImage?: string;
}

/**
 * Grid view configuration.
 */
export interface GridViewConfig {
  /** Number of columns (or 'auto' for responsive) */
  columns?: number | 'auto';

  /** Aspect ratio for grid items */
  aspectRatio?: string;

  /** Field for primary display */
  titleField: string;

  /** Field for secondary display */
  subtitleField?: string;
}

/**
 * List view configuration (single-line items).
 */
export interface ListViewConfig {
  /** Field for primary display */
  primaryField: string;

  /** Field for secondary display (optional) */
  secondaryField?: string;

  /** Field for tertiary display (optional) */
  tertiaryField?: string;

  /** Field for avatar/icon (optional) */
  avatarField?: string;
}

/**
 * View modes configuration for entity listing.
 */
export interface ViewModesConfig {
  /** Available view modes */
  available: ViewMode[];

  /** Default view mode */
  default: ViewMode;

  /** Card view configuration (when 'cards' is available) */
  card?: CardViewConfig;

  /** Grid view configuration (when 'grid' is available) */
  grid?: GridViewConfig;

  /** List view configuration (when 'list' is available) */
  list?: ListViewConfig;
}

/**
 * Feature flags for entity listing.
 */
export interface ListingFeatures {
  /** Enable search input */
  search: boolean;

  /** Enable filter panel */
  filters: boolean;

  /** Enable column visibility toggle */
  columnToggle: boolean;

  /** Selection mode configuration */
  selectionMode: 'none' | 'single' | 'multiple' | 'toggleable';

  /** Enable view mode toggle (table/cards/grid) */
  viewModeToggle: boolean;

  /** Enable import/export functionality */
  importExport: boolean;

  /** Enable refresh button */
  refresh?: boolean;

  /** Enable saved views */
  savedViews?: boolean;
}

/**
 * Action button configuration (for toolbar actions like New, Import/Export).
 */
export interface ActionConfig {
  /** Unique action identifier */
  id: string;

  /** Button label (empty for icon-only) */
  label?: string;

  /** Icon name (Lucide icon) */
  icon?: string;

  /** Accessibility label (required for icon-only buttons) */
  ariaLabel?: string;

  /** Button variant */
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost';

  /** Whether the action is disabled */
  disabled?: boolean;

  /** Tooltip text */
  tooltip?: string;
}

/**
 * @deprecated Use EntityActionConfig with scope instead.
 * Row action configuration.
 */
export interface RowActionConfig {
  /** Unique action identifier */
  id: string;

  /** Icon name (Lucide icon) */
  icon: string;

  /** Button label */
  label: string;

  /** Accessibility label */
  ariaLabel?: string;

  /** Button variant */
  variant?: 'default' | 'danger';

  /**
   * Built-in action type (handled by framework).
   * - 'edit': Navigate to detail page
   * - 'view': Open quick view
   * - 'delete': Delete with confirmation
   * - 'duplicate': Clone the item
   */
  builtin?: 'edit' | 'view' | 'delete' | 'duplicate';

  /**
   * Custom handler method name (called on page class).
   * Used when builtin is not set.
   */
  handler?: string;

  /**
   * Visibility function - return false to hide for specific items.
   */
  visible?: (item: unknown) => boolean;

  /**
   * Disabled function - return true to disable for specific items.
   */
  disabled?: (item: unknown) => boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// Unified Entity Actions (with Scope)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Action scope determines when the action is visible in the toolbar.
 * - 'global': Always visible (e.g., New, Import/Export, Refresh)
 * - 'single': Only visible when exactly 1 item is selected
 * - 'bulk': Only visible when 2+ items are selected (true bulk operations)
 * - 'single+bulk': Visible when 1 or more items are selected
 */
export type EntityActionScope = 'global' | 'single' | 'bulk' | 'single+bulk';

/**
 * Built-in action types handled by the framework.
 */
export type BuiltinActionType = 'edit' | 'view' | 'delete' | 'duplicate';

/**
 * Unified entity action configuration.
 *
 * All actions appear in the toolbar. The `scope` property determines
 * when the action is visible based on selection state.
 *
 * @example
 * ```typescript
 * // Global action (always visible)
 * { id: 'new', label: 'New', icon: 'plus', scope: 'global', variant: 'primary' }
 *
 * // Single-only action (visible when exactly 1 item selected)
 * { id: 'edit', label: 'Edit', icon: 'edit', scope: 'single', builtin: 'edit' }
 *
 * // Bulk-only action (visible when 2+ items selected)
 * { id: 'merge', label: 'Merge', icon: 'git-merge', scope: 'bulk', minSelection: 2 }
 *
 * // Single + bulk (visible when 1 or more items selected)
 * { id: 'delete', label: 'Delete', icon: 'trash-2', scope: 'single+bulk', builtin: 'delete', variant: 'danger' }
 * ```
 */
export interface EntityActionConfig<TItem = unknown> {
  /** Unique action identifier */
  id: string;

  /** Action label */
  label: string;

  /** Icon name (Lucide icon) */
  icon?: string;

  /** Accessibility label (required for icon-only buttons) */
  ariaLabel?: string;

  /**
   * Action scope - determines visibility based on selection count.
   * - 'single': Visible when exactly 1 item selected
   * - 'bulk': Visible when 2+ items selected
   * - 'single+bulk': Visible when 1+ items selected
   */
  scope: EntityActionScope;

  /** Button variant */
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost';

  /**
   * Built-in action type (handled by framework).
   * When set, the framework provides default implementation.
   */
  builtin?: BuiltinActionType;

  /**
   * Visibility function based on selection.
   * Return false to hide the action for the current selection.
   */
  visible?: (selection: TItem[]) => boolean;

  /**
   * Disabled function based on selection.
   * Return true to disable the action for the current selection.
   */
  disabled?: (selection: TItem[]) => boolean;

  /**
   * Minimum number of items required.
   * For 'bulk' scope, defaults to 2.
   * For 'single' scope, forced to 1.
   * For 'single+bulk' scope, defaults to 1.
   */
  minSelection?: number;

  /**
   * Maximum number of items allowed.
   * For 'single' scope, forced to 1.
   */
  maxSelection?: number;

  /**
   * Whether to show confirmation dialog before executing.
   * For 'delete' builtin, this defaults to true.
   */
  confirm?: boolean;

  /**
   * Custom confirmation message.
   */
  confirmMessage?: string | ((selection: TItem[]) => string);

  /** Tooltip text */
  tooltip?: string;

  /**
   * Permission required to see/use this action.
   * Follows the Nafura `module.feature.action` convention.
   *
   * @example 'inventory.product.create'
   * @example 'inventory.product.delete'
   */
  permission?: string;
}

/**
 * Empty state configuration.
 */
export interface EmptyStateConfig {
  /** Icon name (Material or Lucide) */
  icon: string;

  /** Title text */
  title: string;

  /** Description message */
  message: string;

  /** Action button label (optional) */
  actionLabel?: string;

  /** Action ID to trigger (defaults to 'create') */
  actionId?: string;
}

/**
 * Pagination configuration.
 */
export interface PaginationConfig {
  /** Default page size */
  defaultPageSize: number;

  /** Available page size options */
  pageSizeOptions: number[];
}

/**
 * Route configuration for entity listing.
 */
export interface ListingRouteConfig<TItem = unknown> {
  /** Function to build detail route */
  detail: (item: TItem) => string[];

  /** Route to create page */
  create: string[];

  /** Route back to list (optional) */
  list?: string[];
}

/**
 * Delete confirmation configuration.
 */
export interface DeleteConfig<TItem = unknown> {
  /** Dialog title */
  title: string;

  /** Function to generate confirmation message */
  getMessage: (item: TItem) => string;

  /** Confirm button label */
  confirmLabel?: string;

  /** Dialog icon */
  icon?: string;

  /** Toast message on success */
  successMessage: string;

  /** Toast message on error */
  errorMessage: string;
}

/**
 * Complete Entity Listing Page Configuration.
 *
 * This configuration drives the entire listing page behavior.
 * The EntityListingComponent renders based on this config.
 *
 * @typeParam TItem - The list item type
 */
export interface ListingPageConfig<TItem = unknown> {
  // === Identity ===
  /** Entity name (singular) - e.g., "Product" */
  entityName: string;

  /** Entity name (plural) - e.g., "Products" */
  entityNamePlural: string;

  // === Data Display ===
  /** Column configurations for table view */
  columns: ColumnConfig[];

  /** Keys of columns visible by default (all if not specified) */
  defaultVisibleColumns?: string[];

  // === View Modes ===
  /** View mode configuration */
  viewModes: ViewModesConfig;

  // === Features ===
  /** Feature flags */
  features: ListingFeatures;

  // === Actions ===
  /** @deprecated Page header is now separate from entity-listing. */
  headerActions?: ActionConfig[];

  /**
   * @deprecated Use `actions` with `scope: 'global'` instead.
   */
  toolbarActions?: ActionConfig[];

  /**
   * Unified actions configuration. Single source of truth for all actions.
   *
   * Scope determines when action is visible:
   * - 'global': Always visible (New, Import/Export, Refresh)
   * - 'single': When exactly 1 item is selected (Edit, Duplicate)
   * - 'bulk': When 2+ items are selected (Merge)
   * - 'single+bulk': When 1+ items are selected (Delete)
   *
   * @example
   * ```typescript
   * actions: [
   *   // Global actions (always visible)
   *   { id: 'new', label: 'New', scope: 'global', variant: 'primary' },
   *   { id: 'import-export', icon: 'upload', scope: 'global' },
   *
   *   // Selection-based actions
   *   { id: 'edit', label: 'Edit', icon: 'edit', scope: 'single', builtin: 'edit' },
   *   { id: 'delete', label: 'Delete', icon: 'trash-2', scope: 'single+bulk', builtin: 'delete', variant: 'danger' },
   * ]
   * ```
   */
  actions?: EntityActionConfig<TItem>[];

  /**
   * @deprecated Use `actions` with appropriate scope instead.
   */
  bulkActions?: ActionConfig[];

  /**
   * @deprecated Row actions removed. Use `actions` with scope instead.
   */
  rowActions?: RowActionConfig[];

  // === Filters ===
  /** Filter field configurations */
  filters: FilterFieldConfig[];

  // === Pagination ===
  /** Pagination settings */
  pagination: PaginationConfig;

  // === Navigation ===
  /** Route configuration */
  routes: ListingRouteConfig<TItem>;

  // === Delete ===
  /** Delete confirmation configuration */
  delete?: DeleteConfig<TItem>;

  // === Import/Export ===
  /** Import/export configuration */
  importExport?: ImportExportConfig;

  // === Empty State ===
  /** Empty state configuration */
  emptyState: EmptyStateConfig;

  // === Sorting ===
  /** Default sort configuration */
  defaultSort?: SortState;
}

/**
 * Action event emitted by entity listing.
 */
export interface ListingActionEvent<TItem = unknown> {
  /** Action identifier */
  actionId: string;

  /**
   * Action source indicating where the action was triggered from.
   * - 'toolbar': Toolbar button (New, Import/Export, etc.)
   * - 'row': Row action menu (single item)
   * - 'bulk': Bulk action toolbar (multiple items selected)
   * @deprecated 'header' - use page-level header instead
   */
  source: 'header' | 'toolbar' | 'bulk' | 'row';

  /**
   * The item associated with the action.
   * Present for 'row' source (single item actions).
   */
  item?: TItem;

  /**
   * Selected items for bulk actions.
   * Present for 'bulk' source.
   * For 'single+bulk' actions triggered from row, this will be undefined.
   */
  selection?: TItem[];
}

/**
 * Helper type to extract single-scope actions from EntityActionConfig array.
 */
export type SingleScopeActions<TItem> = EntityActionConfig<TItem> & {
  scope: 'single' | 'single+bulk';
};

/**
 * Helper type to extract bulk-scope actions from EntityActionConfig array.
 */
export type BulkScopeActions<TItem> = EntityActionConfig<TItem> & {
  scope: 'bulk' | 'single+bulk';
};

/**
 * Column template context.
 */
export interface ColumnTemplateContext<TItem = unknown> {
  /** The cell value */
  $implicit: unknown;

  /** The full item */
  item: TItem;

  /** The column configuration */
  column: ColumnConfig;
}
