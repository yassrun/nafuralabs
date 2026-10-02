import {
  Component,
  input,
  output,
  signal,
  inject,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RolesApiService } from '../services/roles-api.service';
import { MembersApiService } from '../../../../../app/identite/services/members-api.service';
import { ConfirmDialogService, ListingFlatComponent, type ListingFlatConfig } from '@lib/anatomy/components';
import { ToastService } from '@lib/anatomy/components';
import type { ListingQueryState } from '@lib/anatomy/types';
import { AddMembersDialogComponent } from '../components/add-members-dialog.component';
import type { Member } from '../../../../../app/identite/models';

export interface RoleMemberRow {
  userId: string;
  email: string;
  displayName: string | null;
  status: string;
  joinedAt: string | null;
}

const PAGE_SIZE = 20;

@Component({
  selector: 'app-role-members-section',
  standalone: true,
  imports: [CommonModule, TranslateModule, ListingFlatComponent],
  template: `
    <section class="nf-role-members">
      <h3 class="nf-role-members__title">
        {{ 'administration.roles.detail.members.title' | translate }}
      </h3>
      <nf-listing-flat
        [config]="listing"
        [items]="members()"
        [loading]="loading()"
        [remote]="true"
        [remoteTotal]="total()"
        (load)="onLoad($event)"
        (selectionChange)="selection.set($event)"
        (actionClick)="onAction($event)" />
    </section>
  `,
  styles: [`
    .nf-role-members { margin-top: 1.5rem; }
    .nf-role-members__title { font-size: 1rem; font-weight: 600; margin: 0 0 0.75rem; }
  `],
})
export class RoleMembersSectionComponent {
  readonly roleCode = input.required<string>();
  readonly membersRefreshed = output<void>();

  private readonly rolesApi = inject(RolesApiService);
  private readonly membersApi = inject(MembersApiService);
  private readonly dialog = inject(MatDialog);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(TranslateService);

  readonly page = signal(0);
  readonly members = signal<RoleMemberRow[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly selection = signal<RoleMemberRow[]>([]);

  readonly listing: ListingFlatConfig = {
    columns: [
      { key: 'email', field: 'email', label: 'administration.roles.detail.members.columns.email' },
      { key: 'displayName', field: 'displayName', label: 'administration.roles.detail.members.columns.displayName', transform: (name) => String(name ?? '—') },
      {
        key: 'status',
        field: 'status',
        label: 'administration.roles.detail.members.columns.status',
        type: 'badge',
        transform: (status) => `administration.members.status.${String(status).toLowerCase()}`,
        badgeVariant: (status) => (String(status).toLowerCase() === 'active' ? 'success' : 'default'),
      },
      { key: 'joined', field: 'joinedAt', label: 'administration.roles.detail.members.columns.joined', type: 'date' },
    ],
    pageSize: PAGE_SIZE,
    pageSizeOptions: [PAGE_SIZE],
    emptyMessage: 'administration.roles.detail.members.empty',
    features: { search: false, filters: false, columnToggle: false, selection: 'multiple' },
    actions: [{ id: 'add', label: 'administration.roles.detail.members.add', icon: 'user-plus', variant: 'secondary' }],
    selectionActions: [{ id: 'remove', label: 'administration.roles.detail.members.remove', icon: 'user-minus', variant: 'danger' }],
  };

  private readonly roleCodeEffect = effect(() => {
    const code = this.roleCode();
    if (code) {
      this.page.set(0);
      this.loadMembers();
    }
  });

  onLoad(query: ListingQueryState): void {
    this.page.set(query.page - 1);
    void this.loadMembers();
  }

  onAction(id: string): void {
    if (id === 'add') void this.openAddModal();
    if (id === 'remove') void this.removeMembers(this.selection().map((row) => row.userId));
  }

  async loadMembers(): Promise<void> {
    const code = this.roleCode();
    if (!code) return;
    this.loading.set(true);
    try {
      const res = await this.rolesApi.getRoleMembers(code, this.page(), PAGE_SIZE);
      this.members.set(
        res.items.map((m) => ({
          userId: m.userId,
          email: m.email,
          displayName: m.displayName,
          status: m.status,
          joinedAt: m.joinedAt,
        }))
      );
      this.total.set(res.total);
    } finally {
      this.loading.set(false);
    }
  }

  async removeMembers(userIds: string[]): Promise<void> {
    const code = this.roleCode();
    if (!code || userIds.length === 0) return;
    const confirmed = await this.confirmDialog.confirm({
      title: this.i18n.instant('administration.roles.detail.members.removeConfirm.title'),
      message: this.i18n.instant('administration.roles.detail.members.removeConfirm.message', { count: userIds.length }),
      confirmLabel: this.i18n.instant('administration.roles.detail.members.remove'),
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      await this.rolesApi.removeMembersFromRole(code, userIds);
      this.membersRefreshed.emit();
      await this.loadMembers();
    } catch {
      this.toast.error(this.i18n.instant('administration.roles.detail.members.removeError'));
    }
  }

  async openAddModal(): Promise<void> {
    const code = this.roleCode();
    if (!code) return;
    const currentUserIds = new Set(this.members().map((m) => m.userId));
    const allResponse: { items: Member[] } = await this.membersApi.getAll({ page: 0, pageSize: 500 });
    const candidates = (allResponse.items ?? []).filter(
      (m: Member) => !currentUserIds.has(m.id)
    );

    const result = await this.dialog
      .open(AddMembersDialogComponent, { data: { candidates } })
      .afterClosed()
      .toPromise();

    if (!result || result.length === 0) return;
    try {
      await this.rolesApi.assignMembersToRole(code, result);
      this.membersRefreshed.emit();
      await this.loadMembers();
    } catch {
      this.toast.error(this.i18n.instant('administration.roles.detail.members.addError'));
    }
  }
}
