import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthFacade } from '@core/security/services/auth.facade';

import {
  ConfigDrivenDetailPage,
  ConfigDrivenDetailPageImports,
  ConfigDrivenDetailPageStyles,
  type DetailFacade,
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
      <nf-page-header [config]="headerConfig"></nf-page-header>
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
    </nf-page-shell>
  `,
  styles: [ConfigDrivenDetailPageStyles],
})
export class MemberDetailPage extends ConfigDrivenDetailPage<Member> {
  private readonly crud = inject(MembersFacade);
  private readonly i18n = inject(TranslateService);
  private readonly auth = inject(AuthFacade);

  readonly facade: DetailFacade<Member> = {
    loadById: (id: string) => this.crud.getItem(id),
    create: (data: Partial<Member>) =>
      this.crud.inviteMember(this.toInvite(data)),
    update: (id: string, data: Partial<Member>) =>
      this.crud.updateItem(id, this.toUpdate(data)),
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
      breadcrumbs:
        this.mode() === 'create'
          ? undefined
          : [
              {
                label: 'administration.navigation.title',
                route: '/administration',
              },
              {
                label: 'administration.navigation.members',
                route: '/administration/members',
              },
              {
                label: current
                  ? this.memberDisplayName(current)
                  : this.headerTitle,
              },
            ],
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
      joinedAt: this.formatDisplayDate(loaded.joinedAt),
      lastActivityAt: this.formatDisplayDate(loaded.lastActivityAt),
    });
  }

  private formatDisplayDate(value: string | null | undefined): string {
    if (!value) {
      return '—';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '—';
    }
    return date.toLocaleString('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  protected override async handleSave(
    event: DetailActionEvent<Member>
  ): Promise<void> {
    if (this.mode() === 'create') {
      this.isSaving.set(true);
      try {
        const invite = this.toInvite(event.formValue);
        const savedItem = await this.crud.inviteMember(invite);
        const normalized = {
          ...savedItem,
          roleIds: (savedItem.roles ?? []).map((role) => role.id),
          joinedAt: this.formatDisplayDate(savedItem.joinedAt),
          lastActivityAt: this.formatDisplayDate(savedItem.lastActivityAt),
        };
        if (savedItem.invitationEmailStatus === 'failed') {
          this.showError(
            this.i18n.instant('administration.members.feedback.inviteEmailFailed', {
              email: normalized.email,
            })
          );
        } else {
          this.showSuccess(
            this.i18n.instant('administration.members.feedback.inviteSuccess', {
              email: normalized.email,
            })
          );
        }
        this.detailComponent?.markAsPristine();
        this.afterSave(normalized);
      } catch (error) {
        if (error instanceof HttpErrorResponse && error.status === 409) {
          this.showError(this.i18n.instant('administration.members.feedback.inviteDuplicate'));
        } else {
          this.showError(
            this.i18n.instant('administration.members.feedback.inviteError')
          );
        }
      } finally {
        this.isSaving.set(false);
      }
      return;
    }

    this.isSaving.set(true);
    try {
      const id = this.itemId();
      if (!id) {
        throw new Error('No item ID');
      }
      const update = this.toUpdate(event.formValue);
      if (!update.roles?.length) {
        this.showError(
          this.i18n.instant('administration.members.detail.roles.saveError')
        );
        return;
      }
      await this.crud.updateItem(id, update);
      await this.loadItem(id);
      if (this.auth.user()?.id === String(id)) {
        await this.auth.refreshTenantMemberships();
      }
      this.detailComponent?.markAsPristine();
      this.showSuccess(
        this.i18n.instant('administration.members.detail.roles.saved')
      );
    } catch (error) {
      this.showError(this.actionErrorMessage(error, 'administration.members.detail.roles.saveError'));
    } finally {
      this.isSaving.set(false);
    }
  }

  protected override navigateToList(): void {
    this.router.navigate(['/administration/members']);
  }

  protected override async handleCustomAction(
    event: DetailActionEvent<Member>
  ): Promise<void> {
    switch (event.actionId) {
      case 'resend-invitation':
        await this.resendInvitation();
        break;
      case 'deactivate':
        await this.deactivateMember();
        break;
      case 'reactivate':
        await this.reactivateMember();
        break;
      case 'remove':
        await this.removeMember();
        break;
      default:
        break;
    }
  }

  private memberDisplayName(member: Member): string {
    return (
      member.displayName ||
      `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim() ||
      member.email
    );
  }

  private toInvite(data: Partial<Member>): MemberInvite {
    return {
      email: String(data.email ?? '').trim(),
      roleIds: this.normalizeRoles(data.roleIds),
      message: this.asOptionalString(data.message),
    };
  }

  private toUpdate(data: Partial<Member>): MemberUpdate {
    return {
      roles: this.normalizeRoles(data.roleIds),
    };
  }

  private normalizeRoles(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }
    return value
      .map((roleId) => String(roleId ?? '').trim().toUpperCase())
      .filter((roleId) => roleId.length > 0);
  }

  private asOptionalString(value: unknown): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  private async deactivateMember(): Promise<void> {
    const member = this.item();
    if (!member || member.status !== 'active') {
      return;
    }
    this.isSaving.set(true);
    try {
      await this.crud.deactivateMember(member.id);
      await this.loadItem(member.id);
      this.showSuccess(
        this.i18n.instant('administration.members.feedback.deactivateSuccess')
      );
    } catch (error) {
      this.showError(this.actionErrorMessage(error));
    } finally {
      this.isSaving.set(false);
    }
  }

  private async reactivateMember(): Promise<void> {
    const member = this.item();
    if (!member || member.status !== 'suspended') {
      return;
    }
    this.isSaving.set(true);
    try {
      await this.crud.reactivateMember(member.id);
      await this.loadItem(member.id);
      this.showSuccess(
        this.i18n.instant('administration.members.feedback.reactivateSuccess')
      );
    } catch {
      this.showError(
        this.i18n.instant('administration.members.detail.actions.updateError')
      );
    } finally {
      this.isSaving.set(false);
    }
  }

  private async resendInvitation(): Promise<void> {
    const member = this.item();
    if (!member || member.status !== 'invited') {
      return;
    }
    this.isSaving.set(true);
    try {
      const result = await this.crud.resendInvitation(member.id);
      await this.loadItem(member.id);
      if (result.emailDeliveryStatus === 'failed') {
        this.showError(
          this.i18n.instant('administration.members.feedback.resendEmailFailed', {
            email: member.email,
          })
        );
      } else {
        this.showSuccess(
          this.i18n.instant('administration.members.feedback.resendInvitationSuccess')
        );
      }
    } catch {
      this.showError(
        this.i18n.instant('administration.members.feedback.resendInvitationError')
      );
    } finally {
      this.isSaving.set(false);
    }
  }

  private async removeMember(): Promise<void> {
    const member = this.item();
    if (!member || member.status === 'active') {
      return;
    }
    this.isSaving.set(true);
    try {
      await this.crud.removeMember(member.id);
      this.showSuccess(
        this.i18n.instant('administration.members.feedback.removeSuccess')
      );
      this.navigateToList();
    } catch (error) {
      this.showError(this.actionErrorMessage(error));
    } finally {
      this.isSaving.set(false);
    }
  }

  private actionErrorMessage(
    error: unknown,
    fallbackKey = 'administration.members.detail.actions.updateError'
  ): string {
    if (error instanceof HttpErrorResponse && error.status === 409) {
      return this.i18n.instant('administration.members.feedback.lastOwner');
    }
    const message =
      error instanceof HttpErrorResponse
        ? String(error.error?.message ?? error.error?.detail ?? '')
        : '';
    if (message.toLowerCase().includes('owner')) {
      return this.i18n.instant('administration.members.feedback.lastOwner');
    }
    return this.i18n.instant(fallbackKey);
  }
}
