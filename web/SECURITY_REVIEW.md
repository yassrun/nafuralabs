# Security Architecture Review & Improvement Plan

## 1. FINDINGS (Highest Risk First)

### 🔴 CRITICAL

1. **localStorage XSS Risk**
   - **Issue**: Tokens stored in `localStorage` are accessible to any XSS attack
   - **Impact**: Stolen tokens can be used indefinitely until expiry
   - **Current**: `localStorage` used for "remember me", `sessionStorage` for regular sessions
   - **Fix**: Use `sessionStorage` by default, add memory-only option for high-security mode, implement HttpOnly cookie path for production

2. **No Token Revocation Mechanism**
   - **Issue**: Revoked tokens remain valid until expiry
   - **Impact**: Compromised tokens cannot be invalidated
   - **Current**: No revocation check on refresh or API calls
   - **Fix**: Add `jti` (JWT ID) tracking, implement revocation list check (mock: in-memory set, prod: Redis/DB)

3. **Multi-Tab Refresh Race Condition**
   - **Issue**: Multiple tabs can trigger simultaneous refresh, causing token thrashing
   - **Impact**: Race conditions, potential logout loops, wasted API calls
   - **Current**: Each tab independently schedules refresh
   - **Fix**: Implement single-flight refresh with BroadcastChannel coordination

4. **No Permission Versioning**
   - **Issue**: Permission changes don't invalidate cached tokens
   - **Impact**: Users retain old permissions after role changes
   - **Current**: Permissions embedded in token, no version check
   - **Fix**: Add `perm_version` claim, check on critical operations, force refresh if stale

### 🟠 HIGH

5. **Token Size Growth Risk**
   - **Issue**: Full permission list in token can exceed 4KB (cookie limit)
   - **Impact**: Token too large for cookies, localStorage limits, network overhead
   - **Current**: All permissions (`perms[]`) embedded in token
   - **Fix**: Store role IDs only, fetch permissions from TenantContext, cache with version

6. **Tenant Switching Doesn't Re-Issue Token**
   - **Issue**: Switching tenant uses same token with different context
   - **Impact**: Token claims don't match active tenant, permission checks may be wrong
   - **Current**: `selectTenant()` only updates state, doesn't refresh token
   - **Fix**: Require new token on tenant switch, update all claims

7. **Guard Behavior During Tenant Context Load**
   - **Issue**: Guards may allow access before tenant context fully loads
   - **Impact**: Race condition where route accessible before permissions known
   - **Current**: `tenantRequiredGuard` checks `hasTenant()` but doesn't wait for load
   - **Fix**: Guards should wait for tenant context initialization, show loading state

8. **Refresh Token Rotation Missing**
   - **Issue**: Same refresh token reused, no rotation on refresh
   - **Impact**: Stolen refresh token valid until expiry, no detection of reuse
   - **Current**: Refresh token regenerated but old one not invalidated
   - **Fix**: Implement refresh token rotation, invalidate old token on use

### 🟡 MEDIUM

9. **Super Admin Scope Too Broad**
   - **Issue**: Super admin bypasses ALL checks, even tenant-specific ones
   - **Impact**: Super admin can access any tenant's data without explicit tenant selection
   - **Current**: `isSuperAdmin()` returns true for all permission/role checks
   - **Fix**: Super admin should still require tenant context for tenant-scoped operations

10. **No Session Versioning**
    - **Issue**: Session changes (e.g., password reset) don't invalidate existing sessions
    - **Impact**: Old sessions remain valid after security events
    - **Current**: No session version tracking
    - **Fix**: Add `session_version` claim, increment on security events

11. **Concurrent Refresh Not Coordinated**
    - **Issue**: Multiple API calls can trigger simultaneous refresh attempts
    - **Impact**: Token thrashing, potential logout, wasted resources
    - **Current**: No single-flight pattern for refresh
    - **Fix**: Implement single-flight refresh queue

### 🟢 LOW (OK for Mock, Fix for Prod)

12. **Mock Token Signature Not Validated**
    - **Issue**: Mock tokens use fake signatures
    - **Impact**: None in mock mode, but pattern doesn't match production
    - **Current**: `encodeToken()` creates mock signature
    - **Fix**: Keep for mock, document that production must validate signatures

13. **No CSRF Protection**
    - **Issue**: No CSRF tokens for state-changing operations
    - **Impact**: CSRF attacks possible
    - **Current**: No CSRF protection
    - **Fix**: Add CSRF tokens for production (not needed for mock)

---

## 2. TARGET DESIGN

### 2.1 Token Claim Design (Minimal Stable Claims)

```typescript
interface AccessTokenPayload {
  // Identity (stable)
  sub: string;           // User ID
  email: string;          // User email
  
  // Tenant (stable per session)
  tid?: string;           // Tenant ID (null for super admin)
  
  // Authorization (versioned)
  roles: string[];        // Role IDs only (not full permissions)
  perm_v: number;         // Permission version (increment on role/permission changes)
  sess_v: number;         // Session version (increment on password reset, etc.)
  
  // Metadata
  iat: number;            // Issued at
  exp: number;            // Expires at
  jti: string;            // JWT ID (for revocation)
  iss: string;            // Issuer
  sa?: boolean;           // Super admin flag
}
```

**Key Changes:**
- Remove `perms[]` from token (fetch from TenantContext)
- Add `perm_v` for permission versioning
- Add `sess_v` for session versioning
- Keep only role IDs (not full permission lists)

### 2.2 Permission/Entitlement Strategy

**Two-Tier Approach:**
1. **Token Claims**: Role IDs only (lightweight, stable)
2. **TenantContext**: Full permissions + metadata (loaded on demand, cached)

**Flow:**
```
Token → Extract roles → Load TenantContext → Get permissions from context
```

**Benefits:**
- Smaller tokens
- Permissions can change without re-issuing token (if version matches)
- Permissions fetched once, cached in TenantContext
- Version check forces refresh if permissions changed

### 2.3 TenantContext API Contract

```typescript
interface TenantContextResponse {
  tenant: Tenant;
  enabledModules: string[];
  featureFlags: Record<string, unknown>;
  permissions: Permission[];      // Calculated from roles
  roles: Role[];                  // Full role objects
  permVersion: number;            // Current permission version
  cacheMaxAge: number;            // Cache TTL in seconds
}
```

**Caching Strategy:**
- Cache in memory with TTL
- Check `permVersion` against token `perm_v`
- Force refresh if version mismatch
- Invalidate on tenant switch

### 2.4 Tenant Switching Flow

**Current (Broken):**
```
User switches tenant → Update state → Use same token
```

**Target (Correct):**
```
User switches tenant → Call API to re-issue token for new tenant → 
Update token → Reload TenantContext → Update state
```

**Implementation:**
- `AuthFacade.switchTenant(tenantId)` calls `api.switchTenant()`
- Backend returns new token with new `tid` and updated `roles[]`
- Frontend updates token, reloads TenantContext
- All guards re-evaluate with new context

### 2.5 Refresh Strategy

**Short-Lived Access Tokens:**
- Access token: 15 minutes (current)
- Refresh token: 7 days (current)
- Refresh threshold: 2 minutes before expiry (current)

**Refresh Token Rotation:**
- On refresh, backend issues NEW refresh token
- Old refresh token invalidated immediately
- Frontend stores new refresh token
- If old token used, detect reuse and revoke all sessions

**Single-Flight Pattern:**
- Only one refresh in flight at a time
- Concurrent requests wait for same refresh
- BroadcastChannel coordinates across tabs
- Queue pending requests until refresh completes

### 2.6 Versioning Strategy

**Permission Version (`perm_v`):**
- Incremented when:
  - User's roles change
  - Role's permissions change
  - Tenant's enabled modules change
- Checked on:
  - TenantContext load
  - Permission checks (if cached context stale)
- Action if mismatch:
  - Force token refresh
  - Reload TenantContext

**Session Version (`sess_v`):**
- Incremented when:
  - Password changed
  - MFA enabled/disabled
  - Account locked/unlocked
- Checked on:
  - Token refresh
  - Critical operations
- Action if mismatch:
  - Force re-authentication

---

## 3. IMPLEMENTATION PLAN

### Phase 1: Storage Abstraction & Security (Week 1)

**Files to Create:**
- `app/core/security/storage/storage.adapter.ts` - Storage abstraction
- `app/core/security/storage/memory.storage.ts` - Memory-only storage
- `app/core/security/storage/session.storage.ts` - SessionStorage adapter
- `app/core/security/storage/index.ts` - Exports

**Files to Modify:**
- `app/core/security/state/auth.state.ts` - Use StorageAdapter
- `app/core/security/services/auth.facade.ts` - Use StorageAdapter

**Changes:**
1. Create `StorageAdapter` interface
2. Implement memory-only, sessionStorage, localStorage adapters
3. Add environment-based storage selection (memory for high-security, sessionStorage for prod, localStorage for dev)
4. Update `AuthStateStore` to use adapter

### Phase 2: Token Revocation & Versioning (Week 1)

**Files to Create:**
- `app/core/security/services/token-revocation.service.ts` - Revocation list management
- `app/core/security/models/token.models.ts` - Add version fields

**Files to Modify:**
- `app/core/security/services/token.service.ts` - Check revocation
- `app/core/security/services/auth-api.mock.ts` - Track revoked tokens
- `app/core/security/state/auth.state.ts` - Store versions

**Changes:**
1. Add `jti` tracking to revocation service
2. Check revocation on token validation
3. Add `perm_v` and `sess_v` to token payload
4. Implement version checking logic

### Phase 3: Single-Flight Refresh (Week 2)

**Files to Create:**
- `app/core/security/services/refresh-coordinator.service.ts` - Single-flight refresh
- `app/core/security/utils/broadcast-channel.util.ts` - Multi-tab coordination

**Files to Modify:**
- `app/core/security/services/auth.facade.ts` - Use RefreshCoordinator

**Changes:**
1. Implement single-flight pattern
2. Add BroadcastChannel for tab coordination
3. Queue concurrent refresh requests
4. Update `refreshToken()` to use coordinator

### Phase 4: Permission Refactor (Week 2)

**Files to Modify:**
- `app/core/security/services/permission.service.ts` - Load from TenantContext
- `app/core/tenant/tenant.context.ts` - Add permission caching
- `app/core/security/models/token.models.ts` - Remove perms from token

**Changes:**
1. Remove `perms[]` from token payload
2. Load permissions from TenantContext
3. Cache permissions with version check
4. Update PermissionService to use cached permissions

### Phase 5: Tenant Switching (Week 3)

**Files to Modify:**
- `app/core/security/services/auth.facade.ts` - Implement switchTenant()
- `app/core/security/services/auth-api.mock.ts` - Add switchTenant endpoint
- `app/core/tenant/tenant.context.ts` - Invalidate on switch

**Changes:**
1. Add `switchTenant()` API endpoint
2. Re-issue token on tenant switch
3. Reload TenantContext after switch
4. Update all state with new tenant

### Phase 6: Guard Improvements (Week 3)

**Files to Modify:**
- `app/core/tenant/tenant.guard.ts` - Wait for tenant context load
- `app/core/security/guards/auth.guard.ts` - Add version checks
- `app/core/security/guards/permission.guard.ts` - Wait for permissions

**Changes:**
1. Guards wait for TenantContext initialization
2. Add loading state handling
3. Check permission versions
4. Block navigation deterministically

### Phase 7: Super Admin Scope Fix (Week 4)

**Files to Modify:**
- `app/core/security/services/permission.service.ts` - Require tenant for tenant-scoped ops
- `app/core/security/guards/auth.guard.ts` - Super admin still needs tenant context

**Changes:**
1. Super admin bypass only for global operations
2. Require tenant context for tenant-scoped operations
3. Update guards to check tenant context even for super admin

---

## 4. CODE SNIPPETS

### 4.1 Storage Adapter

```typescript
// app/core/security/storage/storage.adapter.ts
export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
}

// app/core/security/storage/memory.storage.ts
@Injectable({ providedIn: 'root' })
export class MemoryStorage implements StorageAdapter {
  private storage = new Map<string, string>();

  getItem(key: string): string | null {
    return this.storage.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.storage.set(key, value);
  }

  removeItem(key: string): void {
    this.storage.delete(key);
  }

  clear(): void {
    this.storage.clear();
  }
}

// app/core/security/storage/session.storage.ts
@Injectable({ providedIn: 'root' })
export class SessionStorageAdapter implements StorageAdapter {
  getItem(key: string): string | null {
    return sessionStorage.getItem(key);
  }

  setItem(key: string, value: string): void {
    sessionStorage.setItem(key, value);
  }

  removeItem(key: string): void {
    sessionStorage.removeItem(key);
  }

  clear(): void {
    sessionStorage.clear();
  }
}

// app/core/security/storage/storage.factory.ts
@Injectable({ providedIn: 'root' })
export class StorageFactory {
  private readonly env = inject(EnvironmentService);

  create(): StorageAdapter {
    // High-security mode: memory only
    if (this.env.get('HIGH_SECURITY_MODE') === 'true') {
      return inject(MemoryStorage);
    }

    // Production: sessionStorage (survives refresh, cleared on tab close)
    if (this.env.get('production')) {
      return inject(SessionStorageAdapter);
    }

    // Development: localStorage for convenience
    return inject(LocalStorageAdapter);
  }
}
```

### 4.2 Token Revocation Service

```typescript
// app/core/security/services/token-revocation.service.ts
@Injectable({ providedIn: 'root' })
export class TokenRevocationService {
  private readonly revokedTokens = new Set<string>();
  private readonly api = inject(AuthApiMock); // Replace with real API later

  /**
   * Check if token is revoked.
   */
  isRevoked(jti: string): boolean {
    return this.revokedTokens.has(jti);
  }

  /**
   * Revoke a token.
   */
  async revokeToken(jti: string): Promise<void> {
    this.revokedTokens.add(jti);
    // In production, call API to add to revocation list
    await this.api.revokeToken(jti);
  }

  /**
   * Revoke all tokens for a user.
   */
  async revokeUserTokens(userId: string): Promise<void> {
    // In production, call API
    await this.api.revokeUserTokens(userId);
  }

  /**
   * Load revocation list (called on app init).
   */
  async loadRevocationList(): Promise<void> {
    // In production, fetch from API
    const revoked = await this.api.getRevocationList();
    revoked.forEach(jti => this.revokedTokens.add(jti));
  }
}
```

### 4.3 Refresh Coordinator (Single-Flight)

```typescript
// app/core/security/services/refresh-coordinator.service.ts
@Injectable({ providedIn: 'root' })
export class RefreshCoordinatorService {
  private refreshInFlight: Promise<boolean> | null = null;
  private readonly channel = new BroadcastChannel('auth-refresh');
  private readonly authFacade = inject(AuthFacade);

  constructor() {
    // Listen for refresh events from other tabs
    this.channel.onmessage = (event) => {
      if (event.data.type === 'refresh-complete') {
        // Another tab completed refresh, clear our in-flight
        this.refreshInFlight = null;
      } else if (event.data.type === 'refresh-started') {
        // Another tab started refresh, wait for it
        this.refreshInFlight = event.data.promise;
      }
    };
  }

  /**
   * Execute refresh with single-flight pattern.
   */
  async refreshToken(): Promise<boolean> {
    // If refresh already in flight, wait for it
    if (this.refreshInFlight) {
      return this.refreshInFlight;
    }

    // Notify other tabs
    this.channel.postMessage({ type: 'refresh-started' });

    // Start refresh
    this.refreshInFlight = this.authFacade.refreshToken()
      .then(result => {
        // Notify other tabs
        this.channel.postMessage({ type: 'refresh-complete', success: result });
        return result;
      })
      .finally(() => {
        this.refreshInFlight = null;
      });

    return this.refreshInFlight;
  }
}
```

### 4.4 Updated Token Payload

```typescript
// app/core/security/models/token.models.ts
export interface AccessTokenPayload {
  // Identity
  sub: string;
  email: string;

  // Tenant
  tid?: string;

  // Authorization (roles only, not permissions)
  roles: string[];        // Role IDs
  perm_v: number;         // Permission version
  sess_v: number;         // Session version

  // Metadata
  iat: number;
  exp: number;
  jti: string;            // JWT ID for revocation
  iss: string;
  sa?: boolean;           // Super admin
}
```

### 4.5 Updated AuthFacade with Tenant Switch

```typescript
// app/core/security/services/auth.facade.ts (excerpt)
async switchTenant(tenantId: string): Promise<boolean> {
  const user = this.state.user();
  const tokens = this.state.tokens();

  if (!user || !tokens) {
    return false;
  }

  this.state.setLoading(true);

  try {
    // Call API to switch tenant and get new token
    const result = await this.api.switchTenant(
      user.id,
      tenantId,
      tokens.refreshToken
    );

    // Update state with new token
    this.state.setAuthenticatedFromToken(result.tokens, result.user);

    // Invalidate old tenant context
    this.tenantContextService.clear();

    // Load new tenant context
    const currentTenant = this.state.currentTenant();
    if (currentTenant) {
      await this.tenantContextService.initialize(currentTenant.tenant.id);
    }

    // Persist session
    this.state.persistSession();

    return true;
  } catch (error) {
    this.state.setError(error as AuthError);
    return false;
  }
}
```

### 4.6 Updated PermissionService with Caching

```typescript
// app/core/security/services/permission.service.ts (excerpt)
@Injectable({ providedIn: 'root' })
export class PermissionService {
  private readonly state = inject(AuthStateStore);
  private readonly tenantContext = inject(TenantContextService);
  private permissionCache: Map<string, Set<Permission>> = new Map();
  private cacheVersion: number | null = null;

  /**
   * Get permissions from TenantContext (cached).
   */
  private getPermissions(): Set<Permission> {
    const token = this.state.accessToken();
    if (!token) return new Set();

    const payload = this.tokenService.decodeAccessToken(token);
    if (!payload) return new Set();

    // Super admin has all permissions
    if (payload.sa) {
      return new Set(['*']);
    }

    // Check cache version
    const ctx = this.tenantContext.tenantContext();
    if (ctx && ctx.permVersion !== payload.perm_v) {
      // Version mismatch, force refresh
      this.permissionCache.clear();
      // Trigger token refresh
      this.authFacade.refreshToken();
      return new Set(); // Return empty until refresh completes
    }

    // Use cached permissions from TenantContext
    if (ctx) {
      return ctx.permissions;
    }

    // Fallback: return empty (should not happen if tenant context loaded)
    return new Set();
  }

  hasPermission(permission: Permission): boolean {
    if (this.state.isSuperAdmin()) {
      // Super admin bypass, but still require tenant context for tenant-scoped ops
      const ctx = this.tenantContext.tenantContext();
      if (!ctx && this.isTenantScopedPermission(permission)) {
        return false; // Super admin still needs tenant context
      }
      return true;
    }

    const permissions = this.getPermissions();
    return this.matchPermission(permission, permissions);
  }

  private isTenantScopedPermission(permission: Permission): boolean {
    // Permissions with module prefix are tenant-scoped
    return permission.includes('.');
  }
}
```

### 4.7 Updated Tenant Guard with Loading Wait

```typescript
// app/core/tenant/tenant.guard.ts (excerpt)
export const tenantRequiredGuard: CanActivateFn = (): boolean | UrlTree => {
  const tenantContext = inject(TenantContextService);
  const router = inject(Router);
  const auth = inject(AuthFacade);

  // Check authentication first
  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  // Check if tenant context is loading
  if (tenantContext.isLoading()) {
    // Block navigation until loading completes
    // In real implementation, return observable that completes when loaded
    return false; // For now, block
  }

  // Check if tenant context is loaded
  if (!tenantContext.hasTenant()) {
    // Try to initialize from current tenant
    const currentTenant = auth.currentTenant();
    if (currentTenant) {
      // Initialize asynchronously (guard will re-run)
      tenantContext.initialize(currentTenant.tenant.id);
      return false; // Block until initialized
    }

    // No tenant available
    return router.createUrlTree(['/login']);
  }

  return true;
};
```

---

## 5. TESTS

### 5.1 Test Setup (Jasmine/Karma)

```typescript
// app/core/security/services/auth.facade.spec.ts
import { TestBed } from '@angular/core/testing';
import { AuthFacade } from './auth.facade';
import { AuthStateStore } from '../state/auth.state';
import { AuthApiMock } from './auth-api.mock';
import { TokenService } from './token.service';

describe('AuthFacade', () => {
  let facade: AuthFacade;
  let state: AuthStateStore;
  let api: AuthApiMock;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthFacade, AuthStateStore, AuthApiMock, TokenService],
    });

    facade = TestBed.inject(AuthFacade);
    state = TestBed.inject(AuthStateStore);
    api = TestBed.inject(AuthApiMock);
  });

  describe('login', () => {
    it('should set authenticated state on successful login', async () => {
      const result = await facade.login({
        email: 'user@example.com',
        password: 'password123',
      });

      expect(result).toBe(true);
      expect(state.isAuthenticated()).toBe(true);
      expect(state.user()).toBeTruthy();
      expect(state.currentTenantId()).toBeTruthy();
    });

    it('should handle login failure', async () => {
      spyOn(api, 'login').and.returnValue(Promise.reject(new Error('Invalid credentials')));

      const result = await facade.login({
        email: 'wrong@example.com',
        password: 'wrong',
      });

      expect(result).toBe(false);
      expect(state.isAuthenticated()).toBe(false);
      expect(state.error()).toBeTruthy();
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      // Setup: login first
      await facade.login({ email: 'user@example.com', password: 'password123' });

      const result = await facade.refreshToken();

      expect(result).toBe(true);
      expect(state.tokens()).toBeTruthy();
    });

    it('should logout on refresh failure', async () => {
      await facade.login({ email: 'user@example.com', password: 'password123' });

      spyOn(api, 'refreshToken').and.returnValue(Promise.reject(new Error('Token invalid')));

      const logoutSpy = spyOn(facade, 'logout');
      await facade.refreshToken();

      expect(logoutSpy).toHaveBeenCalled();
    });
  });

  describe('switchTenant', () => {
    it('should re-issue token on tenant switch', async () => {
      await facade.login({ email: 'user@example.com', password: 'password123' });
      const oldTenantId = state.currentTenantId();

      const result = await facade.switchTenant('new-tenant-id');

      expect(result).toBe(true);
      expect(state.currentTenantId()).toBe('new-tenant-id');
      expect(state.currentTenantId()).not.toBe(oldTenantId);
    });
  });
});
```

### 5.2 Permission Service Tests

```typescript
// app/core/security/services/permission.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { PermissionService } from './permission.service';
import { AuthStateStore } from '../state/auth.state';
import { TenantContextService } from '../../tenant/tenant.context';

describe('PermissionService', () => {
  let service: PermissionService;
  let state: AuthStateStore;
  let tenantContext: TenantContextService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PermissionService, AuthStateStore, TenantContextService],
    });

    service = TestBed.inject(PermissionService);
    state = TestBed.inject(AuthStateStore);
    tenantContext = TestBed.inject(TenantContextService);
  });

  describe('hasPermission', () => {
    it('should return true for super admin', () => {
      // Setup: super admin user
      state.setUser({ ...mockUser, isSuperAdmin: true });

      expect(service.hasPermission('inventory.products.read')).toBe(true);
      expect(service.hasPermission('any.permission')).toBe(true);
    });

    it('should check permission from tenant context', () => {
      // Setup: normal user with permissions
      state.setUser(mockUser);
      tenantContext.setPermissions(new Set(['inventory.products.read', 'inventory.products.write']));

      expect(service.hasPermission('inventory.products.read')).toBe(true);
      expect(service.hasPermission('inventory.products.delete')).toBe(false);
    });

    it('should support wildcard permissions', () => {
      state.setUser(mockUser);
      tenantContext.setPermissions(new Set(['inventory.*']));

      expect(service.hasPermission('inventory.products.read')).toBe(true);
      expect(service.hasPermission('inventory.products.write')).toBe(true);
      expect(service.hasPermission('orders.read')).toBe(false);
    });

    it('should return false if tenant context not loaded', () => {
      state.setUser(mockUser);
      tenantContext.clear();

      expect(service.hasPermission('inventory.products.read')).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true if user has all permissions', () => {
      state.setUser(mockUser);
      tenantContext.setPermissions(new Set(['inventory.products.read', 'inventory.products.write']));

      expect(service.hasAllPermissions([
        'inventory.products.read',
        'inventory.products.write',
      ])).toBe(true);
    });

    it('should return false if user missing any permission', () => {
      state.setUser(mockUser);
      tenantContext.setPermissions(new Set(['inventory.products.read']));

      expect(service.hasAllPermissions([
        'inventory.products.read',
        'inventory.products.delete',
      ])).toBe(false);
    });
  });
});
```

### 5.3 Guard Tests

```typescript
// app/core/security/guards/auth.guard.spec.ts
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthFacade } from '../services/auth.facade';

describe('authGuard', () => {
  let guard: ReturnType<typeof authGuard>;
  let authFacade: jasmine.SpyObj<AuthFacade>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authFacadeSpy = jasmine.createSpyObj('AuthFacade', ['isAuthenticated']);
    const routerSpy = jasmine.createSpyObj('Router', ['createUrlTree']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthFacade, useValue: authFacadeSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    guard = authGuard;
    authFacade = TestBed.inject(AuthFacade) as jasmine.SpyObj<AuthFacade>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should allow access if authenticated', () => {
    authFacade.isAuthenticated.and.returnValue(true);

    const result = guard();

    expect(result).toBe(true);
  });

  it('should redirect to login if not authenticated', () => {
    authFacade.isAuthenticated.and.returnValue(false);
    router.createUrlTree.and.returnValue('/login' as any);

    const result = guard();

    expect(router.createUrlTree).toHaveBeenCalledWith(['/login'], jasmine.any(Object));
    expect(result).not.toBe(true);
  });
});
```

### 5.4 Tenant Guard Tests

```typescript
// app/core/tenant/tenant.guard.spec.ts
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { tenantRequiredGuard } from './tenant.guard';
import { TenantContextService } from './tenant.context';
import { AuthFacade } from '../security/services/auth.facade';

describe('tenantRequiredGuard', () => {
  let guard: ReturnType<typeof tenantRequiredGuard>;
  let tenantContext: jasmine.SpyObj<TenantContextService>;
  let authFacade: jasmine.SpyObj<AuthFacade>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const tenantContextSpy = jasmine.createSpyObj('TenantContextService', ['hasTenant', 'isLoading', 'initialize']);
    const authFacadeSpy = jasmine.createSpyObj('AuthFacade', ['isAuthenticated', 'currentTenant']);
    const routerSpy = jasmine.createSpyObj('Router', ['createUrlTree']);

    TestBed.configureTestingModule({
      providers: [
        { provide: TenantContextService, useValue: tenantContextSpy },
        { provide: AuthFacade, useValue: authFacadeSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    guard = tenantRequiredGuard;
    tenantContext = TestBed.inject(TenantContextService) as jasmine.SpyObj<TenantContextService>;
    authFacade = TestBed.inject(AuthFacade) as jasmine.SpyObj<AuthFacade>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should allow access if tenant context loaded', () => {
    authFacade.isAuthenticated.and.returnValue(true);
    tenantContext.hasTenant.and.returnValue(true);
    tenantContext.isLoading.and.returnValue(false);

    const result = guard();

    expect(result).toBe(true);
  });

  it('should block if tenant context is loading', () => {
    authFacade.isAuthenticated.and.returnValue(true);
    tenantContext.hasTenant.and.returnValue(false);
    tenantContext.isLoading.and.returnValue(true);

    const result = guard();

    expect(result).toBe(false);
  });

  it('should initialize tenant if authenticated but not loaded', () => {
    authFacade.isAuthenticated.and.returnValue(true);
    authFacade.currentTenant.and.returnValue({ tenant: { id: 'tenant-1' } } as any);
    tenantContext.hasTenant.and.returnValue(false);
    tenantContext.isLoading.and.returnValue(false);

    guard();

    expect(tenantContext.initialize).toHaveBeenCalledWith('tenant-1');
  });
});
```

---

## 6. MIGRATION CHECKLIST

### Week 1: Foundation
- [ ] Create StorageAdapter abstraction
- [ ] Implement memory/session/localStorage adapters
- [ ] Update AuthStateStore to use adapter
- [ ] Add token revocation service
- [ ] Add version fields to token payload

### Week 2: Refresh & Permissions
- [ ] Implement single-flight refresh
- [ ] Add BroadcastChannel coordination
- [ ] Remove permissions from token
- [ ] Load permissions from TenantContext
- [ ] Add permission caching

### Week 3: Tenant & Guards
- [ ] Implement tenant switching with token re-issue
- [ ] Update guards to wait for tenant context
- [ ] Add loading state handling
- [ ] Fix super admin scope

### Week 4: Testing & Polish
- [ ] Write unit tests for all services
- [ ] Write guard tests
- [ ] Integration tests for full flows
- [ ] Documentation updates

---

## 7. PRODUCTION READINESS NOTES

**For Real Backend Integration:**
1. Replace `AuthApiMock` with real HTTP service
2. Implement proper JWT signature validation
3. Add CSRF token support
4. Use HttpOnly cookies for refresh tokens (if possible)
5. Implement proper revocation list (Redis/DB)
6. Add rate limiting for auth endpoints
7. Implement proper session management on backend
8. Add audit logging for security events

**Environment Variables:**
```bash
# Storage mode
HIGH_SECURITY_MODE=false  # Use memory-only storage
STORAGE_MODE=session      # session|local|memory

# Token config
ACCESS_TOKEN_LIFETIME=900      # 15 minutes
REFRESH_TOKEN_LIFETIME=604800   # 7 days
REFRESH_THRESHOLD=120           # 2 minutes
```

---

**END OF REVIEW**
