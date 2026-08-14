/**
 * Security Module
 *
 * Complete authentication and authorization system.
 *
 * Main exports:
 * - AuthFacade: Main entry point for auth operations
 * - PermissionService: RBAC permission checks
 * - Guards: Route protection
 * - Directives: UI permission rendering
 *
 * Usage:
 * ```typescript
 * // In component
 * export class MyComponent {
 *   private auth = inject(AuthFacade);
 *   private permissions = inject(PermissionService);
 *
 *   // Reactive state
 *   isLoggedIn = this.auth.isAuthenticated;
 *   canCreate = this.permissions.hasPermission$('products.create');
 *
 *   // Actions
 *   async login() {
 *     await this.auth.login({ email, password });
 *   }
 * }
 *
 * // In template
 * <button *hasPermission="'products.create'">Create</button>
 * <button *hasRole="'admin'">Admin Action</button>
 * <div *hasModule="'inventory'">...</div>
 *
 * // In routes
 * {
 *   path: 'products',
 *   canActivate: [authGuard, permissionGuard(['products.read'])],
 *   component: ProductsComponent
 * }
 * ```
 */

// Models
export * from './models';

// State
export * from './state';

// Services
export * from './services';

// Guards
export * from './guards';

// Directives
export * from './directives';
