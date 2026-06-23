/**
 * Permission Directives
 *
 * Structural directives for permission-based UI rendering.
 */

import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  inject,
  effect,
  OnDestroy,
} from '@angular/core';

import { PermissionService } from '../services/permission.service';
import { AuthFacade } from '../services/auth.facade';
import { Permission } from '../models/user.models';

/**
 * Has Permission Directive
 *
 * Shows content only if user has the required permission(s).
 *
 * Usage:
 * ```html
 * <!-- Single permission -->
 * <button *hasPermission="'inventory.products.create'">Create Product</button>
 *
 * <!-- Multiple permissions (AND) -->
 * <button *hasPermission="['inventory.products.update', 'inventory.products.delete']">
 *   Manage
 * </button>
 *
 * <!-- Multiple permissions (OR) -->
 * <button *hasPermission="['admin.manage', 'inventory.products.update']; mode: 'any'">
 *   Edit
 * </button>
 *
 * <!-- With else template -->
 * <button *hasPermission="'inventory.products.create'; else noAccess">Create</button>
 * <ng-template #noAccess>
 *   <span>No access</span>
 * </ng-template>
 * ```
 */
@Directive({
  selector: '[hasPermission]',
  standalone: true,
})
export class HasPermissionDirective implements OnDestroy {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly permissionService = inject(PermissionService);
  private readonly auth = inject(AuthFacade);

  private hasView = false;
  private permissions: Permission[] = [];
  private mode: 'all' | 'any' = 'all';
  private elseTemplate: TemplateRef<unknown> | null = null;

  private effectRef = effect(() => {
    // Track reactive state
    this.auth.isAuthenticated();
    this.permissionService.permissions();
    this.auth.isSuperAdmin();
    this.updateView();
  });

  /**
   * Permission(s) to check.
   */
  @Input()
  set hasPermission(value: Permission | Permission[]) {
    const raw = Array.isArray(value) ? value : [value];
    // Filter out empty strings - treat them as "no permission required"
    this.permissions = raw.filter(p => p && p.trim().length > 0);
  }

  /**
   * Check mode: 'all' (default) or 'any'.
   */
  @Input()
  set hasPermissionMode(value: 'all' | 'any') {
    this.mode = value;
  }

  /**
   * Else template.
   */
  @Input()
  set hasPermissionElse(template: TemplateRef<unknown>) {
    this.elseTemplate = template;
  }

  ngOnDestroy(): void {
    this.effectRef.destroy();
  }

  private updateView(): void {
    const hasAccess = this.checkAccess();

    if (hasAccess && !this.hasView) {
      this.viewContainer.clear();
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasAccess && this.hasView) {
      this.viewContainer.clear();
      if (this.elseTemplate) {
        this.viewContainer.createEmbeddedView(this.elseTemplate);
      }
      this.hasView = false;
    } else if (!hasAccess && !this.hasView && this.elseTemplate) {
      this.viewContainer.clear();
      this.viewContainer.createEmbeddedView(this.elseTemplate);
    }
  }

  private checkAccess(): boolean {
    if (!this.auth.isAuthenticated()) {
      return false;
    }

    if (this.auth.isSuperAdmin()) {
      return true;
    }

    if (this.permissions.length === 0) {
      return true;
    }

    return this.mode === 'all'
      ? this.permissionService.hasAllPermissions(this.permissions)
      : this.permissionService.hasAnyPermission(this.permissions);
  }
}

/**
 * Has Role Directive
 *
 * Shows content only if user has the required role(s).
 *
 * Usage:
 * ```html
 * <button *hasRole="'tenant_admin'">Admin Action</button>
 * <div *hasRole="['manager', 'tenant_admin']; mode: 'any'">Manager Section</div>
 * ```
 */
@Directive({
  selector: '[hasRole]',
  standalone: true,
})
export class HasRoleDirective implements OnDestroy {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly permissionService = inject(PermissionService);
  private readonly auth = inject(AuthFacade);

  private hasView = false;
  private roles: string[] = [];
  private mode: 'all' | 'any' = 'any';

  private effectRef = effect(() => {
    this.auth.isAuthenticated();
    this.permissionService.roles();
    this.updateView();
  });

  @Input()
  set hasRole(value: string | string[]) {
    this.roles = Array.isArray(value) ? value : [value];
  }

  @Input()
  set hasRoleMode(value: 'all' | 'any') {
    this.mode = value;
  }

  ngOnDestroy(): void {
    this.effectRef.destroy();
  }

  private updateView(): void {
    const hasAccess = this.checkAccess();

    if (hasAccess && !this.hasView) {
      this.viewContainer.clear();
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasAccess && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }

  private checkAccess(): boolean {
    if (!this.auth.isAuthenticated()) {
      return false;
    }

    if (this.auth.isSuperAdmin()) {
      return true;
    }

    if (this.roles.length === 0) {
      return true;
    }

    return this.mode === 'all'
      ? this.permissionService.hasAllRoles(this.roles)
      : this.permissionService.hasAnyRole(this.roles);
  }
}

/**
 * Is Authenticated Directive
 *
 * Shows content only if user is authenticated.
 *
 * Usage:
 * ```html
 * <nav *isAuthenticated>User Menu</nav>
 * ```
 */
@Directive({
  selector: '[isAuthenticated]',
  standalone: true,
})
export class IsAuthenticatedDirective implements OnDestroy {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly auth = inject(AuthFacade);

  private hasView = false;

  private effectRef = effect(() => {
    const isAuth = this.auth.isAuthenticated();
    this.updateView(isAuth);
  });

  ngOnDestroy(): void {
    this.effectRef.destroy();
  }

  private updateView(isAuthenticated: boolean): void {
    if (isAuthenticated && !this.hasView) {
      this.viewContainer.clear();
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!isAuthenticated && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}

/**
 * Is Super Admin Directive
 *
 * Shows content only if user is a super admin.
 *
 * Usage:
 * ```html
 * <div *isSuperAdmin>Platform Admin Section</div>
 * ```
 */
@Directive({
  selector: '[isSuperAdmin]',
  standalone: true,
})
export class IsSuperAdminDirective implements OnDestroy {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly auth = inject(AuthFacade);

  private hasView = false;

  private effectRef = effect(() => {
    const isSuperAdmin = this.auth.isSuperAdmin();
    this.updateView(isSuperAdmin);
  });

  ngOnDestroy(): void {
    this.effectRef.destroy();
  }

  private updateView(isSuperAdmin: boolean): void {
    if (isSuperAdmin && !this.hasView) {
      this.viewContainer.clear();
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!isSuperAdmin && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}

/**
 * Has Module Directive
 *
 * Shows content only if module is enabled for current tenant.
 *
 * Usage:
 * ```html
 * <nav-item *hasModule="'inventory'">Inventory</nav-item>
 * ```
 */
@Directive({
  selector: '[hasModule]',
  standalone: true,
})
export class HasModuleDirective implements OnDestroy {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly permissionService = inject(PermissionService);

  private hasView = false;
  private moduleId = '';

  private effectRef = effect(() => {
    this.permissionService.enabledModules();
    this.updateView();
  });

  @Input()
  set hasModule(value: string) {
    this.moduleId = value;
  }

  ngOnDestroy(): void {
    this.effectRef.destroy();
  }

  private updateView(): void {
    const isEnabled = this.permissionService.isModuleEnabled(this.moduleId);

    if (isEnabled && !this.hasView) {
      this.viewContainer.clear();
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!isEnabled && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}

