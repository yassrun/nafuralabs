import { formatDate } from '@angular/common';
import { Component, LOCALE_ID, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import {
  ConfirmDialogService,
  ListingFlatComponent,
  ScreenComponent,
  ToastService,
  type ListingFlatConfig,
} from '@lib/anatomy';
import type { ListingQueryState } from '@lib/anatomy/types';
import type { WebhookConfigItem, WebhookDeliveryItem } from './webhooks-api.service';
import { WebhooksFacade } from './webhooks.facade';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-webhook-detail-page',
  standalone: true,
  imports: [ScreenComponent, ListingFlatComponent],
  template: `
    <nf-screen [header]="header()">
      <nf-listing-flat
        [config]="listing"
        [items]="facade.deliveries()"
        [loading]="loading()"
        [remote]="true"
        [remoteTotal]="facade.deliveriesTotal()"
        (load)="onLoad($event)"
        (actionClick)="runTest()"
        (rowDblClick)="showDelivery($event)" />
    </nf-screen>
  `,
})
export class WebhookDetailPage implements OnInit {
  readonly facade = inject(WebhooksFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly dialogs = inject(ConfirmDialogService);
  private readonly translate = inject(TranslateService);
  private readonly locale = inject(LOCALE_ID);

  readonly loading = signal(false);
  readonly webhook = signal<WebhookConfigItem | null>(null);
  readonly testing = signal(false);

  readonly header = computed(() => ({
    title: this.webhook()?.name ?? 'administration.webhooks.detail.title',
    subtitle: this.webhook()?.url,
    icon: 'webhook',
    breadcrumbs: [{ label: 'administration.webhooks.title', route: '/administration/webhooks' }],
  }));

  readonly listing: ListingFlatConfig = {
    columns: [
      { key: 'event', field: 'event', label: 'administration.webhooks.detail.columns.event', transform: (event) => this.eventLabel(String(event)) },
      {
        key: 'status',
        field: 'status',
        label: 'administration.webhooks.detail.columns.status',
        type: 'badge',
        transform: (status) => `administration.webhooks.delivery.${status}`,
        badgeVariant: (status) => ({ SUCCESS: 'success', FAILED: 'danger', PENDING: 'warning' } as const)[status as 'SUCCESS'] ?? 'default',
      },
      { key: 'attempts', field: 'attempts', label: 'administration.webhooks.detail.columns.attempts', type: 'number' },
      { key: 'responseCode', field: 'responseCode', label: 'administration.webhooks.detail.columns.responseCode', transform: (code) => (code == null ? '—' : String(code)) },
      { key: 'timestamp', field: 'createdAt', label: 'administration.webhooks.detail.columns.timestamp', type: 'datetime' },
    ],
    pageSize: PAGE_SIZE,
    pageSizeOptions: [PAGE_SIZE],
    emptyMessage: 'administration.webhooks.detail.empty',
    features: { search: false, filters: false, columnToggle: false, selection: 'none' },
    actions: [{ id: 'test', label: 'administration.webhooks.actions.test', icon: 'send', variant: 'primary' }],
  };

  private get webhookId(): string | null {
    return this.route.snapshot.paramMap.get('id');
  }

  async ngOnInit(): Promise<void> {
    const id = this.webhookId;
    if (!id) return;
    await this.facade.load();
    const item = this.facade.items().find((w) => w.id === id) ?? null;
    this.webhook.set(item);
    if (item) this.facade.setSelectedWebhook(item);
    await this.loadPage(0);
  }

  onLoad(query: ListingQueryState): void {
    void this.loadPage(query.page - 1);
  }

  async runTest(): Promise<void> {
    const id = this.webhookId;
    if (!id || this.testing()) return;
    this.testing.set(true);
    try {
      const result = await this.facade.test(id);
      if (result.success) {
        this.toast.success(this.translate.instant('administration.webhooks.actions.testSuccess'));
      } else {
        this.toast.error(this.translate.instant('administration.webhooks.actions.testFailed'));
      }
      await this.loadPage(0);
    } catch {
      this.toast.error(this.translate.instant('Action failed'));
    } finally {
      this.testing.set(false);
    }
  }

  /** The payload sent and the answer received, readable and copyable. */
  async showDelivery(delivery: WebhookDeliveryItem): Promise<void> {
    const response = delivery.responseBody
      ? `\n\n${this.translate.instant('administration.webhooks.detail.response')} :\n${delivery.responseBody}`
      : '';
    await this.dialogs.reveal({
      title: 'administration.webhooks.detail.columns.payload',
      message: formatDate(delivery.createdAt, 'medium', this.locale),
      value: `${delivery.payload ?? ''}${response}`,
    });
  }

  private eventLabel(event: string): string {
    const key = `administration.webhooks.events.${event}`;
    const label = this.translate.instant(key);
    return label === key ? event : label;
  }

  private async loadPage(page: number): Promise<void> {
    const id = this.webhookId;
    if (!id) return;
    this.loading.set(true);
    try {
      await this.facade.loadDeliveries(id, page, PAGE_SIZE);
    } finally {
      this.loading.set(false);
    }
  }
}
