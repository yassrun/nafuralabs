import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  ConfigDrivenDetailPage,
  ConfigDrivenDetailPageImports,
  ConfigDrivenDetailPageStyles,
  createDetailFacadeFromCrud,
} from '@lib/anatomy';
import { PermissionPickerComponent } from '@lib/anatomy/components/organisms/permission-picker';
import type { DetailActionEvent } from '@lib/anatomy/types';

import { ROLE_DETAIL_CONFIG } from '../config';
import type { Role, RoleCreate } from '../models';
import { RolesFacade } from '../services';
import { RoleMembersSectionComponent } from './role-members-section.component';

@Component({
  selector: 'app-role-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    ...ConfigDrivenDetailPageImports,
    PermissionPickerComponent,
    RoleMembersSectionComponent,
  ],
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="headerConfig"></nf-page-header>

      <!-- System-role read-only banner -->
      @if (item()?.isSystem) {
        <div class="role-system-banner">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="flex-shrink:0">
            <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/>
            <path d="M8 5v3M8 10.5v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          System roles cannot be modified
        </div>
      }

      <nf-entity-detail
        #detail
        [config]="config"
        [mode]="mode()"
        [item]="item()"
        [lookups]="lookups()"
        [loading]="isLoading()"
        [saving]="isSaving()"
        (action)="onAction($event)">
      </nf-entity-detail>

      <!-- Permissions section -->
      <section class="role-permissions-section">
        <h3 class="role-permissions-title">Permissions</h3>
        <nf-permission-picker
          [catalog]="permissionCatalog()"
          [selected]="selectedPermissions()"
          [disabled]="mode() === 'view'"
          (selectionChange)="selectedPermissions.set($event)">
        </nf-permission-picker>
      </section>

      @if (item(); as role) {
        <app-role-members-section
          [roleCode]="role.id"
          (membersRefreshed)="refreshRoleItem()">
        </app-role-members-section>
      }
    </nf-page-shell>
  `,
  styles: [
    ConfigDrivenDetailPageStyles,
    `
    .role-system-banner {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1rem;
      margin: 0.75rem 0;
      background: var(--nf-warning-bg, #fffbeb);
      border: 1px solid var(--nf-warning-border, #fde68a);
      border-radius: 0.5rem;
      font-size: 0.875rem;
      color: var(--nf-warning-text, #92400e);
    }
    .role-permissions-section {
      margin-top: 1.5rem;
      padding: 1.25rem;
      border: 1px solid var(--nf-border-default, #e5e7eb);
      border-radius: 0.5rem;
    }
    .role-permissions-title {
      font-size: 1rem;
      font-weight: 600;
      margin: 0 0 1rem;
      color: var(--nf-text-primary, #111827);
    }
    `,
  ],
})
export class RoleDetailPage extends ConfigDrivenDetailPage<Role> {
  private readonly crud = inject(RolesFacade);

  readonly facade = createDetailFacadeFromCrud<Role, RoleCreate>({
    crud: this.crud,
  });
  readonly config = ROLE_DETAIL_CONFIG;

  /** Locally tracked permission selection — synced from item on load, submitted on save */
  readonly selectedPermissions = signal<string[]>([]);

  /** Permission catalog from the facade, populated after loadLookups() */
  readonly permissionCatalog = this.crud.permissionCatalog;

  get headerTitle(): string {
    if (this.mode() === 'create') {
      return 'New Role';
    }
    return this.item()?.name ?? 'Role Details';
  }

  constructor() {
    super();
    // Sync selected permissions whenever the loaded item changes
    effect(() => {
      const role = this.item();
      if (role) this.selectedPermissions.set(role.permissions ?? []);
    }, { allowSignalWrites: true });
  }

  protected override async loadItem(id: string): Promise<void> {
    await super.loadItem(id);
    const loaded = this.item();
    if (loaded?.isSystem) {
      this.mode.set('view');
    }
  }

  /** Intercept save to merge current permission selection into the payload */
  protected override async handleSave(event: DetailActionEvent<Role>): Promise<void> {
    await super.handleSave({
      ...event,
      formValue: { ...event.formValue, permissions: this.selectedPermissions() },
    });
  }

  protected override async handleCustomAction(
    event: DetailActionEvent<Role>
  ): Promise<void> {
    console.log('Unhandled detail action:', event.actionId, event);
  }

  async refreshRoleItem(): Promise<void> {
    const role = this.item();
    if (role?.id) await this.loadItem(role.id);
  }
}
