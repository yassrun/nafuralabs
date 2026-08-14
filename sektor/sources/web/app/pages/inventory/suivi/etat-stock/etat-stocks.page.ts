/**
 * État des Stocks Page
 *
 * Consultation page showing stock state by article and location.
 * Features:
 * - KPI strip at top (total value, items count, locations, alerts)
 * - Prominent filters (location type, specific location, family, stock status)
 * - Table with colored quantity badges and location type badges
 * - Read-only (no CRUD actions)
 */

import { Component, ViewChild, inject, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';
import { DateLocalizedPipe } from '@lib/anatomy/pipes/date-localized.pipe';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { resolveLocale } from '@lib/anatomy/pipes/_locale-resolver';

import {
  PageShellComponent,
  PageHeaderComponent,
  KpiStripComponent,
  EntityListingComponent,
  ColumnTemplateDirective,
  buildListingConfig,
} from '@lib/anatomy';
import type { KpiItem, ListingPageConfig, ListingActionEvent } from '@lib/anatomy/types';

import { LocationTypeBadgeComponent } from '../../../../inventory/components/location-type-badge';
import { QuantityStatusCellComponent } from '../../../../inventory/components/quantity-status-cell';
import type { Location } from '../../../../inventory/models';

import { EtatStocksFacade } from './services';
import type { EtatStockItem, LocationTypeFilter, StockStatusFilter } from './models';
import { buildEtatStocksColumns } from './config';

@Component({
  selector: 'app-etat-stocks',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageShellComponent,
    PageHeaderComponent,
    KpiStripComponent,
    EntityListingComponent,
    ColumnTemplateDirective,
    LocationTypeBadgeComponent,
    QuantityStatusCellComponent,
    MadCurrencyPipe,
    DateLocalizedPipe,
    TranslateModule,
  ],
  template: `
    <nf-page-shell>
      <nf-page-header [config]="headerConfig"></nf-page-header>

      <div class="etat-content">
        <!-- KPI Strip -->
        <nf-kpi-strip [kpis]="kpiItems()" (kpiClick)="onKpiClick($event)"></nf-kpi-strip>

        <!-- Filters -->
        <div class="etat-filters">
          <div class="etat-filters__group">
            <label class="etat-filters__label">{{ 'inventory.suivi.etatStock.filters.location' | translate }}</label>
            <select
              class="etat-filters__select"
              [ngModel]="filters().locationType"
              (ngModelChange)="onLocationTypeChange($event)">
              <option value="ALL">{{ 'inventory.suivi.etatStock.filters.statutAll' | translate }}</option>
              <option value="DEPOT">{{ 'inventory.enums.locationType.DEPOT' | translate }} / {{ 'inventory.enums.locationType.ENTREPOT' | translate }} / {{ 'inventory.enums.locationType.TRANSIT' | translate }}</option>
              <option value="CHANTIER">{{ 'inventory.enums.locationType.CHANTIER' | translate }}</option>
            </select>
          </div>

          <div class="etat-filters__group">
            <label class="etat-filters__label">{{ 'inventory.suivi.etatStock.columns.locationName' | translate }}</label>
            <select
              class="etat-filters__select"
              [ngModel]="filters().locationId ?? ''"
              (ngModelChange)="onLocationChange($event)">
              <option value="">{{ 'inventory.suivi.etatStock.filters.locationPlaceholder' | translate }}</option>
              @for (loc of locations(); track loc.id) {
                <option [value]="loc.id">{{ loc.name }}</option>
              }
            </select>
          </div>

          <div class="etat-filters__group">
            <label class="etat-filters__label">{{ 'inventory.suivi.etatStock.filters.famille' | translate }}</label>
            <select
              class="etat-filters__select"
              [ngModel]="filters().familleId ?? ''"
              (ngModelChange)="onFamilleChange($event)">
              <option value="">{{ 'inventory.suivi.etatStock.filters.famillePlaceholder' | translate }}</option>
              @for (fam of families(); track fam.id) {
                <option [value]="fam.id">{{ fam.name }}</option>
              }
            </select>
          </div>

          <div class="etat-filters__group">
            <label class="etat-filters__label">{{ 'inventory.suivi.etatStock.filters.statut' | translate }}</label>
            <select
              class="etat-filters__select"
              [ngModel]="filters().stockStatus"
              (ngModelChange)="onStockStatusChange($event)">
              <option value="all">{{ 'inventory.suivi.etatStock.filters.statutAll' | translate }}</option>
              <option value="alert">{{ 'inventory.suivi.etatStock.filters.statutBelowMin' | translate }}</option>
              <option value="exhausted">{{ 'inventory.suivi.etatStock.filters.statutRupture' | translate }}</option>
            </select>
          </div>

          <div class="etat-filters__group etat-filters__group--search">
            <label class="etat-filters__label">{{ 'inventory.suivi.etatStock.filters.article' | translate }}</label>
            <input
              type="text"
              class="etat-filters__input"
              [placeholder]="'inventory.suivi.etatStock.filters.articlePlaceholder' | translate"
              [ngModel]="filters().search ?? ''"
              (ngModelChange)="onSearchChange($event)" />
          </div>
        </div>

        <!-- Listing -->
        <nf-entity-listing
          #listing
          [config]="listingConfig"
          [facade]="facade"
          (action)="onAction($event)">

          <!-- Location Type Badge -->
          <ng-template nfColumn="locationType" let-value let-item="item">
            <app-location-type-badge [type]="value"></app-location-type-badge>
          </ng-template>

          <!-- Quantity Available with status coloring -->
          <ng-template nfColumn="quantityAvailable" let-value let-item="item">
            <app-quantity-status-cell
              [quantity]="value"
              [stockMin]="item.stockMin">
            </app-quantity-status-cell>
          </ng-template>

          <!-- Stock Value formatting -->
          <ng-template nfColumn="stockValue" let-value>
            {{ value | mad }}
          </ng-template>

          <!-- Last Movement Date -->
          <ng-template nfColumn="lastMovementDate" let-value>
            @if (value) {
              {{ value | dateLocalized:'short' }}
            } @else {
              <span class="text-muted">—</span>
            }
          </ng-template>

        </nf-entity-listing>
      </div>
    </nf-page-shell>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }

    nf-page-shell {
      height: 100%;
    }

    .etat-content {
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: var(--nf-space-4, 16px);
      gap: var(--nf-space-4, 16px);
    }

    nf-kpi-strip {
      flex: 0 0 auto;
    }

    .etat-filters {
      display: flex;
      flex-wrap: wrap;
      gap: var(--nf-space-3, 12px);
      padding: var(--nf-space-3, 12px) var(--nf-space-4, 16px);
      background: var(--nf-color-surface);
      border: 1px solid var(--nf-color-border);
      border-radius: var(--nf-radius-md, 8px);
      flex: 0 0 auto;
    }

    .etat-filters__group {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 150px;
    }

    .etat-filters__group--search {
      flex: 1;
      min-width: 200px;
    }

    .etat-filters__label {
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--nf-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }

    .etat-filters__select,
    .etat-filters__input {
      padding: 8px 12px;
      border: 1px solid var(--nf-color-border);
      border-radius: var(--nf-radius-sm, 4px);
      font-size: 0.875rem;
      background: var(--nf-color-background, var(--nf-color-surface));
      transition: border-color 0.2s ease;
    }

    .etat-filters__select:focus,
    .etat-filters__input:focus {
      outline: none;
      border-color: var(--nf-color-primary);
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--nf-color-primary) 20%, transparent);
    }

    nf-entity-listing {
      flex: 1 1 0;
      min-height: 0;
    }

    .text-muted {
      color: var(--nf-text-tertiary);
    }
  `],
})
export class EtatStocksPage implements OnInit {
  @ViewChild('listing') listingComponent?: EntityListingComponent<EtatStockItem>;

  readonly facade = inject(EtatStocksFacade);
  private readonly translate = inject(TranslateService);

  readonly headerConfig = { title: this.translate.instant('inventory.suivi.etatStock.headerTitle') };

  readonly listingConfig: ListingPageConfig<EtatStockItem> = buildListingConfig<EtatStockItem>(
    {
      entityName: this.translate.instant('inventory.suivi.stockBalances.entityName'),
      entityNamePlural: this.translate.instant('inventory.suivi.stockBalances.entityNamePlural'),
      columns: buildEtatStocksColumns(this.translate),
      routes: {
        list: ['/inventory/stock-levels'],
        create: ['/inventory/stock-levels'],
        detail: (item) => ['/inventory/stock-levels', item.id],
      },
      permissionPrefix: 'inventory.stock-levels',
    },
    {
      features: {
        search: false,
        filters: true,
        columnToggle: true,
        selectionMode: 'none',
        viewModeToggle: false,
      },
      defaultSort: {
        column: 'articleCode',
        direction: 'asc',
      },
      emptyState: {
        icon: 'package',
        title: this.translate.instant('inventory.suivi.etatStock.emptyTitle'),
        message: this.translate.instant('inventory.suivi.etatStock.noData'),
      },
    }
  );

  readonly kpis = toSignal(this.facade.kpis$, {
    initialValue: { totalStockValue: 0, articlesInStock: 0, activeLocations: 0, activeAlerts: 0 },
  });

  readonly filters = toSignal(this.facade.filters$, {
    initialValue: {
      locationType: 'ALL' as LocationTypeFilter,
      stockStatus: 'all' as StockStatusFilter,
      locationId: undefined as string | undefined,
      familleId: undefined as string | undefined,
      search: undefined as string | undefined,
    },
  });

  readonly locations = signal<Location[]>([]);
  readonly families = signal<{ id: string; name: string }[]>([]);

  readonly kpiItems = computed<KpiItem[]>(() => {
    const k = this.kpis();
    return [
      {
        id: 'totalValue',
        label: this.translate.instant('inventory.suivi.etatStock.kpis.valueMad'),
        value: this.formatCurrency(k.totalStockValue),
        icon: 'trending-up',
      },
      {
        id: 'articlesCount',
        label: this.translate.instant('inventory.suivi.etatStock.kpis.totalArticles'),
        value: k.articlesInStock,
        icon: 'package',
      },
      {
        id: 'locationsCount',
        label: this.translate.instant('inventory.suivi.etatStock.kpis.totalSku'),
        value: k.activeLocations,
        icon: 'map-pin',
      },
      {
        id: 'alertsCount',
        label: this.translate.instant('inventory.suivi.alertes.kpi.warningCount'),
        value: k.activeAlerts,
        icon: 'alert-triangle',
      },
    ];
  });

  ngOnInit(): void {
    this.facade.getLocationsForFilter().subscribe((locs) => this.locations.set(locs));
    this.facade.getArticleFamilies().subscribe((fams) => this.families.set(fams));
  }

  onLocationTypeChange(type: LocationTypeFilter): void {
    this.facade.setLocationType(type);
    this.refreshListing();
  }

  onLocationChange(locationId: string): void {
    this.facade.setLocationId(locationId || undefined);
    this.refreshListing();
  }

  onFamilleChange(familleId: string): void {
    this.facade.setFamilleId(familleId || undefined);
    this.refreshListing();
  }

  onStockStatusChange(status: StockStatusFilter): void {
    this.facade.setStockStatus(status);
    this.refreshListing();
  }

  onSearchChange(search: string): void {
    this.facade.setSearch(search || undefined);
    this.refreshListing();
  }

  onKpiClick(kpi: KpiItem): void {
    if (kpi.id === 'alertsCount') {
      this.facade.setStockStatus('alert');
      this.refreshListing();
    }
  }

  onAction(event: ListingActionEvent<EtatStockItem>): void {
    switch (event.actionId) {
      case 'refresh':
        this.facade.refresh();
        this.refreshListing();
        break;
      default:
        console.log('Unhandled action:', event.actionId, event);
    }
  }

  private refreshListing(): void {
    this.listingComponent?.refresh();
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
