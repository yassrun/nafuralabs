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

import { EMAIL_TEMPLATES_LISTING_CONFIG } from '../config';
import type { EmailTemplate, EmailTemplateCreate } from '../models';
import { EmailTemplatesFacade } from '../services';
import { CreateEmailTemplateDialogComponent } from '../components/create-email-template-dialog.component';

@Component({
  selector: 'app-email-template-listing-page',
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
export class EmailTemplateListingPage extends ConfigDrivenListingPage<EmailTemplate> {
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly i18n = inject(TranslateService);

  readonly facade = inject(EmailTemplatesFacade);
  readonly config = EMAIL_TEMPLATES_LISTING_CONFIG;
  readonly headerTitle = 'administration.emailTemplates.title';

  async onRowOpen(item: EmailTemplate): Promise<void> {
    await this.router.navigate(['/administration/email-templates', item.id]);
  }

  protected override async handleCustomAction(
    event: ListingActionEvent<EmailTemplate>
  ): Promise<void> {
    switch (event.actionId) {
      case 'new-email-template':
        await this.openCreateDialog();
        break;
      case 'delete-email-template': {
        const target = event.item ?? event.selection?.[0] ?? null;
        if (target) await this.handleDelete(target);
        break;
      }
    }
  }

  private async openCreateDialog(): Promise<void> {
    const dialogRef = this.dialog.open(CreateEmailTemplateDialogComponent, {
      width: '480px',
      maxWidth: '95vw',
    });
    const result = await firstValueFrom(dialogRef.afterClosed()) as EmailTemplateCreate | undefined;
    if (result) {
      try {
        const created = await this.facade.create(result);
        this.showSuccess(
          this.i18n.instant('administration.emailTemplates.createSuccess', { name: created.name })
        );
        await this.refresh();
        await this.router.navigate(['/administration/email-templates', created.id]);
      } catch (err) {
        this.showError(this.i18n.instant('common.errors.saveFailed'));
      }
    }
  }

  private async handleDelete(template: EmailTemplate): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: this.i18n.instant('administration.emailTemplates.delete.confirmTitle'),
      message: this.i18n.instant('administration.emailTemplates.delete.confirmMessage', {
        name: template.name,
      }),
      confirmLabel: this.i18n.instant('common.actions.delete'),
      variant: 'danger',
      icon: 'trash-2',
    });
    if (!confirmed) return;
    try {
      await this.facade.deleteItem(template.id);
      this.showSuccess(this.i18n.instant('administration.emailTemplates.delete.success'));
      await this.refresh();
    } catch (err: unknown) {
      const httpErr = err as HttpErrorResponse | undefined;
      this.showError(
        httpErr?.status === 400
          ? (httpErr as HttpErrorResponse).error?.message ?? this.i18n.instant('common.errors.deleteFailed')
          : this.i18n.instant('common.errors.deleteFailed')
      );
    }
  }
}
