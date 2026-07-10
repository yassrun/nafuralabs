/**
 * Sidebar Navigation Types
 * 
 * Core type definitions for the data-driven sidebar architecture.
 * Features declare their navigation structure using these types.
 * Core composes and filters based on tenant, permissions, and module state.
 */

import { Permission } from '../security/models/user.models';

/**
 * Unique identifier for sidebar nodes.
 * Format convention: 'domain.feature' or 'domain.feature.resource'
 */
export type SidebarNodeId = string;

/**
 * Icon representation - framework agnostic.
 * Can be icon name (string) or component reference.
 */
export type SidebarIcon = string | { component: unknown };

/**
 * Badge configuration for sidebar items.
 * Used for notifications, counts, or status indicators.
 */
export interface SidebarBadge {
  /** Display value (number or text) */
  value: string | number;
  /** Visual variant for styling */
  variant: 'info' | 'warning' | 'error' | 'success';
  /** Optional: hide when value is 0 */
  hideWhenZero?: boolean;
}

/**
 * Dynamic badge provider function.
 * Allows modules to provide reactive badge values.
 */
export type SidebarBadgeProvider = () => SidebarBadge | null;

/**
 * Sidebar zone identifier.
 * Used to group nodes into logical sections.
 */
export type SidebarZone = string;

export interface ZoneConfig {
  id: string;
  label: string;
  order: number;
  icon?: string;
}

export type GeneratedZoneConfig = ZoneConfig;

/**
 * Core sidebar node definition.
 * 
 * This is the fundamental unit of the navigation tree.
 * Features declare arrays of these nodes.
 * Core composes them into a filtered, tenant-scoped tree.
 */
export interface SidebarNode {
  /** Unique identifier for this node */
  id: SidebarNodeId;

  /** Display label (supports i18n keys) */
  label: string;

  /** Icon for the node */
  icon?: SidebarIcon;

  /** Route path for navigation (leaf nodes) */
  route?: string;

  /** Use exact route matching for active state (default: false — prefix matching) */
  exactMatch?: boolean;

  /** External URL (opens in new tab) */
  externalUrl?: string;

  /** Nested child nodes */
  children?: SidebarNode[];

  /** 
   * Required permissions to view this node.
   * All permissions must be satisfied (AND logic).
   */
  permissions?: Permission[];

  /**
   * Alternative: ANY of these permissions grants access (OR logic).
   * Use when multiple roles can access the same feature.
   */
  permissionsAny?: Permission[];

  /**
   * Feature identifier this node belongs to (canonical).
   * Used for feature-level enable/disable filtering.
   */
  featureId?: string;

  /**
   * Module identifier this node belongs to (legacy alias).
   * @deprecated Use featureId.
   */
  moduleId?: string;

  /**
   * Tenant types that can see this node.
   * Empty/undefined = visible to all tenants.
   */
  tenantTypes?: string[];

  /** Display order within parent (lower = higher priority) */
  order?: number;

  /** Badge configuration or provider */
  badge?: SidebarBadge | SidebarBadgeProvider;

  /** Divider before this node */
  dividerBefore?: boolean;

  /** Divider after this node */
  dividerAfter?: boolean;

  /** Node is disabled but visible */
  disabled?: boolean;

  /**
   * Frontend visibility control.
   * When false, hides the item entirely (not just disabled).
   * Use for: feature flags, experimental features, conditional UI.
   * Default: true (visible)
   */
  visible?: boolean;

  /** Tooltip text */
  tooltip?: string;

  /**
   * Zone identifier for grouping nodes into sections.
   * - 'work': Business/operational modules (default)
   * - 'administration': Tenant-level configuration
   * - 'platform': System/platform-level settings (future)
   */
  zone?: SidebarZone;

  /** Custom metadata for extension points */
  meta?: Record<string, unknown>;
}

/**
 * Feature sidebar declaration.
 * Each feature exports one of these to register its navigation.
 */
export interface FeatureSidebarDeclaration {
  /** Feature unique identifier (canonical) */
  featureId?: string;

  /**
   * Module unique identifier (legacy alias).
   * @deprecated Use featureId.
   */
  moduleId: string;

  /** Root-level nodes this module contributes */
  nodes: SidebarNode[];

  /** Default order for this module's section */
  order?: number;
}

/**
 * Legacy alias retained during terminology migration.
 * @deprecated Use FeatureSidebarDeclaration.
 */
export type ModuleSidebarDeclaration = FeatureSidebarDeclaration;

/**
 * Grouped sidebar nodes by zone.
 */
export interface SidebarZoneGroup {
  /** Zone identifier */
  zone: string;
  /** Zone display label (i18n key) */
  label: string;
  /** Zone display order */
  order: number;
  /** Nodes in this zone */
  nodes: SidebarNode[];
}

/**
 * Resolved sidebar tree after filtering.
 * This is what the renderer receives.
 */
export interface ResolvedSidebarTree {
  /** Filtered, ordered nodes ready for rendering */
  nodes: SidebarNode[];

  /** Active node ID based on current route */
  activeNodeId?: SidebarNodeId;

  /** Expanded node IDs (for tree state) */
  expandedNodeIds: Set<SidebarNodeId>;

  /** Nodes grouped by zone (for sectioned rendering) */
  zones?: SidebarZoneGroup[];
}

/**
 * Sidebar state for the renderer.
 * Tracks UI state separately from data.
 */
export interface SidebarState {
  /** Currently expanded node IDs */
  expandedIds: Set<SidebarNodeId>;

  /** Sidebar collapsed state (icon-only mode) */
  isCollapsed: boolean;

  /** Pinned/favorite node IDs */
  pinnedIds: Set<SidebarNodeId>;
}

/**
 * Sidebar node click event.
 * Emitted when a node is activated.
 */
export interface SidebarNodeEvent {
  node: SidebarNode;
  event: MouseEvent | KeyboardEvent;
  isExpand: boolean;
}
