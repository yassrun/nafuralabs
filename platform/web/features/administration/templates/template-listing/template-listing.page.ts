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

import { TEMPLATES_LISTING_CONFIG } from '../config';
import type { PrintTemplate } from '../models';
import { TemplatesFacade } from '../services';
import { CreateTemplateDialogComponent } from '../components/create-template-dialog.component';

@Component({
  selector: 'app-template-listing-page',
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
export class TemplateListingPage extends ConfigDrivenListingPage<PrintTemplate> {
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly i18n = inject(TranslateService);

  readonly facade = inject(TemplatesFacade);
  readonly config = TEMPLATES_LISTING_CONFIG;
  readonly headerTitle = 'administration.templates.title';

  async onRowOpen(item: PrintTemplate): Promise<void> {
    await this.router.navigate(['/administration/templates', item.id]);
  }

  protected override async handleCustomAction(
    event: ListingActionEvent<PrintTemplate>
  ): Promise<void> {
    switch (event.actionId) {
      case 'new-template':
        await this.openCreateDialog();
        break;
      case 'clone-template': {
        const target = event.item ?? event.selection?.[0] ?? null;
        if (target) await this.openCloneDialog(target);
        break;
      }
      case 'delete-template': {
        const target = event.item ?? event.selection?.[0] ?? null;
        if (target) await this.handleDelete(target);
        break;
      }
    }
  }

  private async openCreateDialog(): Promise<void> {
    const dialogRef = this.dialog.open(CreateTemplateDialogComponent, {
      width: '520px',
      maxWidth: '95vw',
    });
    const result = await firstValueFrom(dialogRef.afterClosed()) as PrintTemplate | undefined;
    if (result) {
      this.showSuccess(
        this.i18n.instant('administration.templates.createSuccess', { name: result.name })
      );
      await this.refresh();
      await this.router.navigate(['/administration/templates', result.id]);
    }
  }

  private async openCloneDialog(source: PrintTemplate): Promise<void> {
    const dialogRef = this.dialog.open(CreateTemplateDialogComponent, {
      width: '520px',
      maxWidth: '95vw',
      data: { cloneFrom: source },
    });
    const result = await firstValueFrom(dialogRef.afterClosed()) as PrintTemplate | undefined;
    if (result) {
      this.showSuccess(
        this.i18n.instant('administration.templates.cloneSuccess', { name: result.name })
      );
      await this.refresh();
      await this.router.navigate(['/administration/templates', result.id]);
    }
  }

  private async handleDelete(template: PrintTemplate): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: this.i18n.instant('administration.templates.delete.confirmTitle'),
      message: this.i18n.instant('administration.templates.delete.confirmMessage', {
        name: template.name,
      }),
      confirmLabel: this.i18n.instant('common.actions.delete'),
      variant: 'danger',
      icon: 'trash-2',
    });
    if (!confirmed) return;
    try {
      await this.facade.deleteItem(template.id);
      this.showSuccess(this.i18n.instant('administration.templates.delete.success'));
      await this.refresh();
    } catch (err: unknown) {
      const httpErr = err as HttpErrorResponse | undefined;
      this.showError(
        httpErr instanceof HttpErrorResponse && httpErr.status === 409
          ? this.i18n.instant('administration.templates.delete.inUse')
          : this.i18n.instant('common.errors.deleteFailed')
      );
    }
  }
}
