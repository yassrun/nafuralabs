import { Injectable, inject, signal } from '@angular/core';

import { GridFacade } from '@lib/anatomy';

import type { PermissionGroup } from '@lib/anatomy/components/organisms/permission-picker';
import type { Role, RoleCreate, RoleUpdate } from '../models';
import { RolesApiService } from './roles-api.service';

@Injectable({ providedIn: 'root' })
export class RolesFacade extends GridFacade<Role, RoleCreate, RoleUpdate> {
  protected override api = inject(RolesApiService);

  /** Raw permission catalog grouped by module — consumed by PermissionPickerComponent */
  readonly permissionCatalog = signal<PermissionGroup[]>([]);

  override async loadLookups(): Promise<void> {
    const groups = await this.api.getPermissionsCatalog();
    this.permissionCatalog.set(
      groups.map((g) => ({
        name: g.name ?? '',
        moduleId: g.moduleId ?? '',
        permissions: (g.permissions ?? []).map((p) => ({
          code: p.code ?? '',
          name: p.name ?? p.code ?? '',
          module: p.module ?? g.moduleId ?? '',
          category: p.category ?? '',
          description: p.description,
        })),
      }))
    );
    this._lookupsLoaded.set(true);
  }
}
