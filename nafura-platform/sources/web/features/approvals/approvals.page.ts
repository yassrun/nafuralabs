import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule, Check, X, ClipboardCheck } from 'lucide-angular';
import { ToastService } from '@lib/anatomy';
import { PageShellComponent, PageHeaderComponent } from '@lib/anatomy';
import { TabsComponent, TabItem } from '@lib/anatomy/components/molecules/tabs';
import type { ApprovalRequestDto } from '@platform/features/collaboration/workflow/services/workflow-api.service';
import { ApprovalsFacade } from './services/approvals-facade.service';
import { ApprovalCommentDialogComponent } from './components/approval-comment-dialog.component';
import { getEntityDetailRoute } from './config/entity-type-routes.config';

@Component({
  selector: 'app-approvals-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    TranslateModule,
    LucideAngularModule,
    PageShellComponent,
    PageHeaderComponent,
    TabsComponent,
  ],
  template: `
    <nf-page-shell>
      <nf-page-header [config]="headerConfig"></nf-page-header>

      <nf-tabs
        [tabs]="tabs()"
        [activeTab]="activeTab()"
        (tabChange)="onTabChange($event)">
      </nf-tabs>

      <div class="nf-approvals-content">
        @if (activeTab() === 'pending') {
          @if (facade.loadingPending()) {
            <div class="nf-approvals-loading">
              <mat-spinner diameter="32"></mat-spinner>
              <span>{{ 'approvals.loading' | translate }}</span>
            </div>
          } @else if (facade.pending().length === 0) {
            <div class="nf-approvals-empty">
              <lucide-icon name="clipboard-check" [size]="48" class="nf-approvals-empty__icon"></lucide-icon>
              <p class="nf-approvals-empty__title">{{ 'approvals.emptyTitle' | translate }}</p>
              <p class="nf-approvals-empty__message">{{ 'approvals.emptyMessage' | translate }}</p>
            </div>
          } @else {
            <div class="nf-approvals-table-wrap">
              <table class="nf-approvals-table">
                <thead>
                  <tr>
                    <th>{{ 'approvals.columns.entity' | translate }}</th>
                    <th>{{ 'approvals.columns.title' | translate }}</th>
                    <th>{{ 'approvals.columns.requestedBy' | translate }}</th>
                    <th>{{ 'approvals.columns.requestedAt' | translate }}</th>
                    <th>{{ 'approvals.columns.step' | translate }}</th>
                    <th class="nf-approvals-table__actions">{{ 'approvals.columns.actions' | translate }}</th>
                  </tr>
                </thead>
                <tbody>
                  @for (row of facade.pending(); track row.id) {
                    <tr>
                      <td>
                        @if (entityLink(row).length) {
                          <a [routerLink]="entityLink(row)" class="nf-approvals-link">{{ entityLabel(row) }}</a>
                        } @else {
                          <span>{{ entityLabel(row) }}</span>
                        }
                      </td>
                      <td>{{ row.title }}</td>
                      <td>{{ row.requestedBy }}</td>
                      <td>{{ relativeTime(row.requestedAt) }}</td>
                      <td>{{ row.currentStep || '—' }}</td>
                      <td class="nf-approvals-table__actions">
                        <div class="nf-approvals-actions">
                          <button
                            type="button"
                            class="nf-approvals-btn nf-approvals-btn--approve"
                            [disabled]="facade.actionBusyId() === row.id"
                            (click)="onApprove(row)">
                            <lucide-icon name="check" [size]="16"></lucide-icon>
                            {{ 'approvals.approve' | translate }}
                          </button>
                          <button
                            type="button"
                            class="nf-approvals-btn nf-approvals-btn--reject"
                            [disabled]="facade.actionBusyId() === row.id"
                            (click)="onReject(row)">
                            <lucide-icon name="x" [size]="16"></lucide-icon>
                            {{ 'approvals.reject' | translate }}
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        }

        @if (activeTab() === 'history') {
          @if (facade.loadingHistory()) {
            <div class="nf-approvals-loading">
              <mat-spinner diameter="32"></mat-spinner>
              <span>{{ 'approvals.loading' | translate }}</span>
            </div>
          } @else if (facade.history().length === 0) {
            <div class="nf-approvals-empty">
              <p class="nf-approvals-empty__message">{{ 'approvals.historyEmpty' | translate }}</p>
            </div>
          } @else {
            <div class="nf-approvals-table-wrap">
              <table class="nf-approvals-table">
                <thead>
                  <tr>
                    <th>{{ 'approvals.columns.entity' | translate }}</th>
                    <th>{{ 'approvals.columns.title' | translate }}</th>
                    <th>{{ 'approvals.columns.requestedBy' | translate }}</th>
                    <th>{{ 'approvals.columns.decision' | translate }}</th>
                    <th>{{ 'approvals.columns.decisionAt' | translate }}</th>
                    <th>{{ 'approvals.columns.comment' | translate }}</th>
                  </tr>
                </thead>
                <tbody>
                  @for (row of facade.history(); track row.id) {
                    <tr>
                      <td>
                        @if (entityLink(row).length) {
                          <a [routerLink]="entityLink(row)" class="nf-approvals-link">{{ entityLabel(row) }}</a>
                        } @else {
                          <span>{{ entityLabel(row) }}</span>
                        }
                      </td>
                      <td>{{ row.title }}</td>
                      <td>{{ row.requestedBy }}</td>
                      <td>
                        <span class="nf-approvals-badge" [class.nf-approvals-badge--approved]="row.status === 'APPROVED'" [class.nf-approvals-badge--rejected]="row.status === 'REJECTED'">
                          {{ row.status }}
                        </span>
                      </td>
                      <td>{{ row.approvedAt ? relativeTime(row.approvedAt) : '—' }}</td>
                      <td>{{ row.decisionComment || '—' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        }
      </div>
    </nf-page-shell>
  `,
  styles: [`
    .nf-approvals-content { padding: 1rem 0; }
    .nf-approvals-loading {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 2rem;
      color: var(--nf-text-muted, #6b7280);
    }
    .nf-approvals-empty {
      text-align: center;
      padding: 3rem 2rem;
      color: var(--nf-text-muted, #6b7280);
    }
    .nf-approvals-empty__icon { margin-bottom: 12px; opacity: 0.6; }
    .nf-approvals-empty__title { font-weight: 600; font-size: 1.125rem; margin: 0 0 8px; color: var(--nf-text-primary, #111827); }
    .nf-approvals-empty__message { margin: 0; font-size: 0.875rem; }
    .nf-approvals-table-wrap { overflow-x: auto; border: 1px solid var(--nf-border-default, #e5e7eb); border-radius: 8px; }
    .nf-approvals-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }
    .nf-approvals-table th,
    .nf-approvals-table td { padding: 12px 16px; text-align: left; border-bottom: 1px solid var(--nf-border-default, #e5e7eb); }
    .nf-approvals-table th { font-weight: 600; background: var(--nf-color-bg-subtle, #f9fafb); }
    .nf-approvals-table__actions { white-space: nowrap; }
    .nf-approvals-link { color: var(--nf-color-primary, #2563eb); text-decoration: none; }
    .nf-approvals-link:hover { text-decoration: underline; }
    .nf-approvals-actions { display: flex; gap: 8px; }
    .nf-approvals-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 6px;
      border: 1px solid transparent;
      font-size: 0.8125rem;
      cursor: pointer;
    }
    .nf-approvals-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .nf-approvals-btn--approve { background: #059669; color: #fff; }
    .nf-approvals-btn--reject { background: #dc2626; color: #fff; }
    .nf-approvals-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
    }
    .nf-approvals-badge--approved { background: #d1fae5; color: #065f46; }
    .nf-approvals-badge--rejected { background: #fee2e2; color: #991b1b; }
  `],
})
export class ApprovalsPage implements OnInit {
  readonly facade = inject(ApprovalsFacade);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);

  readonly activeTab = signal<'pending' | 'history'>('pending');

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

  ngOnInit(): void {
    void this.facade.loadPending();
  }

  onTabChange(tabId: string): void {
    this.activeTab.set(tabId as 'pending' | 'history');
    if (tabId === 'history') {
      void this.facade.loadHistory();
    }
  }

  entityLabel(row: ApprovalRequestDto): string {
    return `${row.entityType} / ${row.entityId}`;
  }

  entityLink(row: ApprovalRequestDto): string[] {
    return getEntityDetailRoute(row.entityType, row.entityId);
  }

  relativeTime(iso: string): string {
    if (!iso) return '—';
    const date = new Date(iso);
    const now = new Date();
    const sec = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (sec < 60) return this.translate.instant('approvals.time.agoSeconds', { count: sec });
    if (sec < 3600) return this.translate.instant('approvals.time.agoMinutes', { count: Math.floor(sec / 60) });
    if (sec < 86400) return this.translate.instant('approvals.time.agoHours', { count: Math.floor(sec / 3600) });
    if (sec < 2592000) return this.translate.instant('approvals.time.agoDays', { count: Math.floor(sec / 86400) });
    return date.toLocaleDateString();
  }

  async onApprove(row: ApprovalRequestDto): Promise<void> {
    const ref = this.dialog.open(ApprovalCommentDialogComponent, {
      width: '400px',
      data: { action: 'approve' as const },
    });
    const comment = await ref.afterClosed().toPromise();
    if (comment === undefined) return; // cancelled
    try {
      await this.facade.approve(row.id, comment);
      this.toast.success(this.translate.instant('approvals.approved'));
    } catch (e) {
      this.toast.error(this.translate.instant('approvals.actionFailed'));
    }
  }

  async onReject(row: ApprovalRequestDto): Promise<void> {
    const ref = this.dialog.open(ApprovalCommentDialogComponent, {
      width: '400px',
      data: { action: 'reject' as const },
    });
    const comment = await ref.afterClosed().toPromise();
    if (comment === undefined) return;
    try {
      await this.facade.reject(row.id, comment);
      this.toast.success(this.translate.instant('approvals.rejected'));
    } catch (e) {
      this.toast.error(this.translate.instant('approvals.actionFailed'));
    }
  }
}
