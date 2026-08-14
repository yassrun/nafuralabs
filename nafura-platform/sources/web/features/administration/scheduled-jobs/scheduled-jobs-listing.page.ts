import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
  ToastService,
} from '@lib/anatomy';
import type { ListingActionEvent } from '@lib/anatomy/types';

import { SCHEDULED_JOBS_LISTING_CONFIG } from './scheduled-jobs-listing.config';
import type { ScheduledJobSummary } from './scheduled-jobs.models';
import { ScheduledJobsFacade } from './scheduled-jobs.facade';

@Component({
  selector: 'app-scheduled-jobs-listing-page',
  standalone: true,
  imports: [...ConfigDrivenListingPageImports],
  template: `
    <nf-page-shell>
      <nf-page-header [config]="headerConfig"></nf-page-header>
      <nf-entity-listing
        #listing
        [config]="config"
        [facade]="facade"
        [openOnRowClick]="true"
        (rowOpen)="onRowOpen($event)"
        (action)="onAction($event)">
      </nf-entity-listing>
    </nf-page-shell>
  `,
  styles: [ConfigDrivenListingPageStyles],
})
export class ScheduledJobsListingPage extends ConfigDrivenListingPage<ScheduledJobSummary> {
  private readonly router = inject(Router);
  private readonly facadeInternal = inject(ScheduledJobsFacade);
  private readonly notifier = inject(ToastService);
  private readonly i18n = inject(TranslateService);

  readonly facade = this.facadeInternal;
  readonly config = SCHEDULED_JOBS_LISTING_CONFIG;
  readonly headerTitle = 'administration.scheduledJobs.title';

  async onRowOpen(item: ScheduledJobSummary): Promise<void> {
    await this.router.navigate(['/administration/scheduled-jobs', item.key]);
  }

  protected override async handleCustomAction(
    event: ListingActionEvent<ScheduledJobSummary>
  ): Promise<void> {
    if (event.actionId === 'run-now') {
      const target = event.item ?? event.selection?.[0] ?? null;
      if (!target) return;
      try {
        await this.facadeInternal.runJobNow(target.key);
        this.notifier.success(
          this.i18n.instant(
            'administration.scheduledJobs.actions.runNowSuccess'
          )
        );
      } catch {
        this.notifier.error(
          this.i18n.instant('common.errors.operationFailed') ||
            'Failed to trigger job'
        );
      }
      return;
    }
  }
}

