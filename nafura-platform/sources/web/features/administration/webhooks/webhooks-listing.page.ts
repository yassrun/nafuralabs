import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { WEBHOOKS_LISTING_COLUMNS } from './webhooks-listing.config';
import type { WebhookConfigItem, WebhookUpsertPayload } from './webhooks-api.service';
import { WebhooksFacade } from './webhooks.facade';
import { WebhookCreateDialogComponent } from './webhook-create-dialog.component';

@Component({
  selector: 'app-webhooks-listing-page',
  standalone: true,
  imports: [CommonModule, TranslateModule, WebhookCreateDialogComponent],
  template: `
    <section class="webhooks-page">
      <header class="webhooks-page__header">
        <div>
          <h1>{{ 'administration.webhooks.title' | translate }}</h1>
          <p>{{ 'administration.webhooks.subtitle' | translate }}</p>
        </div>
        <button type="button" (click)="openCreate()">
          {{ 'administration.webhooks.actions.create' | translate }}
        </button>
      </header>

      <app-webhook-create-dialog
        *ngIf="formOpen()"
        [model]="editingItem()"
        [saving]="saving()"
        (saved)="onSave($event.id, $event.payload)"
        (cancelled)="closeForm()">
      </app-webhook-create-dialog>

      <div class="webhooks-page__state" *ngIf="facade.loading()">
        {{ 'administration.webhooks.loading' | translate }}
      </div>
      <div class="webhooks-page__state webhooks-page__state--error" *ngIf="facade.error()">
        {{ facade.error() }}
      </div>

      <table *ngIf="!facade.loading() && facade.hasItems()" class="webhooks-page__table">
        <thead>
          <tr>
            <th *ngFor="let column of columns">{{ column.labelKey | translate }}</th>
            <th>{{ 'administration.webhooks.columns.actions' | translate }}</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of facade.items()" (click)="openDetail($event, item)">
            <td>
              <a href="" (click)="openDetail($event, item)">{{ item.name }}</a>
            </td>
            <td class="webhooks-page__url">{{ truncateUrl(item.url) }}</td>
            <td><span class="webhooks-page__badge webhooks-page__badge--count">{{ item.events.length }}</span></td>
            <td (click)="$event.stopPropagation()">
              <button type="button" class="webhooks-page__toggle" [class.webhooks-page__toggle--on]="item.active" [attr.aria-pressed]="item.active" (click)="toggleActive($event, item)">
                {{ item.active ? ('Yes' | translate) : ('No' | translate) }}
              </button>
            </td>
            <td><span class="webhooks-page__badge" [class.webhooks-page__badge--success]="item.lastDeliveryStatus === 'SUCCESS'" [class.webhooks-page__badge--danger]="item.lastDeliveryStatus === 'FAILED'">{{ item.lastDeliveryStatus || '-' }}</span></td>
            <td>{{ item.createdAt | date : 'short' }}</td>
            <td class="webhooks-page__actions" (click)="$event.stopPropagation()">
              <button type="button" (click)="openEdit(item)">
                {{ 'administration.webhooks.actions.edit' | translate }}
              </button>
              <button type="button" (click)="runTest(item)">
                {{ 'administration.webhooks.actions.test' | translate }}
              </button>
              <button type="button" (click)="remove(item)">
                {{ 'administration.webhooks.actions.delete' | translate }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <p class="webhooks-page__state" *ngIf="!facade.loading() && !facade.hasItems()">
        {{ 'administration.webhooks.empty' | translate }}
      </p>
    </section>
  `,
  styles: [
    `
      .webhooks-page {
        padding: 1rem;
        display: grid;
        gap: 1rem;
      }
      .webhooks-page__header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 1rem;
      }
      .webhooks-page__header h1 {
        margin: 0;
      }
      .webhooks-page__header p {
        margin: 0.25rem 0 0;
        color: var(--nf-text-muted, #6b7280);
      }
      .webhooks-page__state {
        margin: 0;
        color: var(--nf-text-muted, #6b7280);
      }
      .webhooks-page__state--error {
        color: var(--nf-color-danger-600, #b91c1c);
      }
      .webhooks-page__table {
        width: 100%;
        border-collapse: collapse;
      }
      .webhooks-page__table th,
      .webhooks-page__table td {
        border-bottom: 1px solid var(--nf-border-default, #e5e7eb);
        padding: 0.5rem;
        text-align: left;
        vertical-align: top;
      }
      .webhooks-page__actions {
        display: flex;
        gap: 0.4rem;
        flex-wrap: wrap;
      }
      .webhooks-page__url {
        max-width: 12rem;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .webhooks-page__badge {
        display: inline-block;
        padding: 0.2rem 0.5rem;
        border-radius: 4px;
        font-size: 0.85rem;
        background: var(--nf-surface-elevated, #f3f4f6);
        color: var(--nf-text-default, #111);
      }
      .webhooks-page__badge--count {
        min-width: 1.5rem;
        text-align: center;
      }
      .webhooks-page__badge--success {
        background: var(--nf-color-success-100, #d1fae5);
        color: var(--nf-color-success-800, #065f46);
      }
      .webhooks-page__badge--danger {
        background: var(--nf-color-danger-100, #fee2e2);
        color: var(--nf-color-danger-800, #991b1b);
      }
      .webhooks-page__toggle {
        padding: 0.2rem 0.5rem;
        border: 1px solid var(--nf-border-default, #e5e7eb);
        border-radius: 4px;
        background: var(--nf-color-surface, #fff);
        cursor: pointer;
      }
      .webhooks-page__toggle--on {
        background: var(--nf-color-success-100, #d1fae5);
        border-color: var(--nf-color-success-300, #6ee7b7);
      }
    `,
  ],
})
export class WebhooksListingPage implements OnInit {
  readonly facade = inject(WebhooksFacade);
  private readonly router = inject(Router);

  readonly columns = WEBHOOKS_LISTING_COLUMNS;
  readonly formOpen = signal(false);
  readonly editingItem = signal<WebhookConfigItem | null>(null);
  readonly saving = signal(false);
  readonly testingIds = signal<Record<string, boolean>>({});

  readonly activeTests = computed(() => this.testingIds());

  async ngOnInit(): Promise<void> {
    await this.facade.load();
  }

  openCreate(): void {
    this.editingItem.set(null);
    this.formOpen.set(true);
  }

  openEdit(item: WebhookConfigItem): void {
    this.editingItem.set(item);
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
    this.editingItem.set(null);
  }

  async onSave(id: string | null, payload: WebhookUpsertPayload): Promise<void> {
    this.saving.set(true);
    try {
      await this.facade.save(payload, id);
      this.closeForm();
    } finally {
      this.saving.set(false);
    }
  }

  async remove(item: WebhookConfigItem): Promise<void> {
    await this.facade.remove(item.id);
  }

  async runTest(item: WebhookConfigItem): Promise<void> {
    this.testingIds.update((state) => ({ ...state, [item.id]: true }));
    try {
      await this.facade.test(item.id);
      await this.facade.load();
    } finally {
      this.testingIds.update((state) => ({ ...state, [item.id]: false }));
    }
  }

  openDetail(event: Event, item: WebhookConfigItem): void {
    event.preventDefault();
    event.stopPropagation();
    void this.router.navigate(['/administration/webhooks', item.id]);
  }

  truncateUrl(url: string, max = 40): string {
    if (!url) return '';
    return url.length <= max ? url : url.slice(0, max) + '…';
  }

  async toggleActive(event: Event, item: WebhookConfigItem): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    const payload: WebhookUpsertPayload = {
      name: item.name,
      url: item.url,
      secret: '',
      events: item.events ?? [],
      active: !item.active,
    };
    try {
      await this.facade.save(payload, item.id);
    } catch {
      // Error already set on facade
    }
  }
}
