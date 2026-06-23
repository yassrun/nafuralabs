import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
  ButtonComponent,
} from '@lib/anatomy';
import type { Formation } from '@applications/erp/hse/models';

import { FormationFacade } from '../services';
import { buildFormationsListingConfig } from '../config';

type QuickFilter = 'ALL' | 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE';

@Component({
  selector: 'app-formation-listing',
  standalone: true,
  imports: [CommonModule, TranslateModule, ButtonComponent, ...ConfigDrivenListingPageImports],
  templateUrl: './formation-listing.page.html',
  styles: [ConfigDrivenListingPageStyles],
})
export class FormationListingPage extends ConfigDrivenListingPage<Formation> {
  readonly facade = inject(FormationFacade);
  private readonly translate = inject(TranslateService);
  readonly config = buildFormationsListingConfig(this.translate);
  readonly headerTitle = this.translate.instant('hse.formation.headerTitle');

  readonly quickFilter = signal<QuickFilter>('ALL');
  readonly chips = [
    { id: 'ALL' as QuickFilter, labelKey: 'hse.formation.chips.all' },
    { id: 'PLANIFIEE' as QuickFilter, labelKey: 'hse.formation.chips.planifiees' },
    { id: 'EN_COURS' as QuickFilter, labelKey: 'hse.formation.chips.enCours' },
    { id: 'TERMINEE' as QuickFilter, labelKey: 'hse.formation.chips.terminees' },
  ];
  readonly currentChip = computed(() => this.quickFilter());

  selectChip(id: QuickFilter): void {
    this.quickFilter.set(id);
    const filters = id === 'ALL' ? {} : { status: id };
    this.listingComponent?.onFilterChange(filters);
  }
}
