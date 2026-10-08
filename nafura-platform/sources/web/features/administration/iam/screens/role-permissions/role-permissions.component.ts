import { Component, effect, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { ApiConfigService } from '@platform/platform/screen-kit';
import { RECORD_SECTION } from '@platform/platform/record';
import { PermissionPickerComponent, type PermissionGroup } from '@lib/anatomy/components/organisms/permission-picker';

interface PermissionGroupApi {
  name: string;
  moduleId: string;
  permissions?: { code: string; name: string; description?: string; module?: string; category?: string }[];
}

/**
 * Permission tree of a role, projected as a record section (`kind: 'screen'`).
 * Patches the draft via {@link RECORD_SECTION} — no direct PUT.
 */
@Component({
  selector: 'nf-role-permissions-section',
  standalone: true,
  imports: [PermissionPickerComponent],
  template: `
    <nf-permission-picker
      [catalog]="catalog()"
      [selected]="selected()"
      [disabled]="!section.editable()"
      (selectionChange)="onChange($event)" />
  `,
})
export class RolePermissionsSectionComponent {
  readonly section = inject(RECORD_SECTION);
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiConfigService);

  readonly catalog = signal<PermissionGroup[]>([]);
  readonly selected = signal<string[]>([]);

  constructor() {
    void this.loadCatalog();
    effect(() => {
      const permissions = this.section.record()['permissions'];
      this.selected.set(Array.isArray(permissions) ? permissions.map(String) : []);
    });
  }

  onChange(codes: string[]): void {
    this.selected.set(codes);
    this.section.patch({ permissions: codes });
  }

  private async loadCatalog(): Promise<void> {
    const base = this.api.getApiBaseUrl().replace(/\/+$/, '');
    try {
      const groups = await firstValueFrom(
        this.http.get<PermissionGroupApi[]>(`${base}/api/v1/platform/admin/permissions/catalog`),
      );
      this.catalog.set(
        (groups ?? []).map((group) => ({
          name: group.name,
          moduleId: group.moduleId,
          permissions: (group.permissions ?? []).map((permission) => ({
            code: permission.code,
            name: permission.name,
            description: permission.description,
            module: permission.module ?? group.moduleId,
            category: permission.category ?? group.name,
          })),
        })),
      );
    } catch {
      this.catalog.set([]);
    }
  }
}
