/**
 * Feature Page Class
 *
 * Abstract base for all feature-level pages.
 *
 * Design principles:
 * - Minimal and focused on universal concerns only
 * - No business logic
 * - Provides route data as reactive signals
 * - Clean lifecycle hooks
 *
 * What belongs here (universal to ALL pages):
 * - Route params/query params as signals
 * - Lifecycle management (destroy)
 * - Basic lifecycle hooks
 *
 * What does NOT belong here (inject where needed):
 * - Title management → PageTitleService
 * - Breadcrumbs → BreadcrumbService
 * - Permissions → PermissionService
 * - Tenant context → TenantContextService
 * - Loading/Error state → Subclasses (List, Detail)
 */

import {
  DestroyRef,
  Directive,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Data, Params } from '@angular/router';
import { Observable } from 'rxjs';

/**
 * Feature Page Class
 *
 * Extend this class for feature-level pages.
 * Provides route handling and lifecycle management.
 *
 * @example
 * ```typescript
 * @Component({...})
 * export class MyPage extends FeaturePageClass {
 *   protected override onPageInit(): void {
 *     const id = this.getParam('id');
 *     // Initialize page
 *   }
 * }
 * ```
 */
@Directive()
export abstract class FeaturePageClass implements OnInit {
  // ═══════════════════════════════════════════════════════════════════════════
  // Injected Dependencies (Universal)
  // ═══════════════════════════════════════════════════════════════════════════

  protected readonly route = inject(ActivatedRoute);
  protected readonly destroyRef = inject(DestroyRef);

  // ═══════════════════════════════════════════════════════════════════════════
  // Route Data as Signals
  // ═══════════════════════════════════════════════════════════════════════════

  /** Route params as reactive signal */
  protected readonly routeParams = signal<Params>({});

  /** Query params as reactive signal */
  protected readonly queryParams = signal<Params>({});

  /** Route data as reactive signal */
  protected readonly routeData = signal<Data>({});

  // ═══════════════════════════════════════════════════════════════════════════
  // Lifecycle
  // ═══════════════════════════════════════════════════════════════════════════

  ngOnInit(): void {
    this.subscribeToRoute();
    this.onPageInit();
  }

  /**
   * Override in subclass for page-specific initialization.
   * Called after route subscriptions are set up.
   */
  protected onPageInit(): void {
    // Override in subclass
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Route Helpers
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get a route param by key.
   */
  protected getParam(key: string): string | null {
    return this.routeParams()[key] ?? null;
  }

  /**
   * Get a query param by key.
   */
  protected getQueryParam(key: string): string | null {
    return this.queryParams()[key] ?? null;
  }

  /**
   * Get route data by key.
   */
  protected getRouteData<T>(key: string): T | null {
    return (this.routeData()[key] as T) ?? null;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Observable Helpers
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Pipe an observable to auto-unsubscribe on destroy.
   */
  protected untilDestroyed<T>(observable: Observable<T>): Observable<T> {
    return observable.pipe(takeUntilDestroyed(this.destroyRef));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Route Change Hooks
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Override to react to route param changes.
   */
  protected onRouteParamsChange(params: Params): void {
    // Override in subclass
  }

  /**
   * Override to react to query param changes.
   */
  protected onQueryParamsChange(params: Params): void {
    // Override in subclass
  }

  /**
   * Override to react to route data changes.
   */
  protected onRouteDataChange(data: Data): void {
    // Override in subclass
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Private
  // ═══════════════════════════════════════════════════════════════════════════

  private subscribeToRoute(): void {
    // Params
    this.route.params
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.routeParams.set(params);
        this.onRouteParamsChange(params);
      });

    // Query params
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.queryParams.set(params);
        this.onQueryParamsChange(params);
      });

    // Route data
    this.route.data
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        this.routeData.set(data);
        this.onRouteDataChange(data);
      });
  }
}
