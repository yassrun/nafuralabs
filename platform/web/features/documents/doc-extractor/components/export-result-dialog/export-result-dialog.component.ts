import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { TranslateModule } from '@ngx-translate/core';

export interface ExportResultData {
  success: boolean;
  message: string;
  createdItems: number;
  createdSuppliers: number;
  createdTransactions: number;
  transactionLines?: number;
  errors?: string[];
}

@Component({
  selector: 'app-export-result-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatDividerModule,
    TranslateModule,
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon [color]="data.success ? 'primary' : 'warn'">
        {{ data.success ? 'check_circle' : 'error' }}
      </mat-icon>
      <span>{{ (data.success ? 'docExtractor.exportResult.titleSuccess' : 'docExtractor.exportResult.titleErrors') | translate }}</span>
    </h2>

    <mat-dialog-content>
      <div class="export-summary">
        <mat-list>
          <mat-list-item>
            <mat-icon matListItemIcon>person</mat-icon>
            <div matListItemTitle>{{ 'docExtractor.exportResult.suppliersCreated' | translate:{ count: data.createdSuppliers } }}</div>
          </mat-list-item>
          
          <mat-list-item>
            <mat-icon matListItemIcon>inventory_2</mat-icon>
            <div matListItemTitle>{{ 'docExtractor.exportResult.itemsCreated' | translate:{ count: data.createdItems } }}</div>
          </mat-list-item>
          
          <mat-list-item>
            <mat-icon matListItemIcon>receipt</mat-icon>
            <div matListItemTitle>
              {{ 'docExtractor.exportResult.transactionsCreated' | translate:{ count: data.createdTransactions } }}
              <span *ngIf="data.transactionLines && data.transactionLines > 0" class="lines-info">
                {{ 'docExtractor.exportResult.linesInfo' | translate:{ count: data.transactionLines } }}
              </span>
            </div>
          </mat-list-item>
        </mat-list>
      </div>

      <mat-divider *ngIf="data.errors && data.errors.length > 0" style="margin: 16px 0;"></mat-divider>

      <div *ngIf="data.errors && data.errors.length > 0" class="errors-section">
        <h3>{{ 'docExtractor.exportResult.errorsTitle' | translate }}</h3>
        <mat-list>
          <mat-list-item *ngFor="let error of data.errors">
            <mat-icon matListItemIcon color="warn">error</mat-icon>
            <div matListItemTitle>{{ error }}</div>
          </mat-list-item>
        </mat-list>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onClose()">{{ 'docExtractor.exportResult.close' | translate }}</button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2[mat-dialog-title] {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
    }

    mat-dialog-content {
      min-width: 400px;
      max-width: 600px;
    }

    .export-summary {
      margin-bottom: 16px;
    }

    .lines-info {
      color: rgba(0, 0, 0, 0.6);
      font-size: 0.9em;
      margin-left: 8px;
    }

    .errors-section {
      margin-top: 16px;
    }

    .errors-section h3 {
      margin: 16px 0 8px 0;
      color: #f44336;
      font-size: 1.1em;
      font-weight: 500;
    }

    mat-list-item {
      height: auto;
      padding: 8px 0;
    }
  `]
})
export class ExportResultDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ExportResultDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ExportResultData
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }
}
