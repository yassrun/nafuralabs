import { Injectable } from '@angular/core';

/**
 * Showroom: everything allowed. Real RBAC stays in product apps.
 */
@Injectable()
export class SandboxPermissionService {
  hasPermission(_permission: string): boolean {
    return true;
  }

  hasAnyPermission(_permissions: string[]): boolean {
    return true;
  }

  hasAllPermissions(_permissions: string[]): boolean {
    return true;
  }

  can(_permission: string): boolean {
    return true;
  }
}
