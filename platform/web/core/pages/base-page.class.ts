/**
 * Base Page Class
 * 
 * Abstract base for all page components.
 * 
 * Design principles:
 * - Thin and opinionated only on layout
 * - No business logic
 * - Provides common page lifecycle hooks
 * - Standardizes page structure
 * - Handles common concerns (loading, errors, breadcrumbs)
 */

import {
  ChangeDetectorRef,
  DestroyRef,
  Directive,
  OnInit,
  Signal,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Data, Params } from '@angular/router';
import { Observable } from 'rxjs';

import { TenantContextService } from '../tenant/tenant.context';
import { PermissionService } from '../security/services/permission.service';
import { ApplicationContextService } from '../application';

/**
 * Page loading state.
 */
export type PageLoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Page error information.
 */
export interface PageError {
  message: string;
  code?: string;
  details?: unknown;
}

/**
 * Breadcrumb item for page navigation.
 */
export interface BreadcrumbItem {
  label: string;
  route?: string;
  icon?: string;
}

/**
 * Page configuration from route data.
 */
export interface PageConfig {
  /** Page title */
  title?: string;

  /** Breadcrumb trail */
  breadcrumbs?: BreadcrumbItem[];

  /** Required permissions for this page */
  permissions?: string[];

  /** Page-specific settings */
  settings?: Record<string, unknown>;
}

/**
 * Base Page Class
 * 
 * Extend this class for standard pages.
 * Provides common structure and lifecycle management.
 * 
 * @example
 * ```typescript
 * @Component({...})
 * export class ProductDetailsPage extends BasePageClass {
 *   protected override pageTitle = 'Product Details';
 *   
 *   protected override onPageInit(): void {
 *     this.loadProduct();
 *   }
 * }
 * ```
 */
@Directive()
export abstract class BasePageClass implements OnInit {
  // ─────────────────────────────────────────────────────────────────────────────
  // Injected Dependencies
  // ─────────────────────────────────────────────────────────────────────────────

  protected readonly route = inject(ActivatedRoute);
  protected readonly titleService = inject(Title);
  protected readonly tenantContext = inject(TenantContextService);
  protected readonly permissionService = inject(PermissionService);
  protected readonly applicationContext = inject(ApplicationContextService);
  protected readonly destroyRef = inject(DestroyRef);
  protected readonly cdr = inject(ChangeDetectorRef);

  // ─────────────────────────────────────────────────────────────────────────────
  // Configuration (Override in subclass)
  // ─────────────────────────────────────────────────────────────────────────────

  /** Page title - override in subclass */
  protected pageTitle: string = '';

  /** Default breadcrumbs - override in subclass */
  protected defaultBreadcrumbs: BreadcrumbItem[] = [];

  /** Auto-update page title on init */
  protected autoSetTitle: boolean = true;

  // ─────────────────────────────────────────────────────────────────────────────
  // State Signals
  // ─────────────────────────────────────────────────────────────────────────────

  /** Loading state */
  protected readonly _loadingState = signal<PageLoadingState>('idle');

  /** Error state */
  protected readonly _error = signal<PageError | null>(null);

  /** Breadcrumbs */
  protected readonly _breadcrumbs = signal<BreadcrumbItem[]>([]);

  /** Page config from route data */
  protected readonly _pageConfig = signal<PageConfig>({});

  // ─────────────────────────────────────────────────────────────────────────────
  // Public Signals (Read-only)
  // ─────────────────────────────────────────────────────────────────────────────

  /** Current loading state */
  readonly loadingState: Signal<PageLoadingState> = this._loadingState.asReadonly();

  /** Is page loading */
  readonly isLoading: Signal<boolean> = computed(() => this._loadingState() === 'loading');

  /** Is page loaded successfully */
  readonly isLoaded: Signal<boolean> = computed(() => this._loadingState() === 'success');

  /** Has error */
  readonly hasError: Signal<boolean> = computed(() => this._loadingState() === 'error');

  /** Current error */
  readonly error: Signal<PageError | null> = this._error.asReadonly();

  /** Breadcrumbs for navigation */
  readonly breadcrumbs: Signal<BreadcrumbItem[]> = this._breadcrumbs.asReadonly();

  /** Current tenant ID */
  readonly tenantId: Signal<string | null> = this.tenantContext.tenantId;

  // ─────────────────────────────────────────────────────────────────────────────
  // Route Data Helpers
  // ─────────────────────────────────────────────────────────────────────────────

  /** Route params as signal */
  protected readonly routeParams = signal<Params>({});

  /** Route query params as signal */
  protected readonly queryParams = signal<Params>({});

  /** Route data as signal */
  protected readonly routeData = signal<Data>({});

  // ─────────────────────────────────────────────────────────────────────────────
  // Lifecycle
  // ─────────────────────────────────────────────────────────────────────────────

  ngOnInit(): void {
    // Subscribe to route data
    this.subscribeToRouteData();

    // Set page title
    if (this.autoSetTitle && this.pageTitle) {
      this.setPageTitle(this.pageTitle);
    }

    // Set default breadcrumbs
    if (this.defaultBreadcrumbs.length > 0) {
      this._breadcrumbs.set(this.defaultBreadcrumbs);
    }

    // Call subclass initialization
    this.onPageInit();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Protected Methods (For Subclasses)
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Override in subclass for page-specific initialization.
   * Called after base initialization.
   */
  protected onPageInit(): void {
    // Override in subclass
  }

  /**
   * Set the page title.
   *
   * Format: "{title} | {tenantName}" when tenant context exists, else "{title}".
   */
  protected setPageTitle(title: string): void {
    const tenantName = this.tenantContext.tenant()?.name;
    const fullTitle = tenantName ? `${title} | ${tenantName}` : title;
    this.titleService.setTitle(fullTitle);
  }

  /**
   * Set loading state.
   */
  protected setLoading(): void {
    this._loadingState.set('loading');
    this._error.set(null);
  }

  /**
   * Set success state.
   */
  protected setSuccess(): void {
    this._loadingState.set('success');
  }

  /**
   * Set error state.
   */
  protected setError(error: PageError): void {
    this._loadingState.set('error');
    this._error.set(error);
  }

  /**
   * Clear error state.
   */
  protected clearError(): void {
    this._error.set(null);
    if (this._loadingState() === 'error') {
      this._loadingState.set('idle');
    }
  }

  /**
   * Update breadcrumbs.
   */
  protected setBreadcrumbs(breadcrumbs: BreadcrumbItem[]): void {
    this._breadcrumbs.set(breadcrumbs);
  }

  /**
   * Add a breadcrumb item.
   */
  protected addBreadcrumb(item: BreadcrumbItem): void {
    this._breadcrumbs.update(current => [...current, item]);
  }

  /**
   * Get a route param.
   */
  protected getParam(key: string): string | null {
    return this.routeParams()[key] ?? null;
  }

  /**
   * Get a query param.
   */
  protected getQueryParam(key: string): string | null {
    return this.queryParams()[key] ?? null;
  }

  /**
   * Check permission.
   */
  protected hasPermission(permission: string): boolean {
    return this.permissionService.hasPermission(permission);
  }

  /**
   * Helper to pipe observables with automatic unsubscription.
   */
  protected untilDestroyed<T>(observable: Observable<T>): Observable<T> {
    return observable.pipe(takeUntilDestroyed(this.destroyRef));
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Private Methods
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Subscribe to route changes.
   */
  private subscribeToRouteData(): void {
    // Params
    this.route.params
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        this.routeParams.set(params);
        this.onRouteParamsChange(params);
      });

    // Query params
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        this.queryParams.set(params);
        this.onQueryParamsChange(params);
      });

    // Route data
    this.route.data
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(data => {
        this.routeData.set(data);
        this._pageConfig.set(data as PageConfig);
        this.onRouteDataChange(data);
      });
  }

  /**
   * Override in subclass to react to route param changes.
   */
  protected onRouteParamsChange(params: Params): void {
    // Override in subclass
  }

  /**
   * Override in subclass to react to query param changes.
   */
  protected onQueryParamsChange(params: Params): void {
    // Override in subclass
  }

  /**
   * Override in subclass to react to route data changes.
   */
  protected onRouteDataChange(data: Data): void {
    // Override in subclass
  }
}
