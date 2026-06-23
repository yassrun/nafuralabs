import { Component, inject, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PermissionService } from '@core/security/services/permission.service';

import {
  ConfigDrivenDetailPage,
  ConfigDrivenDetailPageImports,
  ConfigDrivenDetailPageStyles,
  DetailFacade,
  type PageHeaderConfig,
} from '@lib/anatomy';
import type { DetailActionEvent } from '@lib/anatomy/types';

import {
  MEMBER_DETAIL_CONFIG,
  MEMBER_DETAIL_CREATE_CONFIG,
} from '../config';
import type { Member, MemberInvite, MemberUpdate } from '../models';
import { MembersFacade } from '../services';

@Component({
  selector: 'app-member-detail-page',
  standalone: true,
  imports: [...ConfigDrivenDetailPageImports, TranslateModule],
  template: `
    <nf-page-shell scroll>
      <nf-page-header
        [config]="headerConfig"
        (actionClick)="onHeaderAction($event)">
      </nf-page-header>

      @if (mode() === 'create') {
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
      } @else {
        @if (item(); as member) {
        <div class="member-detail-layout">
          <section class="member-card">
            <div class="member-avatar">{{ memberInitials(member) }}</div>
            <div class="member-main">
              <h2 class="member-name">{{ memberDisplayName(member) }}</h2>
              <button
                type="button"
                class="member-email"
                [title]="emailCopied() ? ('administration.members.detail.email.copied' | translate) : ''"
                (click)="copyEmail(member.email)">
                {{ member.email }}
              </button>
            </div>
            <span [class]="statusBadgeClass(member.status)">
              {{ statusLabel(member.status) }}
            </span>
            <div class="member-dates">
              <div class="member-date-item">
                <span class="date-label">{{ 'administration.members.detail.joined' | translate }}</span>
                <span class="date-value">{{ formatAbsoluteDate(member.joinedAt) }}</span>
              </div>
              <div class="member-date-item">
                <span class="date-label">{{ 'administration.members.detail.lastActivity' | translate }}</span>
                <span class="date-value">{{ formatRelativeDate(member.lastActivityAt) }}</span>
              </div>
            </div>
          </section>

          <section class="member-section">
            <div class="section-header">
              <h3>{{ 'administration.members.detail.roles.title' | translate }}</h3>
              @if (canWrite() && !isEditingRoles()) {
                <button type="button" class="action-btn" (click)="startRoleEdit()">
                  {{ 'administration.members.detail.roles.edit' | translate }}
                </button>
              }
            </div>

            @if (!isEditingRoles()) {
              <div class="role-chip-list">
                @for (role of member.roles; track role.id) {
                  <span class="role-chip" [class.role-chip-system]="role.isSystem">
                    {{ role.name }}
                    @if (role.isSystem) {
                      <small>{{ 'administration.members.detail.roles.system' | translate }}</small>
                    }
                  </span>
                }
              </div>
            } @else {
              <div class="role-editor">
                @for (role of availableRoleOptions(); track role.key) {
                  <label class="role-option">
                    <input
                      type="checkbox"
                      [checked]="isRoleSelected(role.key)"
                      [disabled]="isSaving() || isSystemRole(role.key)"
                      (change)="onRoleToggle(role.key, $any($event.target).checked)">
                    <span>{{ role.value }}</span>
                    @if (isSystemRole(role.key)) {
                      <small>{{ 'administration.members.detail.roles.system' | translate }}</small>
                    }
                  </label>
                }
              </div>
              <div class="role-editor-actions">
                <button
                  type="button"
                  class="action-btn"
                  [disabled]="isSaving()"
                  (click)="cancelRoleEdit()">
                  {{ 'Cancel' | translate }}
                </button>
                <button
                  type="button"
                  class="action-btn action-btn-primary"
                  [disabled]="isSaving()"
                  (click)="saveRoles()">
                  {{ 'administration.members.detail.roles.save' | translate }}
                </button>
              </div>
            }
          </section>

          @if (canWrite()) {
            <section class="member-section">
              <div class="section-header">
                <h3>{{ 'administration.members.detail.actions.title' | translate }}</h3>
              </div>
              <div class="member-actions">
                @if (member.status === 'active') {
                  <button
                    type="button"
                    class="action-btn action-btn-danger"
                    [disabled]="isSaving()"
                    (click)="deactivateMember()">
                    {{ 'administration.members.detail.actions.deactivate' | translate }}
                  </button>
                }
                @if (member.status === 'suspended') {
                  <button
                    type="button"
                    class="action-btn action-btn-primary"
                    [disabled]="isSaving()"
                    (click)="reactivateMember()">
                    {{ 'administration.members.detail.actions.reactivate' | translate }}
                  </button>
                }
                @if (member.status === 'invited') {
                  <button
                    type="button"
                    class="action-btn"
                    [disabled]="isSaving()"
                    (click)="resendInvitation()">
                    {{ 'administration.members.detail.actions.resend' | translate }}
                  </button>
                }
                @if (member.status !== 'active') {
                  <button
                    type="button"
                    class="action-btn action-btn-danger"
                    [disabled]="isSaving()"
                    (click)="removeMember()">
                    {{ 'administration.members.detail.actions.remove' | translate }}
                  </button>
                }
              </div>
            </section>
          }
        </div>
        }
      }
    </nf-page-shell>
  `,
  styles: [
    ConfigDrivenDetailPageStyles,
    `
      .member-detail-layout {
        display: grid;
        gap: 1rem;
      }

      .member-card,
      .member-section {
        background: var(--nf-color-surface, #ffffff);
        border: 1px solid var(--nf-color-border, #e5e7eb);
        border-radius: 12px;
        padding: 1rem;
      }

      .member-card {
        display: grid;
        grid-template-columns: auto 1fr auto;
        gap: 0.75rem 1rem;
        align-items: center;
      }

      .member-avatar {
        width: 3rem;
        height: 3rem;
        border-radius: 999px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        background: var(--nf-color-primary-100, #e0e7ff);
        color: var(--nf-color-primary-700, #1d4ed8);
      }

      .member-name {
        margin: 0;
        font-size: 1.125rem;
      }

      .member-email {
        appearance: none;
        border: 0;
        background: transparent;
        padding: 0;
        margin-top: 0.25rem;
        color: var(--nf-color-text-secondary, #6b7280);
        cursor: pointer;
        text-align: left;
      }

      .member-dates {
        grid-column: 2 / 4;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.5rem;
      }

      .member-date-item {
        display: grid;
        gap: 0.125rem;
      }

      .date-label {
        color: var(--nf-color-text-secondary, #6b7280);
        font-size: 0.75rem;
      }

      .date-value {
        font-size: 0.875rem;
      }

      .status-badge {
        justify-self: end;
        padding: 0.25rem 0.625rem;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 600;
      }

      .status-success {
        background: #dcfce7;
        color: #166534;
      }

      .status-warning {
        background: #fef3c7;
        color: #92400e;
      }

      .status-danger {
        background: #fee2e2;
        color: #991b1b;
      }

      .section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 0.75rem;
      }

      .section-header h3 {
        margin: 0;
        font-size: 1rem;
      }

      .role-chip-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .role-chip {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.25rem 0.625rem;
        border-radius: 999px;
        background: #f3f4f6;
        font-size: 0.8125rem;
      }

      .role-chip-system {
        background: #ede9fe;
        color: #5b21b6;
      }

      .role-chip small,
      .role-option small {
        color: inherit;
        opacity: 0.8;
      }

      .role-editor {
        display: grid;
        gap: 0.5rem;
      }

      .role-option {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .role-editor-actions,
      .member-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-top: 0.75rem;
      }

      .action-btn {
        border: 1px solid var(--nf-color-border, #d1d5db);
        background: #ffffff;
        color: var(--nf-color-text, #111827);
        border-radius: 8px;
        padding: 0.5rem 0.75rem;
        cursor: pointer;
      }

      .action-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .action-btn-primary {
        background: #2563eb;
        border-color: #2563eb;
        color: #ffffff;
      }

      .action-btn-danger {
        background: #b91c1c;
        border-color: #b91c1c;
        color: #ffffff;
      }

      @media (max-width: 768px) {
        .member-card {
          grid-template-columns: 1fr;
          align-items: start;
        }

        .status-badge,
        .member-dates {
          grid-column: auto;
          justify-self: start;
        }

        .member-dates {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class MemberDetailPage extends ConfigDrivenDetailPage<Member> {
  private readonly crud = inject(MembersFacade);
  private readonly i18n = inject(TranslateService);
  private readonly permissionService = inject(PermissionService);

  readonly emailCopied = signal(false);
  readonly isEditingRoles = signal(false);
  readonly draftRoleIds = signal<string[]>([]);

  readonly facade: DetailFacade<Member> = {
    loadById: (id: string) => this.crud.getItem(id),
    create: (data: Partial<Member>) =>
      this.crud.inviteMember(data as MemberInvite),
    update: (id: string, data: Partial<Member>) =>
      this.crud.updateItem(id, data as MemberUpdate),
    delete: (id: string) => this.crud.deleteItem(id),
  };

  get config() {
    return this.mode() === 'create'
      ? MEMBER_DETAIL_CREATE_CONFIG
      : MEMBER_DETAIL_CONFIG;
  }

  override get headerConfig(): PageHeaderConfig {
    const current = this.item();

    return {
      title:
        this.mode() === 'create'
          ? 'administration.members.invite'
          : this.headerTitle,
      breadcrumbs: this.mode() === 'create'
        ? undefined
        : [
            { label: 'administration.navigation.title', route: '/admin' },
            {
              label: 'administration.navigation.members',
              route: '/administration/members',
              queryParams: this.listingQueryParams(),
            },
            { label: current ? this.memberDisplayName(current) : this.headerTitle },
          ],
      secondaryAction: {
        id: 'back',
        label: 'administration.members.detail.back',
      },
    };
  }

  get headerTitle(): string {
    if (this.mode() === 'create') {
      return this.i18n.instant('administration.members.invite');
    }
    const member = this.item();
    if (!member) {
      return this.i18n.instant('administration.members.detail.title');
    }
    return this.memberDisplayName(member);
  }

  protected override async loadItem(id: string): Promise<void> {
    await super.loadItem(id);
    const loaded = this.item();
    if (!loaded) {
      return;
    }
    this.item.set({
      ...loaded,
      roleIds: (loaded.roles ?? []).map((role) => role.id),
    });
    this.draftRoleIds.set((loaded.roles ?? []).map((role) => role.id));
    this.isEditingRoles.set(false);
  }

  protected override async handleSave(
    event: DetailActionEvent<Member>
  ): Promise<void> {
    if (this.mode() !== 'create') {
      return;
    }

    this.isSaving.set(true);
    try {
      const formValue = event.formValue as Record<string, unknown>;
      const roleIds = this.normalizeRoles(formValue['roleIds']);

      const invite: MemberInvite = {
        email: String(formValue['email'] ?? '').trim(),
        firstName: this.asOptionalString(formValue['firstName']),
        lastName: this.asOptionalString(formValue['lastName']),
        roleIds,
      };
      const savedItem = await this.crud.inviteMember(invite);

      const normalized = {
        ...savedItem,
        roleIds: (savedItem.roles ?? []).map((role) => role.id),
      };
      this.showSuccess(
        this.i18n.instant('administration.members.invite.success', {
          email: normalized.email,
        })
      );
      this.detailComponent?.markAsPristine();
      this.afterSave(normalized);
    } catch (error) {
      this.showError(this.i18n.instant('administration.members.invite.error'));
    } finally {
      this.isSaving.set(false);
    }
  }

  protected override navigateToList(): void {
    this.router.navigate(['/administration/members'], {
      queryParams: this.listingQueryParams(),
    });
  }

  protected override async handleCustomAction(
    event: DetailActionEvent<Member>
  ): Promise<void> {
    console.log('Unhandled detail action:', event.actionId, event);
  }

  onHeaderAction(event: { type: 'primary' | 'secondary'; action: { id?: string } }): void {
    if (event.action.id === 'back' || event.type === 'secondary') {
      this.navigateToList();
    }
  }

  canWrite(): boolean {
    return this.permissionService.hasPermission('administration.members.write');
  }

  memberDisplayName(member: Member): string {
    return member.displayName || `${member.firstName} ${member.lastName}`.trim() || member.email;
  }

  memberInitials(member: Member): string {
    const words = this.memberDisplayName(member)
      .split(' ')
      .map((part) => part.trim())
      .filter((part) => part.length > 0)
      .slice(0, 2);

    if (words.length === 0) {
      return member.email.slice(0, 2).toUpperCase();
    }

    return words.map((part) => part.charAt(0).toUpperCase()).join('');
  }

  statusLabel(status: Member['status']): string {
    return this.i18n.instant(`administration.members.status.${status}`);
  }

  statusBadgeClass(status: Member['status']): string {
    if (status === 'active') return 'status-badge status-success';
    if (status === 'invited') return 'status-badge status-warning';
    return 'status-badge status-danger';
  }

  formatAbsoluteDate(value: string | null): string {
    if (!value) {
      return '-';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    return date.toLocaleDateString(this.currentLanguage(), {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  formatRelativeDate(value: string | null): string {
    if (!value) {
      return '-';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    const now = Date.now();
    const diffMs = date.getTime() - now;
    const rtf = new Intl.RelativeTimeFormat(this.currentLanguage(), {
      numeric: 'auto',
    });

    const minutes = Math.round(diffMs / (1000 * 60));
    if (Math.abs(minutes) < 60) {
      return rtf.format(minutes, 'minute');
    }

    const hours = Math.round(minutes / 60);
    if (Math.abs(hours) < 24) {
      return rtf.format(hours, 'hour');
    }

    const days = Math.round(hours / 24);
    if (Math.abs(days) < 30) {
      return rtf.format(days, 'day');
    }

    const months = Math.round(days / 30);
    if (Math.abs(months) < 12) {
      return rtf.format(months, 'month');
    }

    const years = Math.round(months / 12);
    return rtf.format(years, 'year');
  }

  availableRoleOptions(): Array<{ key: string; value: string }> {
    const options = this.lookups()['roles'];
    if (!Array.isArray(options)) {
      return [];
    }

    return options
      .map((entry) => ({
        key: String(entry.key ?? ''),
        value: String(entry.value ?? ''),
      }))
      .filter((entry) => entry.key.length > 0);
  }

  startRoleEdit(): void {
    const member = this.item();
    if (!member) {
      return;
    }

    this.draftRoleIds.set((member.roles ?? []).map((role) => role.id));
    this.isEditingRoles.set(true);
  }

  cancelRoleEdit(): void {
    this.isEditingRoles.set(false);
    const member = this.item();
    if (member) {
      this.draftRoleIds.set((member.roles ?? []).map((role) => role.id));
    }
  }

  isRoleSelected(roleId: string): boolean {
    return this.draftRoleIds().includes(roleId);
  }

  isSystemRole(roleId: string): boolean {
    const role = this.item()?.roles?.find((entry) => entry.id === roleId);
    return Boolean(role?.isSystem);
  }

  onRoleToggle(roleId: string, checked: boolean): void {
    if (this.isSystemRole(roleId)) {
      return;
    }

    this.draftRoleIds.update((prev) => {
      if (checked) {
        return prev.includes(roleId) ? prev : [...prev, roleId];
      }

      return prev.filter((id) => id !== roleId);
    });
  }

  async saveRoles(): Promise<void> {
    const id = this.itemId();
    if (!id) {
      return;
    }

    this.isSaving.set(true);
    try {
      await this.crud.updateItem(id, { roles: this.draftRoleIds() });
      await this.loadItem(id);
      this.isEditingRoles.set(false);
      this.showSuccess(this.i18n.instant('administration.members.detail.roles.saved'));
    } catch (error) {
      this.showError(this.i18n.instant('administration.members.detail.roles.saveError'));
    } finally {
      this.isSaving.set(false);
    }
  }

  async deactivateMember(): Promise<void> {
    const member = this.item();
    if (!member || member.status !== 'active') {
      return;
    }

    const confirmed = await this.confirmDialog.confirm({
      title: this.i18n.instant('administration.members.detail.actions.deactivate'),
      message: this.i18n.instant('administration.members.detail.actions.deactivateConfirm', {
        name: this.memberDisplayName(member),
      }),
      confirmLabel: this.i18n.instant('administration.members.detail.actions.deactivate'),
      variant: 'danger',
    });

    if (!confirmed) {
      return;
    }

    this.isSaving.set(true);
    try {
      await this.crud.deactivateMember(member.id);
      await this.loadItem(member.id);
      this.showSuccess(this.i18n.instant('administration.members.actions.deactivate.success'));
    } catch (error) {
      this.showError(this.i18n.instant('administration.members.detail.actions.updateError'));
    } finally {
      this.isSaving.set(false);
    }
  }

  async reactivateMember(): Promise<void> {
    const member = this.item();
    if (!member || member.status !== 'suspended') {
      return;
    }

    this.isSaving.set(true);
    try {
      await this.crud.reactivateMember(member.id);
      await this.loadItem(member.id);
      this.showSuccess(this.i18n.instant('administration.members.actions.reactivate.success'));
    } catch (error) {
      this.showError(this.i18n.instant('administration.members.detail.actions.updateError'));
    } finally {
      this.isSaving.set(false);
    }
  }

  async resendInvitation(): Promise<void> {
    const member = this.item();
    if (!member || member.status !== 'invited') {
      return;
    }

    this.isSaving.set(true);
    try {
      await this.crud.resendInvitation(member.id);
      await this.loadItem(member.id);
      this.showSuccess(this.i18n.instant('administration.members.actions.resendInvitation.success'));
    } catch (error) {
      this.showError(this.i18n.instant('administration.members.detail.actions.updateError'));
    } finally {
      this.isSaving.set(false);
    }
  }

  async removeMember(): Promise<void> {
    const member = this.item();
    if (!member || member.status === 'active') {
      return;
    }

    const confirmed = await this.confirmDialog.confirm({
      title: this.i18n.instant('administration.members.detail.actions.remove'),
      message: this.i18n.instant('administration.members.detail.actions.removeConfirm', {
        name: this.memberDisplayName(member),
      }),
      confirmLabel: this.i18n.instant('administration.members.detail.actions.remove'),
      variant: 'danger',
    });

    if (!confirmed) {
      return;
    }

    this.isSaving.set(true);
    try {
      await this.crud.removeMember(member.id);
      this.showSuccess(this.i18n.instant('administration.members.actions.remove.success'));
      this.navigateToList();
    } catch (error) {
      this.showError(this.i18n.instant('administration.members.detail.actions.updateError'));
    } finally {
      this.isSaving.set(false);
    }
  }

  async copyEmail(email: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(email);
      this.emailCopied.set(true);
      this.showSuccess(this.i18n.instant('administration.members.detail.email.copied'));
      setTimeout(() => this.emailCopied.set(false), 2000);
    } catch (error) {
      this.showError(this.i18n.instant('administration.members.detail.email.copyError'));
    }
  }

  private normalizeRoles(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }
    return value
      .map((entry) => String(entry ?? '').trim())
      .filter((entry) => entry.length > 0);
  }

  private asOptionalString(value: unknown): string | undefined {
    if (value === null || value === undefined) {
      return undefined;
    }
    const text = String(value).trim();
    return text.length > 0 ? text : undefined;
  }

  private listingQueryParams(): Record<string, string> {
    const source = this.route.snapshot.queryParams;
    const entries = Object.entries(source)
      .filter(([, value]) => value !== null && value !== undefined)
      .map(([key, value]) => [key, String(value)] as const);
    return Object.fromEntries(entries);
  }

  private currentLanguage(): string {
    return this.i18n.currentLang || this.i18n.defaultLang || 'en';
  }
}
