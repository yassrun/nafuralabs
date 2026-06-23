import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
  ButtonComponent,
} from '@lib/anatomy';
import type { Inspection } from '@applications/erp/hse/models';

import { InspectionFacade } from '../services';
import { buildInspectionsListingConfig } from '../config';

type QuickFilter = 'ALL' | 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE';

@Component({
  selector: 'app-inspection-listing',
  standalone: true,
  imports: [CommonModule, TranslateModule, ButtonComponent, ...ConfigDrivenListingPageImports],
  templateUrl: './inspection-listing.page.html',
  styles: [ConfigDrivenListingPageStyles],
})
export class InspectionListingPage extends ConfigDrivenListingPage<Inspection> {
  readonly facade = inject(InspectionFacade);
  private readonly translate = inject(TranslateService);
  readonly config = buildInspectionsListingConfig(this.translate);
  readonly headerTitle = this.translate.instant('hse.inspection.headerTitle');

  readonly quickFilter = signal<QuickFilter>('ALL');
  readonly chips = [
    { id: 'ALL' as QuickFilter, labelKey: 'hse.inspection.chips.all' },
    { id: 'PLANIFIEE' as QuickFilter, labelKey: 'hse.inspection.chips.planifiees' },
    { id: 'EN_COURS' as QuickFilter, labelKey: 'hse.inspection.chips.enCours' },
    { id: 'TERMINEE' as QuickFilter, labelKey: 'hse.inspection.chips.terminees' },
  ];
  readonly currentChip = computed(() => this.quickFilter());

  selectChip(id: QuickFilter): void {
    this.quickFilter.set(id);
    const filters = id === 'ALL' ? {} : { status: id };
    this.listingComponent?.onFilterChange(filters);
  }
}
