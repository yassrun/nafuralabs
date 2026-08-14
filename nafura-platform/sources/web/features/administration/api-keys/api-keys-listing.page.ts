import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ConfirmDialogService } from '@lib/anatomy/components';
import { API_KEYS_LISTING_COLUMNS } from './api-keys-listing.config';
import type { ApiKeyItem, CreateApiKeyPayload } from './api-keys-api.service';
import { ApiKeysFacade } from './api-keys.facade';
import { ApiKeyCreateDialogComponent } from './api-key-create-dialog.component';
import { ApiKeyCreatedDialogComponent } from './api-key-created-dialog.component';

@Component({
  selector: 'app-api-keys-listing-page',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    ApiKeyCreateDialogComponent,
    ApiKeyCreatedDialogComponent,
  ],
  template: `
    <section class="api-keys-page">
      <header class="api-keys-page__header">
        <div>
          <h1>{{ 'administration.apiKeys.title' | translate }}</h1>
          <p>{{ 'administration.apiKeys.subtitle' | translate }}</p>
        </div>
        <button type="button" (click)="openCreate()">
          {{ 'administration.apiKeys.actions.create' | translate }}
        </button>
      </header>

      <app-api-key-create-dialog
        *ngIf="createOpen()"
        [saving]="saving()"
        (saved)="create($event)"
        (cancelled)="createOpen.set(false)">
      </app-api-key-create-dialog>

      <app-api-key-created-dialog
        *ngIf="createdKey()"
        [plainKey]="createdKey()!"
        (done)="onCreatedDone()">
      </app-api-key-created-dialog>

      <p *ngIf="facade.loading()">{{ 'administration.apiKeys.loading' | translate }}</p>
      <p *ngIf="facade.error()" class="api-keys-page__error">{{ facade.error() }}</p>

      <table *ngIf="!facade.loading() && facade.hasItems()" class="api-keys-page__table">
        <thead>
          <tr>
            <th *ngFor="let column of columns">{{ column.labelKey | translate }}</th>
            <th>{{ 'administration.apiKeys.columns.actions' | translate }}</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of facade.items()">
            <td>{{ item.name }}</td>
            <td><code class="api-keys-page__key">{{ mask(item) }}</code></td>
            <td><span class="api-keys-page__badge api-keys-page__badge--count">{{ item.permissions.length }}</span></td>
            <td>{{ item.createdBy ?? '-' }}</td>
            <td>{{ item.expiresAt ? (item.expiresAt | date : 'short') : ('administration.apiKeys.form.expiryNever' | translate) }}</td>
            <td>{{ relativeLastUsed(item.lastUsedAt) }}</td>
            <td>
              <span class="api-keys-page__badge" [class.api-keys-page__badge--active]="statusKind(item) === 'active'" [class.api-keys-page__badge--revoked]="statusKind(item) === 'revoked'" [class.api-keys-page__badge--expired]="statusKind(item) === 'expired'">
                {{ statusLabel(item) | translate }}
              </span>
            </td>
            <td>
              <button type="button" [disabled]="!item.active" (click)="revoke(item)">
                {{ 'administration.apiKeys.actions.revoke' | translate }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <p *ngIf="!facade.loading() && !facade.hasItems()">
        {{ 'administration.apiKeys.empty' | translate }}
      </p>
    </section>
  `,
  styles: [
    `
      .api-keys-page {
        padding: 1rem;
        display: grid;
        gap: 1rem;
      }
      .api-keys-page__header {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
      }
      .api-keys-page__header h1 {
        margin: 0;
      }
      .api-keys-page__header p {
        margin: 0.25rem 0 0;
        color: var(--nf-text-muted, #6b7280);
      }
      .api-keys-page__table {
        width: 100%;
        border-collapse: collapse;
      }
      .api-keys-page__table th,
      .api-keys-page__table td {
        border-bottom: 1px solid var(--nf-border-default, #e5e7eb);
        padding: 0.5rem;
        text-align: left;
      }
      .api-keys-page__error {
        color: var(--nf-color-danger-600, #b91c1c);
      }
      code, .api-keys-page__key {
        font-family: var(--nf-font-family-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
      }
      .api-keys-page__badge {
        display: inline-block;
        padding: 0.2rem 0.5rem;
        border-radius: 4px;
        font-size: 0.85rem;
        background: var(--nf-surface-elevated, #f3f4f6);
      }
      .api-keys-page__badge--count {
        min-width: 1.5rem;
        text-align: center;
      }
      .api-keys-page__badge--active {
        background: var(--nf-color-success-100, #d1fae5);
        color: var(--nf-color-success-800, #065f46);
      }
      .api-keys-page__badge--revoked {
        background: var(--nf-color-danger-100, #fee2e2);
        color: var(--nf-color-danger-800, #991b1b);
      }
      .api-keys-page__badge--expired {
        background: var(--nf-color-warning-100, #fef3c7);
        color: var(--nf-color-warning-800, #92400e);
      }
    `,
  ],
})
export class ApiKeysListingPage implements OnInit {
  readonly facade = inject(ApiKeysFacade);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly translate = inject(TranslateService);
  readonly columns = API_KEYS_LISTING_COLUMNS;

  readonly createOpen = signal(false);
  readonly saving = signal(false);
  readonly createdKey = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    await this.facade.load();
  }

  openCreate(): void {
    this.createOpen.set(true);
  }

  onCreatedDone(): void {
    this.createdKey.set(null);
    void this.facade.load();
  }

  async create(payload: CreateApiKeyPayload): Promise<void> {
    this.saving.set(true);
    try {
      const created = await this.facade.create(payload);
      this.createOpen.set(false);
      this.createdKey.set(created.plainKey);
    } finally {
      this.saving.set(false);
    }
  }

  async revoke(item: ApiKeyItem): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: this.translate.instant('administration.apiKeys.actions.revoke'),
      message: this.translate.instant('administration.apiKeys.actions.revokeConfirm'),
      confirmLabel: this.translate.instant('administration.apiKeys.actions.revoke'),
      variant: 'danger',
    });
    if (!confirmed) return;
    await this.facade.revoke(item.id);
  }

  mask(item: ApiKeyItem): string {
    const prefix = item.keyPrefix || 'nfk_';
    return `${prefix}****`;
  }

  statusKind(item: ApiKeyItem): 'active' | 'revoked' | 'expired' {
    if (!item.active) return 'revoked';
    if (item.expiresAt && new Date(item.expiresAt) < new Date()) return 'expired';
    return 'active';
  }

  statusLabel(item: ApiKeyItem): string {
    const kind = this.statusKind(item);
    return `administration.apiKeys.status.${kind}`;
  }

  relativeLastUsed(dateStr: string | null): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const now = new Date();
    const sec = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (sec < 60) return this.translate.instant('approvals.time.agoSeconds', { count: sec });
    const min = Math.floor(sec / 60);
    if (min < 60) return this.translate.instant('approvals.time.agoMinutes', { count: min });
    const h = Math.floor(min / 60);
    if (h < 24) return this.translate.instant('approvals.time.agoHours', { count: h });
    const d = Math.floor(h / 24);
    return this.translate.instant('approvals.time.agoDays', { count: d });
  }
}
