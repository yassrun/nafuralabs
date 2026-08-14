/**
 * Print Dialog Service
 *
 * Opens the print dialog for an entity (template selection, preview, download).
 */

import { Injectable, inject } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { PrintDialogComponent } from '../organisms/print-dialog';
import type { PrintDialogData } from '../organisms/print-dialog';

@Injectable({
  providedIn: 'root',
})
export class PrintDialogService {
  private readonly dialog = inject(MatDialog);

  /**
   * Open the print dialog for an entity.
   * @param entityType - Entity type (e.g. "invoice", "product")
   * @param entityId - Entity ID (UUID)
   * @param entityCode - Optional display code for download filename (e.g. "INV-001")
   * @returns Promise that resolves when the dialog is closed.
   */
  open(
    entityType: string,
    entityId: string,
    entityCode?: string
  ): Promise<void> {
    const data: PrintDialogData = {
      entityType,
      entityId,
      entityCode,
    };
    const config: MatDialogConfig<PrintDialogData> = {
      data,
      width: '800px',
      maxHeight: '90vh',
      disableClose: false,
      autoFocus: false,
      panelClass: 'nf-print-dialog-panel',
    };

    const dialogRef = this.dialog.open(PrintDialogComponent, config);
    return firstValueFrom(dialogRef.afterClosed()).then(() => undefined);
  }
}
