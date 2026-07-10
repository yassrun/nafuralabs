/**
 * Import / Export Dialog Service
 *
 * Opens the standard Import/Export modal with config + handlers.
 * Listing pages provide entity config and callbacks; modal handles UX.
 */

import { Injectable, inject } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { ImportExportModalComponent } from '../organisms/import-export-modal';
import type { ImportExportDialogData } from '../organisms/import-export-modal';

@Injectable({
  providedIn: 'root',
})
export class ImportExportDialogService {
  private readonly dialog = inject(MatDialog);

  /**
   * Open the Import/Export modal.
   * @param data Config + handlers (downloadTemplate, importRows, exportView, exportSelection?, hasSelection?)
   * @returns Promise that resolves to true when modal is closed (e.g. after import/export), false if cancelled.
   */
  async open(data: ImportExportDialogData): Promise<boolean> {
    const config: MatDialogConfig<ImportExportDialogData> = {
      data,
      width: '560px',
      maxWidth: '95vw',
      disableClose: false,
      autoFocus: false,
      panelClass: 'nf-import-export-dialog-panel',
    };

    const dialogRef = this.dialog.open(ImportExportModalComponent, config);
    const result = await firstValueFrom(dialogRef.afterClosed());
    return result === true;
  }
}
