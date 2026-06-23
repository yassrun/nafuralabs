import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

import {
  ConfirmDialogService,
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
} from '@lib/anatomy';
import type { ListingActionEvent } from '@lib/anatomy/types';

import { MEMBER_LISTING_CONFIG } from '../config';
import type { MemberListItem } from '../models';
import { MembersFacade } from '../services';
import {
  InviteMemberDialogComponent,
  type InviteMemberDialogResult,
} from '../components/invite-member-dialog.component';

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
  private readonly dialog = inject(MatDialog);
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
          this.showSuccess(this.i18n.instant('administration.members.actions.deactivate.success'));
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
          this.i18n.instant('administration.members.actions.deactivateSelected.success', {
            count: activeMembers.length,
          })
        );
        await this.refresh();
        break;
      }
      case 'reactivate':
        if (target) {
          await this.facade.reactivateMember(target.id);
          this.showSuccess(this.i18n.instant('administration.members.actions.reactivate.success'));
          await this.refresh();
        }
        break;
      case 'resend-invitation':
        if (target) {
          await this.facade.resendInvitation(target.id);
          this.showSuccess(this.i18n.instant('administration.members.actions.resendInvitation.success'));
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
          this.showSuccess(this.i18n.instant('administration.members.actions.remove.success'));
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

  private async openInviteDialog(): Promise<void> {
    await this.facade.ensureLookups();
    const roles = this.facade.lookups()['roles'] ?? [];
    let initialValue: InviteMemberDialogResult | undefined;
    let duplicateError = false;

    while (true) {
      const dialogRef = this.dialog.open(InviteMemberDialogComponent, {
        width: '560px',
        maxWidth: '95vw',
        data: {
          roles,
          initialValue,
          duplicateError,
        },
      });

      const result = await firstValueFrom(dialogRef.afterClosed());
      if (!result) {
        return;
      }

      try {
        await this.facade.inviteMember({
          email: result.email,
          roleIds: [result.roleId],
          message: result.message,
        });
        this.showSuccess(
          this.i18n.instant('administration.members.invite.success', { email: result.email })
        );
        await this.refresh();
        return;
      } catch (error) {
        if (error instanceof HttpErrorResponse && error.status === 409) {
          initialValue = result;
          duplicateError = true;
          continue;
        }

        this.showError(this.i18n.instant('administration.members.invite.error'));
        return;
      }
    }
  }
}
