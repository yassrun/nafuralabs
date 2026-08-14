import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { resolveLocale } from '@lib/anatomy/pipes/_locale-resolver';

import {
  ConfigDrivenDashboardPage,
  ConfigDrivenDashboardPageImports,
  ConfigDrivenDashboardPageStyles,
  NfInputComponent,
} from '@lib/anatomy';
import type { DashboardPageConfig, DashboardDataProvider, KpiItem, ColumnConfig } from '@lib/anatomy';
import { DataTableComponent, KpiStripComponent, BadgeComponent } from '@lib/anatomy';

import { ValorisationFacade } from './services';
import type { ValorisationSnapshot, FamilleValorisation, LocationValorisation } from './models';

@Component({
  selector: 'app-valorisation',
  standalone: true,
  imports: [
    ...ConfigDrivenDashboardPageImports,
    FormsModule,
    TranslateModule,
    NfInputComponent,
    DataTableComponent,
    KpiStripComponent,
    BadgeComponent,
  ],
  template: `
    <nf-page-shell [scroll]="true">
      <nf-page-header [config]="config.headerConfig" (actionClick)="onHeaderAction($event)">
        <div actions class="valorisation-header-actions">
          <nf-input
            class="valorisation-date-field"
            type="date"
            [label]="'inventory.valorisation.date' | translate"
            [ngModel]="selectedDateValue()"
            (ngModelChange)="onDateChange($event)" />
        </div>
      </nf-page-header>

      @if (loading()) {
        <div class="valorisation-loading">
          <span>{{ 'common.loading' | translate }}</span>
        </div>
      } @else if (dashboardError()) {
        <div class="valorisation-error">
          <span>{{ dashboardError() }}</span>
        </div>
      } @else {
        <div class="valorisation-content">
          <!-- Costing Method Badge -->
          <div class="valorisation-method">
            <span class="valorisation-method__label">{{ 'inventory.valorisation.costingMethod' | translate }}:</span>
            <nf-badge variant="info">{{ costingMethod() }}</nf-badge>
          </div>

          <!-- KPI Strip -->
          <nf-kpi-strip [kpis]="kpis()"></nf-kpi-strip>

          <!-- Data Tables -->
          <nf-dashboard-grid>
            <!-- Table by Famille -->
            <nf-dashboard-panel
              [title]="'inventory.valorisation.byFamille'"
              span="half">
              <nf-data-table
                [items]="familleData()"
                [columns]="familleColumns"
                [loading]="loading()"
                emptyMessage="inventory.valorisation.noData">
              </nf-data-table>
            </nf-dashboard-panel>

            <!-- Table by Location -->
            <nf-dashboard-panel
              [title]="'inventory.valorisation.byLocation'"
              span="half">
              <nf-data-table
                [items]="locationData()"
                [columns]="locationColumns"
                [loading]="loading()"
                emptyMessage="inventory.valorisation.noData">
              </nf-data-table>
            </nf-dashboard-panel>
          </nf-dashboard-grid>
        </div>
      }
    </nf-page-shell>
  `,
  styles: [
    ConfigDrivenDashboardPageStyles,
    `
      .valorisation-header-actions {
        display: flex;
        align-items: center;
        gap: var(--nf-space-3, 12px);
      }

      .valorisation-date-field {
        width: 180px;
      }

      .valorisation-loading,
      .valorisation-error {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 200px;
        color: var(--nf-text-secondary);
      }

      .valorisation-error {
        color: var(--nf-color-danger-600);
      }

      .valorisation-content {
        display: flex;
        flex-direction: column;
        gap: var(--nf-space-4, 16px);
      }

      .valorisation-method {
        display: flex;
        align-items: center;
        gap: var(--nf-space-2, 8px);
        padding: var(--nf-space-2, 8px) 0;
      }

      .valorisation-method__label {
        font-size: var(--nf-font-size-sm, 0.875rem);
        color: var(--nf-text-secondary);
      }

      nf-kpi-strip {
        margin-bottom: var(--nf-space-2, 8px);
      }

      nf-dashboard-panel {
        min-height: 300px;
      }
    `,
  ],
})
export class ValorisationPage extends ConfigDrivenDashboardPage<ValorisationSnapshot> {
  private readonly facade = inject(ValorisationFacade);
  private readonly translate = inject(TranslateService);

  // Translation keys consumed by templates via | translate pipe.
  // @i18n-exempt — these are i18n keys (not display strings); the page-shell/header
  // resolves them through ngx-translate at render time.
  readonly config: DashboardPageConfig = {
    headerConfig: {
      title: 'inventory.valorisation.title',
      subtitle: 'inventory.valorisation.subtitle',
      icon: 'assessment',
      secondaryAction: {
        // @i18n-exempt — translation key consumed by nf-page-header via translate pipe
        label: 'common.export',
        icon: 'download',
        id: 'export',
      },
    },
    panels: [],
  };

  readonly dataProvider: DashboardDataProvider<ValorisationSnapshot> = {
    loadSnapshot: () => this.facade.loadSnapshot(),
    refreshSnapshot: () => this.facade.refreshSnapshot(),
  };

  readonly costingMethod = signal<string>('AVCO');
  readonly kpis = signal<KpiItem[]>([]);
  readonly familleData = signal<FamilleValorisation[]>([]);
  readonly locationData = signal<LocationValorisation[]>([]);

  readonly selectedDateValue = computed(() => {
    const dateStr = this.facade.selectedDate();
    return dateStr ?? new Date().toISOString().split('T')[0];
  });

  readonly familleColumns: ColumnConfig[] = [
    { key: 'familleName', label: 'inventory.valorisation.famille', field: 'familleName', sortable: true },
    { key: 'articleCount', label: 'inventory.valorisation.articleCount', field: 'articleCount', type: 'number', sortable: true },
    { key: 'totalQuantity', label: 'inventory.valorisation.totalQty', field: 'totalQuantity', type: 'number', sortable: true },
    { key: 'totalValue', label: 'inventory.valorisation.totalValue', field: 'totalValue', type: 'currency', sortable: true },
    {
      key: 'percentOfTotal',
      label: 'inventory.valorisation.percent',
      field: 'percentOfTotal',
      type: 'number',
      transform: (val) => `${(val as number).toFixed(1)}%`,
      sortable: true,
    },
  ];

  readonly locationColumns: ColumnConfig[] = [
    { key: 'locationName', label: 'inventory.valorisation.location', field: 'locationName', sortable: true },
    {
      key: 'locationType',
      label: 'inventory.valorisation.type',
      field: 'locationType',
      type: 'badge',
      badgeVariant: (val) =>
        val === 'CHANTIER' ? 'warning' : 'info',
      sortable: true,
    },
    { key: 'totalValue', label: 'inventory.valorisation.value', field: 'totalValue', type: 'currency', sortable: true },
    {
      key: 'percentOfTotal',
      label: 'inventory.valorisation.percent',
      field: 'percentOfTotal',
      type: 'number',
      transform: (val) => `${(val as number).toFixed(1)}%`,
      sortable: true,
    },
  ];

  protected override mapSnapshot(snapshot: ValorisationSnapshot): void {
    this.costingMethod.set(snapshot.costingMethod);

    const { kpis } = snapshot;
    const t = (k: string) => this.translate.instant(k);
    const formattedKpis: KpiItem[] = [
      {
        id: 'total',
        label: t('inventory.valorisation.kpi.totalValue'),
        value: this.formatCurrency(kpis.totalStockValue),
        icon: 'account_balance_wallet',
      },
      {
        id: 'depot',
        label: t('inventory.valorisation.kpi.depotValue'),
        value: this.formatCurrency(kpis.depotValue),
        icon: 'warehouse',
      },
      {
        id: 'chantier',
        label: t('inventory.valorisation.kpi.chantierValue'),
        value: this.formatCurrency(kpis.chantierValue),
        icon: 'construction',
      },
      {
        id: 'variation',
        label: t('inventory.valorisation.kpi.monthlyVariation'),
        value: `${kpis.monthlyVariationPercent > 0 ? '+' : ''}${kpis.monthlyVariationPercent.toFixed(1)}%`,
        icon: 'trending_up',
        trend: {
          value: kpis.monthlyVariationPercent,
          direction: kpis.monthlyVariationPercent >= 0 ? 'up' : 'down',
        },
      },
    ];

    this.kpis.set(formattedKpis);
    this.familleData.set(snapshot.byFamille);
    this.locationData.set(snapshot.byLocation);
  }

  onDateChange(date: string | null): void {
    if (date) {
      this.facade.setDate(date);
      void this.refreshSnapshot();
    }
  }

  onHeaderAction(event: { type: 'primary' | 'secondary'; action: { id?: string } }): void {
    if (event.action.id === 'export') {
      this.exportData();
    }
  }

  private exportData(): void {
    console.log('[Valorisation] Export triggered — feature pending backend integration');
  }

  private formatCurrency(value: number): string {
    const locale = resolveLocale(this.translate);
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }
}
