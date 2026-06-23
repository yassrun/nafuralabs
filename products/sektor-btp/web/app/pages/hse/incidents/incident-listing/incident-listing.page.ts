import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
  ButtonComponent,
} from '@lib/anatomy';
import type { Incident } from '@applications/erp/hse/models';

import { IncidentFacade } from '../services';
import { buildIncidentsListingConfig } from '../config';

type QuickFilter = 'ALL' | 'DECLARE' | 'EN_INVESTIGATION';

@Component({
  selector: 'app-incident-listing',
  standalone: true,
  imports: [CommonModule, TranslateModule, ButtonComponent, ...ConfigDrivenListingPageImports],
  templateUrl: './incident-listing.page.html',
  styles: [ConfigDrivenListingPageStyles],
})
export class IncidentListingPage extends ConfigDrivenListingPage<Incident> {
  readonly facade = inject(IncidentFacade);
  private readonly translate = inject(TranslateService);
  readonly config = buildIncidentsListingConfig(this.translate);
  readonly headerTitle = this.translate.instant('hse.incident.headerTitle');

  readonly quickFilter = signal<QuickFilter>('ALL');
  readonly chips = [
    { id: 'ALL' as QuickFilter, labelKey: 'hse.incident.chips.all' },
    { id: 'DECLARE' as QuickFilter, labelKey: 'hse.incident.chips.ouverts' },
    { id: 'EN_INVESTIGATION' as QuickFilter, labelKey: 'hse.incident.chips.investigation' },
  ];
  readonly currentChip = computed(() => this.quickFilter());

  selectChip(id: QuickFilter): void {
    this.quickFilter.set(id);
    const filters = id === 'ALL' ? {} : { status: id };
    this.listingComponent?.onFilterChange(filters);
  }
}
