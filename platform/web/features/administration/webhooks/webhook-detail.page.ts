import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ToastService } from '@lib/anatomy';
import type { WebhookConfigItem } from './webhooks-api.service';
import { WebhooksFacade } from './webhooks.facade';

@Component({
  selector: 'app-webhook-detail-page',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <section class="webhook-detail">
      <button type="button" (click)="back()">{{ 'administration.webhooks.detail.back' | translate }}</button>

      <header *ngIf="webhook() as item" class="webhook-detail__header">
        <div class="webhook-detail__header-content">
          <h1>{{ item.name }}</h1>
          <p>{{ item.url }}</p>
        </div>
        <button type="button" class="webhook-detail__test" (click)="runTest()" [disabled]="testing()">
          {{ 'administration.webhooks.actions.test' | translate }}
        </button>
      </header>

      <p *ngIf="loading()">{{ 'administration.webhooks.detail.loading' | translate }}</p>

      <table *ngIf="!loading() && facade.deliveries().length > 0" class="webhook-detail__table">
        <thead>
          <tr>
            <th style="width: 2rem"></th>
            <th>{{ 'administration.webhooks.detail.columns.event' | translate }}</th>
            <th>{{ 'administration.webhooks.detail.columns.status' | translate }}</th>
            <th>{{ 'administration.webhooks.detail.columns.attempts' | translate }}</th>
            <th>{{ 'administration.webhooks.detail.columns.responseCode' | translate }}</th>
            <th>{{ 'administration.webhooks.detail.columns.timestamp' | translate }}</th>
          </tr>
        </thead>
        <tbody>
          <ng-container *ngFor="let delivery of facade.deliveries()">
            <tr (click)="toggleExpanded(delivery.id)" class="webhook-detail__row">
              <td class="webhook-detail__expand">{{ expandedId() === delivery.id ? '▼' : '▶' }}</td>
              <td>{{ delivery.event }}</td>
              <td><span class="webhook-detail__badge" [class.webhook-detail__badge--success]="delivery.status === 'SUCCESS'" [class.webhook-detail__badge--danger]="delivery.status === 'FAILED'">{{ delivery.status }}</span></td>
              <td>{{ delivery.attempts }}</td>
              <td>{{ delivery.responseCode ?? '-' }}</td>
              <td>{{ delivery.createdAt | date : 'short' }}</td>
            </tr>
            <tr *ngIf="expandedId() === delivery.id" class="webhook-detail__expand-row">
              <td colspan="6" class="webhook-detail__payload">
                <strong>{{ 'administration.webhooks.detail.columns.payload' | translate }}:</strong>
                <pre>{{ delivery.payload }}</pre>
                <strong *ngIf="delivery.responseBody">{{ 'administration.webhooks.detail.response' | translate }}:</strong>
                <pre *ngIf="delivery.responseBody">{{ delivery.responseBody }}</pre>
              </td>
            </tr>
          </ng-container>
        </tbody>
      </table>

      <div *ngIf="!loading() && facade.deliveries().length > 0 && facade.deliveriesTotal() > pageSize()" class="webhook-detail__pagination">
        <button type="button" [disabled]="currentPage() === 0" (click)="goToPage(currentPage() - 1)">
          Prev
        </button>
        <span>{{ currentPage() + 1 }} / {{ totalPages() }}</span>
        <button type="button" [disabled]="currentPage() >= totalPages() - 1" (click)="goToPage(currentPage() + 1)">
          Next
        </button>
      </div>

      <p *ngIf="!loading() && facade.deliveries().length === 0">
        {{ 'administration.webhooks.detail.empty' | translate }}
      </p>
    </section>
  `,
  styles: [
    `
      .webhook-detail {
        padding: 1rem;
        display: grid;
        gap: 1rem;
      }
      .webhook-detail__header h1 {
        margin: 0;
      }
      .webhook-detail__header p {
        margin: 0.25rem 0 0;
        color: var(--nf-text-muted, #6b7280);
      }
      .webhook-detail__table {
        width: 100%;
        border-collapse: collapse;
      }
      .webhook-detail__table th,
      .webhook-detail__table td {
        border-bottom: 1px solid var(--nf-border-default, #e5e7eb);
        padding: 0.5rem;
        text-align: left;
        vertical-align: top;
      }
      .webhook-detail__payload {
        background: var(--nf-surface-page, #f9fafb);
      }
      .webhook-detail pre {
        margin: 0.25rem 0 0.5rem;
        white-space: pre-wrap;
        font-size: 0.75rem;
      }
      .webhook-detail__header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;
      }
      .webhook-detail__test {
        flex-shrink: 0;
      }
      .webhook-detail__row {
        cursor: pointer;
      }
      .webhook-detail__expand {
        width: 2rem;
        font-size: 0.7rem;
      }
      .webhook-detail__expand-row td {
        background: var(--nf-surface-page, #f9fafb);
        padding: 0.75rem 1rem;
      }
      .webhook-detail__badge {
        display: inline-block;
        padding: 0.2rem 0.5rem;
        border-radius: 4px;
        font-size: 0.85rem;
        background: var(--nf-surface-elevated, #f3f4f6);
      }
      .webhook-detail__badge--success {
        background: var(--nf-color-success-100, #d1fae5);
        color: var(--nf-color-success-800, #065f46);
      }
      .webhook-detail__badge--danger {
        background: var(--nf-color-danger-100, #fee2e2);
        color: var(--nf-color-danger-800, #991b1b);
      }
      .webhook-detail__pagination {
        display: flex;
        align-items: center;
        gap: 1rem;
      }
    `,
  ],
})
export class WebhookDetailPage implements OnInit {
  readonly facade = inject(WebhooksFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  readonly loading = signal(false);
  readonly webhook = signal<WebhookConfigItem | null>(null);
  readonly testing = signal(false);
  readonly expandedId = signal<string | null>(null);
  readonly currentPage = signal(0);
  readonly pageSize = signal(20);

  get webhookId(): string | null {
    return this.route.snapshot.paramMap.get('id');
  }

  totalPages(): number {
    return Math.max(1, Math.ceil(this.facade.deliveriesTotal() / this.pageSize()));
  }

  async ngOnInit(): Promise<void> {
    const id = this.webhookId;
    if (!id) return;
    this.loading.set(true);
    try {
      await this.facade.load();
      const item = this.facade.items().find((w) => w.id === id) ?? null;
      this.webhook.set(item);
      if (item) this.facade.setSelectedWebhook(item);
      await this.facade.loadDeliveries(id, 0, this.pageSize());
    } finally {
      this.loading.set(false);
    }
  }

  back(): void {
    this.facade.setSelectedWebhook(null);
    void this.router.navigate(['/administration/webhooks']);
  }

  async runTest(): Promise<void> {
    const id = this.webhookId;
    if (!id) return;
    this.testing.set(true);
    try {
      const result = await this.facade.test(id);
      const key = result.success
        ? 'administration.webhooks.actions.testSuccess'
        : 'administration.webhooks.actions.testFailed';
      this.toast.success(this.translate.instant(key));
      await this.facade.load();
      const item = this.facade.items().find((w) => w.id === id) ?? null;
      this.webhook.set(item);
    } finally {
      this.testing.set(false);
    }
  }

  toggleExpanded(id: string): void {
    this.expandedId.update((current) => (current === id ? null : id));
  }

  async goToPage(page: number): Promise<void> {
    const id = this.webhookId;
    if (!id || page < 0) return;
    this.currentPage.set(page);
    this.loading.set(true);
    try {
      await this.facade.loadDeliveries(id, page, this.pageSize());
    } finally {
      this.loading.set(false);
    }
  }
}
