import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';

import {
  ConfirmDialogService,
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
} from '@lib/anatomy';
import type { FormFieldConfig, ListingActionEvent } from '@lib/anatomy/types';

import { MEMBER_LISTING_CONFIG } from '../config';
import type { MemberListItem } from '../models';
import { MembersFacade } from '../services';

@Component({
  selector: 'app-member-listing-page',
  standalone: true,
  imports: [...ConfigDrivenListingPageImports],
  template: `
    <nf-page-shell>
      <nf-page-header [config]="headerConfig"></nf-page-header>
      <nf-entity-listing
        #listing
        [config]="config"
        [facade]="facade"
        [openOnRowClick]="true"
        (rowOpen)="onRowOpen($event)"
        (action)="onAction($event)">
      </nf-entity-listing>
    </nf-page-shell>
  `,
  styles: [ConfigDrivenListingPageStyles],
})
export class MemberListingPage extends ConfigDrivenListingPage<MemberListItem> {
  private readonly router = inject(Router);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly i18n = inject(TranslateService);

  readonly facade = inject(MembersFacade);
  readonly config = MEMBER_LISTING_CONFIG;
  readonly headerTitle = 'administration.navigation.members';

  async onRowOpen(item: MemberListItem): Promise<void> {
    await this.router.navigate(['/administration/members', item.id], {
      queryParamsHandling: 'preserve',
    });
  }

  protected override async handleCustomAction(
    event: ListingActionEvent<MemberListItem>
  ): Promise<void> {
    const target = event.item ?? event.selection?.[0] ?? null;

    switch (event.actionId) {
      case 'invite':
        await this.openInviteDialog();
        break;
      case 'view-detail':
        if (target) {
          await this.router.navigate(['/administration/members', target.id], {
            queryParamsHandling: 'preserve',
          });
        }
        break;
      case 'deactivate':
        if (target) {
          const confirmed = await this.confirmDialog.confirm({
            title: this.i18n.instant('administration.members.deactivate.confirm.title'),
            message: this.i18n.instant(
              'administration.members.deactivate.confirm.message',
              {
                name: this.memberName(target),
              }
            ),
            confirmLabel: this.i18n.instant('administration.members.actions.deactivate'),
            variant: 'danger',
            icon: 'user-x',
          });
          if (!confirmed) {
            return;
          }
          await this.facade.deactivateMember(target.id);
          this.showSuccess(this.i18n.instant('administration.members.feedback.deactivateSuccess'));
          await this.refresh();
        }
        break;
      case 'bulk-deactivate': {
        const activeMembers = (event.selection ?? []).filter(
          (member) => member.status === 'active'
        );
        if (activeMembers.length === 0) {
          return;
        }

        const confirmed = await this.confirmDialog.confirm({
          title: this.i18n.instant('administration.members.deactivate.bulkConfirm.title'),
          message: this.i18n.instant('administration.members.deactivate.bulkConfirm.message', {
            count: activeMembers.length,
          }),
          confirmLabel: this.i18n.instant('administration.members.actions.deactivateSelected'),
          variant: 'danger',
          icon: 'users',
        });

        if (!confirmed) {
          return;
        }

        await this.facade.deactivateMembers(activeMembers.map((member) => member.id));
        this.showSuccess(
          this.i18n.instant('administration.members.feedback.deactivateSelectedSuccess', {
            count: activeMembers.length,
          })
        );
        await this.refresh();
        break;
      }
      case 'reactivate':
        if (target) {
          await this.facade.reactivateMember(target.id);
          this.showSuccess(this.i18n.instant('administration.members.feedback.reactivateSuccess'));
          await this.refresh();
        }
        break;
      case 'resend-invitation':
        if (target) {
          await this.resendAndFeedback(target.id, target.email);
          await this.refresh();
        }
        break;
      case 'remove':
        if (target) {
          const confirmed = await this.confirmDialog.confirm({
            title: this.i18n.instant('administration.members.remove.confirm.title'),
            message: this.i18n.instant('administration.members.remove.confirm.message', {
              name: this.memberName(target),
            }),
            confirmLabel: this.i18n.instant('administration.members.actions.remove'),
            variant: 'danger',
            icon: 'trash-2',
          });
          if (!confirmed) {
            return;
          }
          await this.facade.removeMember(target.id);
          this.showSuccess(this.i18n.instant('administration.members.feedback.removeSuccess'));
          await this.refresh();
        }
        break;
      default:
        console.log('Unhandled listing action:', event.actionId, event);
    }
  }

  private memberName(member: MemberListItem): string {
    return (
      member.displayName ??
      (`${member.firstName} ${member.lastName}`.trim() || member.email)
    );
  }

  private async resendAndFeedback(memberId: string, email: string): Promise<void> {
    try {
      const result = await this.facade.resendInvitation(memberId);
      if (result.emailDeliveryStatus === 'failed') {
        this.showError(
          this.i18n.instant('administration.members.feedback.resendEmailFailed', { email })
        );
      } else {
        this.showSuccess(
          this.i18n.instant('administration.members.feedback.resendInvitationSuccess')
        );
      }
    } catch {
      this.showError(this.i18n.instant('administration.members.feedback.resendInvitationError'));
    }
  }

  private async openInviteDialog(): Promise<void> {
    await this.facade.ensureLookups();
    const roles = this.facade.lookups()['roles'] ?? [];
    const fields: FormFieldConfig[] = [
      {
        key: 'email',
        field: 'email',
        label: 'administration.members.fields.email',
        type: 'email',
        required: true,
      },
      {
        key: 'roleId',
        field: 'roleId',
        label: 'administration.members.fields.roles',
        type: 'select',
        required: true,
        options: roles.map((role) => ({ label: String(role.value), value: role.key })),
      },
      {
        key: 'message',
        field: 'message',
        label: 'administration.members.fields.message',
        type: 'textarea',
        validation: { maxLength: 500 },
      },
    ];
    let values: Record<string, unknown> = {};

    while (true) {
      const result = await this.confirmDialog.form({
        title: 'administration.members.invite',
        submitLabel: 'administration.members.invite',
        fields,
        values,
      });
      if (!result) {
        return;
      }
      const email = String(result['email'] ?? '').trim();
      const roleId = String(result['roleId'] ?? '').trim();
      const message = String(result['message'] ?? '').trim();
      values = { email, roleId, message };

      try {
        const invited = await this.facade.inviteMember({
          email,
          roleIds: [roleId],
          message: message || undefined,
        });
        if (invited.invitationEmailStatus === 'failed') {
          this.showError(
            this.i18n.instant('administration.members.feedback.inviteEmailFailed', {
              email: invited.email,
            })
          );
        } else {
          this.showSuccess(
            this.i18n.instant('administration.members.feedback.inviteSuccess', {
              email: invited.email,
            })
          );
        }
        await this.refresh();
        return;
      } catch (error) {
        if (error instanceof HttpErrorResponse && error.status === 409) {
          const handled = await this.handleInviteConflict(email, error);
          if (handled) {
            await this.refresh();
            return;
          }
          continue;
        }
        this.showError(this.i18n.instant('administration.members.feedback.inviteError'));
        return;
      }
    }
  }

  /** @returns true when the dialog flow should close (conflict handled or abandoned). */
  private async handleInviteConflict(email: string, error: HttpErrorResponse): Promise<boolean> {
    const apiMessage = String(
      (error.error as { message?: string } | null)?.message ?? ''
    );
    const statusMatch = /^MEMBER_EXISTS:([a-z_]+)$/i.exec(apiMessage.trim());
    let status = statusMatch?.[1]?.toLowerCase() ?? null;

    const existing = await this.facade.findByEmail(email);
    if (existing?.status) {
      status = existing.status;
    }

    if (status === 'invited' && existing) {
      const resend = await this.confirmDialog.confirm({
        title: this.i18n.instant('administration.members.inviteAlready.invitedTitle'),
        message: this.i18n.instant('administration.members.inviteAlready.invitedMessage', {
          email,
        }),
        confirmLabel: this.i18n.instant('administration.members.actions.resendInvitation'),
        variant: 'default',
        icon: 'mail',
      });
      if (!resend) {
        return true;
      }
      await this.resendAndFeedback(existing.id, existing.email);
      return true;
    }

    if (status === 'active') {
      this.showError(
        this.i18n.instant('administration.members.feedback.inviteAlreadyActive', { email })
      );
      return true;
    }

    if (status === 'suspended') {
      this.showError(
        this.i18n.instant('administration.members.feedback.inviteAlreadySuspended', { email })
      );
      return true;
    }

    this.showError(this.i18n.instant('administration.members.feedback.inviteDuplicate'));
    return false;
  }
}
