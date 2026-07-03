import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
  ButtonComponent,
} from '@lib/anatomy';
import type { NonConformite } from '@applications/erp/hse/models';

import { NcFacade } from '../services';
import { buildNcListingConfig } from '../config';

type QuickFilter = 'ALL' | 'OUVERTE' | 'EN_COURS' | 'VERIFIEE';

@Component({
  selector: 'app-nc-listing',
  standalone: true,
  imports: [CommonModule, TranslateModule, ButtonComponent, ...ConfigDrivenListingPageImports],
  templateUrl: './nc-listing.page.html',
  styles: [ConfigDrivenListingPageStyles],
})
export class NcListingPage extends ConfigDrivenListingPage<NonConformite> {
  readonly facade = inject(NcFacade);
  private readonly translate = inject(TranslateService);
  readonly config = buildNcListingConfig(this.translate);
  readonly headerTitle = this.translate.instant('hse.nonConformite.headerTitle');

  readonly quickFilter = signal<QuickFilter>('ALL');
  readonly chips = [
    { id: 'ALL' as QuickFilter, labelKey: 'hse.nonConformite.chips.all' },
    { id: 'OUVERTE' as QuickFilter, labelKey: 'hse.nonConformite.chips.ouvertes' },
    { id: 'EN_COURS' as QuickFilter, labelKey: 'hse.nonConformite.chips.enCours' },
    { id: 'VERIFIEE' as QuickFilter, labelKey: 'hse.nonConformite.chips.verifiees' },
  ];
  readonly currentChip = computed(() => this.quickFilter());

  selectChip(id: QuickFilter): void {
    this.quickFilter.set(id);
    const filters = id === 'ALL' ? {} : { status: id };
    this.listingComponent?.onFilterChange(filters);
  }
}
