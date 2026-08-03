import { Component, Inject, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { JsonPipe } from '@angular/common';
import { CatalogApiService, JobDetail } from '../../core/catalog-api.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-job-detail-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, JsonPipe, MatSnackBarModule],
  template: `
    <h2 mat-dialog-title>Job {{ data.type }}</h2>
    <mat-dialog-content>
      <p><strong>Statut:</strong> {{ data.status }}</p>
      <p><strong>Id:</strong> {{ data.id }}</p>
      @if (data.progress) {
        <p><strong>Progress:</strong> {{ data.progress | json }}</p>
      }
      @if (data.error) {
        <p class="error"><strong>Erreur:</strong> {{ data.error | json }}</p>
      }
      @if (data.result) {
        <p><strong>Résultat:</strong> {{ data.result | json }}</p>
      }
      @if (data.steps?.length) {
        <h3>Étapes</h3>
        <ul class="steps">
          @for (step of data.steps; track step['id']) {
            <li>
              <strong>{{ step['stepType'] }}</strong>
              — {{ step['status'] }}
              @if (step['skipped']) {
                (skip: {{ step['skipReason'] }})
              }
              @if (step['errorMessage']) {
                <span class="error"> · {{ step['errorMessage'] }}</span>
              }
            </li>
          }
        </ul>
      }
      <pre>{{ data.request | json }}</pre>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button type="button" (click)="retry()">Retry job</button>
      <button mat-button mat-dialog-close type="button">Fermer</button>
    </mat-dialog-actions>
  `,
  styles: `
    pre {
      background: #f4f6f8;
      padding: 0.75rem;
      border-radius: 6px;
      overflow: auto;
      max-height: 240px;
      font-size: 0.75rem;
    }
    .error {
      color: #b00020;
    }
    .steps {
      padding-left: 1.1rem;
      font-size: 0.85rem;
      max-height: 180px;
      overflow: auto;
    }
  `,
})
export class JobDetailDialog {
  private readonly api = inject(CatalogApiService);
  private readonly snack = inject(MatSnackBar);
  private readonly dialogRef = inject(MatDialogRef<JobDetailDialog>);

  constructor(@Inject(MAT_DIALOG_DATA) public readonly data: JobDetail) {}

  retry(): void {
    this.api.retryJob(this.data.id).subscribe({
      next: (res) => {
        this.snack.open(`Retry lancé (${res.status})`, 'OK', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.snack.open(err?.error?.message ?? err?.message ?? 'Retry échoué', 'OK', {
          duration: 4000,
        });
      },
    });
  }
}
