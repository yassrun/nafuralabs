import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

import { getEntityDetailRoute } from '../../../approvals/config/entity-type-routes.config';
import {
  auditChanges,
  auditFieldLabel,
  auditSnapshot,
  effectiveAuditAction,
  formatAuditValue,
} from '../audit-entry.util';
import type { AuditEventDto } from '../services/audit-api.service';

/** Detail dialog for one audit event (fiche timeline + journal admin). */
@Component({
  selector: 'nf-audit-entry-detail-dialog',
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
          <dd>{{ actionLabel() }}</dd>
          <dt>{{ 'administration.audit.columns.entityType' | translate }}</dt>
          <dd>{{ entry.entityType }}</dd>
          @if (entry.details) {
            <dt>{{ 'administration.audit.columns.details' | translate }}</dt>
            <dd>{{ entry.details }}</dd>
          }
        </dl>

        @if (changes().length) {
          <section class="audit-detail__section">
            <h3>{{ 'administration.audit.detail.changes' | translate }}</h3>
            <table class="audit-detail__diff">
              <thead>
                <tr>
                  <th>{{ 'administration.audit.detail.field' | translate }}</th>
                  <th>{{ 'administration.audit.detail.from' | translate }}</th>
                  <th>{{ 'administration.audit.detail.to' | translate }}</th>
                </tr>
              </thead>
              <tbody>
                @for (row of changes(); track row.field) {
                  <tr>
                    <td>{{ fieldLabel(row.field) }}</td>
                    <td>{{ formatValue(row.from) }}</td>
                    <td>{{ formatValue(row.to) }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </section>
        } @else if (snapshotEntries().length) {
          <section class="audit-detail__section">
            <h3>{{ 'administration.audit.detail.snapshot' | translate }}</h3>
            <dl class="audit-detail__fields">
              @for (row of snapshotEntries(); track row.field) {
                <dt>{{ fieldLabel(row.field) }}</dt>
                <dd>{{ formatValue(row.value) }}</dd>
              }
            </dl>
          </section>
        } @else if (entry.payload && hasPayloadContent(entry.payload)) {
          <section class="audit-detail__section">
            <h3>{{ 'administration.audit.detail.payload' | translate }}</h3>
            <pre class="audit-detail__payload-json">{{ payloadJson }}</pre>
          </section>
        }
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        @if (entityRoute()) {
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
    .audit-detail__section { margin-top: 1rem; }
    .audit-detail__section h3 { margin: 0 0 0.5rem; font-size: 0.875rem; }
    .audit-detail__diff { width: 100%; border-collapse: collapse; font-size: 0.8125rem; }
    .audit-detail__diff th, .audit-detail__diff td {
      text-align: left; padding: 0.4rem 0.5rem; border-bottom: 1px solid var(--nf-border-default, #e5e7eb); vertical-align: top;
    }
    .audit-detail__diff th { color: var(--nf-text-secondary, #64748b); font-weight: 600; }
    .audit-detail__payload-json {
      margin: 0; padding: 0.75rem; background: var(--nf-bg-subtle, #f1f5f9); border-radius: 6px;
      font-size: 0.8rem; overflow: auto; max-height: 200px;
    }
  `],
})
export class AuditEntryDetailDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<AuditEntryDetailDialogComponent>);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  readonly entry: AuditEventDto = inject<AuditEventDto>(MAT_DIALOG_DATA);

  readonly changes = computed(() => auditChanges(this.entry.payload));

  readonly snapshotEntries = computed(() => {
    const snap = auditSnapshot(this.entry.payload);
    if (!snap) return [] as Array<{ field: string; value: unknown }>;
    return Object.entries(snap).map(([field, value]) => ({ field, value }));
  });

  readonly actionLabel = computed(() => {
    const action = effectiveAuditAction(this.entry.action, this.entry.payload);
    const key = `audit.action.${action}`;
    const verb = this.translate.instant(key);
    return verb !== key ? verb : action;
  });

  get payloadJson(): string {
    if (!this.entry?.payload) return '';
    try {
      return JSON.stringify(this.entry.payload, null, 2);
    } catch {
      return String(this.entry.payload);
    }
  }

  entityRoute = (): string | null => {
    const e = this.entry;
    if (!e?.entityType || !e?.entityId) return null;
    const parts = getEntityDetailRoute(e.entityType, e.entityId);
    if (!parts.length) return null;
    return parts.length === 1 ? parts[0] : parts.join('/');
  };

  hasPayloadContent(payload: Record<string, unknown>): boolean {
    return Object.keys(payload ?? {}).length > 0;
  }

  fieldLabel(field: string): string {
    return auditFieldLabel(this.translate, field);
  }

  formatValue(value: unknown): string {
    return formatAuditValue(value);
  }

  viewEntity(): void {
    const route = this.entityRoute();
    if (route) {
      this.dialogRef.close();
      void this.router.navigateByUrl(route);
    }
  }
}
