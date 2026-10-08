import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

import { PageHeaderComponent, PageShellComponent } from '@lib/anatomy';
import { getEntityDetailRoute } from '../../approvals/config/entity-type-routes.config';
import {
  auditChanges,
  auditFieldLabel,
  auditSnapshot,
  effectiveAuditAction,
  formatAuditValue,
} from '../../collaboration/audit/audit-entry.util';
import type { AuditEventDto } from '../../collaboration/audit/services/audit-api.service';

const ENDPOINT = '/api/v1/platform/collaboration/audit/log';

/** Fiche d’un événement du journal d’audit. */
@Component({
  selector: 'app-audit-detail-page',
  standalone: true,
  imports: [CommonModule, TranslateModule, PageShellComponent, PageHeaderComponent, RouterLink, DatePipe],
  template: `
    <nf-page-shell>
      <nf-page-header
        [config]="{
          title: 'administration.audit.detail.title',
          breadcrumbs: [
            { label: 'administration.audit.title', route: '/administration/audit' },
            { label: 'administration.audit.detail.title' },
          ],
        }" />
      @if (entry()) {
        <dl class="fields">
          <dt>{{ 'administration.audit.columns.date' | translate }}</dt>
          <dd>{{ entry()!.eventAt | date: 'medium' }}</dd>
          <dt>{{ 'administration.audit.columns.actor' | translate }}</dt>
          <dd>{{ entry()!.actor }}</dd>
          <dt>{{ 'administration.audit.columns.action' | translate }}</dt>
          <dd>{{ actionLabel() }}</dd>
          <dt>{{ 'administration.audit.columns.entityType' | translate }}</dt>
          <dd>{{ entry()!.entityType }}</dd>
          @if (entry()!.details) {
            <dt>{{ 'administration.audit.columns.details' | translate }}</dt>
            <dd>{{ entry()!.details }}</dd>
          }
        </dl>
        @if (changes().length) {
          <section>
            <h3>{{ 'administration.audit.detail.changes' | translate }}</h3>
            <table>
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
          <section>
            <h3>{{ 'administration.audit.detail.snapshot' | translate }}</h3>
            <dl class="fields">
              @for (row of snapshotEntries(); track row.field) {
                <dt>{{ fieldLabel(row.field) }}</dt>
                <dd>{{ formatValue(row.value) }}</dd>
              }
            </dl>
          </section>
        }
        @if (entityRoute().length) {
          <a [routerLink]="entityRoute()" class="entity-link">
            {{ 'administration.audit.detail.viewEntity' | translate: { entityType: entry()!.entityType } }}
          </a>
        }
      } @else if (error()) {
        <p>{{ error() }}</p>
      } @else {
        <p>{{ 'common.empty.loading' | translate }}</p>
      }
    </nf-page-shell>
  `,
  styles: `
    .fields { display: grid; grid-template-columns: auto 1fr; gap: 0.5rem 1.5rem; margin: 0 0 1rem; }
    .fields dt { font-weight: 600; color: var(--nf-text-secondary, #64748b); }
    table { width: 100%; border-collapse: collapse; font-size: 0.8125rem; }
    th, td { text-align: left; padding: 0.4rem 0.5rem; border-bottom: 1px solid var(--nf-border-default, #e5e7eb); }
    .entity-link { display: inline-block; margin-top: 1rem; }
  `,
})
export class AuditDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly translate = inject(TranslateService);

  readonly entry = signal<AuditEventDto | null>(null);
  readonly error = signal<string | null>(null);

  readonly actionLabel = computed(() => {
    const e = this.entry();
    if (!e) return '';
    const action = effectiveAuditAction(e.action, e.payload);
    const key = `administration.audit.actions.${action}`;
    const label = this.translate.instant(key);
    return label === key ? action : label;
  });

  readonly changes = computed(() => {
    const e = this.entry();
    return e ? auditChanges(e.payload) : [];
  });

  readonly snapshotEntries = computed(() => {
    const e = this.entry();
    if (!e) return [] as { field: string; value: unknown }[];
    const snap = auditSnapshot(e.payload);
    if (!snap) return [];
    return Object.entries(snap).map(([field, value]) => ({ field, value }));
  });

  readonly entityRoute = computed(() => {
    const e = this.entry();
    if (!e?.entityType || !e.entityId) return [] as string[];
    return getEntityDetailRoute(e.entityType, e.entityId);
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      void this.router.navigateByUrl('/administration/audit');
      return;
    }
    void firstValueFrom(this.http.get<AuditEventDto>(`${ENDPOINT}/${id}`))
      .then((row) => this.entry.set(row))
      .catch(() => this.error.set(this.translate.instant('Unable to load data')));
  }

  fieldLabel(field: string): string {
    return auditFieldLabel(this.translate, field);
  }

  formatValue(value: unknown): string {
    return formatAuditValue(value);
  }
}
