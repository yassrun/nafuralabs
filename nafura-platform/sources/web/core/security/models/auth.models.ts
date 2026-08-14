/**
 * Authentication Models
 *
 * Core types for the authentication system.
 */

import { User, UserProfile } from './user.models';
import { TokenPair } from './token.models';
import { TenantMembership } from './tenant.models';

// ─────────────────────────────────────────────────────────────────────────────
// Authentication Request/Response Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Login credentials.
 */
export interface LoginCredentials {
  email: string;
  password: string;
  /** Optional: specify tenant ID for login (auto-selected if not provided) */
  tenantId?: string;
  /** Remember me for extended session */
  rememberMe?: boolean;
}

/**
 * Login response from auth API.
 * 
 * The backend returns only the token (which contains all essential info).
 * User object is optional for profile display purposes.
 */
export interface LoginResponse {
  /** Token pair containing all user context (sub, email, tid, roles, perms, sa) */
  tokens: TokenPair;
  /** Optional user object for profile display (firstName, lastName, etc.) */
  user?: User;
}

/**
 * Registration data.
 */
export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  preferredLocale?: 'fr' | 'en' | 'ar';
  /** Invite code for joining existing tenant */
  inviteCode?: string;
}

/**
 * Password reset request.
 */
export interface PasswordResetRequest {
  email: string;
}

/**
 * Password reset confirmation.
 */
export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

/**
 * Change password request.
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Authentication State Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Authentication status.
 */
export type AuthStatus =
  | 'idle'           // Initial state
  | 'checking'       // Checking stored session
  | 'authenticated'  // User is logged in
  | 'unauthenticated'; // No valid session

/**
 * Authentication error.
 */
export interface AuthError {
  code: AuthErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Authentication error codes.
 */
export type AuthErrorCode =
  | 'invalid_credentials'
  | 'account_locked'
  | 'account_disabled'
  | 'email_not_verified'
  | 'mfa_required'
  | 'session_expired'
  | 'token_invalid'
  | 'tenant_access_denied'
  | 'no_tenant'
  | 'network_error'
  | 'unknown_error';

/**
 * Complete authentication state.
 */
export interface AuthState {
  /** Current auth status */
  status: AuthStatus;

  /** Authenticated user (null if not authenticated) */
  user: User | null;

  /** User's tenant memberships */
  tenants: TenantMembership[];

  /** Currently selected tenant ID */
  currentTenantId: string | null;

  /** Current tenant membership (derived) */
  currentTenant: TenantMembership | null;

  /** Authentication tokens */
  tokens: TokenPair | null;

  /** Is currently loading */
  isLoading: boolean;

  /** Last error */
  error: AuthError | null;

  /** Session expiry timestamp */
  expiresAt: number | null;
}

/**
 * Initial auth state.
 */
export const initialAuthState: AuthState = {
  status: 'idle',
  user: null,
  tenants: [],
  currentTenantId: null,
  currentTenant: null,
  tokens: null,
  isLoading: false,
  error: null,
  expiresAt: null,
};

// ─────────────────────────────────────────────────────────────────────────────
// Session Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Stored session data (for persistence).
 */
export interface StoredSession {
  tokens: TokenPair;
  userId: string;
  tenantId: string | null;
  expiresAt: number;
  rememberMe: boolean;
}

/**
 * Session storage keys.
 */
export const SESSION_STORAGE_KEY = 'pf_session';
export const TENANT_STORAGE_KEY = 'pf_tenant';
