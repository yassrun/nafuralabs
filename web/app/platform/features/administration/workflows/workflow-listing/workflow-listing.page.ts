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
import type { ListingActionEvent } from '@lib/anatomy/types';

import { WORKFLOWS_LISTING_CONFIG } from '../config';
import type { WorkflowTemplate } from '../models';
import { WorkflowsFacade } from '../services';

@Component({
  selector: 'app-workflow-listing-page',
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
export class WorkflowListingPage extends ConfigDrivenListingPage<WorkflowTemplate> {
  private readonly router = inject(Router);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly i18n = inject(TranslateService);

  readonly facade = inject(WorkflowsFacade);
  readonly config = WORKFLOWS_LISTING_CONFIG;
  readonly headerTitle = 'administration.workflows.title';

  async onRowOpen(item: WorkflowTemplate): Promise<void> {
    await this.router.navigate(['/administration/workflows', item.id]);
  }

  protected override async handleCustomAction(
    event: ListingActionEvent<WorkflowTemplate>
  ): Promise<void> {
    switch (event.actionId) {
      case 'new-template':
        await this.router.navigate(['/administration/workflows/new']);
        break;
      case 'toggle-active': {
        const target = event.item ?? event.selection?.[0] ?? null;
        if (target) await this.handleToggleActive(target);
        break;
      }
      case 'delete-template': {
        const target = event.item ?? event.selection?.[0] ?? null;
        if (target) await this.handleDelete(target);
        break;
      }
    }
  }

  private async handleToggleActive(template: WorkflowTemplate): Promise<void> {
    try {
      await this.facade.setActive(template.id, !template.isActive);
      this.showSuccess(
        this.i18n.instant('administration.workflows.toggleSuccess', {
          name: template.name,
          state: this.i18n.instant(
            !template.isActive
              ? 'administration.workflows.status.active'
              : 'administration.workflows.status.inactive'
          ),
        })
      );
      await this.refresh();
    } catch {
      this.showError(this.i18n.instant('common.errors.updateFailed'));
    }
  }

  private async handleDelete(template: WorkflowTemplate): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: this.i18n.instant('administration.workflows.delete.confirmTitle'),
      message: this.i18n.instant('administration.workflows.delete.confirmMessage', {
        name: template.name,
      }),
      confirmLabel: this.i18n.instant('common.actions.delete'),
      variant: 'danger',
      icon: 'trash-2',
    });
    if (!confirmed) return;
    try {
      await this.facade.deleteItem(template.id);
      this.showSuccess(this.i18n.instant('administration.workflows.delete.success'));
      await this.refresh();
    } catch (err: unknown) {
      const httpErr = err as HttpErrorResponse | undefined;
      this.showError(
        httpErr instanceof HttpErrorResponse && httpErr.status === 409
          ? this.i18n.instant('administration.workflows.delete.inUse')
          : this.i18n.instant('common.errors.deleteFailed')
      );
    }
  }
}
