/**
 * Sidebar Builder
 * 
 * Composes the final sidebar tree by:
 * 1. Collecting all module declarations from registry
 * 2. Filtering by tenant enabled modules
 * 3. Filtering by user permissions
 * 4. Filtering by tenant type restrictions
 * 5. Sorting by declared order
 * 6. Providing reactive updates
 * 
 * This is the brain of the navigation system.
 */

import { Injectable, Signal, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

import { Permission } from '../security/models/user.models';
import { PermissionService } from '../security/services/permission.service';
import { TenantContextService } from '../tenant/tenant.context';
import { SidebarRegistry } from './sidebar.registry';
import { I18nService } from '../i18n';
import {
  ResolvedSidebarTree,
  SidebarNode,
  SidebarNodeId,
  SidebarZone,
  SidebarZoneGroup,
} from './sidebar.types';

/**
 * Build configuration for sidebar filtering.
 */
export interface SidebarBuildConfig {
  /** Include disabled modules (show as disabled, not hidden) */
  showDisabledModules?: boolean;
  
  /** Include permission-denied items (show as disabled) */
  showDeniedAsDisabled?: boolean;
  
  /** Custom filter predicate */
  customFilter?: (node: SidebarNode) => boolean;
}

/**
 * Sidebar Builder Service
 * 
 * Reactively builds the filtered sidebar tree based on:
 * - Current tenant context
 * - User permissions
 * - Module enablement
 * - Route state
 */
@Injectable({ providedIn: 'root' })
export class SidebarBuilder {
  private readonly registry = inject(SidebarRegistry);
  private readonly tenantContext = inject(TenantContextService);
  private readonly permissionService = inject(PermissionService);
  private readonly i18n = inject(I18nService);
  private readonly router = inject(Router);

  // ─────────────────────────────────────────────────────────────────────────────
  // Reactive State
  // ─────────────────────────────────────────────────────────────────────────────

  /** Current route URL as signal */
  private readonly currentUrl: Signal<string> = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(event => event.urlAfterRedirects),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  /** Current language as signal to refresh translated zone labels */
  private readonly currentLanguage: Signal<string> = toSignal(
    this.i18n.onLanguageChange().pipe(startWith(this.i18n.getCurrentLanguage())),
    { initialValue: this.i18n.getCurrentLanguage() }
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Build and return the resolved sidebar tree.
   * This is the main entry point for the sidebar component.
   */
  readonly tree: Signal<ResolvedSidebarTree> = computed(() => {
    // Track language changes so zone labels are rebuilt reactively.
    this.currentLanguage();

    const rawNodes = this.registry.getAllNodes();
    const filteredNodes = this.filterNodes(rawNodes);
    const sortedNodes = this.sortNodes(filteredNodes);
    const activeNodeId = this.findActiveNodeId(sortedNodes, this.currentUrl());
    const zones = this.groupNodesByZone(sortedNodes);

    return {
      nodes: sortedNodes,
      activeNodeId,
      expandedNodeIds: this.computeExpandedIds(sortedNodes, activeNodeId),
      zones,
    };
  });

  /**
   * Build tree with custom configuration.
   */
  buildWithConfig(config: SidebarBuildConfig): ResolvedSidebarTree {
    const rawNodes = this.registry.getAllNodes();
    const filteredNodes = this.filterNodes(rawNodes, config);
    const sortedNodes = this.sortNodes(filteredNodes);
    const activeNodeId = this.findActiveNodeId(sortedNodes, this.currentUrl());
    const zones = this.groupNodesByZone(sortedNodes);

    return {
      nodes: sortedNodes,
      activeNodeId,
      expandedNodeIds: this.computeExpandedIds(sortedNodes, activeNodeId),
      zones,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Filtering Logic
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Filter nodes based on tenant, permissions, and module enablement.
   * Recursively processes children.
   */
  private filterNodes(
    nodes: SidebarNode[],
    config?: SidebarBuildConfig
  ): SidebarNode[] {
    const result: SidebarNode[] = [];

    for (const node of nodes) {
      const filteredNode = this.filterNode(node, config);
      if (filteredNode) {
        result.push(filteredNode);
      }
    }

    return result;
  }

  /**
   * Filter a single node and its children.
   * Returns null if node should be hidden.
   */
  private filterNode(
    node: SidebarNode,
    config?: SidebarBuildConfig
  ): SidebarNode | null {
    // Check frontend visibility (hardest filter - no override)
    if (node.visible === false) {
      return null;
    }

    // Check feature/module enablement
    const featureId = node.featureId ?? node.moduleId;
    if (featureId && !this.isFeatureEnabled(featureId)) {
      if (!config?.showDisabledModules) {
        return null;
      }
      // Show as disabled instead of hidden
      node = { ...node, disabled: true };
    }

    // Check tenant type restrictions
    if (!this.checkTenantType(node)) {
      return null; // Tenant type restrictions are always hard filters
    }

    // Check permissions
    if (!this.checkPermissions(node)) {
      if (!config?.showDeniedAsDisabled) {
        return null;
      }
      node = { ...node, disabled: true };
    }

    // Apply custom filter
    if (config?.customFilter && !config.customFilter(node)) {
      return null;
    }

    // Recursively filter children
    if (node.children && node.children.length > 0) {
      const filteredChildren = this.filterNodes(node.children, config);
      
      // If all children are filtered out, hide the parent (unless it has its own route)
      if (filteredChildren.length === 0 && !node.route && !node.externalUrl) {
        return null;
      }

      node = { ...node, children: filteredChildren };
    }

    return node;
  }

  /**
   * Check if module is enabled for current tenant.
   */
  private isFeatureEnabled(featureId: string): boolean {
    return this.tenantContext.isFeatureEnabled(featureId);
  }

  /**
   * Check if current tenant type can see this node.
   */
  private checkTenantType(node: SidebarNode): boolean {
    if (!node.tenantTypes || node.tenantTypes.length === 0) {
      return true; // No restrictions
    }

    const currentType = this.tenantContext.tenantType();
    return currentType ? node.tenantTypes.includes(currentType) : false;
  }

  /**
   * Check if current user has required permissions.
   */
  private checkPermissions(node: SidebarNode): boolean {
    // Check AND permissions (all required)
    if (node.permissions && node.permissions.length > 0) {
      if (!this.hasAllPermissions(node.permissions)) {
        return false;
      }
    }

    // Check OR permissions (any required)
    if (node.permissionsAny && node.permissionsAny.length > 0) {
      if (!this.hasAnyPermission(node.permissionsAny)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if user has all specified permissions.
   */
  private hasAllPermissions(permissions: Permission[]): boolean {
    return permissions.every(p => this.permissionService.hasPermission(p));
  }

  /**
   * Check if user has any of the specified permissions.
   */
  private hasAnyPermission(permissions: Permission[]): boolean {
    return permissions.some(p => this.permissionService.hasPermission(p));
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Sorting Logic
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Sort nodes by their order property.
   * Recursively sorts children.
   */
  private sortNodes(nodes: SidebarNode[]): SidebarNode[] {
    const sorted = [...nodes].sort((a, b) => {
      const orderA = a.order ?? 999;
      const orderB = b.order ?? 999;
      return orderA - orderB;
    });

    return sorted.map(node => {
      if (node.children && node.children.length > 0) {
        return { ...node, children: this.sortNodes(node.children) };
      }
      return node;
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Active State Logic
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Find the active node ID based on current URL.
   */
  private findActiveNodeId(
    nodes: SidebarNode[],
    currentUrl: string
  ): SidebarNodeId | undefined {
    // Normalize URL for comparison
    const normalizedUrl = this.normalizeUrl(currentUrl);

    // Find best match (longest matching route wins)
    let bestMatchId: SidebarNodeId | undefined = undefined;
    let bestMatchLength = 0;

    this.traverseNodes(nodes, node => {
      if (node.route) {
        const normalizedRoute = this.normalizeUrl(node.route);
        
        if (normalizedUrl.startsWith(normalizedRoute)) {
          if (normalizedRoute.length > bestMatchLength) {
            bestMatchId = node.id;
            bestMatchLength = normalizedRoute.length;
          }
        }
      }
    });

    return bestMatchId;
  }

  /**
   * Compute which nodes should be expanded based on active node.
   * Expands all ancestors of the active node.
   * By default, expands all parent nodes that have children.
   */
  private computeExpandedIds(
    nodes: SidebarNode[],
    activeNodeId?: SidebarNodeId
  ): Set<SidebarNodeId> {
    const expandedIds = new Set<SidebarNodeId>();

    // Expand only the active path to reduce first-load cognitive overload
    if (activeNodeId) {
      const path = this.findPathToNode(nodes, activeNodeId);
      path.forEach(id => expandedIds.add(id));
    }

    // Respect explicit expansion hints from navigation config
    this.traverseNodes(nodes, node => {
      if (node.children?.length && node.meta?.['expanded'] === true) {
        expandedIds.add(node.id);
      }
    });

    return expandedIds;
  }

  /**
   * Recursively expand all parent nodes that have children.
   */
  /**
   * Find the path (ancestor IDs) to a specific node.
   */
  private findPathToNode(
    nodes: SidebarNode[],
    targetId: SidebarNodeId,
    currentPath: SidebarNodeId[] = []
  ): SidebarNodeId[] {
    for (const node of nodes) {
      if (node.id === targetId) {
        return currentPath;
      }

      if (node.children && node.children.length > 0) {
        const path = this.findPathToNode(
          node.children,
          targetId,
          [...currentPath, node.id]
        );
        if (path.length > 0 || node.children.some(c => c.id === targetId)) {
          return path.length > 0 ? path : [...currentPath, node.id];
        }
      }
    }

    return [];
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Utilities
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Traverse all nodes recursively.
   */
  private traverseNodes(
    nodes: SidebarNode[],
    callback: (node: SidebarNode) => void
  ): void {
    for (const node of nodes) {
      callback(node);
      if (node.children && node.children.length > 0) {
        this.traverseNodes(node.children, callback);
      }
    }
  }

  /**
   * Normalize URL for comparison.
   * Removes query params and trailing slashes.
   */
  private normalizeUrl(url: string): string {
    return url.split('?')[0].replace(/\/$/, '').toLowerCase();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Zone Grouping Logic
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Group nodes by their zone identifier.
   * Creates sectioned sidebar structure.
   */
  private groupNodesByZone(nodes: SidebarNode[]): SidebarZoneGroup[] {
    const zoneMap = new Map<string, SidebarNode[]>();

    // Group nodes by zone (default to 'work' if not specified)
    for (const node of nodes) {
      const zone = node.zone || 'work';
      if (!zoneMap.has(zone)) {
        zoneMap.set(zone, []);
      }
      zoneMap.get(zone)!.push(node);
    }

    // Convert to array with proper ordering and labels
    const zoneOrder = ['work', 'administration', 'platform', 'inventory', 'finance'];
    const zoneLabels: Record<string, string> = {
      work: this.i18n.instant('core.navigation.zones.work'),
      administration: this.i18n.instant('core.navigation.zones.administration'),
      platform: this.i18n.instant('core.navigation.zones.platform'),
      inventory: this.i18n.instant('core.navigation.zones.inventory'),
      finance: this.i18n.instant('core.navigation.zones.finance'),
    };

    const result: SidebarZoneGroup[] = [];

    for (const [index, zone] of zoneOrder.entries()) {
      const zoneNodes = zoneMap.get(zone);
      if (zoneNodes && zoneNodes.length > 0) {
        result.push({
          zone,
          label: zoneLabels[zone],
          order: index,
          nodes: zoneNodes,
        });
      }
    }

    // Append any non-standard zones after known defaults.
    const knownZones = new Set(zoneOrder);
    const extraZones = Array.from(zoneMap.keys())
      .filter((zone) => !knownZones.has(zone))
      .sort((a, b) => a.localeCompare(b));

    for (const [offset, zone] of extraZones.entries()) {
      const zoneNodes = zoneMap.get(zone);
      if (zoneNodes && zoneNodes.length > 0) {
        result.push({
          zone,
          label: zone,
          order: zoneOrder.length + offset,
          nodes: zoneNodes,
        });
      }
    }

    return result;
  }
}
