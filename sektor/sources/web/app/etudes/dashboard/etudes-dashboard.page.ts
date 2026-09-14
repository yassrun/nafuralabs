import { Component, OnInit, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { AuthFacade } from '@platform/core/security/services/auth.facade';
import {
  BadgeComponent,
  DataStateComponent,
  ScreenComponent,
  StatCardComponent,
  type DataStateValue,
  type PageHeaderConfig,
} from '@platform/lib/anatomy';
import { DateLocalizedPipe } from '@platform/lib/anatomy/pipes/date-localized.pipe';

import { DossierEtudeFacade } from '../dossiers/services/dossier-etude.facade';
import { buildEtudesDashboard } from '../dossiers/utils/etudes-dashboard.util';
import { variantEtatListing } from '../dossiers/utils/dossier-status.util';

@Component({
  selector: 'app-etudes-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    TranslateModule,
    ScreenComponent,
    StatCardComponent,
    BadgeComponent,
    DataStateComponent,
    DateLocalizedPipe,
  ],
  templateUrl: './etudes-dashboard.page.html',
  styleUrls: ['./etudes-dashboard.page.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class EtudesDashboardPage implements OnInit {
  private readonly facade = inject(DossierEtudeFacade);
  private readonly auth = inject(AuthFacade);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly empty = signal(false);
  readonly vm = signal(buildEtudesDashboard([], null));

  readonly pageState = computed<DataStateValue>(() => {
    if (this.loading()) return 'loading';
    if (this.loadError()) return 'error';
    if (this.empty()) return 'empty';
    return 'loaded';
  });

  readonly pipelineMax = computed(() =>
    Math.max(1, ...this.vm().pipeline.map((p) => p.count)),
  );

  readonly headerConfig = computed<PageHeaderConfig>(() => ({
    title: this.translate.instant('etudes.dashboard.title'),
    subtitle: this.translate.instant('etudes.dashboard.subtitle', {
      count: this.vm().ouverts,
    }),
    icon: 'calculate',
    breadcrumbs: [
      { label: this.translate.instant('nav.etudes') },
      { label: this.translate.instant('nav.etudes.dashboard') },
    ],
    primaryAction: {
      id: 'create',
      label: this.translate.instant('etudes.dashboard.actions.create'),
      icon: 'add',
    },
    secondaryAction: {
      id: 'listing',
      label: this.translate.instant('etudes.dashboard.actions.listing'),
      icon: 'list',
    },
  }));

  ngOnInit(): void {
    void this.reload();
  }

  async reload(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);
    try {
      const result = await this.facade.loadItems({ page: 1, pageSize: 500 });
      const items = result.items ?? [];
      this.empty.set(items.length === 0);
      const me = this.auth.user();
      this.vm.set(buildEtudesDashboard(items, me?.id ?? null, new Date(), me?.email));
    } catch (error) {
      this.loadError.set(
        error instanceof Error
          ? error.message
          : this.translate.instant('etudes.dashboard.error'),
      );
    } finally {
      this.loading.set(false);
    }
  }

  onHeaderAction(event: { type: 'primary' | 'secondary'; action: { id?: string } }): void {
    if (event.action.id === 'create') {
      void this.router.navigate(['/etudes/dossiers/new']);
      return;
    }
    void this.router.navigate(['/etudes/dossiers']);
  }

  variantEtat(status: string) {
    return variantEtatListing(status);
  }
}
