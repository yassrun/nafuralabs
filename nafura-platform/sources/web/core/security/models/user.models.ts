/**
 * User Models
 *
 * User-related types for the authentication system.
 */

// ─────────────────────────────────────────────────────────────────────────────
// User Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * User account status.
 */
export type UserStatus = 'active' | 'inactive' | 'pending' | 'locked' | 'deleted';

/**
 * Core user entity.
 */
export interface User {
  /** Unique user identifier */
  id: string;

  /** Email address (unique) */
  email: string;

  /** User profile information */
  profile: UserProfile;

  /** Account status */
  status: UserStatus;

  /** Email verified */
  emailVerified: boolean;

  /** MFA enabled */
  mfaEnabled: boolean;

  /** Is platform super admin */
  isSuperAdmin: boolean;

  /** Account metadata */
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

/**
 * User profile information.
 */
export interface UserProfile {
  firstName: string;
  lastName: string;
  displayName?: string;
  avatarUrl?: string;
  phone?: string;
  timezone?: string;
  locale?: string;
}

/**
 * Computed user properties.
 */
export function getUserDisplayName(user: User): string {
  if (user.profile.displayName) {
    return user.profile.displayName;
  }
  return `${user.profile.firstName} ${user.profile.lastName}`.trim() || user.email;
}

export function getUserInitials(user: User): string {
  const first = user.profile.firstName?.[0] || '';
  const last = user.profile.lastName?.[0] || '';
  return (first + last).toUpperCase() || user.email[0].toUpperCase();
}

// ─────────────────────────────────────────────────────────────────────────────
// Role Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Role definition.
 */
export interface Role {
  /** Unique role identifier */
  id: string;

  /** Role name */
  name: string;

  /** Role description */
  description: string;

  /** Permissions granted by this role */
  permissions: string[];

  /** Is this a system role (non-editable) */
  isSystem: boolean;

  /** Role priority (higher = more privileged) */
  priority: number;
}

/**
 * System-defined roles.
 */
export const SystemRoles = {
  SUPER_ADMIN: 'super_admin',
  TENANT_OWNER: 'tenant_owner',
  TENANT_ADMIN: 'tenant_admin',
  MANAGER: 'manager',
  MEMBER: 'member',
  VIEWER: 'viewer',
} as const;

export type SystemRole = (typeof SystemRoles)[keyof typeof SystemRoles];

// ─────────────────────────────────────────────────────────────────────────────
// Permission Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Permission string format: 'resource.action' or 'module.resource.action'
 */
export type Permission = string;

/**
 * Standard permission actions.
 */
export const PermissionActions = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  MANAGE: 'manage',
  EXPORT: 'export',
  IMPORT: 'import',
} as const;

/**
 * Build permission string.
 */
export function buildPermission(
  resource: string,
  action: string,
  module?: string
): Permission {
  return module ? `${module}.${resource}.${action}` : `${resource}.${action}`;
}

/**
 * Check if permission matches pattern (supports wildcards).
 *
 * Examples:
 * - 'inventory.*' matches 'inventory.products.read'
 * - 'inventory.products.*' matches 'inventory.products.create'
 * - '*' matches everything
 */
export function matchesPermissionPattern(
  permission: Permission,
  pattern: Permission
): boolean {
  if (pattern === '*') return true;

  const patternParts = pattern.split('.');
  const permissionParts = permission.split('.');

  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i] === '*') return true;
    if (patternParts[i] !== permissionParts[i]) return false;
  }

  return patternParts.length === permissionParts.length;
}
