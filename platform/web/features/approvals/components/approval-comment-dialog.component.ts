import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';

export interface ApprovalCommentDialogData {
  action: 'approve' | 'reject';
  title?: string;
}

@Component({
  selector: 'app-approval-comment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    TranslateModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ (data.action === 'reject' ? 'approvals.reject' : 'approvals.approve') | translate }}</h2>
    <mat-dialog-content>
      <p class="nf-approval-dialog__hint" *ngIf="data.action === 'reject'">
        {{ 'approvals.commentRequired' | translate }}
      </p>
      <mat-form-field appearance="outline" class="nf-approval-dialog__field">
        <mat-label>{{ 'approvals.comment' | translate }}</mat-label>
        <textarea
          matInput
          [(ngModel)]="comment"
          rows="3"
          [placeholder]="data.action === 'reject' ? ('approvals.commentPlaceholderReject' | translate) : ('approvals.commentPlaceholderApprove' | translate)"
          #commentInput>
        </textarea>
      </mat-form-field>
      <p class="nf-approval-dialog__error" *ngIf="showError">{{ 'approvals.commentRequired' | translate }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ 'Cancel' | translate }}</button>
      <button
        mat-flat-button
        [color]="data.action === 'approve' ? 'primary' : 'warn'"
        [disabled]="data.action === 'reject' && !comment.trim()"
        (click)="submit()">
        {{ (data.action === 'reject' ? 'approvals.reject' : 'approvals.approve') | translate }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .nf-approval-dialog__hint { margin-bottom: 12px; color: var(--nf-text-muted, #6b7280); font-size: 0.875rem; }
    .nf-approval-dialog__field { width: 100%; }
    .nf-approval-dialog__error { color: var(--nf-color-error, #dc2626); font-size: 0.875rem; margin-top: -8px; }
  `],
})
export class ApprovalCommentDialogComponent {
  readonly data: ApprovalCommentDialogData = inject(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ApprovalCommentDialogComponent>);

  comment = '';
  showError = false;

  submit(): void {
    if (this.data.action === 'reject' && !this.comment.trim()) {
      this.showError = true;
      return;
    }
    this.showError = false;
    this.dialogRef.close(this.comment.trim() || undefined);
  }
}
