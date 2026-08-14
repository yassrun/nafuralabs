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
import { MembersApiService } from '../../members/services/members-api.service';
import { ConfirmDialogService } from '@lib/anatomy/components';
import { ToastService } from '@lib/anatomy/components';
import { AddMembersDialogComponent } from '../components/add-members-dialog.component';
import type { Member } from '../../members/models';

export interface RoleMemberRow {
  userId: string;
  email: string;
  displayName: string | null;
  status: string;
  joinedAt: string | null;
}

@Component({
  selector: 'app-role-members-section',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <section class="nf-role-members">
      <div class="nf-role-members__header">
        <h3 class="nf-role-members__title">
          {{ 'administration.roles.detail.members.title' | translate }}
        </h3>
        <button
          type="button"
          class="nf-role-members__add"
          (click)="openAddModal()">
          {{ 'administration.roles.detail.members.add' | translate }}
        </button>
      </div>
      @if (loading()) {
        <p class="nf-role-members__loading">
          {{ 'administration.roles.detail.members.loading' | translate }}
        </p>
      } @else if (members().length === 0) {
        <p class="nf-role-members__empty">
          {{ 'administration.roles.detail.members.empty' | translate }}
        </p>
      } @else {
        <table class="nf-role-members__table">
          <thead>
            <tr>
              <th>{{ 'administration.roles.detail.members.columns.email' | translate }}</th>
              <th>{{ 'administration.roles.detail.members.columns.displayName' | translate }}</th>
              <th>{{ 'administration.roles.detail.members.columns.status' | translate }}</th>
              <th>{{ 'administration.roles.detail.members.columns.joined' | translate }}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (row of members(); track row.userId) {
              <tr>
                <td>{{ row.email }}</td>
                <td>{{ row.displayName ?? '—' }}</td>
                <td>{{ row.status }}</td>
                <td>{{ row.joinedAt ?? '—' }}</td>
                <td>
                  <button
                    type="button"
                    class="nf-role-members__remove"
                    (click)="removeMember(row.userId)">
                    {{ 'administration.roles.detail.members.remove' | translate }}
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
        @if (total() > members().length) {
          <div class="nf-role-members__pagination">
            <button
              type="button"
              [disabled]="page() === 0"
              (click)="setPage(page() - 1)">
              {{ 'administration.roles.detail.members.pagination.previous' | translate }}
            </button>
            <span>{{
              'administration.roles.detail.members.pagination.page'
                | translate : { current: page() + 1, total: totalPages() }
            }}</span>
            <button
              type="button"
              [disabled]="page() >= totalPages() - 1"
              (click)="setPage(page() + 1)">
              {{ 'administration.roles.detail.members.pagination.next' | translate }}
            </button>
          </div>
        }
      }
    </section>
  `,
  styles: [`
    .nf-role-members { margin-top: 1.5rem; }
    .nf-role-members__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
    .nf-role-members__title { font-size: 1rem; font-weight: 600; margin: 0; }
    .nf-role-members__add { padding: 0.375rem 0.75rem; border-radius: 0.375rem; border: 1px solid var(--nf-border-default, #e5e7eb); background: var(--nf-color-surface, #fff); cursor: pointer; font-size: 0.875rem; }
    .nf-role-members__loading, .nf-role-members__empty { color: var(--nf-text-muted, #6b7280); font-size: 0.875rem; margin: 0.5rem 0; }
    .nf-role-members__table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    .nf-role-members__table th, .nf-role-members__table td { padding: 0.5rem 0.75rem; text-align: left; border-bottom: 1px solid var(--nf-border-subtle, #f3f4f6); }
    .nf-role-members__table th { font-weight: 600; color: var(--nf-text-muted, #6b7280); }
    .nf-role-members__remove { padding: 0.25rem 0.5rem; font-size: 0.8125rem; border: none; background: transparent; color: var(--nf-danger, #ef4444); cursor: pointer; }
    .nf-role-members__remove:hover { text-decoration: underline; }
    .nf-role-members__pagination { display: flex; align-items: center; gap: 0.75rem; margin-top: 0.75rem; font-size: 0.875rem; }
    .nf-role-members__pagination button { padding: 0.25rem 0.5rem; cursor: pointer; }
    .nf-role-members__pagination button:disabled { opacity: 0.5; cursor: not-allowed; }
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
  readonly pageSize = 20;
  readonly members = signal<RoleMemberRow[]>([]);
  readonly total = signal(0);
  readonly totalPages = signal(0);
  readonly loading = signal(false);

  private readonly roleCodeEffect = effect(() => {
    const code = this.roleCode();
    if (code) {
      this.page.set(0);
      this.loadMembers();
    }
  });

  setPage(p: number): void {
    this.page.set(p);
    this.loadMembers();
  }

  async loadMembers(): Promise<void> {
    const code = this.roleCode();
    if (!code) return;
    this.loading.set(true);
    try {
      const res = await this.rolesApi.getRoleMembers(code, this.page(), this.pageSize);
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
      this.totalPages.set(Math.max(1, res.totalPages));
    } finally {
      this.loading.set(false);
    }
  }

  async removeMember(userId: string): Promise<void> {
    const code = this.roleCode();
    if (!code) return;
    const confirmed = await this.confirmDialog.confirm({
      title: this.i18n.instant('administration.roles.detail.members.removeConfirm.title'),
      message: this.i18n.instant('administration.roles.detail.members.removeConfirm.message'),
      confirmLabel: this.i18n.instant('administration.roles.detail.members.remove'),
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      await this.rolesApi.removeMembersFromRole(code, [userId]);
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
