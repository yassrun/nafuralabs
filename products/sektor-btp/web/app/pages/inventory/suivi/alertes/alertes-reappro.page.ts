import { Component, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ButtonComponent, ConfigDrivenListingPage, ConfigDrivenListingPageImports, ConfigDrivenListingPageStyles } from '@lib/anatomy';
import { ColumnTemplateDirective, EntityListingComponent } from '@lib/anatomy/components';
import type { ListingActionEvent, PartialCrudFacade } from '@lib/anatomy/types';

import type { StockAlert } from '../../../../inventory/models';

import { AlertesReapproFacade, type AlertListItem } from './services/alertes-reappro.facade';
import { buildAlertesListingConfig } from './config/listing.config';

const AUTO_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

@Component({
  selector: 'app-alertes-reappro',
  standalone: true,
  imports: [...ConfigDrivenListingPageImports, ColumnTemplateDirective, FormsModule, TranslateModule, ButtonComponent],
  template: `
    <nf-page-shell>
      <nf-page-header [config]="headerConfig"></nf-page-header>
      <nf-entity-listing
        #listing
        [config]="config"
        [facade]="facade"
        (action)="onAction($event)">
        <ng-template nfColumn="articleCell" let-item>
          <div class="alert-article">
            <span class="alert-article__code">{{ item.articleCode }}</span>
            <span class="alert-article__name">{{ item.articleName }}</span>
          </div>
        </ng-template>
        <ng-template nfColumn="stockActuelCell" let-item>
          <span [class.alert-stock--critical]="item.currentQty === 0"
                [class.alert-stock--warning]="item.currentQty > 0 && item.currentQty < item.minQty">
            {{ item.currentQty }}
          </span>
        </ng-template>
        <ng-template nfColumn="shortageCell" let-item>
          <span class="alert-shortage">-{{ item.shortage }}</span>
        </ng-template>
      </nf-entity-listing>
    </nf-page-shell>

    @if (showThresholdDialog()) {
      <div class="dialog-overlay" (click)="closeThresholdDialog()">
        <div class="dialog-panel" (click)="$event.stopPropagation()">
          <div class="dialog-header">
            <h3>{{ 'inventory.suivi.alertes.dialog.title' | translate }}</h3>
            <nf-button class="dialog-close" (clicked)="closeThresholdDialog()" variant="secondary">&times;</nf-button>
          </div>
          <div class="dialog-body">
            <p class="dialog-article-info">
              <strong>{{ editingArticle()?.articleCode }}</strong> — {{ editingArticle()?.articleName }}
            </p>
            <label class="dialog-label">
              {{ 'inventory.suivi.alertes.dialog.newThresholdLabel' | translate }}
              <input type="number" [(ngModel)]="newThreshold" min="0" class="dialog-input" />
            </label>
          </div>
          <div class="dialog-footer">
            <nf-button class="btn btn--secondary" (clicked)="closeThresholdDialog()" variant="secondary">{{ 'inventory.suivi.alertes.dialog.cancel' | translate }}</nf-button>
            <nf-button class="btn btn--primary" (clicked)="saveThreshold()" variant="primary">{{ 'inventory.suivi.alertes.dialog.save' | translate }}</nf-button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    ConfigDrivenListingPageStyles,
    `
      .alert-article {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .alert-article__code {
        font-weight: 600;
        font-size: 0.875rem;
      }
      .alert-article__name {
        font-size: 0.8125rem;
        color: var(--text-muted, var(--nf-text-muted));
      }
      .alert-stock--critical {
        color: var(--color-danger, var(--nf-color-danger-600));
        font-weight: 700;
      }
      .alert-stock--warning {
        color: var(--color-warning, var(--nf-color-warning-600));
        font-weight: 600;
      }
      .alert-shortage {
        color: var(--color-danger, var(--nf-color-danger-600));
        font-weight: 600;
      }

      .dialog-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }
      .dialog-panel {
        background: var(--bg-surface, var(--nf-color-surface));
        border-radius: 8px;
        width: 400px;
        max-width: 90vw;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      }
      .dialog-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.5rem;
        border-bottom: 1px solid var(--border-color, var(--nf-border-default));
      }
      .dialog-header h3 {
        margin: 0;
        font-size: 1.125rem;
        font-weight: 600;
      }
      .dialog-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: var(--text-muted, var(--nf-text-muted));
      }
      .dialog-body {
        padding: 1.5rem;
      }
      .dialog-article-info {
        margin: 0 0 1rem;
        color: var(--text-secondary);
      }
      .dialog-label {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        font-weight: 500;
      }
      .dialog-input {
        padding: 0.5rem 0.75rem;
        border: 1px solid var(--border-color, var(--nf-border-default));
        border-radius: 6px;
        font-size: 1rem;
      }
      .dialog-footer {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        padding: 1rem 1.5rem;
        border-top: 1px solid var(--border-color, var(--nf-border-default));
      }
      .btn {
        padding: 0.5rem 1rem;
        border-radius: 6px;
        font-weight: 500;
        cursor: pointer;
        border: none;
      }
      .btn--secondary {
        background: var(--bg-secondary);
        color: var(--text-primary, var(--nf-text-primary));
      }
      .btn--primary {
        background: var(--color-primary, var(--nf-color-primary-600));
        color: var(--nf-color-surface);
      }
    `,
  ],
})
export class AlertesReapproPage
  extends ConfigDrivenListingPage<AlertListItem>
  implements OnInit, OnDestroy
{
  @ViewChild('listing') declare listingComponent?: EntityListingComponent<AlertListItem>;

  private autoRefreshTimer?: ReturnType<typeof setInterval>;
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  readonly facade = inject(AlertesReapproFacade) as PartialCrudFacade<unknown, AlertListItem> &
    AlertesReapproFacade;
  readonly config = buildAlertesListingConfig(this.translate);
  readonly headerTitle = this.translate.instant('inventory.suivi.alertes.headerTitle');

  readonly showThresholdDialog = signal(false);
  readonly editingArticle = signal<StockAlert | null>(null);
  newThreshold = 0;

  ngOnInit(): void {
    this.autoRefreshTimer = setInterval(() => {
      void this.refresh();
    }, AUTO_REFRESH_INTERVAL_MS);
  }

  ngOnDestroy(): void {
    if (this.autoRefreshTimer) {
      clearInterval(this.autoRefreshTimer);
    }
  }

  protected override async handleCustomAction(event: ListingActionEvent<AlertListItem>): Promise<void> {
    const item = event.item;
    if (!item) return;

    switch (event.actionId) {
      case 'createReception':
        this.router.navigate(['/inventory/mouvements/receptions/new'], {
          queryParams: { articleId: item.articleId },
        });
        break;

      case 'editThreshold':
        this.editingArticle.set(item);
        this.newThreshold = item.minQty;
        this.showThresholdDialog.set(true);
        break;

      default:
        console.log('Unhandled action:', event.actionId, event);
    }
  }

  closeThresholdDialog(): void {
    this.showThresholdDialog.set(false);
    this.editingArticle.set(null);
  }

  async saveThreshold(): Promise<void> {
    const article = this.editingArticle();
    if (!article) return;

    try {
      await this.facade.updateStockMin(article.articleId, this.newThreshold);
      this.showSuccess(this.translate.instant('inventory.suivi.alertes.toasts.thresholdUpdated'));
      this.closeThresholdDialog();
      await this.refresh();
    } catch {
      this.showError(this.translate.instant('inventory.errors.common.updateFailed'));
    }
  }
}
