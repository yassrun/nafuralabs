import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

import type { AuditLogEntry } from '../models';

@Component({
  selector: 'app-audit-detail-dialog',
  standalone: true,
  imports: [CommonModule, TranslateModule, MatDialogModule, MatButtonModule],
  template: `
    <div class="audit-detail">
      <h2 mat-dialog-title>{{ 'administration.audit.detail.title' | translate }}</h2>
      <mat-dialog-content>
        <dl class="audit-detail__fields">
          <dt>{{ 'administration.audit.columns.date' | translate }}</dt>
          <dd>{{ entry.eventAt | date:'medium' }}</dd>
          <dt>{{ 'administration.audit.columns.actor' | translate }}</dt>
          <dd>{{ entry.actor }}</dd>
          <dt>{{ 'administration.audit.columns.action' | translate }}</dt>
          <dd>{{ entry.action }}</dd>
          <dt>{{ 'administration.audit.columns.entityType' | translate }}</dt>
          <dd>{{ entry.entityType }}</dd>
          <dt>Entity ID</dt>
          <dd>{{ entry.entityId }}</dd>
          @if (entry.details) {
            <dt>{{ 'administration.audit.columns.details' | translate }}</dt>
            <dd>{{ entry.details }}</dd>
          }
        </dl>
        @if (entry.payload && hasPayloadContent(entry.payload)) {
          <section class="audit-detail__payload">
            <h3>{{ 'administration.audit.detail.payload' | translate }}</h3>
            <pre class="audit-detail__payload-json">{{ payloadJson }}</pre>
          </section>
        }
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        @if (entityRoute().length) {
          <button mat-flat-button color="primary" (click)="viewEntity()">
            {{ 'administration.audit.detail.viewEntity' | translate:{ entityType: entry.entityType } }}
          </button>
        }
        <button mat-button mat-dialog-close>{{ 'Cancel' | translate }}</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .audit-detail__fields { display: grid; grid-template-columns: auto 1fr; gap: 0.5rem 1.5rem; margin: 0 0 1rem; }
    .audit-detail__fields dt { font-weight: 600; color: var(--nf-text-secondary, #64748b); }
    .audit-detail__payload { margin-top: 1rem; }
    .audit-detail__payload h3 { margin: 0 0 0.5rem; font-size: 0.875rem; }
    .audit-detail__payload-json { margin: 0; padding: 0.75rem; background: var(--nf-bg-subtle, #f1f5f9); border-radius: 6px; font-size: 0.8rem; overflow: auto; max-height: 200px; }
  `],
})
export class AuditDetailDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<AuditDetailDialogComponent>);
  private readonly router = inject(Router);
  readonly entry: AuditLogEntry = inject<AuditLogEntry>(MAT_DIALOG_DATA);

  get payloadJson(): string {
    if (!this.entry?.payload) return '';
    try {
      return JSON.stringify(this.entry.payload, null, 2);
    } catch {
      return String(this.entry.payload);
    }
  }

  entityRoute = (): string[] => {
    const e = this.entry;
    if (!e?.entityType || !e?.entityId) return [];
    return ['/', e.entityType, e.entityId];
  };

  hasPayloadContent(payload: Record<string, unknown>): boolean {
    return Object.keys(payload ?? {}).length > 0;
  }

  viewEntity(): void {
    const route = this.entityRoute();
    if (route.length) {
      this.dialogRef.close();
      this.router.navigate(route);
    }
  }
}
