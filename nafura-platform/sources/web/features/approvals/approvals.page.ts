import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import {
  ColumnTemplateDirective,
  ListingFlatComponent,
  PageHeaderComponent,
  PageShellComponent,
  ToastService,
  type ListingFlatConfig,
} from '@lib/anatomy';
import type { ColumnConfig } from '@lib/anatomy/types';
import { TabsComponent, TabItem } from '@lib/anatomy/components/molecules/tabs';
import type { ApprovalRequestDto } from '@platform/app/approbation/services/workflow-api.service';
import { ApprovalsFacade } from './services/approvals-facade.service';
import { ApprovalCommentDialogComponent } from './components/approval-comment-dialog.component';
import { getEntityDetailRoute } from './config/entity-type-routes.config';

type Tab = 'pending' | 'history';

const TITLE: ColumnConfig = { key: 'title', field: 'title', label: 'approvals.columns.title', sortable: true };
const REQUESTED_BY: ColumnConfig = { key: 'requestedBy', field: 'requestedBy', label: 'approvals.columns.requestedBy', sortable: true };

@Component({
  selector: 'app-approvals-page',
  standalone: true,
  imports: [NgTemplateOutlet, RouterLink, PageShellComponent, PageHeaderComponent, TabsComponent, ListingFlatComponent, ColumnTemplateDirective],
  template: `
    <nf-page-shell>
      <nf-page-header [config]="headerConfig"></nf-page-header>
      <nf-tabs [tabs]="tabs()" [activeTab]="activeTab()" (tabChange)="onTabChange($event)"></nf-tabs>

      <div class="nf-approvals-content">
        @if (activeTab() === 'pending') {
          <nf-listing-flat
            [config]="pendingListing"
            [items]="facade.pending()"
            [loading]="facade.loadingPending()"
            [error]="failed() ? 'Unable to load data' : null"
            (retry)="load('pending')"
            (selectionChange)="selection.set($event)"
            (actionClick)="onAction($event)">
            <ng-template nfColumn="title" let-item="item">
              <ng-container [ngTemplateOutlet]="entityCell" [ngTemplateOutletContext]="{ $implicit: item }" />
            </ng-template>
          </nf-listing-flat>
        } @else {
          <nf-listing-flat
            [config]="historyListing"
            [items]="facade.history()"
            [loading]="facade.loadingHistory()"
            [error]="failed() ? 'Unable to load data' : null"
            (retry)="load('history')">
            <ng-template nfColumn="title" let-item="item">
              <ng-container [ngTemplateOutlet]="entityCell" [ngTemplateOutletContext]="{ $implicit: item }" />
            </ng-template>
          </nf-listing-flat>
        }
      </div>
    </nf-page-shell>

    <ng-template #entityCell let-row>
      @if (entityLink(row).length) {
        <a [routerLink]="entityLink(row)" class="nf-approvals-link" data-no-click="true">{{ entityLabel(row) }}</a>
      } @else {
        {{ entityLabel(row) }}
      }
    </ng-template>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .nf-approvals-content { display: flex; flex-direction: column; flex: 1 1 0; min-height: 0; padding-top: 1rem; }
    .nf-approvals-link { color: var(--nf-color-primary, #2563eb); text-decoration: none; }
    .nf-approvals-link:hover { text-decoration: underline; }
  `],
})
export class ApprovalsPage implements OnInit {
  readonly facade = inject(ApprovalsFacade);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  readonly activeTab = signal<Tab>('pending');
  readonly selection = signal<ApprovalRequestDto[]>([]);
  readonly failed = signal(false);

  readonly headerConfig = {
    title: 'approvals.title',
    titleI18n: true,
    subtitle: 'approvals.subtitle',
    subtitleI18n: true,
  };

  readonly tabs = computed<TabItem[]>(() => {
    const count = this.facade.pendingCount();
    return [
      { id: 'pending', label: this.translate.instant('approvals.tabs.pending'), badge: count > 0 ? String(count) : undefined },
      { id: 'history', label: this.translate.instant('approvals.tabs.history') },
    ];
  });

  readonly pendingListing: ListingFlatConfig = {
    columns: [
      TITLE,
      REQUESTED_BY,
      { key: 'requestedAt', field: 'requestedAt', label: 'approvals.columns.requestedAt', type: 'relative', sortable: true },
      { key: 'step', field: 'currentStep', label: 'approvals.columns.step', transform: (step) => String(step || '—') },
    ],
    searchFields: ['title', 'requestedBy', 'entityType', 'entityId'],
    features: { filters: false, columnToggle: false },
    emptyState: { icon: 'clipboard-check', title: 'approvals.emptyTitle', message: 'approvals.emptyMessage' },
    selectionActions: [
      { id: 'approve', label: 'approvals.approve', icon: 'check', variant: 'primary', scope: 'single', disabledFor: (rows) => this.busy(rows) },
      { id: 'reject', label: 'approvals.reject', icon: 'x', variant: 'danger', scope: 'single', disabledFor: (rows) => this.busy(rows) },
    ],
  };

  readonly historyListing: ListingFlatConfig = {
    columns: [
      TITLE,
      REQUESTED_BY,
      {
        key: 'decision',
        field: 'status',
        label: 'approvals.columns.decision',
        type: 'badge',
        transform: (status) => `approvals.status.${status}`,
        badgeVariant: (status) => (status === 'APPROVED' ? 'success' : status === 'REJECTED' ? 'danger' : 'default'),
      },
      { key: 'decisionAt', field: 'approvedAt', label: 'approvals.columns.decisionAt', type: 'relative', sortable: true },
      { key: 'comment', field: 'decisionComment', label: 'approvals.columns.comment', transform: (comment) => String(comment || '—') },
    ],
    searchFields: ['title', 'requestedBy', 'entityType', 'entityId', 'decisionComment'],
    features: { filters: false, columnToggle: false, selection: 'none' },
    emptyState: { icon: 'history', title: 'approvals.historyEmpty' },
  };

  ngOnInit(): void {
    void this.load('pending');
  }

  onTabChange(tabId: string): void {
    this.activeTab.set(tabId as Tab);
    this.selection.set([]);
    void this.load(tabId as Tab);
  }

  async load(tab: Tab): Promise<void> {
    this.failed.set(false);
    try {
      await (tab === 'pending' ? this.facade.loadPending() : this.facade.loadHistory());
    } catch {
      this.failed.set(true);
    }
  }

  entityLabel(row: ApprovalRequestDto): string {
    return row.title || `${row.entityType} / ${row.entityId}`;
  }

  entityLink(row: ApprovalRequestDto): string[] {
    return getEntityDetailRoute(row.entityType, row.entityId);
  }

  async onAction(id: string): Promise<void> {
    const row = this.selection()[0];
    if (!row || (id !== 'approve' && id !== 'reject')) return;
    const ref = this.dialog.open(ApprovalCommentDialogComponent, { width: '400px', data: { action: id } });
    const decision = (await firstValueFrom(ref.afterClosed())) as { comment?: string } | undefined | '';
    if (!decision) return;
    const comment = decision.comment;
    try {
      if (id === 'approve') {
        await this.facade.approve(row.id, comment);
        this.toast.success(this.translate.instant('approvals.approved'));
      } else {
        await this.facade.reject(row.id, comment ?? '');
        this.toast.success(this.translate.instant('approvals.rejected'));
      }
    } catch {
      this.toast.error(this.translate.instant('approvals.actionFailed'));
    }
  }

  private busy(rows: ApprovalRequestDto[]): boolean {
    return rows.some((row) => row.id === this.facade.actionBusyId());
  }
}
