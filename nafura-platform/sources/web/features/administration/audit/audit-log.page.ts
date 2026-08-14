import { Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
  CsvService,
} from '@lib/anatomy';
import type { ListingActionEvent } from '@lib/anatomy/types';

import { AUDIT_LISTING_CONFIG } from './config';
import { AuditDetailDialogComponent } from './components/audit-detail-dialog.component';
import type { AuditLogEntry } from './models';
import { AuditLogFacade } from './services';

@Component({
  selector: 'app-audit-log-page',
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
export class AuditLogPage extends ConfigDrivenListingPage<AuditLogEntry> {
  private readonly dialog = inject(MatDialog);
  private readonly csvService = inject(CsvService);
  private readonly translate = inject(TranslateService);

  readonly facade = inject(AuditLogFacade);
  readonly config = AUDIT_LISTING_CONFIG;
  readonly headerTitle = 'administration.audit.title';

  async onRowOpen(item: AuditLogEntry): Promise<void> {
    this.dialog.open(AuditDetailDialogComponent, {
      width: '560px',
      maxWidth: '95vw',
      data: item,
    });
  }

  protected override async handleCustomAction(
    event: ListingActionEvent<AuditLogEntry>
  ): Promise<void> {
    if (event.actionId === 'export-csv') {
      await this.exportCsv();
      return;
    }
  }

  private async exportCsv(): Promise<void> {
    try {
      const items = await this.facade.exportRows();
      const columns = [
        { field: 'eventAt', label: this.translate.instant('administration.audit.columns.date') },
        { field: 'actor', label: this.translate.instant('administration.audit.columns.actor') },
        { field: 'action', label: this.translate.instant('administration.audit.columns.action') },
        { field: 'entityType', label: this.translate.instant('administration.audit.columns.entityType') },
        { field: 'entityId', label: 'Entity ID' },
        { field: 'details', label: this.translate.instant('administration.audit.columns.details') },
      ];
      const filename = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
      this.csvService.exportToCsv(
        items as unknown as Record<string, unknown>[],
        columns,
        filename
      );
      this.showSuccess(
        this.translate.instant('administration.audit.exportSuccess', { count: items.length })
      );
    } catch {
      this.showError(this.translate.instant('administration.audit.exportError'));
    }
  }
}
