/**
 * Sidebar Registry
 * 
 * Central registry where modules register their sidebar declarations.
 * This is the collection point - modules push, core consumes.
 * 
 * Design principle: Modules declare, Core composes.
 */

import { Injectable, InjectionToken, inject } from '@angular/core';
import { FeatureSidebarDeclaration, SidebarNode } from './sidebar.types';

/**
 * Injection token for providing module sidebar declarations.
 * Modules use this to register their navigation at bootstrap.
 * 
 * Usage in module:
 * ```typescript
 * providers: [
 *   {
 *     provide: SIDEBAR_DECLARATIONS,
 *     useValue: module1SidebarDeclaration,
 *     multi: true
 *   }
 * ]
 * ```
 */
export const SIDEBAR_DECLARATIONS = new InjectionToken<FeatureSidebarDeclaration[]>(
  'SIDEBAR_DECLARATIONS'
);

/**
 * Sidebar Registry Service
 * 
 * Collects and manages all module sidebar declarations.
 * Provides the raw, unfiltered sidebar data to the builder.
 */
@Injectable({ providedIn: 'root' })
export class SidebarRegistry {
  /** Registered module declarations */
  private readonly declarations: Map<string, FeatureSidebarDeclaration> = new Map();

  /** 
   * Injected declarations from modules.
   * Collected via multi-provider injection token.
   */
  private readonly injectedDeclarations = inject(SIDEBAR_DECLARATIONS, { optional: true }) ?? [];

  constructor() {
    // Auto-register injected declarations
    this.injectedDeclarations.forEach(decl => this.register(decl));
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Registration API
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Register a module's sidebar declaration.
   * Typically called during module initialization.
   */
  register(declaration: FeatureSidebarDeclaration): void {
    const featureId = declaration.featureId ?? declaration.moduleId;
    if (this.declarations.has(featureId)) {
      console.warn(
        `[SidebarRegistry] Feature "${featureId}" already registered. Overwriting.`
      );
    }
    this.declarations.set(featureId, declaration);
  }

  /**
   * Unregister a module's sidebar declaration.
   * Used for dynamic module unloading (rare).
   */
  unregister(moduleId: string): void {
    this.declarations.delete(moduleId);
  }

  /**
   * Register multiple declarations at once.
   */
  registerAll(declarations: FeatureSidebarDeclaration[]): void {
    declarations.forEach(decl => this.register(decl));
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Query API
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Get all registered declarations.
   * Returns a copy to prevent external mutation.
   */
  getAll(): FeatureSidebarDeclaration[] {
    return Array.from(this.declarations.values());
  }

  /**
   * Get declaration for a specific module.
   */
  get(moduleId: string): FeatureSidebarDeclaration | undefined {
    return this.declarations.get(moduleId);
  }

  /**
   * Check if a module is registered.
   */
  has(moduleId: string): boolean {
    return this.declarations.has(moduleId);
  }

  /**
   * Get all registered module IDs.
   */
  getModuleIds(): string[] {
    return Array.from(this.declarations.keys());
  }

  /**
   * Get all nodes from all modules (unfiltered, unsorted).
   * This is the raw aggregate for the builder to process.
   */
  getAllNodes(): SidebarNode[] {
    const allNodes: SidebarNode[] = [];

    for (const declaration of this.declarations.values()) {
      // Attach moduleId to each node for filtering
      const nodesWithModule = declaration.nodes.map(node => ({
        ...node,
        featureId: node.featureId ?? declaration.featureId ?? declaration.moduleId,
        moduleId: node.moduleId ?? declaration.moduleId,
      }));
      allNodes.push(...nodesWithModule);
    }

    return allNodes;
  }

  /**
   * Clear all registrations.
   * Useful for testing.
   */
  clear(): void {
    this.declarations.clear();
  }
}
