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

import { ADMINISTRATION_CONFIG } from '../../../administration.token';
import { createRolesListingConfig } from '../config';
import type { Role, RoleListItem } from '../models';
import { RolesFacade } from '../services';
import { CreateRoleDialogComponent } from '../components/create-role-dialog.component';

@Component({
  selector: 'app-role-listing-page',
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
export class RoleListingPage extends ConfigDrivenListingPage<RoleListItem> {
  private readonly moduleConfig = inject(ADMINISTRATION_CONFIG);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly i18n = inject(TranslateService);

  readonly facade = inject(RolesFacade);
  readonly config = createRolesListingConfig(
    this.moduleConfig.sections?.roles?.customRoles === true
  );
  readonly headerTitle = 'administration.roles.title';

  async onRowOpen(item: RoleListItem): Promise<void> {
    await this.router.navigate(['/administration/roles', item.roleCode]);
  }

  protected override async handleCustomAction(
    event: ListingActionEvent<RoleListItem>
  ): Promise<void> {
    switch (event.actionId) {
      case 'create-role':
        await this.openCreateDialog();
        break;
      case 'delete-role': {
        const target = event.item ?? event.selection?.[0] ?? null;
        if (target) {
          await this.handleDeleteRole(target);
        }
        break;
      }
      default:
        console.log('Unhandled listing action:', event.actionId, event);
    }
  }

  private async openCreateDialog(): Promise<void> {
    const dialogRef = this.dialog.open(CreateRoleDialogComponent, {
      width: '480px',
      maxWidth: '95vw',
    });

    const result = await firstValueFrom(dialogRef.afterClosed()) as Role | undefined;
    if (result) {
      this.showSuccess(
        this.i18n.instant('administration.roles.create.success', { name: result.name })
      );
      await this.refresh();
      await this.router.navigate(['/administration/roles', result.roleCode]);
    }
  }

  private async handleDeleteRole(role: RoleListItem): Promise<void> {
    const count = role.memberCount ?? 0;
    const message =
      count > 0
        ? this.i18n.instant('administration.roles.delete.confirm.message', { count })
        : this.i18n.instant('administration.roles.delete.confirm.messageEmpty', {
            name: role.name,
          });

    const confirmed = await this.confirmDialog.confirm({
      title: this.i18n.instant('administration.roles.delete.confirm.title'),
      message,
      confirmLabel: this.i18n.instant('common.actions.delete'),
      variant: 'danger',
      icon: 'trash-2',
    });

    if (!confirmed) return;

    try {
      await this.facade.deleteItem(role.id);
      await this.refresh();
    } catch (err: unknown) {
      const httpErr = err as HttpErrorResponse | undefined;
      if (httpErr instanceof HttpErrorResponse && httpErr.status === 409) {
        this.showError(this.i18n.instant('administration.roles.delete.hasMembers'));
      } else {
        this.showError(this.i18n.instant('common.errors.deleteFailed'));
      }
    }
  }
}
