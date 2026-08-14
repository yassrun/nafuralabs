/**
 * Send Email Dialog Service
 *
 * Opens the send email compose dialog for an entity.
 */

import { Injectable, inject } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { SendEmailDialogComponent } from '../organisms/send-email-dialog';
import type { SendEmailDialogData } from '../organisms/send-email-dialog';

@Injectable({
  providedIn: 'root',
})
export class SendEmailDialogService {
  private readonly dialog = inject(MatDialog);

  /**
   * Open the send email dialog for an entity.
   * @param entityType - Entity type (e.g. "invoice")
   * @param entityId - Entity ID (UUID)
   * @param options - Optional entityCode and initialTo (e.g. customer email)
   * @returns Promise that resolves to true if email was sent, undefined if dialog was closed without sending.
   */
  open(
    entityType: string,
    entityId: string,
    options?: { entityCode?: string; initialTo?: string }
  ): Promise<boolean | undefined> {
    const data: SendEmailDialogData = {
      entityType,
      entityId,
      entityCode: options?.entityCode,
      initialTo: options?.initialTo,
    };
    const config: MatDialogConfig<SendEmailDialogData> = {
      data,
      width: '600px',
      maxHeight: '90vh',
      disableClose: false,
      autoFocus: false,
      panelClass: 'nf-send-email-dialog-panel',
    };

    const dialogRef = this.dialog.open(SendEmailDialogComponent, config);
    return firstValueFrom(dialogRef.afterClosed());
  }
}
